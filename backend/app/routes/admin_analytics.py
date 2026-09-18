from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from datetime import date
from typing import Optional

from app.database.connection import get_db
from app.utils.dependencies import get_super_admin
from app.models.user import User
from app.services import analytics_service
from app.schemas.admin_analytics import (
    DashboardResponse,
    RevenueTimeseriesResponse,
    ProductAnalyticsResponse,
    CustomerAnalyticsResponse
)

router = APIRouter(prefix="/api/admin/analytics", tags=["Admin Analytics"])

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    start_date: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    """
    Get top-level metrics for the Super Admin dashboard.
    """
    return analytics_service.get_dashboard_metrics(db, start_date, end_date)

@router.get("/revenue-timeseries", response_model=RevenueTimeseriesResponse)
def get_revenue_timeseries(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    interval: str = Query("day", description="Grouping interval: day, week, month"),
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    """
    Get revenue aggregated by the specified interval.
    """
    if interval not in ["day", "week", "month"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="interval must be day, week, or month"
        )
    return analytics_service.get_revenue_timeseries(db, interval, start_date, end_date)

@router.get("/products", response_model=ProductAnalyticsResponse)
def get_product_analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    """
    Get product intelligence (top sellers, low sellers, problematic).
    """
    return analytics_service.get_product_analytics(db, start_date, end_date, limit)

@router.get("/customers", response_model=CustomerAnalyticsResponse)
def get_customer_analytics(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(get_super_admin)
):
    """
    Get customer intelligence (new vs returning, top customers).
    """
    return analytics_service.get_customer_analytics(db, start_date, end_date, limit)
