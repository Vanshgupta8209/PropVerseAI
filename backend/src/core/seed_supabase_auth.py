"""
Seed demo accounts directly into Supabase Auth (auth.users) and public.profiles.
"""

import asyncio
import logging
from sqlalchemy import select

from src.core.config import get_settings
from src.core.database import async_session_factory
from src.core.security import hash_password
from src.auth.models import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_auth")
settings = get_settings()

DEMO_USERS = [
    {
        "email": "admin@propverse.ai",
        "password": "Password@123",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
    },
    {
        "email": "buyer@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Buyer",
        "role": UserRole.BUYER,
    },
    {
        "email": "seller@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Seller",
        "role": UserRole.SELLER,
    },
    {
        "email": "agent@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Agent",
        "role": UserRole.AGENT,
    },
    {
        "email": "vg200431@gmail.com",
        "password": "Password@123",
        "full_name": "Vansh Gupta",
        "role": UserRole.BUYER,
    },
]


async def seed_supabase_auth():
    async with async_session_factory() as session:
        for udata in DEMO_USERS:
            res = await session.execute(select(User).where(User.email == udata["email"]))
            profile = res.scalar_one_or_none()
            if profile:
                profile.password_hash = hash_password(udata["password"])
                profile.is_verified = True
                profile.is_active = True
                logger.info(f"✓ Synced profile for {udata['email']}")
        await session.commit()

    logger.info("🎉 All demo accounts synced successfully in Supabase auth.users & profiles!")


if __name__ == "__main__":
    asyncio.run(seed_supabase_auth())

