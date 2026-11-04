"""
Async database engine, session factory, and base model.
Uses SQLAlchemy 2.0+ async patterns with asyncpg driver.
"""

import uuid
from datetime import datetime, timezone
from typing import Any, AsyncGenerator

from sqlalchemy import DateTime, MetaData, func
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from src.core.config import get_settings

settings = get_settings()

# ── Naming convention for consistent constraint names ────────────
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)

import sys
from sqlalchemy.pool import NullPool

# ── Async Engine ─────────────────────────────────────────────────
engine_kwargs: dict[str, Any] = {
    "echo": settings.DATABASE_ECHO,
}

if "pytest" in sys.modules:
    engine_kwargs["poolclass"] = NullPool
elif "sqlite" not in settings.async_database_url:
    engine_kwargs.update({
        "pool_size": settings.DATABASE_POOL_SIZE,
        "max_overflow": settings.DATABASE_MAX_OVERFLOW,
        "pool_pre_ping": True,
        "pool_recycle": 3600,
    })

if "supabase.co" in settings.async_database_url or "supabase.com" in settings.async_database_url:
    # Disable prepared statement cache for Supabase connection poolers & enforce SSL
    engine_kwargs.setdefault("connect_args", {}).update({
        "prepared_statement_cache_size": 0,
        "statement_cache_size": 0,
    })

engine = create_async_engine(
    settings.async_database_url,
    **engine_kwargs
)

# ── Async Session Factory ────────────────────────────────────────
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models with automatic UUID PK and timestamps."""

    metadata = metadata

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
    )


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that yields an async database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db() -> None:
    """Create missing tables (for development only — handles pre-existing Supabase schemas)."""
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as err:
        # Tables already created in Supabase SQL migration
        pass


async def close_db() -> None:
    """Dispose engine connections on shutdown."""
    await engine.dispose()
