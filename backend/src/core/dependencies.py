"""
Shared FastAPI dependencies — database sessions, auth, pagination.
"""

import uuid
from typing import Annotated

from fastapi import Depends, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import Settings, get_settings
from src.core.database import get_async_session
from src.core.exceptions import AuthenticationError, InsufficientPermissionsError
from src.core.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

# ── Type aliases for cleaner signatures ──────────────────────────
DBSession = Annotated[AsyncSession, Depends(get_async_session)]
AppSettings = Annotated[Settings, Depends(get_settings)]


async def get_current_user_id(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> uuid.UUID:
    """Extract and validate user ID from the JWT access token."""
    if token is None:
        raise AuthenticationError("Authentication required")

    payload = decode_token(token)
    if payload is None:
        raise AuthenticationError("Invalid or expired token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    if user_id is None:
        raise AuthenticationError("Invalid token payload")

    try:
        return uuid.UUID(user_id)
    except ValueError as err:
        raise AuthenticationError("Invalid token payload") from err


async def get_optional_user_id(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> uuid.UUID | None:
    """Extract user ID from token if present, otherwise return None (for public endpoints)."""
    if token is None:
        return None
    try:
        return await get_current_user_id(token)
    except AuthenticationError:
        return None


CurrentUserId = Annotated[uuid.UUID, Depends(get_current_user_id)]
OptionalUserId = Annotated[uuid.UUID | None, Depends(get_optional_user_id)]


# ── Role-Based Access ────────────────────────────────────────────
def require_role(*allowed_roles: str):
    """Dependency factory that checks if the current user has one of the allowed roles."""

    async def role_checker(
        user_id: CurrentUserId,
        db: DBSession,
    ) -> uuid.UUID:
        from src.auth.repository import UserRepository

        repo = UserRepository(db)
        user = await repo.get_by_id(user_id)
        if user is None:
            raise AuthenticationError("User not found")
        if user.role not in allowed_roles:
            raise InsufficientPermissionsError(
                f"This action requires one of these roles: {', '.join(allowed_roles)}"
            )
        return user_id

    return role_checker


# ── Pagination ───────────────────────────────────────────────────
class PaginationParams:
    """Reusable pagination query parameters."""

    def __init__(
        self,
        page: Annotated[int, Query(ge=1, description="Page number")] = 1,
        page_size: Annotated[
            int, Query(ge=1, le=100, alias="pageSize", description="Items per page")
        ] = 20,
    ):
        self.page = page
        self.page_size = page_size
        self.offset = (page - 1) * page_size


Pagination = Annotated[PaginationParams, Depends()]
