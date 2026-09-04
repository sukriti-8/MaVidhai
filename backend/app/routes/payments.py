from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.payment import PaymentCreateRequest, PaymentCreateResponse, PaymentVerifyRequest, PaymentVerifyResponse
from app.services import payment_service

router = APIRouter(prefix="/api/payments", tags=["Payments"])

@router.post("/create", response_model=PaymentCreateResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    request: PaymentCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return payment_service.create_payment(db=db, user=current_user, order_number=request.order_number)

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
