from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from decimal import Decimal
import os
import urllib.parse
import asyncio
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User

# In the future, this can be dynamically loaded or injected
from app.integrations.razorpay_client import provider as payment_provider
from app.integrations.whatsapp_client import client as whatsapp_client

def _send_whatsapp_bg(phone: str, text: str):
    asyncio.run(whatsapp_client.send_message(phone, text))

def create_payment(db: Session, user: User, order_number: str, background_tasks: BackgroundTasks = None):
    # 1. Get MaVidhai Order and verify ownership
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == user.id
    ).first()
    
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # 2. Verify order status
    if order.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot create payment for order with status: {order.status}"
        )
        
    # 3. Prevent duplicate Payment Links
    existing_payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.status == "created"
    ).first()
    
    if order.total_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Order amount must be greater than zero"
        )
    
    payment_url = None
    
    if existing_payment:
        provider_order_id = existing_payment.provider_order_id
        # We might not have the URL persisted in DB yet, but we'll adapt later if needed.
    else:
        # 4. Create Payment Link via Provider
        try:
            link_data = payment_provider.create_payment_link(
                amount=float(order.total_amount),
                currency=order.currency,
                order_id=order.order_number,
                customer_phone=order.shipping_phone
            )
            
            provider_order_id = link_data.get("provider_order_id")
            payment_url = link_data.get("payment_url")
            
            # 5. Create Payment record
            payment = Payment(
                order_id=order.id,
                provider="provider", # Generic or 'razorpay'
                provider_order_id=provider_order_id,
                amount=order.total_amount,
                currency=order.currency,
                status="created"
            )
            db.add(payment)
            db.commit()
            
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to create payment: {str(e)}"
            )

    wa_number = os.getenv("WHATSAPP_BUSINESS_PHONE", "910000000000") # Default or fallback
    message_text = f"Hi {order.shipping_full_name},\n\nYour MaVidhai order {order.order_number} has been created.\n\nPlease complete your payment using this link: {payment_url}"
    
    whatsapp_deep_link = f"https://wa.me/{wa_number}?text={urllib.parse.quote(message_text)}"

    if background_tasks and order.shipping_phone:
        background_tasks.add_task(_send_whatsapp_bg, order.shipping_phone, message_text)

    # 6. Return response with the payment URL
    return {
        "order_number": order.order_number,
        "provider_order_id": provider_order_id,
        "payment_url": payment_url,
        "whatsapp_deep_link": whatsapp_deep_link,
        "amount": int(order.total_amount * Decimal("100")),
        "currency": order.currency,
    }

def verify_payment(db: Session, user: User, data):
    """
    Deprecated for Option 2: The frontend no longer does client-side signature verification.
    The authoritative webhook handles all confirmation.
    """
    raise HTTPException(
        status_code=status.HTTP_410_GONE, 
        detail="Client-side payment verification is no longer supported. Please wait for webhook confirmation."
    )

