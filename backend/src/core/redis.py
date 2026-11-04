"""
Redis client for caching and session management.
Provides async connection pool and cache utility helpers.
"""

import json
import logging
from typing import Any

import redis.asyncio as aioredis

from src.core.config import get_settings

logger = logging.getLogger("propverse.redis")
settings = get_settings()

# ── Connection Pool ──────────────────────────────────────────────
redis_client: aioredis.Redis | None = None


async def init_redis() -> aioredis.Redis | None:
    """Initialize Redis connection pool."""
    global redis_client
    redis_client = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        max_connections=20,
    )
    try:
        await redis_client.ping()
        logger.info("✓ Redis connected at %s", settings.REDIS_URL)
    except Exception:
        logger.warning("⚠ Redis not available — caching disabled")
        redis_client = None
    return redis_client


async def close_redis() -> None:
    """Close Redis connection pool."""
    global redis_client
    if redis_client:
        await redis_client.close()
        redis_client = None


def get_redis() -> aioredis.Redis | None:
    """Return the Redis client (may be None if unavailable)."""
    return redis_client


# ── Cache Helpers ────────────────────────────────────────────────
async def cache_get(key: str) -> Any | None:
    """Retrieve a cached value by key."""
    if redis_client is None:
        return None
    try:
        value = await redis_client.get(key)
        return json.loads(value) if value else None
    except Exception:
        logger.warning("Cache get failed for key: %s", key)
        return None


async def cache_set(key: str, value: Any, ttl: int | None = None) -> bool:
    """Store a value in cache with optional TTL (seconds)."""
    if redis_client is None:
        return False
    try:
        serialized = json.dumps(value, default=str)
        await redis_client.set(key, serialized, ex=ttl or settings.REDIS_CACHE_TTL)
        return True
    except Exception:
        logger.warning("Cache set failed for key: %s", key)
        return False


async def cache_delete(key: str) -> bool:
    """Remove a cached value by key."""
    if redis_client is None:
        return False
    try:
        await redis_client.delete(key)
        return True
    except Exception:
        return False


async def cache_clear_pattern(pattern: str) -> int:
    """Delete all keys matching a pattern (e.g., 'properties:*')."""
    if redis_client is None:
        return 0
    try:
        keys = []
        async for key in redis_client.scan_iter(match=pattern):
            keys.append(key)
        if keys:
            return await redis_client.delete(*keys)
        return 0
    except Exception:
        logger.warning("Cache clear failed for pattern: %s", pattern)
        return 0
