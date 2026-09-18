from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import date

class DateRangeParams(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class RevenueDashboard(BaseModel):
    gross_captured: float
    refunded: float
    net: float

class OrdersDashboard(BaseModel):
    total: int
    captured: int
    cancelled: int
    inventory_conflict: int

class CustomersDashboard(BaseModel):
    customers_with_orders: int
    new_customers: int

class RefundsDashboard(BaseModel):
    completed_count: int
    completed_amount: float
    pending_count: int

class InventoryDashboard(BaseModel):
    low_stock: int
    out_of_stock: int

class DashboardPeriod(BaseModel):
    start_date: date
    end_date: date

class DashboardResponse(BaseModel):
    period: DashboardPeriod
    revenue: RevenueDashboard
    orders: OrdersDashboard
    customers: CustomersDashboard
    refunds: RefundsDashboard
    aov: float
    inventory: InventoryDashboard
    
    model_config = ConfigDict(from_attributes=True)

class TimeseriesPoint(BaseModel):
    date: str
    revenue: float
    orders_count: int
    
    model_config = ConfigDict(from_attributes=True)

class RevenueTimeseriesResponse(BaseModel):
    period: DashboardPeriod
    interval: str
    data: List[TimeseriesPoint]
    
    model_config = ConfigDict(from_attributes=True)

class ProductSalesMetric(BaseModel):
    product_id: int
    product_name: str
    quantity_sold: int
    revenue_generated: float
    order_count: int
    
    model_config = ConfigDict(from_attributes=True)

class ProblematicProductMetric(BaseModel):
    product_id: int
    product_name: str
    inventory_conflict_count: int
    cancellation_count: int
    
    model_config = ConfigDict(from_attributes=True)

class ProductAnalyticsResponse(BaseModel):
    top_by_quantity: List[ProductSalesMetric]
    top_by_revenue: List[ProductSalesMetric]
    lowest_sellers: List[ProductSalesMetric]
    problematic_products: List[ProblematicProductMetric]
    
    model_config = ConfigDict(from_attributes=True)

class TopCustomerMetric(BaseModel):
    user_id: int
    email: str
    full_name: str
    period_revenue: float
    orders_count: int
    
    model_config = ConfigDict(from_attributes=True)

class CustomerAnalyticsResponse(BaseModel):
    new_customers: int
    returning_customers: int
    top_customers_by_period_revenue: List[TopCustomerMetric]
    average_order_value: float
    
    model_config = ConfigDict(from_attributes=True)
