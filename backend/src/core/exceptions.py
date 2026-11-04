"""
Custom exceptions and global exception handlers.
All API errors return a consistent JSON structure:
{
    "error": "ERROR_CODE",
    "message": "Human-readable description",
    "details": { ... }  // optional
}
"""

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


# ── Base Exception ───────────────────────────────────────────────
class AppException(Exception):
    """Base application exception with HTTP status code."""

    def __init__(
        self,
        message: str = "An unexpected error occurred",
        error_code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: dict | None = None,
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


# ── Auth Exceptions ──────────────────────────────────────────────
class AuthenticationError(AppException):
    def __init__(self, message: str = "Invalid credentials"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_FAILED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class TokenExpiredError(AppException):
    def __init__(self):
        super().__init__(
            message="Token has expired",
            error_code="TOKEN_EXPIRED",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class TokenInvalidError(AppException):
    def __init__(self):
        super().__init__(
            message="Invalid token",
            error_code="TOKEN_INVALID",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class InsufficientPermissionsError(AppException):
    def __init__(self, message: str = "You do not have permission to perform this action"):
        super().__init__(
            message=message,
            error_code="INSUFFICIENT_PERMISSIONS",
            status_code=status.HTTP_403_FORBIDDEN,
        )


# ── Resource Exceptions ─────────────────────────────────────────
class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource", resource_id: str = ""):
        detail = f"{resource} not found"
        if resource_id:
            detail = f"{resource} with id '{resource_id}' not found"
        super().__init__(
            message=detail,
            error_code="NOT_FOUND",
            status_code=status.HTTP_404_NOT_FOUND,
        )


class ConflictError(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(
            message=message,
            error_code="CONFLICT",
            status_code=status.HTTP_409_CONFLICT,
        )


class ValidationError(AppException):
    def __init__(self, message: str = "Validation failed", details: dict | None = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details=details,
        )


# ── Rate Limiting ────────────────────────────────────────────────
class RateLimitExceededError(AppException):
    def __init__(self):
        super().__init__(
            message="Too many requests. Please try again later.",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        )


# ── Register Exception Handlers ─────────────────────────────────
def register_exception_handlers(app: FastAPI) -> None:
    """Attach global exception handlers to the FastAPI app."""

    @app.exception_handler(AppException)
    async def app_exception_handler(_request: Request, exc: AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_code,
                "message": exc.message,
                **({"details": exc.details} if exc.details else {}),
            },
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(_request: Request, _exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
            },
        )
