"""
Auth repository — data access layer for users and tokens.
Encapsulates all database operations; never exposed to routers directly.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import AuditLog, OTPCode, RefreshToken, User, UserRole


class UserRepository:
    """Database operations for User entities."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.email == email.lower())
        )
        return result.scalar_one_or_none()

    async def email_exists(self, email: str) -> bool:
        result = await self.db.execute(
            select(User.id).where(User.email == email.lower())
        )
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        email: str,
        password_hash: str,
        full_name: str,
        role: UserRole = UserRole.BUYER,
        phone: str | None = None,
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=password_hash,
            full_name=full_name,
            role=role,
            phone=phone,
        )
        self.db.add(user)
        await self.db.flush()
        return user

    async def update_user(self, user_id: uuid.UUID, **kwargs) -> User | None:
        user = await self.get_by_id(user_id)
        if user is None:
            return None
        for key, value in kwargs.items():
            if hasattr(user, key) and value is not None:
                setattr(user, key, value)
        user.updated_at = datetime.now(timezone.utc)
        await self.db.flush()
        return user

    async def verify_user(self, user_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values({User.is_verified: True, User.updated_at: datetime.now(timezone.utc)})
        )
        return int(getattr(result, "rowcount", 0)) > 0

    async def update_password(self, user_id: uuid.UUID, password_hash: str) -> bool:
        result = await self.db.execute(
            update(User)
            .where(User.id == user_id)
            .values({User.password_hash: password_hash, User.updated_at: datetime.now(timezone.utc)})
        )
        return int(getattr(result, "rowcount", 0)) > 0

    async def get_users(
        self,
        offset: int = 0,
        limit: int = 20,
        role: UserRole | None = None,
    ) -> tuple[list[User], int]:
        query = select(User)
        if role:
            query = query.where(User.role == role)
        query = query.order_by(User.created_at.desc())

        # Count total
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total = (await self.db.execute(count_query)).scalar() or 0

        # Paginated results
        result = await self.db.execute(query.offset(offset).limit(limit))
        return list(result.scalars().all()), total


class TokenRepository:
    """Database operations for refresh tokens."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        token: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> RefreshToken:
        refresh_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.db.add(refresh_token)
        await self.db.flush()
        return refresh_token

    async def get_by_token(self, token: str) -> RefreshToken | None:
        result = await self.db.execute(
            select(RefreshToken).where(
                and_(
                    RefreshToken.token == token,
                    RefreshToken.revoked == False,  # noqa: E712
                    RefreshToken.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        return result.scalar_one_or_none()

    async def revoke(self, token: str) -> bool:
        result = await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.token == token)
            .values(revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        return int(getattr(result, "rowcount", 0)) > 0

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> int:
        result = await self.db.execute(
            update(RefreshToken)
            .where(
                and_(
                    RefreshToken.user_id == user_id,
                    RefreshToken.revoked == False,  # noqa: E712
                )
            )
            .values(revoked=True, revoked_at=datetime.now(timezone.utc))
        )
        return int(getattr(result, "rowcount", 0))


class OTPRepository:
    """Database operations for OTP codes."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        user_id: uuid.UUID,
        code: str,
        purpose: str,
        expires_at: datetime,
    ) -> OTPCode:
        otp = OTPCode(
            user_id=user_id,
            code=code,
            purpose=purpose,
            expires_at=expires_at,
        )
        self.db.add(otp)
        await self.db.flush()
        return otp

    async def get_valid_otp(
        self, user_id: uuid.UUID, code: str, purpose: str
    ) -> OTPCode | None:
        result = await self.db.execute(
            select(OTPCode).where(
                and_(
                    OTPCode.user_id == user_id,
                    OTPCode.code == code,
                    OTPCode.purpose == purpose,
                    OTPCode.used == False,  # noqa: E712
                    OTPCode.expires_at > datetime.now(timezone.utc),
                )
            )
        )
        return result.scalar_one_or_none()

    async def mark_used(self, otp_id: uuid.UUID) -> bool:
        result = await self.db.execute(
            update(OTPCode)
            .where(OTPCode.id == otp_id)
            .values(used=True, used_at=datetime.now(timezone.utc))
        )
        return int(getattr(result, "rowcount", 0)) > 0


class AuditLogRepository:
    """Database operations for audit trail entries."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        action: str,
        user_id: uuid.UUID | None = None,
        resource: str | None = None,
        resource_id: str | None = None,
        details: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> AuditLog:
        log = AuditLog(
            user_id=user_id,
            action=action,
            resource=resource,
            resource_id=resource_id,
            details=details,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        self.db.add(log)
        await self.db.flush()
        return log
