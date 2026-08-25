import json
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.payment import Payment, PaymentEvent
from app.models.order import Order
from app.integrations import razorpay_client
import logging

logger = logging.getLogger(__name__)

def process_webhook(db: Session, raw_body: bytes, signature: str, event_id: str):
    # 2. Verify signature
    if not signature or not razorpay_client.verify_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")
        
    # 3. Parse JSON
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")
        
    event_type = payload.get("event")
    
    # Check if we support this event type
    supported_events = ["payment.captured", "payment.failed", "order.paid"]
    if event_type not in supported_events:
        # Acknowledge but ignore unknown events safely
        return {"status": "ignored", "message": f"Event {event_type} ignored"}
        
    # 4. Extract event ID (passed in from headers)
    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing event ID")
        
    # 5. Begin DB transaction
    try:
        # 6. Check PaymentEvent
        existing_event = db.query(PaymentEvent).filter(PaymentEvent.provider_event_id == event_id).first()
        if existing_event:
            return {"status": "success", "message": "Event already processed"}
            
        # Extract payment data
        try:
            payment_entity = payload["payload"]["payment"]["entity"]
            provider_order_id = payment_entity.get("order_id")
            provider_payment_id = payment_entity.get("id")
            amount_paise = payment_entity.get("amount")
        except KeyError:
            # If payload doesn't have expected payment entity
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed payload")
            
        if not provider_order_id or not provider_payment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing payment identifiers")

        # 7. Lock Payment with FOR UPDATE
        payment = db.query(Payment).filter(
            Payment.provider_order_id == provider_order_id
        ).with_for_update().first()
        
        if not payment:
            # Payment not found for this provider_order_id
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
            
        # 8. Validate event against Payment
        if payment.provider_payment_id and payment.provider_payment_id != provider_payment_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment ID mismatch")
            
        expected_amount_paise = int(payment.amount * Decimal("100"))
        if amount_paise != expected_amount_paise:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount mismatch")
            
        # 9. Create PaymentEvent
        from datetime import datetime, timezone
        payment_event = PaymentEvent(
            provider_event_id=event_id,
            event_type=event_type,
            payload=payload,
            processed_at=datetime.now(timezone.utc)
        )
        db.add(payment_event)
        
        # 10. & 11. Update Payment and Order
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        
        if event_type == "payment.captured":
            payment.status = "captured"
            payment.provider_payment_id = provider_payment_id
            order.status = "confirmed"
        elif event_type == "payment.failed":
            payment.status = "failed"
            payment.provider_payment_id = provider_payment_id
            # Order remains pending
            
        # For order.paid, we just record the event and ensure state converges
        if event_type == "order.paid":
            if payment.status != "captured":
                payment.status = "captured"
                payment.provider_payment_id = provider_payment_id
                order.status = "confirmed"
                
        # 12. Commit
        db.commit()
        return {"status": "success", "message": "Event processed successfully"}
        
    except IntegrityError:
        # Concurrent duplicate delivery causing unique constraint violation on PaymentEvent
        db.rollback()
        return {"status": "success", "message": "Event already processed (concurrent)"}
    except Exception as e:
        db.rollback()
        if isinstance(e, HTTPException):
            raise e
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")
