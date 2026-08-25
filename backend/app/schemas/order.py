from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime

class OrderCreate(BaseModel):
    shipping_full_name: str = Field(..., min_length=1)
    shipping_email: str = Field(..., min_length=1)
    shipping_phone: str = Field(..., min_length=1)
    shipping_address_line1: str = Field(..., min_length=1)
    shipping_address_line2: Optional[str] = None
    shipping_city: str = Field(..., min_length=1)
    shipping_state: str = Field(..., min_length=1)
    shipping_postal_code: str = Field(..., min_length=1)
    shipping_country: str = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    product_slug: str
    unit_price: float
    quantity: int
    subtotal: float
    
    model_config = ConfigDict(from_attributes=True)


class OrderListItem(BaseModel):
    order_number: str
    status: str
    currency: str
    total_amount: float
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class OrderListResponse(BaseModel):
    items: List[OrderListItem]
    page: int
    limit: int
    total: int
    pages: int

class OrderResponse(BaseModel):
    id: int
    order_number: str
    status: str
    payment_status: Optional[str] = "pending"
    subtotal: float
    shipping_amount: float
    discount_amount: float
    total_amount: float
    currency: str
    
    shipping_full_name: str
    shipping_email: str
    shipping_phone: str
    shipping_address_line1: str
    shipping_address_line2: Optional[str]
    shipping_city: str
    shipping_state: str
    shipping_postal_code: str
    shipping_country: str
    
    created_at: datetime
    updated_at: datetime
    
    items: List[OrderItemResponse]
    
    model_config = ConfigDict(from_attributes=True)
