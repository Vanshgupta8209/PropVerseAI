"""
Property service — business logic for property management.
"""

import math
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.core.exceptions import InsufficientPermissionsError, NotFoundError
from src.properties.models import PropertyStatus
from src.properties.repository import (
    AmenityRepository,
    BookmarkRepository,
    PropertyRepository,
    ReviewRepository,
)
from src.properties.schemas import (
    AmenityResponse,
    PaginatedProperties,
    PropertyCard,
    PropertyCreate,
    PropertyDetail,
    PropertyFilter,
    PropertyImageResponse,
    PropertyUpdate,
    ReviewCreate,
    ReviewResponse,
)


class PropertyService:
    """Business logic for properties, bookmarks, reviews."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.properties = PropertyRepository(db)
        self.bookmarks = BookmarkRepository(db)
        self.reviews = ReviewRepository(db)
        self.amenities_repo = AmenityRepository(db)

    # ── CRUD ─────────────────────────────────────────────────────
    async def create_property(self, owner_id: uuid.UUID, data: PropertyCreate) -> PropertyDetail:
        create_data = data.model_dump()
        # Convert image objects to dicts
        images = create_data.pop("images", [])
        create_data["images"] = [img if isinstance(img, dict) else img for img in images]

        prop = await self.properties.create(owner_id=owner_id, **create_data)
        return await self.get_property(prop.id)

    async def get_property(
        self, property_id: uuid.UUID, user_id: uuid.UUID | None = None
    ) -> PropertyDetail:
        prop = await self.properties.get_by_id(property_id, user_id)
        if prop is None:
            raise NotFoundError("Property", str(property_id))

        # Build response
        images = [PropertyImageResponse.model_validate(img) for img in prop.images]
        amenity_responses = []
        for pa in prop.amenities:
            if pa.amenity:
                amenity_responses.append(AmenityResponse.model_validate(pa.amenity))
        review_responses = [ReviewResponse.model_validate(r) for r in prop.reviews]
        avg_rating = await self.reviews.get_avg_rating(property_id)
        is_bookmarked = False
        if user_id:
            is_bookmarked = await self.bookmarks.is_bookmarked(user_id, property_id)

        return PropertyDetail(
            **{
                k: v
                for k, v in prop.__dict__.items()
                if not k.startswith("_") and k not in ("images", "amenities", "reviews", "owner")
            },
            images=images,
            amenities=amenity_responses,
            reviews=review_responses,
            avg_rating=avg_rating,
            is_bookmarked=is_bookmarked,
        )

    async def get_property_by_slug(
        self, slug: str, user_id: uuid.UUID | None = None
    ) -> PropertyDetail:
        prop = await self.properties.get_by_slug(slug)
        if prop is None:
            raise NotFoundError("Property", slug)
        return await self.get_property(prop.id, user_id)

    async def update_property(
        self, property_id: uuid.UUID, owner_id: uuid.UUID, data: PropertyUpdate
    ) -> PropertyDetail:
        prop = await self.properties.get_by_id(property_id)
        if prop is None:
            raise NotFoundError("Property", str(property_id))
        if prop.owner_id != owner_id:
            raise InsufficientPermissionsError("You can only edit your own properties")

        update_data = data.model_dump(exclude_unset=True)
        await self.properties.update(property_id, **update_data)
        return await self.get_property(property_id)

    async def delete_property(self, property_id: uuid.UUID, owner_id: uuid.UUID) -> None:
        prop = await self.properties.get_by_id(property_id)
        if prop is None:
            raise NotFoundError("Property", str(property_id))
        if prop.owner_id != owner_id:
            raise InsufficientPermissionsError("You can only delete your own properties")
        await self.properties.delete(property_id)

    # ── Search & Browse ──────────────────────────────────────────
    async def search_properties(
        self, filters: PropertyFilter, page: int = 1, page_size: int = 20
    ) -> PaginatedProperties:
        offset = (page - 1) * page_size
        properties, total = await self.properties.search(filters, offset, page_size)

        items = []
        for prop in properties:
            primary_image = None
            for img in prop.images:
                if img.is_primary:
                    primary_image = img.url
                    break
            if not primary_image and prop.images:
                primary_image = prop.images[0].url

            items.append(
                PropertyCard(
                    **{
                        k: v
                        for k, v in prop.__dict__.items()
                        if not k.startswith("_") and k not in ("images", "amenities", "reviews", "owner")
                    },
                    primary_image=primary_image,
                )
            )

        return PaginatedProperties(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
        )

    async def get_featured(self) -> list[PropertyCard]:
        properties = await self.properties.get_featured()
        return self._to_cards(properties)

    async def get_trending(self) -> list[PropertyCard]:
        properties = await self.properties.get_trending()
        return self._to_cards(properties)

    async def get_my_properties(
        self, owner_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> PaginatedProperties:
        offset = (page - 1) * page_size
        properties, total = await self.properties.get_by_owner(owner_id, offset, page_size)
        return PaginatedProperties(
            items=self._to_cards(properties),
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
        )

    # ── Bookmarks ────────────────────────────────────────────────
    async def toggle_bookmark(self, user_id: uuid.UUID, property_id: uuid.UUID) -> bool:
        return await self.bookmarks.toggle(user_id, property_id)

    async def get_bookmarks(
        self, user_id: uuid.UUID, page: int = 1, page_size: int = 20
    ) -> PaginatedProperties:
        offset = (page - 1) * page_size
        properties, total = await self.bookmarks.get_user_bookmarks(user_id, offset, page_size)
        return PaginatedProperties(
            items=self._to_cards(properties),
            total=total,
            page=page,
            page_size=page_size,
            total_pages=math.ceil(total / page_size) if total > 0 else 0,
        )

    # ── Reviews ──────────────────────────────────────────────────
    async def add_review(
        self, user_id: uuid.UUID, property_id: uuid.UUID, data: ReviewCreate
    ) -> ReviewResponse:
        review = await self.reviews.create(
            user_id=user_id,
            property_id=property_id,
            rating=data.rating,
            title=data.title,
            comment=data.comment,
        )
        return ReviewResponse.model_validate(review)

    # ── Amenities ────────────────────────────────────────────────
    async def get_amenities(self) -> list[AmenityResponse]:
        amenities = await self.amenities_repo.get_all()
        return [AmenityResponse.model_validate(a) for a in amenities]

    # ── Record View ──────────────────────────────────────────────
    async def record_view(
        self, property_id: uuid.UUID, user_id: uuid.UUID | None = None, ip: str | None = None
    ) -> None:
        await self.properties.increment_view(property_id, user_id, ip)

    # ── Helpers ──────────────────────────────────────────────────
    def _to_cards(self, properties) -> list[PropertyCard]:
        cards = []
        for prop in properties:
            primary_image = None
            if hasattr(prop, "images") and prop.images:
                for img in prop.images:
                    if img.is_primary:
                        primary_image = img.url
                        break
                if not primary_image:
                    primary_image = prop.images[0].url

            cards.append(
                PropertyCard(
                    **{
                        k: v
                        for k, v in prop.__dict__.items()
                        if not k.startswith("_")
                        and k not in ("images", "amenities", "reviews", "owner")
                    },
                    primary_image=primary_image,
                )
            )
        return cards
