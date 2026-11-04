"""
Seed rich sample real estate properties directly into Supabase Cloud PostgreSQL.
"""

import asyncio
import logging
from sqlalchemy import select

from src.core.database import async_session_factory
from src.auth.models import User
from src.properties.models import Property, PropertyType, ListingType, PropertyStatus, FurnishingStatus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_properties")

SAMPLE_PROPERTIES = [
    {
        "slug": "skyline-luxury-villa-jaipur",
        "title": "Skyline Luxury Villa",
        "description": "State-of-the-art 4BHK smart villa with private pool, landscaped garden, and panoramic Aravalli views.",
        "property_type": PropertyType.VILLA,
        "listing_type": ListingType.SALE,
        "price": 18500000.00,
        "price_per_sqft": 5285.00,
        "area_sqft": 3500.0,
        "bedrooms": 4,
        "bathrooms": 5,
        "balconies": 3,
        "parking_spaces": 2,
        "furnishing": FurnishingStatus.FULLY_FURNISHED,
        "city": "Jaipur",
        "state": "Rajasthan",
        "address": "Malviya Nagar, Sector 4",
        "pincode": "302017",
        "latitude": 26.8530,
        "longitude": 75.8048,
        "is_featured": True,
        "is_verified": True,
        "is_premium": True,
    },
    {
        "slug": "oceanfront-penthouse-bandra-mumbai",
        "title": "Sea Breeze Oceanfront Penthouse",
        "description": "Exclusive 3BHK luxury penthouse facing Bandra Bandstand with ultra-modern interiors and private terrace garden.",
        "property_type": PropertyType.PENTHOUSE,
        "listing_type": ListingType.SALE,
        "price": 45000000.00,
        "price_per_sqft": 18000.00,
        "area_sqft": 2500.0,
        "bedrooms": 3,
        "bathrooms": 4,
        "balconies": 2,
        "parking_spaces": 2,
        "furnishing": FurnishingStatus.FULLY_FURNISHED,
        "city": "Mumbai",
        "state": "Maharashtra",
        "address": "Bandstand Promenade, Bandra West",
        "pincode": "400050",
        "latitude": 19.0544,
        "longitude": 72.8200,
        "is_featured": True,
        "is_verified": True,
        "is_premium": True,
    },
    {
        "slug": "green-valley-apartment-indiranagar-bengaluru",
        "title": "Green Valley Eco Apartment",
        "description": "Modern 2BHK eco-friendly apartment in prime Indiranagar near Metro, tech hubs, and fine dining.",
        "property_type": PropertyType.APARTMENT,
        "listing_type": ListingType.SALE,
        "price": 9500000.00,
        "price_per_sqft": 7600.00,
        "area_sqft": 1250.0,
        "bedrooms": 2,
        "bathrooms": 2,
        "balconies": 2,
        "parking_spaces": 1,
        "furnishing": FurnishingStatus.SEMI_FURNISHED,
        "city": "Bengaluru",
        "state": "Karnataka",
        "address": "100 Feet Road, Indiranagar",
        "pincode": "560038",
        "latitude": 12.9784,
        "longitude": 77.6408,
        "is_featured": True,
        "is_verified": True,
        "is_premium": False,
    },
    {
        "slug": "royal-palms-residence-dlf-gurgaon",
        "title": "Royal Palms Luxury Residence",
        "description": "Spacious 4BHK high-rise apartment in Cyber City Gurgaon with clubhouse, infinity pool, and 24/7 security.",
        "property_type": PropertyType.APARTMENT,
        "listing_type": ListingType.SALE,
        "price": 22000000.00,
        "price_per_sqft": 8148.00,
        "area_sqft": 2700.0,
        "bedrooms": 4,
        "bathrooms": 4,
        "balconies": 3,
        "parking_spaces": 2,
        "furnishing": FurnishingStatus.FULLY_FURNISHED,
        "city": "Delhi NCR",
        "state": "Haryana",
        "address": "DLF Phase 5, Golf Course Road",
        "pincode": "122002",
        "latitude": 28.4595,
        "longitude": 77.0266,
        "is_featured": False,
        "is_verified": True,
        "is_premium": True,
    },
    {
        "slug": "sunset-beach-villa-candolim-goa",
        "title": "Sunset Horizon Beach Villa",
        "description": "Portuguese-style 3BHK luxury beach villa 200m from Candolim Beach with private pool and garden.",
        "property_type": PropertyType.VILLA,
        "listing_type": ListingType.RENT,
        "price": 120000.00,
        "price_per_sqft": 9500.00,
        "area_sqft": 2200.0,
        "bedrooms": 3,
        "bathrooms": 3,
        "balconies": 2,
        "parking_spaces": 2,
        "furnishing": FurnishingStatus.FULLY_FURNISHED,
        "city": "Goa",
        "state": "Goa",
        "address": "Candolim Beach Road, North Goa",
        "pincode": "403515",
        "latitude": 15.5177,
        "longitude": 73.7626,
        "is_featured": True,
        "is_verified": True,
        "is_premium": True,
    },
]


async def seed_properties():
    async with async_session_factory() as session:
        # Get seller user
        res = await session.execute(select(User).where(User.email == "seller@propverse.ai"))
        owner = res.scalar_one_or_none()
        if owner is None:
            res = await session.execute(select(User))
            owner = res.scalars().first()

        if owner is None:
            logger.error("No user found to attach properties!")
            return

        for pdata in SAMPLE_PROPERTIES:
            res_prop = await session.execute(select(Property).where(Property.slug == pdata["slug"]))
            existing = res_prop.scalar_one_or_none()
            if existing is None:
                prop = Property(owner_id=owner.id, status=PropertyStatus.ACTIVE, **pdata)
                session.add(prop)
                logger.info("✓ Added property: %s (%s)", pdata['title'], pdata['city'])
            else:
                logger.info("✓ Property already exists: %s", pdata['title'])

        await session.commit()
        logger.info("🎉 All sample properties seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_properties())
