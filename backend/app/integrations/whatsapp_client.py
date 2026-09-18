import httpx
import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class WhatsAppClient:
    def __init__(self):
        self.access_token = os.getenv("WHATSAPP_ACCESS_TOKEN")
        self.phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
        self.api_version = "v17.0"
        self.base_url = f"https://graph.facebook.com/{self.api_version}"
        
    async def send_message(self, phone: str, text: str) -> Optional[Dict[str, Any]]:
        """
        Send a text message via WhatsApp Cloud API.
        Returns the API response dict if successful, None otherwise.
        """
        # For tests or local dev without credentials, just log
        if not self.access_token or not self.phone_number_id or os.getenv("MAVIDHAI_TEST") == "1":
            logger.info(f"MOCK WhatsApp to {phone}: {text}")
            return {"messages": [{"id": "mock_wamid"}], "mocked": True}
            
        url = f"{self.base_url}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }
        
        # Ensure phone number formatting (e.g. Meta requires country code without '+')
        formatted_phone = phone.lstrip('+')
        
        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": formatted_phone,
            "type": "text",
            "text": {
                "preview_url": True,
                "body": text
            }
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(url, headers=headers, json=payload, timeout=10.0)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {phone}: {str(e)}")
            return None

# Singleton
client = WhatsAppClient()
