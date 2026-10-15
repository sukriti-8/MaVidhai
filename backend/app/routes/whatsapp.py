import hashlib
import hmac
import os
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import PlainTextResponse

from app.services import whatsapp_service


router = APIRouter(
    prefix="/api/whatsapp",
    tags=["WhatsApp"],
)


@router.get("/webhook")
async def verify_webhook(
    hub_mode: str | None = Query(None, alias="hub.mode"),
    hub_verify_token: str | None = Query(None, alias="hub.verify_token"),
    hub_challenge: str | None = Query(None, alias="hub.challenge"),
):
    """
    Verify Meta's webhook subscription request.
    """

    expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN")

    if (
        hub_mode != "subscribe"
        or not expected_token
        or hub_verify_token is None
        or not hmac.compare_digest(
            hub_verify_token,
            expected_token,
        )
        or hub_challenge is None
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Webhook verification failed",
        )

    return PlainTextResponse(
        content=hub_challenge,
        status_code=status.HTTP_200_OK,
    )


@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Verify Meta's signature before processing incoming events.
    """

    app_secret = os.getenv("WHATSAPP_APP_SECRET")
    signature = request.headers.get("X-Hub-Signature-256")

    if not app_secret or not signature:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook signature verification failed",
        )

    raw_body = await request.body()
    expected_signature = "sha256=" + hmac.new(
        app_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Webhook signature verification failed",
        )

    try:
        payload: dict[str, Any] = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload",
        )

    whatsapp_service.log_webhook_event(payload)

    return {
        "status": "received",
    }
