"""
Auth service — business logic for registration, login, token management, OTP.
This layer orchestrates repositories and security utilities.
"""

import uuid
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.models import User, UserRole
from src.auth.repository import (
    AuditLogRepository,
    OTPRepository,
    TokenRepository,
    UserRepository,
)
from src.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserPublic,
)
from src.core.config import get_settings
from src.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    hash_password,
    verify_password,
)

logger = logging.getLogger("propverse.auth")
settings = get_settings()


class AuthService:
    """Handles all authentication and user management business logic."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.users = UserRepository(db)
        self.tokens = TokenRepository(db)
        self.otps = OTPRepository(db)
        self.audit = AuditLogRepository(db)

    # ── Registration ─────────────────────────────────────────────
    async def register(
        self,
        data: RegisterRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """Register a new user account."""
        # Check for existing email
        if await self.users.email_exists(data.email):
            raise ConflictError("An account with this email already exists")

        # Create user
        hashed = hash_password(data.password)
        user = await self.users.create(
            email=data.email,
            password_hash=hashed,
            full_name=data.full_name,
            role=data.role,
            phone=data.phone,
        )

        # Generate OTP for email verification
        otp_code = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        await self.otps.create(
            user_id=user.id,
            code=otp_code,
            purpose="email_verification",
            expires_at=expires_at,
        )

        # Audit log
        await self.audit.create(
            action="user.register",
            user_id=user.id,
            resource="user",
            resource_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        role_str = getattr(user.role, "value", user.role)
        logger.info("New user registered: %s (%s)", user.email, role_str)

        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "otp_code": otp_code,  # In production, send via email instead
            "message": "Registration successful. Please verify your email.",
        }

    # ── Login ────────────────────────────────────────────────────
    async def login(
        self,
        data: LoginRequest,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """Authenticate user and return access + refresh tokens."""
        user = await self.users.get_by_email(data.email)
        if user is None or not user.password_hash or not verify_password(data.password, user.password_hash):
            raise AuthenticationError("Invalid email or password")

        if not user.is_active:
            raise AuthenticationError("Account has been deactivated")

        # Generate tokens
        role_str = getattr(user.role, "value", user.role)
        token_data = {"sub": str(user.id), "role": role_str}
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)

        # Store refresh token
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.tokens.create(
            user_id=user.id,
            token=refresh_token,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        # Audit log
        await self.audit.create(
            action="user.login",
            user_id=user.id,
            resource="user",
            resource_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info("User logged in: %s", user.email)

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserPublic.model_validate(user),
        )

    # ── Token Refresh ────────────────────────────────────────────
    async def refresh_tokens(
        self,
        refresh_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> TokenResponse:
        """Validate a refresh token and issue new token pair (token rotation)."""
        # Verify the JWT signature
        payload = decode_token(refresh_token)
        if payload is None or payload.get("type") != "refresh":
            raise AuthenticationError("Invalid refresh token")

        # Check the token exists in DB and isn't revoked
        stored_token = await self.tokens.get_by_token(refresh_token)
        if stored_token is None:
            raise AuthenticationError("Refresh token is invalid or expired")

        # Revoke old refresh token (rotation)
        await self.tokens.revoke(refresh_token)

        # Get user
        user = await self.users.get_by_id(stored_token.user_id)
        if user is None or not user.is_active:
            raise AuthenticationError("User not found or deactivated")

        # Issue new tokens
        role_str = getattr(user.role, "value", user.role)
        token_data = {"sub": str(user.id), "role": role_str}
        new_access = create_access_token(token_data)
        new_refresh = create_refresh_token(token_data)

        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.tokens.create(
            user_id=user.id,
            token=new_refresh,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )

        return TokenResponse(
            access_token=new_access,
            refresh_token=new_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserPublic.model_validate(user),
        )

    # ── Logout ───────────────────────────────────────────────────
    async def logout(self, refresh_token: str, user_id: uuid.UUID) -> None:
        """Revoke a specific refresh token."""
        await self.tokens.revoke(refresh_token)
        await self.audit.create(
            action="user.logout",
            user_id=user_id,
            resource="user",
            resource_id=str(user_id),
        )

    async def logout_all(self, user_id: uuid.UUID) -> int:
        """Revoke all refresh tokens for a user (logout from all devices)."""
        count = await self.tokens.revoke_all_for_user(user_id)
        await self.audit.create(
            action="user.logout_all",
            user_id=user_id,
            resource="user",
            resource_id=str(user_id),
            details=f"Revoked {count} tokens",
        )
        return count

    # ── OTP Verification ─────────────────────────────────────────
    async def verify_otp(
        self, email: str, code: str, purpose: str = "email_verification"
    ) -> dict:
        """Verify an OTP code for email verification or password reset."""
        user = await self.users.get_by_email(email)
        if user is None:
            raise NotFoundError("User", email)

        otp = await self.otps.get_valid_otp(user.id, code, purpose)
        if otp is None:
            raise ValidationError("Invalid or expired OTP code")

        await self.otps.mark_used(otp.id)

        if purpose == "email_verification":
            await self.users.verify_user(user.id)

        await self.audit.create(
            action=f"user.otp_verified.{purpose}",
            user_id=user.id,
            resource="user",
            resource_id=str(user.id),
        )

        return {"message": "Verification successful", "success": True}

    # ── Forgot Password ──────────────────────────────────────────
    async def forgot_password(self, email: str) -> dict:
        """Generate a password reset OTP (in production, send via email)."""
        user = await self.users.get_by_email(email)
        # Always return success to prevent email enumeration
        if user is None:
            return {
                "message": "If an account exists with this email, you will receive a reset code.",
                "success": True,
            }

        otp_code = generate_otp()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        await self.otps.create(
            user_id=user.id,
            code=otp_code,
            purpose="password_reset",
            expires_at=expires_at,
        )

        logger.info("Password reset requested for: %s (OTP: %s)", email, otp_code)

        return {
            "message": "If an account exists with this email, you will receive a reset code.",
            "success": True,
            "otp_code": otp_code,  # Remove in production; send via email
        }

    # ── Reset Password ───────────────────────────────────────────
    async def reset_password(self, email: str, code: str, new_password: str) -> dict:
        """Reset password using a valid OTP code."""
        user = await self.users.get_by_email(email)
        if user is None:
            raise NotFoundError("User", email)

        otp = await self.otps.get_valid_otp(user.id, code, "password_reset")
        if otp is None:
            raise ValidationError("Invalid or expired reset code")

        await self.otps.mark_used(otp.id)
        hashed = hash_password(new_password)
        await self.users.update_password(user.id, hashed)

        # Revoke all existing sessions for security
        await self.tokens.revoke_all_for_user(user.id)

        await self.audit.create(
            action="user.password_reset",
            user_id=user.id,
            resource="user",
            resource_id=str(user.id),
        )

        return {"message": "Password has been reset successfully", "success": True}

    # ── Profile ──────────────────────────────────────────────────
    async def get_profile(self, user_id: uuid.UUID) -> UserPublic:
        """Retrieve current user's profile."""
        user = await self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User", str(user_id))
        return UserPublic.model_validate(user)

    async def update_profile(self, user_id: uuid.UUID, **kwargs) -> UserPublic:
        """Update current user's profile fields."""
        user = await self.users.update_user(user_id, **kwargs)
        if user is None:
            raise NotFoundError("User", str(user_id))
        return UserPublic.model_validate(user)
