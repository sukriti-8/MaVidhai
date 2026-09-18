from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Literal

PaymentStatus = Literal["created", "captured", "failed", "refunded"]

class PaymentOrderContext(BaseModel):
    order_number: str
    status: str
    
    model_config = ConfigDict(from_attributes=True)

class AdminPaymentResponse(BaseModel):
    id: int
    order_id: int
    provider: str
    provider_order_id: str
    provider_payment_id: str | None = None
    status: PaymentStatus
    amount: float
    currency: str
    failure_code: str | None = None
    failure_message: str | None = None
    created_at: datetime
    updated_at: datetime
    
    order: PaymentOrderContext
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAdminPaymentResponse(BaseModel):
    items: list[AdminPaymentResponse]
    page: int
    limit: int
    total: int
    pages: int

class PaymentReconciliationResponse(BaseModel):
    payment_id: int
    order_id: int
    payment_status: PaymentStatus
    order_status: str
    reason: str
    action_required: str

class AdminRefundResponse(BaseModel):
    status: str
    message: str
    payment: AdminPaymentResponse

class AdminRefundRecoveryResponse(BaseModel):
    status: str
    resolution: str
    message: str
    payment: AdminPaymentResponse | None = None
