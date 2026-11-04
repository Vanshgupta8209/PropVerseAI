"""
Auth ORM models — User, RefreshToken, OTPCode, AuditLog.
All models use UUID primary keys and UTC timestamps.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base


from src.auth.schemas import UserRole


class User(Base):
    """Platform user account (linked to Supabase profiles)."""

    __tablename__ = "profiles"
    __table_args__ = (
        Index("ix_profiles_email", "email", unique=True),
        Index("ix_profiles_role", "role"),
    )

    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    role: Mapped[str] = mapped_column(
        String(50),
        default="buyer",
        server_default="buyer",
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")

    # Profile fields (inline for simplicity; can be split to a profile table later)
    full_name: Mapped[str | None] = mapped_column(String(200))
    phone: Mapped[str | None] = mapped_column(String(20))
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    bio: Mapped[str | None] = mapped_column(Text)
    company_name: Mapped[str | None] = mapped_column(String(200))

    # Relationships
    refresh_tokens: Mapped[list["RefreshToken"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    otp_codes: Mapped[list["OTPCode"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        role_str = getattr(self.role, "value", self.role)
        return f"<User {self.email} ({role_str})>"


class RefreshToken(Base):
    """Stored refresh tokens for session management and revocation."""

    __tablename__ = "refresh_tokens"
    __table_args__ = (
        Index("ix_refresh_tokens_token", "token", unique=True),
        Index("ix_refresh_tokens_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    user_agent: Mapped[str | None] = mapped_column(String(500))
    ip_address: Mapped[str | None] = mapped_column(String(45))

    # Relationship
    user: Mapped["User"] = relationship(back_populates="refresh_tokens")


class OTPCode(Base):
    """One-time password codes for email/phone verification."""

    __tablename__ = "otp_codes"
    __table_args__ = (
        Index("ix_otp_codes_user_id", "user_id"),
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False
    )
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    purpose: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # "email_verification", "password_reset", "phone_verification"
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Relationship
    user: Mapped["User"] = relationship(back_populates="otp_codes")


class AuditLog(Base):
    """Immutable audit trail for security-sensitive operations."""

    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_user_id", "user_id"),
        Index("ix_audit_logs_action", "action"),
        Index("ix_audit_logs_created_at", "created_at"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("profiles.id", ondelete="SET NULL"),
    )
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str | None] = mapped_column(String(100))
    resource_id: Mapped[str | None] = mapped_column(String(50))
    details: Mapped[str | None] = mapped_column(Text)
    ip_address: Mapped[str | None] = mapped_column(String(45))
    user_agent: Mapped[str | None] = mapped_column(String(500))
