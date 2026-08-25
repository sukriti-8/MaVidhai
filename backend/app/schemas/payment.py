from pydantic import BaseModel, ConfigDict
from typing import Optional

class PaymentCreateRequest(BaseModel):
    order_number: str

class PaymentCreateResponse(BaseModel):
    order_number: str
    razorpay_order_id: str
    amount: int  # in paise
    currency: str
    key_id: str

class PaymentVerifyRequest(BaseModel):
    order_number: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class PaymentVerifyResponse(BaseModel):
    status: str
    order_number: str
    message: str
