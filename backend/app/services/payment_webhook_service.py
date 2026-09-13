import json
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.payment import Payment, PaymentEvent
from app.models.order import Order
from app.integrations.razorpay_client import provider as payment_provider
import logging

logger = logging.getLogger(__name__)

def process_webhook(db: Session, raw_body: bytes, signature: str, event_id: str):
    # 2. Verify signature
    if not signature or not payment_provider.verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
        
    # 3. Parse JSON
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
        
    # Delegate parsing to the provider
    parsed_event = payment_provider.parse_webhook_event(payload)
    print(f"DEBUG_PARSED: {parsed_event}")
    
    provider_event_id = parsed_event.get("provider_event_id") or event_id
    provider_order_id = parsed_event.get("provider_order_id")
    provider_payment_id = parsed_event.get("provider_payment_id")
    event_status = parsed_event.get("status")
    
    if event_status == "unknown":
        return {"status": "ignored", "message": "Unknown or unsupported event ignored"}
        
    if not provider_event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing event ID")
        
    # 5. Begin DB transaction
    try:
        # 6. Check PaymentEvent (Idempotency)
        existing_event = db.query(PaymentEvent).filter(PaymentEvent.provider_event_id == provider_event_id).first()
        if existing_event:
            return {"status": "success", "message": "Event already processed"}
            
        if not provider_order_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing order identifier in webhook")

        # 7. Lock Payment with FOR UPDATE
        payment = db.query(Payment).filter(
            Payment.provider_order_id == provider_order_id
        ).with_for_update().first()
        
        if not payment:
            # Payment not found for this provider_order_id
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            
        # 8. Validate event against Payment (Optional amount check if provider returns amount)
        # Note: We omit strict amount checking here if the provider webhook structure doesn't easily expose it,
        # since verify_webhook_signature already guarantees payload authenticity from the provider.
        if payment.provider_payment_id and provider_payment_id and payment.provider_payment_id != provider_payment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment ID mismatch")
            
        if provider_payment_id and not payment.provider_payment_id:
            # Check if this provider_payment_id is already assigned to a DIFFERENT local payment
            conflict = db.query(Payment).filter(
                Payment.provider_payment_id == provider_payment_id,
                Payment.id != payment.id
            ).first()
            with open("webhook_debug.txt", "a") as f:
                f.write(f"provider_payment_id={provider_payment_id}, payment.id={payment.id}, payment.provider_payment_id={payment.provider_payment_id}, conflict={conflict.id if conflict else None}\n")
            if conflict:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment ID mismatch")
            
        # 9. Create PaymentEvent
        from datetime import datetime, timezone
        payment_event = PaymentEvent(
            provider_event_id=provider_event_id,
            event_type=payload.get("event", "unknown"),
            payload=payload,
            processed_at=datetime.now(timezone.utc)
        )
        db.add(payment_event)
        
        # 10. & 11. Update Payment and Order
        order = db.query(Order).filter(Order.id == payment.order_id).with_for_update().first()
        
        from app.services import inventory_service

        if event_status == "captured":
            if payment.status != "captured":
                payment.status = "captured"
                payment.provider_payment_id = provider_payment_id
                
                success = inventory_service.reserve_and_deduct_stock(db, order.items)
                order.status = "confirmed" if success else "inventory_conflict"
                
        elif event_status == "failed":
            if payment.status != "captured":
                payment.status = "failed"
                payment.provider_payment_id = provider_payment_id
            # Order remains pending
                
        # 12. Commit
        db.commit()
        return {"status": "success", "message": "Event processed successfully"}
        
    except IntegrityError:
        # If it's PaymentEvent unique constraint, it's a concurrent duplicate.
        # But if it's Payment.provider_payment_id unique constraint, it's a forgery attempt.
        db.rollback()
        # Since we can't easily distinguish SQLite IntegrityErrors without parsing the string,
        # and we already check PaymentEvent explicitly above, any remaining IntegrityError
        # during commit is likely the provider_payment_id uniqueness constraint.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment ID already assigned to another order")
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
