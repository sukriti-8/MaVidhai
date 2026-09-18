from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.schemas.admin_dashboard import DashboardResponse
from app.utils.dependencies import get_super_admin
from app.services.admin_dashboard_service import get_dashboard_v2
from datetime import datetime, timezone

router = APIRouter(prefix="/api/admin/dashboard", tags=["admin_dashboard"])

@router.get("", response_model=DashboardResponse)
def get_dashboard_metrics(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    if not end_date:
        end_date = datetime.now(timezone.utc).date()
    if not start_date:
        start_date = end_date - timedelta(days=29) # default 30 days inclusive

    data = get_dashboard_v2(db, start_date, end_date)
    return data
