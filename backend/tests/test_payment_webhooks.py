import pytest
import json
from unittest.mock import patch
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.main import app
from app.models.payment import Payment, PaymentEvent
from app.models.order import Order
from tests.test_payments import sample_pending_order, auth_headers_user1
# Assuming test_db is defined in conftest or we need to import it too
# Actually, test_db is defined in test_payments too? Let's check
from tests.test_payments import test_db

client = TestClient(app)

from app.models.product import Product
from app.models.order import OrderItem

import uuid

@pytest.fixture
def webhook_products(test_db: Session):
    suffix = uuid.uuid4().hex[:6]
    p1 = Product(name=f"Prod A {suffix}", slug=f"prod-a-{suffix}", description="A", price=100.0, stock=10, availability=True, category_id=1)
    p2 = Product(name=f"Prod B {suffix}", slug=f"prod-b-{suffix}", description="B", price=200.0, stock=8, availability=True, category_id=1)
    test_db.add_all([p1, p2])
    test_db.commit()
    
    try:
        yield [p1, p2]
    finally:
        test_db.delete(p1)
        test_db.delete(p2)
        test_db.commit()

@pytest.fixture
def sample_webhook_payment(sample_pending_order, webhook_products, test_db: Session):
    item1 = OrderItem(order_id=sample_pending_order.id, product_id=webhook_products[0].id, product_name=webhook_products[0].name, product_slug=webhook_products[0].slug, unit_price=100.0, quantity=2, subtotal=200.0)
    item2 = OrderItem(order_id=sample_pending_order.id, product_id=webhook_products[1].id, product_name=webhook_products[1].name, product_slug=webhook_products[1].slug, unit_price=200.0, quantity=3, subtotal=600.0)
    test_db.add_all([item1, item2])
    
    payment = Payment(
        order_id=sample_pending_order.id,
        provider="razorpay",
        provider_order_id="order_WH123",
        amount=sample_pending_order.total_amount,
        currency="INR",
        status="created"
    )
    test_db.add(payment)
    test_db.commit()
    test_db.refresh(payment)
    return payment

def make_webhook_payload(event="payment.captured", order_id="order_WH123", payment_id="pay_WH123", amount=719600):
    return {
        "entity": "event",
        "account_id": "acc_123",
        "event": event,
        "contains": ["payment"],
        "payload": {
            "payment": {
                "entity": {
                    "id": payment_id,
                    "entity": "payment",
                    "amount": amount,
                    "currency": "INR",
                    "status": "captured" if event == "payment.captured" else "failed",
                    "order_id": order_id
                }
            }
        },
        "created_at": 1600000000
    }

import uuid
@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_valid_signature_payment_captured_decrements_stock(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid_webhook_signature",
        "x-razorpay-event-id": ev_id
    })
    
    assert response.status_code == 200, response.text
    
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    assert sample_webhook_payment.provider_payment_id == "pay_WH123"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "confirmed"
    
    # Verify stock decremented
    test_db.refresh(webhook_products[0])
    test_db.refresh(webhook_products[1])
    assert webhook_products[0].stock == 8  # 10 - 2
    assert webhook_products[1].stock == 5  # 8 - 3
    
    event = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).first()
    assert event is not None
    assert event.event_type == "payment.captured"

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_insufficient_stock(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    # Manually reduce stock before webhook so it fails
    webhook_products[0].stock = 1
    test_db.commit()
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid_webhook_signature",
        "x-razorpay-event-id": ev_id
    })
    
    # Webhook should succeed (200 OK) because payment was captured
    assert response.status_code == 200
    
    # Check that payment and order statuses are updated correctly
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "inventory_conflict"
    assert sample_pending_order.payment_status == "captured"
    
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == 1  # unchanged
    
    # PaymentEvent should be recorded
    event = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).first()
    assert event is not None
    assert event.event_type == "payment.captured"

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_missing_product(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    # Manually delete product before webhook
    test_db.delete(webhook_products[0])
    test_db.commit()
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid_webhook_signature",
        "x-razorpay-event-id": ev_id
    })
    
    assert response.status_code == 200
    
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "inventory_conflict"
    assert sample_pending_order.payment_status == "captured"
    
    # Stock of other product should be unchanged
    test_db.refresh(webhook_products[1])
    assert webhook_products[1].stock == 8
    
    event = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).first()
    assert event is not None

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_missing_signature(mock_verify):
    payload = make_webhook_payload()
    # Missing headers entirely
    response = client.post("/api/payments/webhook", json=payload)
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_invalid_signature(mock_verify):
    mock_verify.return_value = False
    payload = make_webhook_payload()
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "invalid_sig",
        "x-razorpay-event-id": "ev_123"
    })
    
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_payment_failed(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload(event="payment.failed", payment_id="pay_WH456")
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": ev_id
    })
    
    assert response.status_code == 200, response.text
    
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "failed"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "pending"  # Order remains pending
    
    # Stock remains unchanged
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == 10

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_wrong_provider_order_id_rejected(mock_verify, sample_webhook_payment):
    mock_verify.return_value = True
    payload = make_webhook_payload(order_id="order_UNKNOWN")
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_wrong_order"
    })
    
    assert response.status_code == 404
    assert "Payment not found" in response.json()["detail"]



@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_idempotency_duplicate_event(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    headers = {
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": ev_id
    }
    
    # First request
    res1 = client.post("/api/payments/webhook", json=payload, headers=headers)
    assert res1.status_code == 200, res1.text
    
    # Verify state transitioned
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == 8 # 10 - 2
    
    # Change it back manually just for the test to ensure duplicate doesn't transition it again
    sample_webhook_payment.status = "something_else"
    test_db.commit()
    
    # Second request
    res2 = client.post("/api/payments/webhook", json=payload, headers=headers)
    assert res2.status_code == 200
    assert "already processed" in res2.json()["message"].lower()
    
    # State should NOT transition back to captured
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "something_else"
    
    # Stock should NOT decrement again
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == 8
    
    events = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).all()
    assert len(events) == 1

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_idempotency_duplicate_conflict_event(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    headers = {
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": ev_id
    }
    
    # Manually reduce stock to trigger conflict
    webhook_products[0].stock = 1
    test_db.commit()
    
    # First request
    res1 = client.post("/api/payments/webhook", json=payload, headers=headers)
    assert res1.status_code == 200, res1.text
    
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "inventory_conflict"
    
    # Second request
    res2 = client.post("/api/payments/webhook", json=payload, headers=headers)
    assert res2.status_code == 200
    assert "already processed" in res2.json()["message"].lower()
    
    # State should remain unchanged
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "inventory_conflict"
    
    events = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).all()
    assert len(events) == 1

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_late_failed_after_capture(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
    # Setup: capture payment and order conflict manually
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    mock_verify.return_value = True
    payload = make_webhook_payload(event="payment.failed")
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": ev_id
    })
    
    assert response.status_code == 200
    
    test_db.expire_all()
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "captured"  # Should NOT downgrade
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "inventory_conflict"  # Should NOT change

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_existing_captured_payment(mock_verify, sample_webhook_payment, sample_pending_order, webhook_products, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload()
    ev_id = f"ev_{uuid.uuid4().hex}"
    headers = {
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": ev_id
    }
    
    # Manually set payment to captured first
    sample_webhook_payment.status = "captured"
    test_db.commit()
    
    # Webhook runs
    res = client.post("/api/payments/webhook", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    
    # Stock should NOT decrement
    test_db.expire_all()
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == 10 # still 10

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_unknown_event_is_ignored(mock_verify, sample_webhook_payment):
    mock_verify.return_value = True
    payload = make_webhook_payload(event="some.future.razorpay.event")
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_unknown"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_transaction_rollback(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload(order_id="order_WH123", payment_id="pay_error_test")

    with patch("app.services.inventory_service.reserve_and_deduct_stock") as mock_reserve:
        mock_reserve.side_effect = Exception("DB crash")
        response = client.post("/api/payments/webhook", json=payload, headers={
            "x-razorpay-signature": "valid",
            "x-razorpay-event-id": "ev_tx_rollback"
        })
        
        order = test_db.query(Order).filter_by(id=sample_pending_order.id).first()
        assert order.status == "pending"

@patch("app.services.payment_webhook_service.payment_provider.verify_webhook_signature")
def test_webhook_payment_id_mismatch_rejected(mock_verify, sample_webhook_payment, test_db: Session):
    mock_verify.return_value = True
    
    # Pre-set the payment to have a known provider_payment_id
    sample_webhook_payment.provider_payment_id = "pay_ORIGINAL123"
    test_db.commit()

    # Webhook arrives with a DIFFERENT provider_payment_id mapped
    payload = make_webhook_payload(order_id="order_WH123", payment_id="pay_FORGED999")
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_mismatch"
    })
    
    assert response.status_code == 400
    assert "Payment ID mismatch" in response.json()["detail"]
