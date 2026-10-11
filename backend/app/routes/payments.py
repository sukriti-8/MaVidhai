from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment import PaymentCreateRequest, PaymentCreateResponse, PaymentVerifyRequest, PaymentVerifyResponse
from app.services import payment_service
import os
import json
from fastapi import HTTPException
from app.models.payment import Payment
from app.models.order import Order
from app.integrations.razorpay_client import provider as payment_provider
router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create", response_model=PaymentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    request: PaymentCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return payment_service.create_payment(
        db=db, 
        user=current_user, 
        order_number=request.order_number,
        background_tasks=background_tasks
    )

@router.post("/verify", response_model=PaymentVerifyResponse, status_code=status.HTTP_200_OK)
def verify_payment(
    request: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return payment_service.verify_payment(db=db, user=current_user, data=request)

from fastapi import Request
from app.services import payment_webhook_service

@router.post("/webhook")
async def webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    event_id = request.headers.get("x-razorpay-event-id")
    
    # If the event ID isn't in headers, we can try to extract it from payload after signature validation
    # Razorpay's payload usually has "id": "ev_..." at the root. We'll pass both if available.
    if not event_id:
        try:
            import json
            payload = json.loads(raw_body.decode("utf-8"))
            event_id = payload.get("id")
        except Exception:
            pass

    return payment_webhook_service.process_webhook(
        db=db, 
        raw_body=raw_body, 
        signature=signature, 
        event_id=event_id
    )

import os
import json
from app.models.payment import Payment
from app.models.order import Order
from app.integrations.razorpay_client import provider as payment_provider


@router.post("/mock-confirm/{order_number}")
def mock_confirm_payment(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Never allow mock confirmations in production.
    if os.getenv("ENVIRONMENT", "development").lower() == "production":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock payments are disabled in production",
        )

    # Mock confirmation is allowed only without a real Razorpay client.
    if payment_provider.client is not None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Mock payments are disabled when Razorpay is configured",
        )

    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == current_user.id,
    ).first()

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    payment = db.query(Payment).filter(
        Payment.order_id == order.id,
    ).order_by(Payment.id.desc()).first()

    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    if payment.status != "created":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment cannot be confirmed from status: {payment.status}",
        )

    payload = {
        "id": f"evt_mock_{payment.id}",
        "event": "payment_link.paid",
        "payload": {
            "payment_link": {
                "entity": {
                    "id": payment.provider_order_id,
                    "payment_id": f"pay_mock_{payment.id}",
                }
            }
        },
    }

    raw_body = json.dumps(payload).encode("utf-8")

    result = payment_webhook_service.process_webhook(
        db=db,
        raw_body=raw_body,
        signature="valid_webhook_signature",
        event_id=payload["id"],
    )

    return {
        "status": "success",
        "message": "Mock payment confirmation processed",
        "order_number": order.order_number,
        "payment_result": result,
    }
