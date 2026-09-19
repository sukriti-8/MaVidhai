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
        from app.models.inventory_audit import InventoryAudit
        from app.models.order import OrderItem
        test_db.query(InventoryAudit).filter(InventoryAudit.order.has(user_id=user.id)).delete(synchronize_session=False)
        test_db.query(OrderItem).filter(OrderItem.order.has(user_id=user.id)).delete(synchronize_session=False)
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

@patch("app.services.payment_service.payment_provider.create_payment_link")
def test_create_payment_success(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.return_value = {
        "provider_order_id": "plink_mocked",
        "payment_url": "http://example.com/pay"
    }
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 201
    
    data = response.json()
    assert data["order_number"] == sample_pending_order.order_number
    assert data["provider_order_id"] == "plink_mocked"
    assert data["payment_url"] == "http://example.com/pay"
    assert data["amount"] == 719600
    assert data["currency"] == "INR"
    
    # DB check
    payment = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).first()
    assert payment is not None
    assert payment.provider == "provider"
    assert payment.provider_order_id == "plink_mocked"
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

@patch("app.services.payment_service.payment_provider.create_payment_link")
def test_create_payment_duplicate_protection(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.return_value = {
        "provider_order_id": "plink_mocked",
        "payment_url": "http://example.com/pay"
    }
    # First request
    res1 = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert res1.status_code == 201
    provider_id1 = res1.json()["provider_order_id"]
    
    # Second request
    res2 = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert res2.status_code == 201
    provider_id2 = res2.json()["provider_order_id"]
    
    # Should reuse the provider ID and NOT create a new payment row
    assert provider_id1 == provider_id2
    
    payments = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).all()
    assert len(payments) == 1

@patch("app.services.payment_service.payment_provider.create_payment_link")
def test_create_payment_provider_failure(mock_create, auth_headers_user1, sample_pending_order, test_db: Session):
    mock_create.side_effect = Exception("Provider API down")
    
    response = client.post("/api/payments/create", json={"order_number": sample_pending_order.order_number}, headers=auth_headers_user1)
    assert response.status_code == 502
    assert "Provider API down" in response.json()["detail"]
    
    # Assert payment is rolled back/not created
    payments = test_db.query(Payment).filter(Payment.order_id == sample_pending_order.id).all()
    assert len(payments) == 0

def test_verify_payment_deprecated(auth_headers_user1, sample_pending_order):
    response = client.post("/api/payments/verify", json={
        "order_number": sample_pending_order.order_number,
        "razorpay_order_id": "mock_order",
        "razorpay_payment_id": "pay_mocked",
        "razorpay_signature": "valid_signature"
    }, headers=auth_headers_user1)
    
    # Endpoint should be deprecated (410 GONE)
    assert response.status_code == 410
