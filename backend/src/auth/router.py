"""
Auth router — API endpoints for authentication, registration, and profile management.
Thin controller layer: validates input, calls service, returns response.
"""

from fastapi import APIRouter, Request, status

from src.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    OTPVerifyRequest,
    RefreshTokenRequest,
    RegisterRequest,
    RegisterResponse,
    ResetPasswordRequest,
    TokenResponse,
    UserPublic,
    UserUpdate,
)
from src.auth.service import AuthService
from src.core.dependencies import CurrentUserId, DBSession

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_client_info(request: Request) -> tuple[str | None, str | None]:
    """Extract client IP and user agent from request."""
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent")
    return ip, ua


# ── Registration ─────────────────────────────────────────────────
@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new account",
)
async def register(data: RegisterRequest, request: Request, db: DBSession):
    """Create a new user account and send verification OTP."""
    ip, ua = _get_client_info(request)
    service = AuthService(db)
    result = await service.register(data, ip_address=ip, user_agent=ua)
    return result


# ── Login ────────────────────────────────────────────────────────
@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login with email and password",
)
async def login(data: LoginRequest, request: Request, db: DBSession):
    """Authenticate and return access + refresh tokens."""
    ip, ua = _get_client_info(request)
    service = AuthService(db)
    return await service.login(data, ip_address=ip, user_agent=ua)


# ── Token Refresh ────────────────────────────────────────────────
@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(data: RefreshTokenRequest, request: Request, db: DBSession):
    """Exchange a valid refresh token for new access + refresh tokens."""
    ip, ua = _get_client_info(request)
    service = AuthService(db)
    return await service.refresh_tokens(data.refresh_token, ip_address=ip, user_agent=ua)


# ── Logout ───────────────────────────────────────────────────────
@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout current session",
)
async def logout(data: RefreshTokenRequest, user_id: CurrentUserId, db: DBSession):
    """Revoke the provided refresh token."""
    service = AuthService(db)
    await service.logout(data.refresh_token, user_id)
    return MessageResponse(message="Logged out successfully")


@router.post(
    "/logout-all",
    response_model=MessageResponse,
    summary="Logout from all devices",
)
async def logout_all(user_id: CurrentUserId, db: DBSession):
    """Revoke all refresh tokens for the current user."""
    service = AuthService(db)
    count = await service.logout_all(user_id)
    return MessageResponse(message=f"Logged out from {count} session(s)")


# ── OTP Verification ─────────────────────────────────────────────
@router.post(
    "/verify-otp",
    response_model=MessageResponse,
    summary="Verify OTP code",
)
async def verify_otp(data: OTPVerifyRequest, db: DBSession):
    """Verify an OTP code for email verification or password reset."""
    service = AuthService(db)
    result = await service.verify_otp(data.email, data.code, data.purpose)
    return result


# ── Forgot Password ──────────────────────────────────────────────
@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    summary="Request password reset",
)
async def forgot_password(data: ForgotPasswordRequest, db: DBSession):
    """Generate a password reset OTP and send to user's email."""
    service = AuthService(db)
    result = await service.forgot_password(data.email)
    return result


# ── Reset Password ───────────────────────────────────────────────
@router.post(
    "/reset-password",
    response_model=MessageResponse,
    summary="Reset password with OTP",
)
async def reset_password(data: ResetPasswordRequest, db: DBSession):
    """Reset password using a valid OTP code."""
    service = AuthService(db)
    result = await service.reset_password(data.email, data.code, data.new_password)
    return result


# ── Profile ──────────────────────────────────────────────────────
@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user profile",
)
async def get_profile(user_id: CurrentUserId, db: DBSession):
    """Retrieve the authenticated user's profile."""
    service = AuthService(db)
    return await service.get_profile(user_id)


@router.patch(
    "/me",
    response_model=UserPublic,
    summary="Update current user profile",
)
async def update_profile(data: UserUpdate, user_id: CurrentUserId, db: DBSession):
    """Update profile fields for the authenticated user."""
    service = AuthService(db)
    update_data = data.model_dump(exclude_unset=True)
    return await service.update_profile(user_id, **update_data)
