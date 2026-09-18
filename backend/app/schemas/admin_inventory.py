from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field

class AdminInventoryProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: float
    stock: int
    availability: bool
    category_id: int
    is_low_stock: bool
    is_out_of_stock: bool
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAdminInventoryProductResponse(BaseModel):
    items: list[AdminInventoryProductResponse]
    total: int
    page: int
    size: int

class InventoryAuditResponse(BaseModel):
    id: int
    product_id: int
    admin_id: Optional[int]
    order_id: Optional[int]
    adjustment_type: str
    previous_stock: int
    adjustment: int
    new_stock: int
    reason: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedInventoryAuditResponse(BaseModel):
    items: list[InventoryAuditResponse]
    total: int
    page: int
    size: int

class BulkInventoryAdjustmentItem(BaseModel):
    product_id: int
    delta: int
    reason: str = Field(..., min_length=1)

class BulkInventoryAdjustmentRequest(BaseModel):
    items: List[BulkInventoryAdjustmentItem] = Field(..., min_length=1, max_length=100)

class InventorySummaryResponse(BaseModel):
    total_stock: int
    low_stock_count: int
    out_of_stock_count: int
    availability_breakdown: dict
