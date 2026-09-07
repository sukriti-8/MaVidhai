import logging
from typing import Any

logger = logging.getLogger(__name__)


def log_webhook_event(payload: dict[str, Any]) -> None:
    """
    Log the receipt of a WhatsApp webhook event.

    This is intentionally lightweight for P0.
    Message parsing and business actions will be added later.
    """
    logger.info(
        "WhatsApp webhook received: object=%s",
        payload.get("object"),
    )

    entries = payload.get("entry", [])

    for entry in entries:
        for change in entry.get("changes", []):
            value = change.get("value", {})
            messages = value.get("messages", [])

            for message in messages:
                logger.info(
                    "WhatsApp message received: from=%s type=%s",
                    message.get("from"),
                    message.get("type"),
                )
