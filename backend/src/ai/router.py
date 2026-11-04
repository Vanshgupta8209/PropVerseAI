"""
AI Router — Endpoints for AI search, price prediction, description generator, and AI chatbot.
"""

from fastapi import APIRouter, Query, status
from pydantic import BaseModel, Field

from src.ai.service import AIService

router = APIRouter(prefix="/ai", tags=["AI Services"])


class PricePredictRequest(BaseModel):
    city: str
    area_sqft: float = Field(gt=0)
    bedrooms: int = Field(default=2, ge=1)
    property_type: str = Field(default="apartment")
    locality: str | None = None


class DescriptionGenRequest(BaseModel):
    title: str
    city: str
    bedrooms: int = 2
    property_type: str = "apartment"
    area_sqft: float = 1200


class ChatRequest(BaseModel):
    message: str


@router.get("/parse-search", summary="Parse natural language search query")
async def parse_search(query: str = Query(..., description="Natural language search prompt")):
    service = AIService()
    return await service.parse_natural_language_search(query)


@router.post("/predict-price", summary="Predict property price and growth score")
async def predict_price(data: PricePredictRequest):
    service = AIService()
    return await service.predict_property_price(
        city=data.city,
        area_sqft=data.area_sqft,
        bedrooms=data.bedrooms,
        property_type=data.property_type,
        locality=data.locality,
    )


@router.post("/generate-description", summary="Generate AI property description")
async def generate_description(data: DescriptionGenRequest):
    service = AIService()
    description = await service.generate_property_description(data.model_dump())
    return {"description": description}


@router.post("/chat", summary="Chat with PropVerse AI Assistant")
async def chat(data: ChatRequest):
    service = AIService()
    return await service.chat_assistant(data.message)
