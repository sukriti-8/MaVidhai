from sqlalchemy.orm import Session
from fastapi import HTTPException, status, BackgroundTasks
from decimal import Decimal
import os
import urllib.parse
import asyncio
from app.models.order import Order
from app.models.payment import Payment, PaymentRefund
from app.models.user import User
from app.database.connection import SessionLocal

# In the future, this can be dynamically loaded or injected
from app.integrations.razorpay_client import provider as payment_provider
from app.integrations.whatsapp_client import client as whatsapp_client
from app.services.audit_service import log_admin_action

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

def admin_refund_payment(payment_id: int, admin_user: User):
    """
    Executes a full refund for a captured payment using a two-phase transaction.
    """
    # Phase 1: Intent & Lock
    with SessionLocal() as db:
        from sqlalchemy.orm import selectinload
        # Lock the payment
        payment = db.query(Payment).options(selectinload(Payment.order)).filter(Payment.id == payment_id).with_for_update().first()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            
        if payment.status != "captured":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"Only 'captured' payments can be refunded. Current status is '{payment.status}'"
            )

        if payment.order and payment.order.status in ["shipped", "delivered"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Refunds for {payment.order.status} orders must be processed via the returns workflow."
            )
            
        # Check for pending refunds
        pending_refund = db.query(PaymentRefund).filter(
            PaymentRefund.payment_id == payment_id,
            PaymentRefund.status == "pending"
        ).first()
        
        if pending_refund:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A refund for this payment is already in progress."
            )
            
        # Create pending refund record
        refund_record = PaymentRefund(
            payment_id=payment.id,
            admin_id=admin_user.id,
            amount=payment.amount,
            status="pending"
        )
        db.add(refund_record)
        db.commit()
        db.refresh(refund_record)
        refund_record_id = refund_record.id
        provider_payment_id = payment.provider_payment_id
        amount = float(payment.amount)
        order_id = payment.order_id

    # Phase 2: Network Call
    try:
        refund_data = payment_provider.refund_payment(
            provider_payment_id=provider_payment_id, 
            amount=amount, 
            receipt=str(refund_record_id)
        )
        provider_refund_id = refund_data.get("provider_refund_id")
        provider_success = True
        error_message = None
    except Exception as e:
        provider_success = False
        error_message = str(e)
        provider_refund_id = None

    # Phase 3: Finalize
    with SessionLocal() as db:
        from sqlalchemy.orm import selectinload
        payment = db.query(Payment).options(selectinload(Payment.order)).filter(Payment.id == payment_id).with_for_update().first()
        refund_record = db.query(PaymentRefund).filter(PaymentRefund.id == refund_record_id).with_for_update().first()
        order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
        
        if provider_success:
            refund_record.status = "completed"
            refund_record.provider_refund_id = provider_refund_id
            payment.status = "refunded"
            
            # Order Consequences
            from app.services import order_service
            order_service.cancel_order_internal(db, order, adjustment_type="REFUND_RESTORATION")
            
            log_admin_action(
                db=db,
                admin_id=admin_user.id,
                action="PAYMENT_REFUNDED",
                entity_type="PAYMENT",
                entity_id=str(payment.id),
                details={
                    "refund_record_id": refund_record.id,
                    "provider_refund_id": provider_refund_id,
                    "amount": amount
                }
            )
                
            db.commit()
            db.refresh(payment)
            return {"status": "success", "message": "Refund processed successfully.", "payment": payment}
        else:
            refund_record.status = "failed"
            refund_record.failure_message = error_message
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Provider refund failed: {error_message}"
            )

def recover_admin_refund(payment_id: int, admin_user: User):
    """
    Recovers a stuck pending refund by checking Razorpay for the exact receipt matching PaymentRefund.id.
    """
    # Transaction 1: Lock/read pending refund and validate eligibility
    with SessionLocal() as db:
        payment = db.query(Payment).filter(Payment.id == payment_id).with_for_update().first()
        if not payment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            
        pending_refund = db.query(PaymentRefund).filter(
            PaymentRefund.payment_id == payment_id,
            PaymentRefund.status == "pending"
        ).with_for_update().first()
        
        if not pending_refund:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending refund found for this payment to recover."
            )
            
        refund_record_id = pending_refund.id
        provider_payment_id = payment.provider_payment_id
        receipt_to_match = str(refund_record_id)
        
    # Provider API call: fetch refunds
    try:
        provider_refunds = payment_provider.fetch_refunds(provider_payment_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch provider refunds: {str(e)}"
        )
        
    # Correlate exact refund
    matching_provider_refund = None
    for r in provider_refunds:
        if r.get("receipt") == receipt_to_match:
            matching_provider_refund = r
            break
            
    # Transaction 2: Verify still pending and finalize
    with SessionLocal() as db:
        from sqlalchemy.orm import selectinload
        payment = db.query(Payment).options(selectinload(Payment.order)).filter(Payment.id == payment_id).with_for_update().first()
        refund_record = db.query(PaymentRefund).filter(PaymentRefund.id == refund_record_id).with_for_update().first()
        order = db.query(Order).filter(Order.id == payment.order_id).with_for_update().first()
        
        if refund_record.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Refund is no longer pending; recovery was already processed."
            )
            
        if not matching_provider_refund:
            return {
                "status": "pending",
                "resolution": "UNRESOLVED",
                "message": "No matching provider refund was found; retry reconciliation later."
            }
            
        provider_status = matching_provider_refund.get("status")
        provider_refund_id = matching_provider_refund.get("provider_refund_id")
        
        if provider_status == "processed":
            refund_record.status = "completed"
            refund_record.provider_refund_id = provider_refund_id
            payment.status = "refunded"
            
            # Order Consequences
            from app.services import order_service
            order_service.cancel_order_internal(db, order, adjustment_type="REFUND_RESTORATION")
            
            log_admin_action(
                db=db,
                admin_id=admin_user.id,
                action="PAYMENT_REFUND_RECOVERED",
                entity_type="PAYMENT",
                entity_id=str(payment.id),
                details={
                    "refund_record_id": refund_record.id,
                    "provider_refund_id": provider_refund_id
                }
            )
                
            db.commit()
            db.refresh(payment)
            return {
                "status": "success", 
                "resolution": "FINALIZED",
                "message": "Pending refund was successfully correlated and finalized.", 
                "payment": payment
            }
            
        elif provider_status == "failed":
            refund_record.status = "failed"
            refund_record.provider_refund_id = provider_refund_id
            refund_record.failure_message = "Provider refund was marked as failed."
            db.commit()
            db.refresh(payment)
            return {
                "status": "success",
                "resolution": "MARKED_FAILED",
                "message": "Pending refund failed at provider and is now marked failed.",
                "payment": payment
            }
            
        else: # e.g. "pending"
            return {
                "status": "pending",
                "resolution": "UNRESOLVED",
                "message": f"Provider refund is currently in state '{provider_status}'. Will remain pending."
            }
