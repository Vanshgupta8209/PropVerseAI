"""
Property router — API endpoints for property management.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request, status

from src.auth.schemas import MessageResponse
from src.core.dependencies import CurrentUserId, DBSession, OptionalUserId, Pagination
from src.properties.models import FurnishingStatus, ListingType, PropertyType
from src.properties.schemas import (
    AmenityResponse,
    PaginatedProperties,
    PropertyCreate,
    PropertyDetail,
    PropertyFilter,
    PropertyUpdate,
    ReviewCreate,
    ReviewResponse,
    PropertyCard,
)
from src.properties.service import PropertyService

router = APIRouter(prefix="/properties", tags=["Properties"])


# ── Public & Static Endpoints (Must be registered before dynamic /{property_id}) ──
@router.get(
    "",
    response_model=PaginatedProperties,
    summary="Search properties",
)
async def search_properties(
    db: DBSession,
    pagination: Pagination,
    query: str | None = Query(None, description="Search query"),
    property_type: PropertyType | None = None,
    listing_type: ListingType | None = None,
    city: str | None = None,
    state: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_area: float | None = None,
    max_area: float | None = None,
    bedrooms: int | None = None,
    bathrooms: int | None = None,
    furnishing: FurnishingStatus | None = None,
    is_verified: bool | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
):
    """Search and filter properties with pagination."""
    filters = PropertyFilter(
        query=query,
        property_type=property_type,
        listing_type=listing_type,
        city=city,
        state=state,
        min_price=min_price,
        max_price=max_price,
        min_area=min_area,
        max_area=max_area,
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        furnishing=furnishing,
        is_verified=is_verified,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    service = PropertyService(db)
    return await service.search_properties(filters, pagination.page, pagination.page_size)


@router.get(
    "/featured",
    response_model=list[PropertyCard],
    summary="Get featured properties",
)
async def get_featured(db: DBSession):
    service = PropertyService(db)
    return await service.get_featured()


@router.get(
    "/trending",
    response_model=list[PropertyCard],
    summary="Get trending properties",
)
async def get_trending(db: DBSession):
    service = PropertyService(db)
    return await service.get_trending()


@router.get(
    "/amenities",
    response_model=list[AmenityResponse],
    summary="Get all amenities",
)
async def get_amenities(db: DBSession):
    service = PropertyService(db)
    return await service.get_amenities()


@router.get(
    "/slug/{slug}",
    response_model=PropertyDetail,
    summary="Get property by slug",
)
async def get_property_by_slug(slug: str, db: DBSession, user_id: OptionalUserId):
    service = PropertyService(db)
    return await service.get_property_by_slug(slug, user_id)


@router.get(
    "/my/listings",
    response_model=PaginatedProperties,
    summary="Get my properties",
)
async def get_my_properties(user_id: CurrentUserId, db: DBSession, pagination: Pagination):
    service = PropertyService(db)
    return await service.get_my_properties(user_id, pagination.page, pagination.page_size)


@router.get(
    "/my/bookmarks",
    response_model=PaginatedProperties,
    summary="Get bookmarked properties",
)
async def get_bookmarks(user_id: CurrentUserId, db: DBSession, pagination: Pagination):
    service = PropertyService(db)
    return await service.get_bookmarks(user_id, pagination.page, pagination.page_size)


# ── Dynamic Param & Mutation Endpoints ──────────────────────────────
@router.get(
    "/{property_id}",
    response_model=PropertyDetail,
    summary="Get property details",
)
async def get_property(
    property_id: uuid.UUID,
    request: Request,
    db: DBSession,
    user_id: OptionalUserId,
):
    service = PropertyService(db)
    ip = request.client.host if request.client else None
    await service.record_view(property_id, user_id, ip)
    return await service.get_property(property_id, user_id)


@router.post(
    "",
    response_model=PropertyDetail,
    status_code=status.HTTP_201_CREATED,
    summary="Create property listing",
)
async def create_property(data: PropertyCreate, user_id: CurrentUserId, db: DBSession):
    service = PropertyService(db)
    return await service.create_property(user_id, data)


@router.patch(
    "/{property_id}",
    response_model=PropertyDetail,
    summary="Update property",
)
async def update_property(
    property_id: uuid.UUID, data: PropertyUpdate, user_id: CurrentUserId, db: DBSession
):
    service = PropertyService(db)
    return await service.update_property(property_id, user_id, data)


@router.delete(
    "/{property_id}",
    response_model=MessageResponse,
    summary="Delete property",
)
async def delete_property(property_id: uuid.UUID, user_id: CurrentUserId, db: DBSession):
    service = PropertyService(db)
    await service.delete_property(property_id, user_id)
    return MessageResponse(message="Property deleted successfully")


@router.post(
    "/{property_id}/bookmark",
    response_model=MessageResponse,
    summary="Toggle bookmark",
)
async def toggle_bookmark(property_id: uuid.UUID, user_id: CurrentUserId, db: DBSession):
    service = PropertyService(db)
    bookmarked = await service.toggle_bookmark(user_id, property_id)
    msg = "Property bookmarked" if bookmarked else "Bookmark removed"
    return MessageResponse(message=msg)


@router.post(
    "/{property_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add review",
)
async def add_review(
    property_id: uuid.UUID, data: ReviewCreate, user_id: CurrentUserId, db: DBSession
):
    service = PropertyService(db)
    return await service.add_review(user_id, property_id, data)

