from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from app.schemas.order import OrderResponse

class AdminPaymentDetail(BaseModel):
    status: str
    provider_order_id: str
    provider_payment_id: Optional[str] = None
    amount: float
    
    model_config = ConfigDict(from_attributes=True)

class PaymentHistoryItem(BaseModel):
    status: str
    provider_payment_id: Optional[str] = None
    amount: float
    timestamp: datetime
    
    model_config = ConfigDict(from_attributes=True)

class AdminOrderResponse(OrderResponse):
    payment: Optional[AdminPaymentDetail] = None
    payment_history: List[PaymentHistoryItem] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)

class AdminOrderListResponse(BaseModel):
    items: List[AdminOrderResponse]
    page: int
    limit: int
    total: int
    pages: int

class AdminOrderStatusUpdate(BaseModel):
    status: str
