from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Annotated

from app.database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_super_admin
from app.schemas.admin_audit import PaginatedAdminAuditResponse
from app.services.audit_service import get_audit_logs

router = APIRouter(prefix="/api/admin/audit", tags=["Admin Audit"])

@router.get("", response_model=PaginatedAdminAuditResponse)
def get_admin_audit_logs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
    admin_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    size: Annotated[int, Query(ge=1, le=100)] = 50
):
    items, total, pages = get_audit_logs(
        db=db,
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        start_date=start_date,
        end_date=end_date,
        page=page,
        size=size
    )
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }
