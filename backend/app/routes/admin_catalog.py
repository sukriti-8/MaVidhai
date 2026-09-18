from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user import User
from app.schemas.admin_catalog import CatalogSummaryResponse
from app.utils.dependencies import get_super_admin
from app.services import catalog_service

router = APIRouter(prefix="/api/admin/catalog", tags=["admin_catalog"])

@router.get(
    "/summary",
    response_model=CatalogSummaryResponse,
)
def get_catalog_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    return catalog_service.get_catalog_summary(db)
