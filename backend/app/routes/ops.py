from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.connection import get_db

router = APIRouter(tags=["ops"])

@router.get("/health")
def health_check():
    """Liveness probe: verifies the application process is responding."""
    return {
        "status": "ok",
        "service": "mavidhai-api"
    }

@router.get("/ready")
def readiness_check(response: Response, db: Session = Depends(get_db)):
    """Readiness probe: verifies the application is ready to process traffic and the DB is up."""
    try:
        # Perform a lightweight query using the existing session infrastructure
        db.execute(text("SELECT 1"))
        return {
            "status": "ready",
            "database": "up"
        }
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "not_ready",
            "database": "down"
        }
