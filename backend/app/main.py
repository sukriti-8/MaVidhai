from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from sqlalchemy import text
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.database.connection import engine
import os
import logging

from app.utils.logging import setup_logging, request_id_context
from app.middlewares.logging_middleware import LoggingMiddleware
from app.middlewares.security_middleware import SecurityHeadersMiddleware

from app.routes import auth, categories, products, cart, wishlist, orders, payments, translation, whatsapp, admin_categories, admin_products, admin_dashboard, admin_users, admin_orders, admin_payments, admin_inventory, admin_analytics, admin_catalog, admin_audit, ops

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


# Initialize logging before creating the app
setup_logging()

# Determine if docs should be disabled in production
environment = os.getenv("ENVIRONMENT", "development")
docs_url = None if environment == "production" else "/docs"
redoc_url = None if environment == "production" else "/redoc"

app = FastAPI(
    title="MaVidhai API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url=docs_url,
    redoc_url=redoc_url,
)



@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Log unexpected 5xx errors with their request ID and stack trace,
    but keep the response contract safe and minimal.
    """
    req_id = request.headers.get("X-Request-ID", request_id_context.get())
    
    logger.error(
        "Unhandled server error",
        exc_info=exc,
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": 500,
            "request_id": req_id
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error"},
        headers={"X-Request-ID": req_id}
    )

# 1. Trusted Host Middleware (Innermost of these, drops bad hosts)
allowed_hosts_env = os.getenv("ALLOWED_HOSTS", "*" if environment != "production" else "api.mavidhai.com")
allowed_hosts = [host.strip() for host in allowed_hosts_env.split(",") if host.strip()]

if environment == "production" and (not allowed_hosts or "*" in allowed_hosts):
    logger.warning("Production environment requires explicit ALLOWED_HOSTS. Falling back to strict default.")
    allowed_hosts = ["api.mavidhai.com"]

app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

# 2. CORS Middleware
frontend_url_env = os.getenv("FRONTEND_URL", "http://localhost:3000")
allow_origins = [origin.strip() for origin in frontend_url_env.split(",") if origin.strip()]

if environment == "production" and (not allow_origins or "*" in allow_origins):
    logger.warning("Production environment requires explicit FRONTEND_URL. Falling back to strict default.")
    allow_origins = ["https://mavidhai.com"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# 3. Security Headers (Applies to all HTTP responses)
app.add_middleware(SecurityHeadersMiddleware)

# 4. Logging Middleware (Outermost, added last so it wraps everything)
app.add_middleware(LoggingMiddleware)

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
app.include_router(admin_dashboard.router)
app.include_router(admin_payments.router)
app.include_router(admin_users.router)
app.include_router(admin_orders.router)
app.include_router(admin_inventory.router)
app.include_router(admin_analytics.router)
app.include_router(admin_catalog.router)
app.include_router(admin_audit.router)
app.include_router(ops.router)

