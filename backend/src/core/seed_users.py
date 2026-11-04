"""
Seed default test users into PropVerse AI database.
"""

import asyncio
import logging
from sqlalchemy import select

from src.core.database import async_session_factory
from src.core.security import hash_password
from src.auth.models import User, UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

DEFAULT_USERS = [
    {
        "email": "admin@propverse.ai",
        "password": "Password@123",
        "full_name": "System Administrator",
        "role": UserRole.ADMIN,
        "is_verified": True,
        "is_superuser": True,
    },
    {
        "email": "buyer@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Buyer",
        "role": UserRole.BUYER,
        "is_verified": True,
    },
    {
        "email": "seller@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Seller",
        "role": UserRole.SELLER,
        "is_verified": True,
    },
    {
        "email": "agent@propverse.ai",
        "password": "Password@123",
        "full_name": "Demo Agent",
        "role": UserRole.AGENT,
        "is_verified": True,
    },
    {
        "email": "vg200431@gmail.com",
        "password": "Password@123",
        "full_name": "Vansh Gupta",
        "role": UserRole.BUYER,
        "is_verified": True,
    },
]


async def seed_users():
    async with async_session_factory() as session:
        for udata in DEFAULT_USERS:
            res = await session.execute(select(User).where(User.email == udata["email"]))
            existing = res.scalar_one_or_none()
            if existing is None:
                user = User(
                    email=udata["email"],
                    password_hash=hash_password(udata["password"]),
                    full_name=udata["full_name"],
                    role=udata["role"].value if hasattr(udata["role"], "value") else udata["role"],
                    is_verified=udata.get("is_verified", False),
                    is_superuser=udata.get("is_superuser", False),
                    is_active=True,
                )
                session.add(user)
                logger.info(f"✓ Created user: {udata['email']} ({udata['role'].value})")
            else:
                # Update password to ensure valid login
                existing.password_hash = hash_password(udata["password"])
                existing.is_active = True
                logger.info(f"✓ Updated password for: {udata['email']}")
        await session.commit()
    logger.info("🎉 All default users seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_users())
