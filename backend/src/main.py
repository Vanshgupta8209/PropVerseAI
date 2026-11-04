"""
PropVerse AI — FastAPI Application Factory
Assembles the application with middleware, routers, and lifecycle events.
"""

import logging
import sys
from contextlib import asynccontextmanager
from pathlib import Path

# Ensure backend directory is in sys.path when running main.py directly
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.core.config import get_settings
from src.core.database import close_db, init_db
from src.core.exceptions import register_exception_handlers
from src.core.middleware import RequestLoggingMiddleware, SecurityHeadersMiddleware
from src.core.redis import close_redis, init_redis

settings = get_settings()

# ── Logging Configuration ────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s │ %(levelname)-8s │ %(name)s │ %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("propverse")


# ── Lifecycle Events ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle manager."""
    logger.info("🚀 Starting PropVerse AI v%s [%s]", settings.APP_VERSION, settings.ENVIRONMENT)

    # Initialize services
    try:
        await init_db()
        logger.info("✓ Database connected")

        # Seed default data
        from src.core.database import async_session_factory
        from src.properties.repository import AmenityRepository

        async with async_session_factory() as session:
            amenity_repo = AmenityRepository(session)
            await amenity_repo.seed_defaults()
            await session.commit()
            logger.info("✓ Default amenities seeded")
    except Exception as exc:
        logger.error("⚠ Database connection failed: %s", exc)
        logger.warning("⚠ Check your DATABASE_URL in .env (e.g. set correct password for postgres).")

    # Initialize Redis
    try:
        await init_redis()
    except Exception as exc:
        logger.warning("⚠ Redis initialization failed: %s", exc)

    logger.info("═══════════════════════════════════════════════")
    logger.info("  PropVerse AI Live URL: http://%s:%s", settings.HOST, settings.PORT)
    logger.info("  Swagger UI: http://%s:%s/docs", settings.HOST, settings.PORT)
    logger.info("═══════════════════════════════════════════════")

    yield

    # Shutdown
    logger.info("Shutting down PropVerse AI...")
    await close_redis()
    await close_db()
    logger.info("Goodbye! 👋")


# ── Application Factory ─────────────────────────────────────────
def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description=settings.APP_DESCRIPTION,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # ── Middleware (order matters: last added = first executed) ──
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ──────────────────────────────────────
    register_exception_handlers(app)

    # ── Routers ─────────────────────────────────────────────────
    from src.auth.router import router as auth_router
    from src.properties.router import router as properties_router
    from src.ai.router import router as ai_router
    from src.loans.router import router as loans_router
    from src.posts.router import router as posts_router
    from src.chat.router import router as chat_router
    from src.dashboard.router import router as dashboard_router

    api_prefix = "/api/v1"
    app.include_router(auth_router, prefix=api_prefix)
    app.include_router(properties_router, prefix=api_prefix)
    app.include_router(ai_router, prefix=api_prefix)
    app.include_router(loans_router, prefix=api_prefix)
    app.include_router(posts_router, prefix=api_prefix)
    app.include_router(chat_router, prefix=api_prefix)
    app.include_router(dashboard_router, prefix=api_prefix)

    # ── Health & System API Check ───────────────────────────────
    @app.get("/health", tags=["System"])
    @app.get(f"{api_prefix}/health", tags=["System"])
    async def health_check():
        return {
            "status": "healthy",
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
        }

    @app.get(f"{api_prefix}/info", tags=["System"])
    async def system_info():
        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "tagline": "The Intelligent Future of Real Estate",
            "docs": "/docs",
            "contact": {
                "email": settings.CONTACT_EMAIL,
                "phone": settings.CONTACT_PHONE,
                "location": settings.CONTACT_LOCATION,
            },
        }

    # ── Static Files & SPA Frontend ─────────────────────────────
    frontend_dist = backend_dir.parent / "frontend" / "dist"
    if (frontend_dist / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(frontend_dist / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Prevent fallback for unmatched API routes so clients receive 404 JSON
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail="API route not found")

        # Serve static file if present in frontend/dist (e.g. favicon.ico)
        if full_path:
            target_file = frontend_dist / full_path
            if target_file.is_file():
                return FileResponse(target_file)

        # Fallback to index.html for client-side SPA routing
        index_file = frontend_dist / "index.html"
        if index_file.exists():
            return FileResponse(index_file)

        return {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "message": "Frontend build not found. Please run 'npm run build' in frontend directory."
        }

    return app


# ── Application Instance ────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("src.main:app", host="127.0.0.1", port=8000, reload=True)

