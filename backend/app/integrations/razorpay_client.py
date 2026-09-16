import os
import razorpay
from typing import Dict, Any
from app.integrations.payment_provider import PaymentProvider

class RazorpayProvider(PaymentProvider):
    def __init__(self):
        self.key_id = os.getenv("RAZORPAY_KEY_ID")
        self.key_secret = os.getenv("RAZORPAY_KEY_SECRET")
        self.webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
        
        self.client = None
        if os.getenv("MAVIDHAI_TEST") != "1" and self.key_id and self.key_secret:
            self.client = razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_payment_link(self, amount: float, currency: str, order_id: str, customer_phone: str) -> Dict[str, Any]:
        amount_paise = int(amount * 100)
        
        if not self.client:
            # Mock for tests
            return {
                "provider_order_id": f"plink_mock_{order_id}",
                "payment_url": f"http://localhost:3000/mock-payment/{order_id}",
            }
        
        data = {
            "amount": amount_paise,
            "currency": currency,
            "reference_id": order_id,
            "description": f"Payment for Order {order_id}",
            "customer": {
                "contact": customer_phone or ""
            }
        }
        
        # Depending on razorpay python SDK version, payment_link or invoice might be used.
        # Payment Links API is accessible via client.payment_link.create()
        try:
            plink = self.client.payment_link.create(data)
            return {
                "provider_order_id": plink.get("id"),
                "payment_url": plink.get("short_url"),
            }
        except Exception as e:
            # Fallback if payment_link API fails or is not available
            # We can still create a standard order, but it won't have a direct payment link URL
            order = self.client.order.create({
                "amount": amount_paise,
                "currency": currency,
                "receipt": order_id
            })
            return {
                "provider_order_id": order.get("id"),
                "payment_url": None, # Frontend will need to handle this fallback
            }

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        if not self.client:
            return signature == "valid_webhook_signature"
            
        if not self.webhook_secret:
            return False
            
        try:
            self.client.utility.verify_webhook_signature(payload.decode('utf-8'), signature, self.webhook_secret)
            return True
        except razorpay.errors.SignatureVerificationError:
            return False
        except Exception:
            return False

    def parse_webhook_event(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Razorpay sends events like 'payment.captured', 'payment.failed', 'payment_link.paid'
        """
        event = payload.get("event", "")
        event_id = payload.get("id", "") # Webhook event ID (ev_...)
        
        # Default empty return
        result = {
            "provider_event_id": event_id,
            "provider_payment_id": None,
            "provider_order_id": None,
            "status": "unknown"
        }
        
        if event in ("payment.captured", "payment.authorized"):
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            result["provider_payment_id"] = payment_entity.get("id")
            result["provider_order_id"] = payment_entity.get("order_id")
            result["status"] = "captured"
            
        elif event == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            result["provider_payment_id"] = payment_entity.get("id")
            result["provider_order_id"] = payment_entity.get("order_id")
            result["status"] = "failed"
            
        elif event == "payment_link.paid":
            plink_entity = payload.get("payload", {}).get("payment_link", {}).get("entity", {})
            result["provider_order_id"] = plink_entity.get("id") # The payment link ID
            result["provider_payment_id"] = plink_entity.get("payment_id") # Might not be directly in payment_link entity
            result["status"] = "captured"
            
        return result

# Singleton instance
provider = RazorpayProvider()

