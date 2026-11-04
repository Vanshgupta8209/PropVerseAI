"""
PropVerse AI — Supabase Client Helper.
Provides REST client utilities for interacting with Supabase Cloud APIs (Auth, Storage, Functions, REST).
"""

import logging
from typing import Any

import httpx

from src.core.config import get_settings

logger = logging.getLogger("propverse.supabase")
settings = get_settings()


class SupabaseClient:
    """Async client wrapper for Supabase REST and Storage APIs."""

    def __init__(self) -> None:
        self.url = settings.SUPABASE_URL.rstrip("/")
        self.key = settings.SUPABASE_KEY
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }

    async def get_table_data(self, table: str, query_params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
        """Fetch rows from a table via PostgREST endpoint."""
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{self.url}/rest/v1/{table}",
                headers=self.headers,
                params=query_params or {},
            )
            resp.raise_for_status()
            return resp.json()

    async def create_storage_bucket(self, bucket_name: str, public: bool = True) -> dict[str, Any]:
        """Create a Supabase storage bucket if it doesn't exist."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{self.url}/storage/v1/bucket",
                headers=self.headers,
                json={"id": bucket_name, "name": bucket_name, "public": public},
            )
            if resp.status_code in (200, 201):
                logger.info(f"Supabase bucket '{bucket_name}' created/ready.")
                return resp.json()
            return {"status": "exists_or_error", "code": resp.status_code}


_supabase_client: SupabaseClient | None = None


def get_supabase_client() -> SupabaseClient:
    """Singleton getter for Supabase Client."""
    global _supabase_client
    if _supabase_client is None:
        _supabase_client = SupabaseClient()
    return _supabase_client
