"""
Application configuration using Pydantic Settings.
All environment variables are validated and typed at startup.
"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central configuration — loaded from .env file and environment variables."""

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "PropVerse AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "The Intelligent Future of Real Estate"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"  # development | staging | production

    # ── Server ───────────────────────────────────────────────────
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # ── Database & Supabase ──────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/propverse"
    DATABASE_ECHO: bool = False
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10

    # ── Supabase Cloud Settings ──────────────────────────────────
    SUPABASE_URL: str = "https://axpjsozhyypeqeycafql.supabase.co"
    SUPABASE_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4cGpzb3poeXlwZXFleWNhZnFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNTI0MzMsImV4cCI6MjEwMTkyODQzM30.5F7uB7DcP1_7Fz1l3mxOMjNXPctr8PJhRGjuDBgLuIc"
    SUPABASE_PUBLISHABLE_KEY: str = "sb_publishable_mPWeT_PW7wtCconCJR3ZdQ_UsnRDSU7"
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Redis ────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_CACHE_TTL: int = 3600  # seconds

    # ── JWT Authentication ───────────────────────────────────────
    JWT_SECRET_KEY: str = "propverse-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── Security ─────────────────────────────────────────────────
    BCRYPT_ROUNDS: int = 12
    RATE_LIMIT_PER_MINUTE: int = 60
    OTP_EXPIRE_MINUTES: int = 10
    OTP_LENGTH: int = 6

    # ── File Uploads ─────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_IMAGE_TYPES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    # ── AI Services ──────────────────────────────────────────────
    AI_PROVIDER: str = "gemini"  # gemini | openai
    GEMINI_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gemini-2.0-flash"

    # ── Email (SMTP) & Contact ────────────────────────────────────
    CONTACT_EMAIL: str = "vanshgupta200431@gmail.com"
    CONTACT_PHONE: str = "+91 8000101992"
    CONTACT_LOCATION: str = "Jaipur, Rajasthan, India"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "vanshgupta200431@gmail.com"
    SMTP_FROM_NAME: str = "PropVerse AI"

    # ── Google Maps ──────────────────────────────────────────────
    GOOGLE_MAPS_API_KEY: str = ""

    # ── Pagination ───────────────────────────────────────────────
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100

    @property
    def async_database_url(self) -> str:
        """Ensure the database URL uses appropriate async driver."""
        if self.DATABASE_URL.startswith("postgresql://"):
            return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)
        if self.DATABASE_URL.startswith("sqlite://") and not self.DATABASE_URL.startswith("sqlite+aiosqlite://"):
            return self.DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://", 1)
        return self.DATABASE_URL


@lru_cache
def get_settings() -> Settings:
    """Cached settings singleton — parsed once at startup."""
    return Settings()
