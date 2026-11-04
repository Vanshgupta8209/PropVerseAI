"""
Property Pydantic schemas — request/response DTOs for property endpoints.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.properties.models import (
    FurnishingStatus,
    ListingType,
    PropertyStatus,
    PropertyType,
)


# ── Property Creation / Update ───────────────────────────────────
class PropertyCreate(BaseModel):
    title: str = Field(min_length=5, max_length=300)
    description: str | None = Field(None, max_length=5000)
    property_type: PropertyType
    listing_type: ListingType
    price: float = Field(gt=0)
    area_sqft: float | None = Field(None, gt=0)
    carpet_area_sqft: float | None = Field(None, gt=0)
    bedrooms: int | None = Field(None, ge=0, le=20)
    bathrooms: int | None = Field(None, ge=0, le=20)
    balconies: int | None = Field(None, ge=0, le=10)
    floor_number: int | None = None
    total_floors: int | None = None
    parking_spaces: int | None = Field(None, ge=0)
    year_built: int | None = Field(None, ge=1900, le=2030)
    furnishing: FurnishingStatus | None = None
    facing: str | None = Field(None, max_length=50)
    possession_date: datetime | None = None
    rera_id: str | None = Field(None, max_length=100)
    address: str | None = Field(None, max_length=500)
    locality: str | None = Field(None, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    pincode: str | None = Field(None, max_length=10)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    maintenance_charge: float | None = Field(None, ge=0)
    security_deposit: float | None = Field(None, ge=0)
    amenity_ids: list[uuid.UUID] = Field(default_factory=list)
    images: list["PropertyImageCreate"] = Field(default_factory=list)


class PropertyUpdate(BaseModel):
    title: str | None = Field(None, min_length=5, max_length=300)
    description: str | None = Field(None, max_length=5000)
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    price: float | None = Field(None, gt=0)
    area_sqft: float | None = Field(None, gt=0)
    carpet_area_sqft: float | None = Field(None, gt=0)
    bedrooms: int | None = Field(None, ge=0, le=20)
    bathrooms: int | None = Field(None, ge=0, le=20)
    balconies: int | None = Field(None, ge=0, le=10)
    floor_number: int | None = None
    total_floors: int | None = None
    parking_spaces: int | None = Field(None, ge=0)
    year_built: int | None = Field(None, ge=1900, le=2030)
    furnishing: FurnishingStatus | None = None
    facing: str | None = Field(None, max_length=50)
    address: str | None = Field(None, max_length=500)
    locality: str | None = Field(None, max_length=200)
    city: str | None = Field(None, min_length=2, max_length=100)
    state: str | None = Field(None, min_length=2, max_length=100)
    pincode: str | None = Field(None, max_length=10)
    latitude: float | None = Field(None, ge=-90, le=90)
    longitude: float | None = Field(None, ge=-180, le=180)
    maintenance_charge: float | None = Field(None, ge=0)
    security_deposit: float | None = Field(None, ge=0)
    amenity_ids: list[uuid.UUID] | None = None


# ── Property Image ───────────────────────────────────────────────
class PropertyImageCreate(BaseModel):
    url: str = Field(max_length=500)
    caption: str | None = Field(None, max_length=200)
    is_primary: bool = False
    order: int = 0


class PropertyImageResponse(BaseModel):
    id: uuid.UUID
    url: str
    thumbnail_url: str | None = None
    caption: str | None = None
    is_primary: bool
    order: int

    model_config = {"from_attributes": True}


# ── Amenity ──────────────────────────────────────────────────────
class AmenityResponse(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None = None
    category: str

    model_config = {"from_attributes": True}


# ── Review ───────────────────────────────────────────────────────
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(None, max_length=200)
    comment: str | None = Field(None, max_length=2000)


class ReviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    rating: int
    title: str | None = None
    comment: str | None = None
    is_verified: bool
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Property Response ────────────────────────────────────────────
class PropertyCard(BaseModel):
    """Compact property representation for list views."""
    id: uuid.UUID
    title: str
    slug: str
    property_type: PropertyType
    listing_type: ListingType
    status: PropertyStatus
    price: float
    price_per_sqft: float | None = None
    area_sqft: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    city: str
    state: str
    locality: str | None = None
    is_verified: bool
    is_featured: bool
    view_count: int = 0
    primary_image: str | None = None
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class PropertyDetail(BaseModel):
    """Full property detail with all relationships."""
    id: uuid.UUID
    owner_id: uuid.UUID
    title: str
    slug: str
    description: str | None = None
    property_type: PropertyType
    listing_type: ListingType
    status: PropertyStatus
    price: float
    price_per_sqft: float | None = None
    maintenance_charge: float | None = None
    security_deposit: float | None = None
    area_sqft: float | None = None
    carpet_area_sqft: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    balconies: int | None = None
    floor_number: int | None = None
    total_floors: int | None = None
    parking_spaces: int | None = None
    year_built: int | None = None
    furnishing: FurnishingStatus | None = None
    facing: str | None = None
    possession_date: datetime | None = None
    rera_id: str | None = None
    address: str | None = None
    locality: str | None = None
    city: str
    state: str
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    is_verified: bool
    is_featured: bool
    is_premium: bool = False
    view_count: int = 0
    inquiry_count: int = 0
    images: list[PropertyImageResponse] = []
    amenities: list[AmenityResponse] = []
    reviews: list[ReviewResponse] = []
    avg_rating: float | None = None
    is_bookmarked: bool = False
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


# ── Search / Filter Params ───────────────────────────────────────
class PropertyFilter(BaseModel):
    """Query parameters for property search."""
    query: str | None = None  # Full-text / AI search
    property_type: PropertyType | None = None
    listing_type: ListingType | None = None
    city: str | None = None
    state: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    min_area: float | None = None
    max_area: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    furnishing: FurnishingStatus | None = None
    is_verified: bool | None = None
    sort_by: str = "created_at"  # price, area_sqft, view_count, created_at
    sort_order: str = "desc"  # asc, desc


# ── Paginated Response ───────────────────────────────────────────
class PaginatedProperties(BaseModel):
    items: list[PropertyCard]
    total: int
    page: int
    page_size: int
    total_pages: int
