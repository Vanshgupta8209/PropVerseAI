"""
Property ORM models — Property, PropertyImage, Amenity, Bookmark, Review.
These represent the core real-estate entities in the platform.
"""

import enum
import uuid
from datetime import datetime, timezone

from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base

if TYPE_CHECKING:
    from src.auth.models import User



class PropertyType(str, enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    VILLA = "villa"
    PLOT = "plot"
    COMMERCIAL = "commercial"
    PENTHOUSE = "penthouse"
    STUDIO = "studio"
    FARMHOUSE = "farmhouse"


class ListingType(str, enum.Enum):
    SALE = "sale"
    RENT = "rent"
    LEASE = "lease"


class PropertyStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    SOLD = "sold"
    RENTED = "rented"
    INACTIVE = "inactive"
    REJECTED = "rejected"


class FurnishingStatus(str, enum.Enum):
    UNFURNISHED = "unfurnished"
    SEMI_FURNISHED = "semi_furnished"
    FULLY_FURNISHED = "fully_furnished"


class Property(Base):
    """A real-estate property listing."""

    __tablename__ = "properties"
    __table_args__ = (
        Index("ix_properties_city", "city"),
        Index("ix_properties_price", "price"),
        Index("ix_properties_property_type", "property_type"),
        Index("ix_properties_listing_type", "listing_type"),
        Index("ix_properties_status", "status"),
        Index("ix_properties_owner_id", "owner_id"),
        Index("ix_properties_location", "latitude", "longitude"),
    )

    # Ownership
    owner_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )

    # Basic info
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    slug: Mapped[str] = mapped_column(String(350), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False)
    listing_type: Mapped[str] = mapped_column(String(50), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="active", server_default="active", nullable=False)

    # Pricing
    price: Mapped[float] = mapped_column(Numeric(15, 2), nullable=False)
    price_per_sqft: Mapped[float | None] = mapped_column(Numeric(12, 2))
    maintenance_charge: Mapped[float | None] = mapped_column(Numeric(12, 2))
    security_deposit: Mapped[float | None] = mapped_column(Numeric(15, 2))

    # Dimensions
    area_sqft: Mapped[float | None] = mapped_column(Float)
    carpet_area_sqft: Mapped[float | None] = mapped_column(Float)
    bedrooms: Mapped[int | None] = mapped_column(Integer)
    bathrooms: Mapped[int | None] = mapped_column(Integer)
    balconies: Mapped[int | None] = mapped_column(Integer)
    floor_number: Mapped[int | None] = mapped_column(Integer)
    total_floors: Mapped[int | None] = mapped_column(Integer)
    parking_spaces: Mapped[int | None] = mapped_column(Integer)

    # Details
    year_built: Mapped[int | None] = mapped_column(Integer)
    furnishing: Mapped[str | None] = mapped_column(String(50))
    facing: Mapped[str | None] = mapped_column(String(50))
    possession_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rera_id: Mapped[str | None] = mapped_column(String(100))

    # Location
    address: Mapped[str | None] = mapped_column(String(500))
    locality: Mapped[str | None] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    pincode: Mapped[str | None] = mapped_column(String(10))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)

    # Flags
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    is_premium: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Stats
    view_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    inquiry_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    # Relationships
    owner: Mapped["User"] = relationship("User", backref="properties")
    images: Mapped[list["PropertyImage"]] = relationship(
        back_populates="property", cascade="all, delete-orphan", order_by="PropertyImage.order"
    )
    amenities: Mapped[list["PropertyAmenity"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="property", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        ptype = getattr(self.property_type, "value", self.property_type)
        return f"<Property {self.title} ({ptype})>"


class PropertyImage(Base):
    """Images associated with a property."""

    __tablename__ = "property_images"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    url: Mapped[str] = mapped_column(String(500), nullable=False)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500))
    caption: Mapped[str | None] = mapped_column(String(200))
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    order: Mapped[int] = mapped_column(Integer, default=0, server_default="0")

    property: Mapped["Property"] = relationship(back_populates="images")


class Amenity(Base):
    """Master list of amenities (swimming pool, gym, etc.)."""

    __tablename__ = "amenities"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50))
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # safety, lifestyle, convenience


class PropertyAmenity(Base):
    """Many-to-many: Property ↔ Amenity."""

    __tablename__ = "property_amenities"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    amenity_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("amenities.id", ondelete="CASCADE"), nullable=False
    )

    property: Mapped["Property"] = relationship(back_populates="amenities")
    amenity: Mapped["Amenity"] = relationship()


class Bookmark(Base):
    """User-saved / bookmarked properties."""

    __tablename__ = "property_favorites"
    __table_args__ = (
        Index("ix_property_favorites_user_property", "user_id", "property_id", unique=True),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )


class Review(Base):
    """User reviews for properties."""

    __tablename__ = "property_reviews"
    __table_args__ = (
        Index("ix_property_reviews_property_id", "property_id"),
        Index("ix_property_reviews_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    title: Mapped[str | None] = mapped_column(String(200))
    comment: Mapped[str | None] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    user: Mapped["User"] = relationship("User")
    property: Mapped["Property"] = relationship(back_populates="reviews")


class PropertyView(Base):
    """Track property views for analytics and AI recommendations."""

    __tablename__ = "property_views"
    __table_args__ = (
        Index("ix_property_views_user_id", "user_id"),
        Index("ix_property_views_property_id", "property_id"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("profiles.id", ondelete="SET NULL")
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )
    ip_address: Mapped[str | None] = mapped_column(String(45))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
