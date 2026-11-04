"""
Auth Pydantic schemas — request/response DTOs for authentication endpoints.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from pydantic import BaseModel as _PydanticBaseModel
from pydantic import ConfigDict, EmailStr, Field, field_validator


class BaseModel(_PydanticBaseModel):
    """Base Pydantic model for request/response DTOs."""
    pass


class UserRole(str, enum.Enum):
    """Supported platform roles."""
    BUYER = "buyer"
    SELLER = "seller"
    BUILDER = "builder"
    AGENT = "agent"
    ADMIN = "admin"


# ── User DTOs ────────────────────────────────────────────────────
class UserPublic(BaseModel):
    """Public user representation — no sensitive fields."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    full_name: str | None
    role: UserRole
    avatar_url: str | None = None
    city: str | None = None
    state: str | None = None
    bio: str | None = None
    company_name: str | None = None
    phone: str | None = None
    is_verified: bool = False
    created_at: datetime | None = None


class UserUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=200)
    phone: str | None = Field(None, max_length=20)
    avatar_url: str | None = Field(None, max_length=500)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    bio: str | None = Field(None, max_length=2000)
    company_name: str | None = Field(None, max_length=200)


# ── Registration ─────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=2, max_length=200)
    role: UserRole = UserRole.BUYER
    phone: str | None = Field(None, max_length=20)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


class RegisterResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: UserRole
    message: str = "Registration successful. Please verify your email."


# ── Login ────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds
    user: UserPublic


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ── OTP ──────────────────────────────────────────────────────────
class OTPVerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    purpose: str = "email_verification"


class OTPResendRequest(BaseModel):
    email: EmailStr
    purpose: str = "email_verification"


# ── Password Reset ───────────────────────────────────────────────
class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v


# ── Generic Messages ────────────────────────────────────────────
class MessageResponse(BaseModel):
    message: str
    success: bool = True
