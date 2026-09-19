from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date, datetime

class DashboardPeriod(BaseModel):
    start_date: date
    end_date: date

class DashboardMetrics(BaseModel):
    total_revenue: float
    average_order_value: float
    total_orders: int
    new_customers: int
    returning_customers: int

class DashboardInventorySummary(BaseModel):
    total_stock: int
    low_stock_count: int
    out_of_stock_count: int

class DashboardRecentOrder(BaseModel):
    id: int
    order_number: str
    customer: str
    total_amount: float
    order_status: str
    payment_status: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DashboardRecentAudit(BaseModel):
    id: int
    admin_id: int
    action: str
    entity_type: str
    entity_id: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DashboardResponse(BaseModel):
    period: DashboardPeriod
    metrics: DashboardMetrics
    inventory_summary: DashboardInventorySummary
    recent_orders: List[DashboardRecentOrder]
    recent_audits: List[DashboardRecentAudit]
