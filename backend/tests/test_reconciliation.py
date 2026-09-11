import pytest
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.services.order_service import reconcile_inventory_conflict
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product

# Import fixtures
from tests.test_payments import test_db, sample_pending_order, auth_headers_user1
from tests.test_payment_webhooks import webhook_products, sample_webhook_payment

def test_reconcile_success(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    reconciled_order = reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert reconciled_order.status == "confirmed"
    
    test_db.refresh(webhook_products[0])
    test_db.refresh(webhook_products[1])
    assert webhook_products[0].stock == 8 # 10 - 2
    assert webhook_products[1].stock == 5 # 8 - 3

def test_reconcile_insufficient_stock(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    webhook_products[0].stock = 1 # Not enough
    test_db.commit()
    
    reconciled_order = reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert reconciled_order.status == "inventory_conflict"
    
    test_db.refresh(webhook_products[0])
    test_db.refresh(webhook_products[1])
    assert webhook_products[0].stock == 1
    assert webhook_products[1].stock == 8 # Unchanged

def test_reconcile_missing_product(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.delete(webhook_products[0])
    test_db.commit()
    
    reconciled_order = reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert reconciled_order.status == "inventory_conflict"
    test_db.refresh(webhook_products[1])
    assert webhook_products[1].stock == 8

def test_reconcile_already_confirmed(test_db: Session, sample_pending_order, sample_webhook_payment):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "confirmed"
    test_db.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert excinfo.value.status_code == 409
    assert "not in inventory_conflict state" in excinfo.value.detail

def test_reconcile_payment_not_captured(test_db: Session, sample_pending_order, sample_webhook_payment):
    sample_webhook_payment.status = "created"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    with pytest.raises(HTTPException) as excinfo:
        reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert excinfo.value.status_code == 409
    assert "payment is not captured" in excinfo.value.detail

def test_reconcile_pending_order(test_db: Session, sample_pending_order):
    with pytest.raises(HTTPException) as excinfo:
        reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    
    assert excinfo.value.status_code == 409
    assert "not in inventory_conflict state" in excinfo.value.detail

def test_reconcile_repeated(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products):
    # First attempt: succeeds
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    reconciled_order = reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
    assert reconciled_order.status == "confirmed"
    
    test_db.refresh(webhook_products[0])
    stock_after_first = webhook_products[0].stock
    
    # Second attempt: fails with 409
    with pytest.raises(HTTPException) as excinfo:
        reconcile_inventory_conflict(test_db, sample_pending_order.order_number)
        
    assert excinfo.value.status_code == 409
    assert "not in inventory_conflict state" in excinfo.value.detail
    
    test_db.refresh(webhook_products[0])
    assert webhook_products[0].stock == stock_after_first # stock unchanged

from fastapi.testclient import TestClient
from app.main import app
from app.models.user import User

client = TestClient(app)

@pytest.fixture
def test_user1(test_db: Session):
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    if user.role != "CUSTOMER":
        user.role = "CUSTOMER"
        test_db.commit()
    return user

@pytest.fixture
def make_admin(test_db: Session, test_user1):
    original_role = test_user1.role
    test_user1.role = "SUPER_ADMIN"
    test_db.commit()
    yield
    test_user1.role = original_role
    test_db.refresh(test_user1)
    test_db.commit()

def test_api_reconcile_admin_success(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products, auth_headers_user1, make_admin):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    res = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile", headers=auth_headers_user1)
    assert res.status_code == 200
    assert res.json()["status"] == "confirmed"

def test_api_reconcile_customer_forbidden(test_db: Session, sample_pending_order, sample_webhook_payment, auth_headers_user1):
    # Does not use make_admin fixture, so role is customer
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    from app.models.user import User
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    if user.role != "CUSTOMER":
        user.role = "CUSTOMER"
        test_db.commit()
    print(f"Role before request: {user.role}")
    
    res = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile", headers=auth_headers_user1)
    print(f"Response status: {res.status_code}, Body: {res.json()}")
    assert res.status_code == 403

def test_api_reconcile_unauthenticated(sample_pending_order):
    res = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile")
    assert res.status_code == 401

def test_api_reconcile_nonexistent_order(auth_headers_user1, make_admin):
    res = client.post("/api/orders/MVD-INVALID/reconcile", headers=auth_headers_user1)
    assert res.status_code == 404

def test_api_reconcile_pending_order(test_db: Session, sample_pending_order, auth_headers_user1, make_admin):
    res = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile", headers=auth_headers_user1)
    assert res.status_code == 409

def test_api_reconcile_repeated(test_db: Session, sample_pending_order, sample_webhook_payment, webhook_products, auth_headers_user1, make_admin):
    sample_webhook_payment.status = "captured"
    sample_pending_order.status = "inventory_conflict"
    test_db.commit()
    
    res1 = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile", headers=auth_headers_user1)
    assert res1.status_code == 200
    
    res2 = client.post(f"/api/orders/{sample_pending_order.order_number}/reconcile", headers=auth_headers_user1)
    assert res2.status_code == 409
