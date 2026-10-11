import json
import os

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    Request,
    status,
)
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.integrations.razorpay_client import provider as payment_provider
from app.models.order import Order
from app.models.payment import Payment
from app.models.user import User
from app.schemas.payment import (
    PaymentCreateRequest,
    PaymentCreateResponse,
    PaymentVerifyRequest,
    PaymentVerifyResponse,
)
from app.services import payment_service, payment_webhook_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])


@router.post(
    "/create",
    response_model=PaymentCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    request: PaymentCreateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return payment_service.create_payment(
        db=db,
        user=current_user,
        order_number=request.order_number,
        background_tasks=background_tasks,
    )


@router.post(
    "/verify",
    response_model=PaymentVerifyResponse,
    status_code=status.HTTP_200_OK,
)
def verify_payment(
    request: PaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return payment_service.verify_payment(
        db=db,
        user=current_user,
        data=request,
    )


@router.post("/mock-confirm/{order_number}")
def mock_confirm_payment(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete a local demo payment through the webhook service."""
    if (
        os.getenv("ENVIRONMENT", "development").lower() == "production"
        or payment_provider.client is not None
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Not found",
        )

    order = (
        db.query(Order)
        .filter(
            Order.order_number == order_number,
            Order.user_id == current_user.id,
        )
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id)
        .order_by(Payment.id.desc())
        .first()
    )

    if not payment or payment.status != "created":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No pending demo payment found",
        )

    event_id = f"evt_mock_{payment.id}"
    payload = {
        "id": event_id,
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

    # This depends on the webhook service explicitly supporting this
    # local-demo signature. Never enable this mock flow in production.
    return payment_webhook_service.process_webhook(
        db=db,
        raw_body=json.dumps(payload).encode("utf-8"),
        signature="valid_webhook_signature",
        event_id=event_id,
    )


@router.post("/webhook")
async def webhook(
    request: Request,
    db: Session = Depends(get_db),
):
    raw_body = await request.body()
    signature = request.headers.get("x-razorpay-signature")
    event_id = request.headers.get("x-razorpay-event-id")

    # Fall back to the event ID in the JSON payload when necessary.
    if not event_id:
        try:
            payload = json.loads(raw_body.decode("utf-8"))
            event_id = payload.get("id")
        except (json.JSONDecodeError, UnicodeDecodeError):
            event_id = None

    return payment_webhook_service.process_webhook(
        db=db,
        raw_body=raw_body,
        signature=signature,
        event_id=event_id,
    )