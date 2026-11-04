"""
Comprehensive backend test suite for PropVerse AI platform.
Tests system health, loans/EMI calculator, AI endpoints, authentication, and property routes.
"""

import pytest
from fastapi.testclient import TestClient
from src.main import app

def test_health_check(client):
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "PropVerse AI"


def test_root(client):
    """Test API root endpoint (serves SPA HTML or info json)."""
    response = client.get("/")
    assert response.status_code == 200
    if "text/html" in response.headers.get("content-type", ""):
        assert "<!html" in response.text.lower() or "<div" in response.text.lower() or "propverse" in response.text.lower()
    else:
        data = response.json()
        assert "name" in data

    res_info = client.get("/api/v1/info")
    assert res_info.status_code == 200
    assert "name" in res_info.json()


def test_loan_emi_calculation(client):
    """Test EMI calculator endpoint."""
    payload = {
        "loan_amount": 5000000,
        "interest_rate": 8.5,
        "tenure_years": 20
    }
    response = client.post("/api/v1/loans/calculate-emi", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "monthly_emi" in data
    assert data["monthly_emi"] > 0
    assert data["total_payment"] > payload["loan_amount"]


def test_loan_eligibility(client):
    """Test loan eligibility endpoint."""
    payload = {
        "monthly_income": 150000,
        "existing_emis": 20000,
        "interest_rate": 8.5,
        "tenure_years": 20
    }
    response = client.post("/api/v1/loans/eligibility", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "eligible_loan_amount" in data
    assert data["eligible_loan_amount"] > 0


def test_ai_parse_search(client):
    """Test natural language search parser."""
    response = client.get("/api/v1/ai/parse-search?query=3BHK%20apartment%20under%2080%20lakh%20in%20Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert data["bedrooms"] == 3
    assert data["property_type"] == "apartment"
    assert data["city"] == "Mumbai"


def test_ai_price_prediction(client):
    """Test AI price prediction engine."""
    payload = {
        "city": "Mumbai",
        "area_sqft": 1200,
        "bedrooms": 3,
        "property_type": "apartment"
    }
    response = client.post("/api/v1/ai/predict-price", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "estimated_price" in data
    assert data["estimated_price"] > 0
    assert "investment_score" in data


def test_ai_description_generator(client):
    """Test AI property description generator."""
    payload = {
        "title": "Luxury Sea View Apartment",
        "city": "Mumbai",
        "bedrooms": 3,
        "property_type": "apartment",
        "area_sqft": 1500
    }
    response = client.post("/api/v1/ai/generate-description", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "description" in data
    assert len(data["description"]) > 20


def test_ai_chat_assistant(client):
    """Test AI conversational assistant."""
    payload = {"message": "How do I calculate loan EMI?"}
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "response" in data


def test_auth_registration_validation(client):
    """Test registration input validation."""
    invalid_payload = {
        "email": "invalid-email",
        "password": "simple",
        "full_name": "T"
    }
    response = client.post("/api/v1/auth/register", json=invalid_payload)
    assert response.status_code == 422


def test_properties_public_search(client):
    """Test property public search endpoint."""
    response = client.get("/api/v1/properties?city=Mumbai")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


def test_properties_featured_and_trending(client):
    """Test featured and trending properties endpoints."""
    res_featured = client.get("/api/v1/properties/featured")
    assert res_featured.status_code == 200
    assert isinstance(res_featured.json(), list)

    res_trending = client.get("/api/v1/properties/trending")
    assert res_trending.status_code == 200
    assert isinstance(res_trending.json(), list)


def test_properties_amenities(client):
    """Test amenities list endpoint."""
    response = client.get("/api/v1/properties/amenities")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


def test_properties_my_listings_route_ordering(client):
    """Verify route ordering fix: /properties/my/listings returns 401 (auth required), NOT 422 (UUID validation error)."""
    response = client.get("/api/v1/properties/my/listings")
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "AUTHENTICATION_FAILED"


def test_properties_my_bookmarks_route_ordering(client):
    """Verify route ordering fix: /properties/my/bookmarks returns 401 (auth required), NOT 422 (UUID validation error)."""
    response = client.get("/api/v1/properties/my/bookmarks")
    assert response.status_code == 401
    data = response.json()
    assert data["error"] == "AUTHENTICATION_FAILED"
