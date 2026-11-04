"""
Pytest configuration and global fixtures for PropVerse AI test suite.
"""

import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture(scope="session", autouse=True)
def client():
    """Client fixture that initializes the app lifespan (database init & seeding)."""
    with TestClient(app) as c:
        yield c
