import os
import sys
import json
import time
import hmac
import hashlib
import requests
import urllib.parse
from uuid import uuid4

# P0: Environment Guard
if os.getenv("ENVIRONMENT") == "production":
    print("ERROR: Smoke test cannot be run in production environment.")
    sys.exit(1)

API_BASE = "http://localhost:8000/api"
WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "test_secret") # Using local fallback

SESSION = requests.Session()

def create_test_user():
    email = f"smoketest_{uuid4().hex[:8]}@example.com"
    res = SESSION.post(f"{API_BASE}/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Smoke Test User"
    })
    if res.status_code != 201:
        print(f"Failed to create test user: {res.text}")
        sys.exit(1)
    
    res = SESSION.post(f"{API_BASE}/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    token = res.json()["access_token"]
    SESSION.headers.update({"Authorization": f"Bearer {token}"})

def get_test_product():
    res = SESSION.get(f"{API_BASE}/products?limit=1")
    if res.status_code != 200 or len(res.json()["items"]) == 0:
        print("No products available to test.")
        sys.exit(1)
    return res.json()["items"][0]

def add_to_cart(product_id, quantity=1):
    res = SESSION.post(f"{API_BASE}/cart/items", json={
        "product_id": product_id,
        "quantity": quantity
    })
    assert res.status_code == 200, "Failed to add to cart"

def sign_webhook(raw_body: bytes) -> str:
    # Since MAVIDHAI_TEST=1, the backend uses mock signature validation
    return "valid_webhook_signature"

def send_webhook(payload: dict, event_id: str, signature=None):
    raw_body = json.dumps(payload, separators=(',', ':')).encode()
    if signature is None:
        signature = sign_webhook(raw_body)
    
    res = requests.post(f"{API_BASE}/payments/webhook", data=raw_body, headers={
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
        "x-razorpay-event-id": event_id
    })
    return res

def run_smoke_tests():
    print("--- Phase A: Health / Setup ---")
    try:
        res = requests.get(f"{API_BASE}/health")
        assert res.status_code == 200, "API is not reachable"
    except Exception as e:
        print("API Reachability failed:")
        sys.exit(1)
    print("API Reachable")

    create_test_user()
    print("Test user authenticated")

    product = get_test_product()
    product_id = product["id"]
    product_slug = product["slug"]
    initial_stock = product["stock"]
    print(f"Found test product: ID {product_id}, Stock {initial_stock}")

    add_to_cart(product_id)
    
    print("\n--- Phase B: Order Creation ---")
    order_data = {
        "shipping_full_name": "Test User",
        "shipping_email": "test@example.com",
        "shipping_phone": "919999999999",
        "shipping_address_line1": "123 Test St",
        "shipping_city": "Test City",
        "shipping_state": "Test State",
        "shipping_postal_code": "123456",
        "shipping_country": "India"
    }
    res = SESSION.post(f"{API_BASE}/orders", json=order_data)
    assert res.status_code == 201, f"Failed to create order: {res.text}"
    order = res.json()
    order_number = order["order_number"]
    assert order["status"] == "pending", "Order status should be pending"
    assert len(order["items"]) > 0, "Order items missing"
    
    prod_check = SESSION.get(f"{API_BASE}/products/{product_slug}")
    assert prod_check.json()["stock"] == initial_stock, "Stock should not drop on order creation"
    print(f"Order {order_number} created (pending)")

    print("\n--- Phase C: Payment Creation ---")
    res = SESSION.post(f"{API_BASE}/payments/create", json={"order_number": order_number})
    assert res.status_code == 201, f"Failed to create payment: {res.text}"
    payment_data = res.json()
    provider_order_id = payment_data["provider_order_id"]
    wa_link = payment_data["whatsapp_deep_link"]
    
    order_check = SESSION.get(f"{API_BASE}/orders/{order_number}")
    assert order_check.json()["status"] == "pending", "Order status must remain pending after payment link generation"
    assert order_check.json()["payment_status"] in ["pending", "created"], f"Unexpected payment status: {order_check.json()['payment_status']}"

    assert wa_link.startswith("https://wa.me/"), "Deep link missing wa.me domain"
    assert "text=" in wa_link, "Deep link missing encoded message"
    parsed_msg = urllib.parse.unquote(wa_link.split("text=")[1])
    assert order_number in parsed_msg, "Message missing order number"
    print("Payment link generated, Order remains pending")

    print("\n--- P0.4: Captured Webhook Transition ---")
    provider_payment_id = f"pay_{uuid4().hex[:8]}"
    event_id_captured = f"ev_{uuid4().hex[:8]}"
    
    webhook_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": provider_payment_id,
                    "order_id": provider_order_id,
                    "status": "captured"
                }
            }
        }
    }
    
    res = send_webhook(webhook_payload, event_id_captured)
    assert res.status_code == 200, f"Webhook failed: {res.text}"
    
    order_check = SESSION.get(f"{API_BASE}/orders/{order_number}")
    assert order_check.json()["payment_status"] == "captured", "Payment should be captured"
    assert order_check.json()["status"] == "confirmed", "Order should be confirmed"
    
    prod_check = SESSION.get(f"{API_BASE}/products/{product_slug}")
    expected_stock = initial_stock - 1
    assert prod_check.json()["stock"] == expected_stock, f"Expected stock {expected_stock}, got {prod_check.json()['stock']}"
    print("Payment Captured, Order Confirmed, Inventory Deducted")

    print("\n--- P0.5: Webhook Idempotency ---")
    res = send_webhook(webhook_payload, event_id_captured)
    assert res.status_code == 200
    
    prod_check = SESSION.get(f"{API_BASE}/products/{product_slug}")
    assert prod_check.json()["stock"] == expected_stock, "Duplicate webhook caused double deduction"
    print("Duplicate webhook correctly ignored (Idempotent)")
    
    print("\n--- P0.6: Cross-Order Correlation Attack ---")
    add_to_cart(product_id)
    res = SESSION.post(f"{API_BASE}/orders", json=order_data)
    order_number_2 = res.json()["order_number"]
    res = SESSION.post(f"{API_BASE}/payments/create", json={"order_number": order_number_2})
    provider_order_id_2 = res.json()["provider_order_id"]
    
    attack_payload = {
        "event": "payment.captured",
        "payload": {
            "payment": {
                "entity": {
                    "id": provider_payment_id,
                    "order_id": provider_order_id_2,
                    "status": "captured"
                }
            }
        }
    }
    res = send_webhook(attack_payload, f"ev_{uuid4().hex[:8]}")
    assert res.status_code == 400, f"Expected 400 Bad Request, got {res.status_code}: {res.text}"
    
    order_check = SESSION.get(f"{API_BASE}/orders/{order_number_2}")
    assert order_check.json()["status"] == "pending", "Order 2 should remain pending"
    print("Cross-order mapping forgery rejected")

    print("\n--- P0.7: Invalid Signature ---")
    invalid_signature = "wrong_secret_signature"
    res = send_webhook(webhook_payload, f"ev_{uuid4().hex[:8]}", signature=invalid_signature)
    assert res.status_code == 400, "Invalid signature was not rejected"
    print("Invalid signature correctly rejected")

    print("\n--- P0.8: Captured -> Failed Regression ---")
    fail_payload = {
        "event": "payment.failed",
        "payload": {
            "payment": {
                "entity": {
                    "id": provider_payment_id,
                    "order_id": provider_order_id,
                    "status": "failed"
                }
            }
        }
    }
    res = send_webhook(fail_payload, f"ev_{uuid4().hex[:8]}")
    assert res.status_code == 200, "Webhook processed"
    
    order_check = SESSION.get(f"{API_BASE}/orders/{order_number}")
    assert order_check.json()["payment_status"] == "captured", "Payment should NOT downgrade to failed"
    assert order_check.json()["status"] == "confirmed", "Order should remain confirmed"
    print("Captured -> Failed downgrade successfully prevented")

    print("\nALL SMOKE TESTS PASSED")

if __name__ == "__main__":
    run_smoke_tests()
