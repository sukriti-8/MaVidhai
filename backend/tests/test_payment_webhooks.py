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

@pytest.fixture
def sample_webhook_payment(sample_pending_order, test_db: Session):
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
@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_valid_signature_payment_captured(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
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
    
    event = test_db.query(PaymentEvent).filter_by(provider_event_id="ev_123").first()
    assert event is not None
    assert event.event_type == "payment.captured"

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_missing_signature(mock_verify):
    payload = make_webhook_payload()
    # Missing headers entirely
    response = client.post("/api/payments/webhook", json=payload)
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_invalid_signature(mock_verify):
    mock_verify.return_value = False
    payload = make_webhook_payload()
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "invalid_sig",
        "x-razorpay-event-id": "ev_123"
    })
    
    assert response.status_code == 400
    assert "Invalid webhook signature" in response.json()["detail"]

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_payment_failed(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
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

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_wrong_provider_order_id_rejected(mock_verify, sample_webhook_payment):
    mock_verify.return_value = True
    payload = make_webhook_payload(order_id="order_UNKNOWN")
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_wrong_order"
    })
    
    assert response.status_code == 404
    assert "Payment not found" in response.json()["detail"]

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_amount_mismatch_rejected(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload(amount=999900)  # Incorrect amount
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_amount_mismatch"
    })
    
    assert response.status_code == 400
    assert "Amount mismatch" in response.json()["detail"]
    
    # State should remain unchanged
    test_db.refresh(sample_webhook_payment)
    assert sample_webhook_payment.status == "created"

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_idempotency_duplicate_event(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
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
    
    # Should only be one event
    events = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).all()
    assert len(events) == 1

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_unknown_event_is_ignored(mock_verify, sample_webhook_payment):
    mock_verify.return_value = True
    payload = make_webhook_payload(event="some.future.razorpay.event")
    
    response = client.post("/api/payments/webhook", json=payload, headers={
        "x-razorpay-signature": "valid",
        "x-razorpay-event-id": "ev_unknown"
    })
    
    assert response.status_code == 200
    assert response.json()["status"] == "ignored"

@patch("app.integrations.razorpay_client.verify_webhook_signature")
def test_webhook_transaction_rollback(mock_verify, sample_webhook_payment, sample_pending_order, test_db: Session):
    mock_verify.return_value = True
    payload = make_webhook_payload(order_id="order_WH123", payment_id="pay_error_test")
    ev_id = f"ev_{uuid.uuid4().hex}"
    
    # We monkeypatch Session.commit to raise an exception simulating a DB error
    with patch("sqlalchemy.orm.Session.commit", side_effect=ValueError("DB Error")):
        response = client.post("/api/payments/webhook", json=payload, headers={
            "x-razorpay-signature": "valid",
            "x-razorpay-event-id": ev_id
        })
        
        assert response.status_code == 500
        
        test_db.expire_all()
        
        # PaymentEvent should be absent
        event = test_db.query(PaymentEvent).filter_by(provider_event_id=ev_id).first()
        assert event is None
        
        # Payment remains original state
        payment = test_db.query(Payment).filter_by(id=sample_webhook_payment.id).first()
        assert payment.status == "created"
        
        # Order remains original state
        order = test_db.query(Order).filter_by(id=sample_pending_order.id).first()
        assert order.status == "pending"
