# Technical Requirement Document (TRD) — PropVerse AI

## 1. System Architecture Overview

```
                      ┌─────────────────────────────────────────┐
                      │              React 19 SPA               │
                      │  Vite + Tailwind CSS v4 + Framer Motion  │
                      └────────────────────┬────────────────────┘
                                           │ HTTP/REST & WebSockets
                                           ▼
                      ┌─────────────────────────────────────────┐
                      │           Nginx Reverse Proxy           │
                      └────────────────────┬────────────────────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        ▼                                     ▼
             ┌─────────────────────┐               ┌─────────────────────┐
             │   FastAPI Engine    │               │ WebSocket Server    │
             │ (ASGI Uvicorn App)  │               │ Real-time Chat/Notif│
             └──────────┬──────────┘               └──────────┬──────────┘
                        │                                     │
         ┌──────────────┼──────────────────────┐              │
         ▼              ▼                      ▼              ▼
 ┌───────────────┐ ┌───────────────┐ ┌──────────────────┐ ┌──────────────┐
 │ PostgreSQL 16 │ │ Redis Cache   │ │ Gemini / OpenAI  │ │ Celery Worker│
 │ Async SQLAlchemy││ Sessions/Queue│ │ LLM AI Services  │ │ Async Backgnd│
 └───────────────┘ └───────────────┘ └──────────────────┘ └──────────────┘
```

## 2. Low-Level Architecture & Domain Modules
The backend follows Domain-Driven Design (DDD) with explicit module isolation:
* **`src/core/`**: Security (JWT/bcrypt), Database session context, Pydantic settings, Exceptions, Redis manager.
* **`src/auth/`**: User account registration, OAuth2 bearer flow, OTP generation/validation, Audit logs.
* **`src/properties/`**: Property CRUD, search engine filters, reviews, bookmarks, media catalog.
* **`src/ai/`**: Natural language search parser, market price prediction, automated description generator, chatbot.
* **`src/chat/`**: WebSocket connection manager, message history repository, typing indicators.
* **`src/loans/`**: Financial loan eligibility scoring and EMI calculation matrix.
* **`src/admin/`**: Moderation workflows, user status toggle, audit monitoring.

## 3. Database & Caching Strategy
* **Primary Store**: PostgreSQL 16 using `asyncpg` driver and SQLAlchemy 2.0 async engine.
* **Indexing**: B-Tree indexes on PKs/FKs and low-cardinality flags (`is_verified`, `status`), Composite indexes on location (`city`, `state`) and price ranges.
* **Caching**: Redis multi-tier caching for high-frequency queries (e.g. `properties:featured`, `amenities:list`) with automatic TTL and key invalidation patterns.

## 4. AI Service Infrastructure
* **LLM Engine**: Integration with Google Gemini API (`gemini-2.0-flash`) and fallback to OpenAI API.
* **NLP Search**: Converts raw text inputs into structured Pydantic search filter objects (`PropertyFilter`).
* **Valuation Model**: Machine learning regression pipeline computing baseline price per sqft adjusted for location growth indices, age, and amenities.

## 5. Security & Rate Limiting
* **Authentication**: Short-lived JWT Access Tokens (30 mins) + Long-lived Rotating Refresh Tokens (7 days).
* **Passwords**: Bcrypt with adaptive work factor (12 rounds).
* **API Protection**: Security headers middleware (HSTS, CSP, X-Frame-Options, XSS protection), rate-limiting middleware by IP address.
