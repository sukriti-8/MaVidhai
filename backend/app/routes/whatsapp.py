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
    Meta webhook verification endpoint.

    Meta sends:
        hub.mode
        hub.verify_token
        hub.challenge

    We return the challenge only when the verification
    token matches our configured token.
    """

    expected_token = os.getenv("WHATSAPP_VERIFY_TOKEN")

    if (
        hub_mode != "subscribe"
        or not expected_token
        or hub_verify_token != expected_token
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
    Receive WhatsApp webhook events from Meta.

    P0 behavior:
    - Parse JSON
    - Log the event
    - Return HTTP 200
    """

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
