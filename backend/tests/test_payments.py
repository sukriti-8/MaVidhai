import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import SessionLocal
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from typing import Dict
from unittest.mock import patch
import os

client = TestClient(app)

@pytest.fixture
def test_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_headers_user1(test_db: Session) -> Dict[str, str]:
    # Clear orders and payments for clean state
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    if user:
        test_db.query(Payment).filter(Payment.order.has(user_id=user.id)).delete(synchronize_session=False)
        test_db.query(Order).filter(Order.user_id == user.id).delete(synchronize_session=False)
        test_db.commit()
    else:
        try:
            client.post("/api/auth/register", json={
                "email": "userpay1@example.com",
                "password": "password123",
                "full_name": "User Pay One"
            })
        except:
            pass
    response = client.post("/api/auth/login", json={
        "email": "userpay1@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user2(test_db: Session) -> Dict[str, str]:
    try:
        client.post("/api/auth/register", json={
            "email": "userpay2@example.com",
            "password": "password123",
            "full_name": "User Pay Two"
        })
    except:
        pass
    response = client.post("/api/auth/login", json={
        "email": "userpay2@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_pending_order(auth_headers_user1, test_db: Session):
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    order = Order(
        user_id=user.id,
        order_number="MVD-TEST-123",
        status="pending",
        subtotal=7196.00,
        shipping_amount=0,
        discount_amount=0,
        total_amount=7196.00,
        currency="INR",
        shipping_full_name="Test User",
        shipping_email="test@example.com",
        shipping_phone="9876543210",
        shipping_address_line1="123 Example Street",
        shipping_city="Hyderabad",
        shipping_state="Telangana",
        shipping_postal_code="500001",
        shipping_country="India"
    )
    test_db.add(order)
    test_db.commit()
    test_db.refresh(order)
    return order

def test_unauthenticated_payment():
    response = client.post("/api/payments/create", json={"order_number": "MVD-TEST-123"})
    assert response.status_code == 401

@patch("app.integrations.razorpay_client.create_provider_order")
def test_create_payment_success(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.return_value = {
        "id": "order_mocked",
        "amount": 719600,
        "currency": "INR",
        "status": "created"
    }
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 201
    
    data = response.json()
    assert data["order_number"] == sample_pending_order.order_number
    assert "razorpay_order_id" in data
    assert data["amount"] == 719600
    assert data["currency"] == "INR"
    assert data["key_id"] == os.getenv("RAZORPAY_KEY_ID", "rzp_test_dummy")
    
    # DB check
    payment = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).first()
    assert payment is not None
    assert payment.provider == "razorpay"
    assert payment.provider_order_id == data["razorpay_order_id"]
    assert payment.amount == 7196.00
    assert payment.status == "created"
    
    # Original order is still pending
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "pending"

def test_create_payment_ownership_isolation(auth_headers_user2, sample_pending_order):
    # User 2 tries to pay for User 1's order
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user2)
    assert response.status_code == 404

def test_create_payment_status_validation(auth_headers_user1, sample_pending_order, test_db: Session):
    sample_pending_order.status = "confirmed"
    test_db.commit()
    
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 400
    assert "status: confirmed" in response.json()["detail"]

@patch("app.integrations.razorpay_client.create_provider_order")
def test_create_payment_duplicate_protection(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.return_value = {
        "id": "order_mocked",
        "amount": 719600,
        "currency": "INR",
        "status": "created"
    }
    # First request
    res1 = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert res1.status_code == 201
    provider_id1 = res1.json()["razorpay_order_id"]
    
    # Second request
    res2 = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert res2.status_code == 201
    provider_id2 = res2.json()["razorpay_order_id"]
    
    # Should reuse the provider ID and NOT create a new payment row
    assert provider_id1 == provider_id2
    
    payments = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).all()
    assert len(payments) == 1

@pytest.fixture
def sample_payment(sample_pending_order, test_db: Session):
    payment = Payment(
        order_id=sample_pending_order.id,
        provider="razorpay",
        provider_order_id="order_mocked",
        amount=sample_pending_order.total_amount,
        currency="INR",
        status="created"
    )
    test_db.add(payment)
    test_db.commit()
    test_db.refresh(payment)
    return payment

@patch("app.integrations.razorpay_client.fetch_provider_payment")
@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_success(mock_verify, mock_fetch, auth_headers_user1, sample_pending_order, sample_payment, test_db: Session):
    mock_verify.return_value = True
    mock_fetch.return_value = {"amount": 719600}
    
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": sample_payment.provider_order_id,
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }, headers=auth_headers_user1)
    
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    test_db.refresh(sample_payment)
    assert sample_payment.provider_payment_id == "pay_mocked"
    
    test_db.refresh(sample_pending_order)
    assert sample_pending_order.status == "pending" # Does not confirm order prematurely

@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_invalid_signature(mock_verify, auth_headers_user1, sample_pending_order, sample_payment):
    mock_verify.return_value = False
    
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": sample_payment.provider_order_id,
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "invalid"
    }, headers=auth_headers_user1)
    
    assert response.status_code == 400
    assert "Invalid payment signature" in response.json()["detail"]

def test_verify_payment_unauthorized():
    response = client.post("/api/payments/verify", json={
        "order_number": "MVD-TEST",
        "razorpay_order_id": "order_mocked",
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "invalid"
    })
    assert response.status_code == 401

@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_other_user_order(mock_verify, auth_headers_user2, sample_pending_order, sample_payment):
    mock_verify.return_value = True
    
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": sample_payment.provider_order_id,
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }, headers=auth_headers_user2)
    
    assert response.status_code == 404

@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_wrong_provider_order(mock_verify, auth_headers_user1, sample_pending_order, sample_payment):
    mock_verify.return_value = True
    
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": "order_different",
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }, headers=auth_headers_user1)
    
    assert response.status_code == 400
    assert "Payment not found" in response.json()["detail"]

@patch("app.integrations.razorpay_client.fetch_provider_payment")
@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_amount_mismatch(mock_verify, mock_fetch, auth_headers_user1, sample_pending_order, sample_payment):
    mock_verify.return_value = True
    mock_fetch.return_value = {"amount": 999900} # Mismatched amount
    
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": sample_payment.provider_order_id,
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }, headers=auth_headers_user1)
    
    assert response.status_code == 400
    assert "Payment amount mismatch" in response.json()["detail"]

@patch("app.integrations.razorpay_client.fetch_provider_payment")
@patch("app.integrations.razorpay_client.verify_signature")
def test_verify_payment_idempotency(mock_verify, mock_fetch, auth_headers_user1, sample_pending_order, sample_payment, test_db: Session):
    mock_verify.return_value = True
    mock_fetch.return_value = {"amount": 719600}
    
    payload = {
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": sample_payment.provider_order_id,
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }
    
    res1 = client.post("/api/payments/verify", json=payload, headers=auth_headers_user1)
    assert res1.status_code == 200
    
    # Second request should succeed but shortcut to returning success
    res2 = client.post("/api/payments/verify", json=payload, headers=auth_headers_user1)
    assert res2.status_code == 200
    assert "already verified" in res2.json()["message"]


@patch("app.integrations.razorpay_client.create_provider_order")
def test_create_payment_provider_failure(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.side_effect = Exception("Razorpay API down")
    
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 502
    assert "Razorpay API down" in response.json()["detail"]
    
    # Assert payment is rolled back/not created
    payments = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).all()
    assert len(payments) == 0

@patch("app.integrations.razorpay_client.create_provider_order")
def test_create_payment_amount_mismatch(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    # Mock returns the wrong amount
    mock_create.return_value = {
        "id": "order_badamount",
        "amount": 999999, # different from 719600
        "currency": "INR",
        "status": "created"
    }
    
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 502
    assert "Amount mismatch" in response.json()["detail"]
    
    payments = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).all()
    assert len(payments) == 0
