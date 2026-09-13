from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware

from app.database.connection import engine
import os
import logging

from app.routes import auth, categories, products, cart, wishlist, orders, payments, translation, whatsapp, admin_categories, admin_products

logger = logging.getLogger(__name__)


def validate_production_environment():
    """Validate that all required environment variables are set and valid for production."""
    environment = os.getenv("ENVIRONMENT", "development")
    if environment != "production":
        return

    errors = []

    # --- WhatsApp credentials (New Payment & Communication Flow) ---
    whatsapp_access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    whatsapp_phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not whatsapp_access_token:
        errors.append("WHATSAPP_ACCESS_TOKEN is required in production")
    if not whatsapp_phone_number_id:
        errors.append("WHATSAPP_PHONE_NUMBER_ID is required in production")

    # --- Application secrets ---
    secret_key = os.getenv("SECRET_KEY", "")
    if "change-this" in secret_key or not secret_key:
        errors.append("SECRET_KEY must be set to a secure value in production")

    jwt_secret = os.getenv("JWT_SECRET_KEY")
    if not jwt_secret:
        errors.append("JWT_SECRET_KEY is required in production")

    # --- Database ---
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        errors.append("DATABASE_URL is required in production")

    if errors:
        error_msg = "Production environment validation failed:\n" + "\n".join(f"  ✗ {e}" for e in errors)
        logger.critical(error_msg)
        raise RuntimeError(error_msg)

    logger.info("Production environment validation passed")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    validate_production_environment()
    yield
    # --- Shutdown ---


app = FastAPI(
    title="MaVidhai API",
    version="1.0.0",
    lifespan=lifespan,
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(wishlist.router)
app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(translation.router)
app.include_router(whatsapp.router)
app.include_router(admin_categories.router)
app.include_router(admin_products.router)


@app.get("/api/health")
def health_check():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "status": "ok",
            "database": "connected",
        }

    except Exception as error:
        return {
            "status": "error",
            "database": "disconnected",
            "detail": str(error),
        }
