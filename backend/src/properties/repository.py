"""
Property repository — data access layer for properties, images, amenities, bookmarks.
"""

import math
import re
import uuid

from sqlalchemy import func, select, and_, or_, desc, asc, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.properties.models import (
    Amenity,
    Bookmark,
    Property,
    PropertyAmenity,
    PropertyImage,
    PropertyStatus,
    PropertyView,
    Review,
)
from src.properties.schemas import PropertyFilter


def _slugify(text: str) -> str:
    """Generate a URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[\s_]+", "-", slug)
    slug = re.sub(r"-+", "-", slug)
    return slug[:300]


class PropertyRepository:
    """Database operations for Property entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, owner_id: uuid.UUID, **kwargs) -> Property:
        title = kwargs.get("title", "")
        base_slug = _slugify(title)
        slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"

        # Calculate price per sqft
        price = kwargs.get("price", 0)
        area = kwargs.get("area_sqft")
        price_per_sqft = round(price / area, 2) if area and area > 0 else None

        # Remove non-model fields
        amenity_ids = kwargs.pop("amenity_ids", [])
        image_data = kwargs.pop("images", [])

        prop = Property(
            owner_id=owner_id,
            slug=slug,
            price_per_sqft=price_per_sqft,
            **kwargs,
        )
        self.db.add(prop)
        await self.db.flush()

        # Add images
        for i, img in enumerate(image_data):
            image = PropertyImage(
                property_id=prop.id,
                url=img.get("url", "") if isinstance(img, dict) else img.url,
                caption=img.get("caption") if isinstance(img, dict) else img.caption,
                is_primary=img.get("is_primary", i == 0) if isinstance(img, dict) else (img.is_primary or i == 0),
                order=img.get("order", i) if isinstance(img, dict) else img.order,
            )
            self.db.add(image)

        # Add amenities
        for amenity_id in amenity_ids:
            pa = PropertyAmenity(property_id=prop.id, amenity_id=amenity_id)
            self.db.add(pa)

        await self.db.flush()
        return prop

    async def get_by_id(
        self, property_id: uuid.UUID, user_id: uuid.UUID | None = None
    ) -> Property | None:
        result = await self.db.execute(
            select(Property)
            .options(
                selectinload(Property.images),
                selectinload(Property.amenities).selectinload(PropertyAmenity.amenity),
                selectinload(Property.reviews),
            )
            .where(Property.id == property_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Property | None:
        result = await self.db.execute(
            select(Property)
            .options(
                selectinload(Property.images),
                selectinload(Property.amenities).selectinload(PropertyAmenity.amenity),
                selectinload(Property.reviews),
            )
            .where(Property.slug == slug)
        )
        return result.scalar_one_or_none()

    async def search(
        self,
        filters: PropertyFilter,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Property], int]:
        query = select(Property).options(selectinload(Property.images))

        # Only show active properties in public search
        conditions = [Property.status == PropertyStatus.ACTIVE]

        if filters.property_type:
            conditions.append(Property.property_type == filters.property_type)
        if filters.listing_type:
            conditions.append(Property.listing_type == filters.listing_type)
        if filters.city:
            conditions.append(func.lower(Property.city) == filters.city.lower())
        if filters.state:
            conditions.append(func.lower(Property.state) == filters.state.lower())
        if filters.min_price is not None:
            conditions.append(Property.price >= filters.min_price)
        if filters.max_price is not None:
            conditions.append(Property.price <= filters.max_price)
        if filters.min_area is not None:
            conditions.append(Property.area_sqft >= filters.min_area)
        if filters.max_area is not None:
            conditions.append(Property.area_sqft <= filters.max_area)
        if filters.bedrooms is not None:
            conditions.append(Property.bedrooms == filters.bedrooms)
        if filters.bathrooms is not None:
            conditions.append(Property.bathrooms == filters.bathrooms)
        if filters.furnishing:
            conditions.append(Property.furnishing == filters.furnishing)
        if filters.is_verified is not None:
            conditions.append(Property.is_verified == filters.is_verified)
        if filters.query:
            search_term = f"%{filters.query}%"
            conditions.append(
                or_(
                    Property.title.ilike(search_term),
                    Property.description.ilike(search_term),
                    Property.locality.ilike(search_term),
                    Property.city.ilike(search_term),
                    Property.state.ilike(search_term),
                    Property.address.ilike(search_term),
                    Property.pincode.ilike(search_term),
                )
            )

        query = query.where(and_(*conditions))

        # Sorting
        sort_column = getattr(Property, filters.sort_by, Property.created_at)
        sort_fn = desc if filters.sort_order == "desc" else asc
        query = query.order_by(sort_fn(sort_column))

        # Count
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Paginate
        result = await self.db.execute(query.offset(offset).limit(limit))
        properties = list(result.scalars().all())

        return properties, total

    async def get_by_owner(
        self, owner_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> tuple[list[Property], int]:
        query = (
            select(Property)
            .options(selectinload(Property.images))
            .where(Property.owner_id == owner_id)
            .order_by(Property.created_at.desc())
        )
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(query.offset(offset).limit(limit))
        return list(result.scalars().all()), total

    async def update(self, property_id: uuid.UUID, **kwargs) -> Property | None:
        prop = await self.get_by_id(property_id)
        if prop is None:
            return None
        amenity_ids = kwargs.pop("amenity_ids", None)
        for key, value in kwargs.items():
            if hasattr(prop, key) and value is not None:
                setattr(prop, key, value)
        if amenity_ids is not None:
            # Clear existing and add new
            await self.db.execute(
                delete(PropertyAmenity).where(
                    PropertyAmenity.property_id == property_id
                )
            )
            for aid in amenity_ids:
                self.db.add(PropertyAmenity(property_id=property_id, amenity_id=aid))
        await self.db.flush()
        return prop

    async def delete(self, property_id: uuid.UUID) -> bool:
        prop = await self.get_by_id(property_id)
        if prop is None:
            return False
        await self.db.delete(prop)
        await self.db.flush()
        return True

    async def get_featured(self, limit: int = 8) -> list[Property]:
        result = await self.db.execute(
            select(Property)
            .options(selectinload(Property.images))
            .where(
                and_(
                    Property.status == PropertyStatus.ACTIVE,
                    Property.is_featured == True,  # noqa: E712
                )
            )
            .order_by(Property.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_trending(self, limit: int = 8) -> list[Property]:
        result = await self.db.execute(
            select(Property)
            .options(selectinload(Property.images))
            .where(Property.status == PropertyStatus.ACTIVE)
            .order_by(Property.view_count.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def increment_view(
        self, property_id: uuid.UUID, user_id: uuid.UUID | None = None, ip: str | None = None
    ) -> None:
        prop = await self.db.get(Property, property_id)
        if prop:
            prop.view_count += 1
            view = PropertyView(property_id=property_id, user_id=user_id, ip_address=ip)
            self.db.add(view)
            await self.db.flush()


class BookmarkRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def toggle(self, user_id: uuid.UUID, property_id: uuid.UUID) -> bool:
        """Toggle bookmark. Returns True if bookmarked, False if removed."""
        result = await self.db.execute(
            select(Bookmark).where(
                and_(Bookmark.user_id == user_id, Bookmark.property_id == property_id)
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            await self.db.delete(existing)
            await self.db.flush()
            return False
        self.db.add(Bookmark(user_id=user_id, property_id=property_id))
        await self.db.flush()
        return True

    async def is_bookmarked(self, user_id: uuid.UUID, property_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            select(Bookmark.id).where(
                and_(Bookmark.user_id == user_id, Bookmark.property_id == property_id)
            )
        )
        return result.scalar_one_or_none() is not None

    async def get_user_bookmarks(
        self, user_id: uuid.UUID, offset: int = 0, limit: int = 20
    ) -> tuple[list[Property], int]:
        query = (
            select(Property)
            .join(Bookmark, Bookmark.property_id == Property.id)
            .options(selectinload(Property.images))
            .where(Bookmark.user_id == user_id)
            .order_by(Bookmark.created_at.desc())
        )
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0
        result = await self.db.execute(query.offset(offset).limit(limit))
        return list(result.scalars().all()), total


class ReviewRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self, user_id: uuid.UUID, property_id: uuid.UUID, rating: int, title: str | None = None, comment: str | None = None
    ) -> Review:
        review = Review(
            user_id=user_id, property_id=property_id, rating=rating, title=title, comment=comment
        )
        self.db.add(review)
        await self.db.flush()
        return review

    async def get_avg_rating(self, property_id: uuid.UUID) -> float | None:
        result = await self.db.execute(
            select(func.avg(Review.rating)).where(Review.property_id == property_id)
        )
        avg = result.scalar()
        return round(float(avg), 1) if avg else None


class AmenityRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self) -> list[Amenity]:
        result = await self.db.execute(select(Amenity).order_by(Amenity.category, Amenity.name))
        return list(result.scalars().all())

    async def seed_defaults(self) -> None:
        """Seed default amenities if table is empty."""
        count = (await self.db.execute(select(func.count()).select_from(Amenity))).scalar()
        if count and count > 0:
            return
        defaults = [
            ("Swimming Pool", "pool", "lifestyle"),
            ("Gym", "dumbbell", "lifestyle"),
            ("Parking", "car", "convenience"),
            ("Power Backup", "zap", "convenience"),
            ("Lift", "arrow-up", "convenience"),
            ("Security", "shield", "safety"),
            ("CCTV", "camera", "safety"),
            ("Garden", "trees", "lifestyle"),
            ("Club House", "home", "lifestyle"),
            ("Children Play Area", "baby", "lifestyle"),
            ("Fire Safety", "flame", "safety"),
            ("Intercom", "phone", "safety"),
            ("Rain Water Harvesting", "droplets", "convenience"),
            ("Waste Management", "recycle", "convenience"),
            ("WiFi", "wifi", "convenience"),
            ("AC", "snowflake", "convenience"),
            ("Jogging Track", "footprints", "lifestyle"),
            ("Indoor Games", "gamepad-2", "lifestyle"),
            ("Meditation Hall", "heart", "lifestyle"),
            ("Spa", "sparkles", "lifestyle"),
        ]
        for name, icon, category in defaults:
            self.db.add(Amenity(name=name, icon=icon, category=category))
        await self.db.flush()
