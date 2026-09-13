from pydantic import BaseModel, ConfigDict
from typing import Optional

class PaymentCreateRequest(BaseModel):
    order_number: str

class PaymentCreateResponse(BaseModel):
    order_number: str
    provider_order_id: str
    payment_url: Optional[str] = None
    whatsapp_deep_link: Optional[str] = None
    amount: int  # generic or paise depending on provider, we'll keep it as int (paise) for now
    currency: str

class PaymentVerifyRequest(BaseModel):
    # Deprecated for Option 2, but kept for parsing legacy test requests
    order_number: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentVerifyResponse(BaseModel):
    status: str
    order_number: str
    message: str
