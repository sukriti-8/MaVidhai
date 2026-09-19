import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.product import Product
from app.models.category import Category
from app.models.user import User
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.inventory_audit import InventoryAudit
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
import uuid

client = TestClient(app)

@pytest.fixture
def super_admin_headers(test_db: Session, auth_headers_user1):
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    original_role = user.role
    user.role = "SUPER_ADMIN"
    test_db.commit()
    yield auth_headers_user1
    user.role = original_role
    test_db.commit()

@pytest.fixture
def base_user(test_db: Session):
    return test_db.query(User).filter(User.email == "userpay1@example.com").first()

def test_admin_inventory_rbac(auth_headers_user2, super_admin_headers):
    res = client.get("/api/admin/inventory")
    assert res.status_code == 401

    res = client.get("/api/admin/inventory", headers=auth_headers_user2)
    assert res.status_code == 403

    res = client.get("/api/admin/inventory", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_inventory_filtering(test_db: Session, super_admin_headers):
    cat = Category(name="Inv Cat", slug="inv-cat")
    test_db.add(cat)
    test_db.commit()

    p_low = Product(category_id=cat.id, name="Low Stock", slug="low-stock", price=10, stock=5)
    p_out = Product(category_id=cat.id, name="Out Stock", slug="out-stock", price=10, stock=0)
    p_normal = Product(category_id=cat.id, name="Normal Stock", slug="norm-stock", price=10, stock=15)
    test_db.add_all([p_low, p_out, p_normal])
    test_db.commit()

    # Low stock test
    res = client.get("/api/admin/inventory?low_stock=true", headers=super_admin_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(i["id"] == p_low.id for i in items)
    assert all(i["stock"] <= 10 and i["stock"] > 0 for i in items)

    # Out of stock test
    res = client.get("/api/admin/inventory?out_of_stock=true", headers=super_admin_headers)
    assert res.status_code == 200
    items = res.json()["items"]
    assert any(i["id"] == p_out.id for i in items)
    assert all(i["stock"] == 0 for i in items)

def test_admin_adjust_stock_audit_integrity(test_db: Session, super_admin_headers, base_user):
    cat = Category(name="Inv Cat 2", slug="inv-cat-2")
    test_db.add(cat)
    test_db.commit()

    p = Product(category_id=cat.id, name="Audit Prod", slug="audit-prod", price=10, stock=20)
    test_db.add(p)
    test_db.commit()

    # Manual adjustment
    payload = {"delta": -5, "reason": "Damaged inventory"}
    res = client.patch(f"/api/admin/products/{p.id}/stock", json=payload, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["stock"] == 15

    # Check Audit
    audit = test_db.query(InventoryAudit).filter(InventoryAudit.product_id == p.id).first()
    assert audit is not None
    assert audit.previous_stock == 20
    assert audit.adjustment == -5
    assert audit.new_stock == 15
    assert audit.reason == "Damaged inventory"
    assert audit.admin_id == base_user.id
    assert audit.adjustment_type == "ADMIN_ADJUSTMENT"
    assert audit.previous_stock + audit.adjustment == audit.new_stock

def test_admin_adjust_stock_validations(test_db: Session, super_admin_headers):
    cat = Category(name="Inv Cat 3", slug="inv-cat-3")
    test_db.add(cat)
    test_db.commit()

    p = Product(category_id=cat.id, name="Val Prod", slug="val-prod", price=10, stock=10)
    test_db.add(p)
    test_db.commit()

    # Zero adjustment
    res = client.patch(f"/api/admin/products/{p.id}/stock", json={"delta": 0, "reason": "zero"}, headers=super_admin_headers)
    assert res.status_code == 400

    # Negative below zero
    res = client.patch(f"/api/admin/products/{p.id}/stock", json={"delta": -15, "reason": "negative"}, headers=super_admin_headers)
    assert res.status_code == 400

    # Missing reason
    res = client.patch(f"/api/admin/products/{p.id}/stock", json={"delta": 5, "reason": ""}, headers=super_admin_headers)
    assert res.status_code == 400

    res = client.patch(f"/api/admin/products/{p.id}/stock", json={"delta": 5, "reason": "   "}, headers=super_admin_headers)
    assert res.status_code == 400

    # Ensure no audits were created
    assert test_db.query(InventoryAudit).filter(InventoryAudit.product_id == p.id).count() == 0

def test_refund_distinction(test_db: Session, super_admin_headers, base_user):
    from unittest.mock import patch
    with patch("app.services.payment_service.payment_provider.refund_payment") as mock_refund:
        mock_refund.side_effect = lambda **kwargs: {"provider_refund_id": f"rfnd_{uuid.uuid4()}"}

        cat = Category(name="Inv Cat 4", slug="inv-cat-4")
        test_db.add(cat)
        test_db.commit()

        p = Product(category_id=cat.id, name="Refund Prod", slug="refund-prod", price=10, stock=10)
        test_db.add(p)
        test_db.commit()

        shipping_info = {
            "shipping_full_name": "Test User",
            "shipping_email": "test@example.com",
            "shipping_phone": "1234567890",
            "shipping_address_line1": "123 Test St",
            "shipping_city": "Test City",
            "shipping_state": "Test State",
            "shipping_postal_code": "123456",
            "shipping_country": "Test Country"
        }

        # 1. confirmed -> refund -> stock restored -> REFUND_RESTORATION
        o_conf = Order(user_id=base_user.id, order_number="MV-REF-C1", status="confirmed", subtotal=20.0, total_amount=20.0, currency="INR", **shipping_info)
        test_db.add(o_conf)
        test_db.commit()
        test_db.add(OrderItem(order_id=o_conf.id, product_id=p.id, product_name="Refund Prod", product_slug="refund-prod", unit_price=10.0, quantity=2, subtotal=20.0))
        p_conf = Payment(order_id=o_conf.id, provider="razorpay", provider_order_id="c1", provider_payment_id="pay_c1", status="captured", amount=20.0)
        test_db.add(p_conf)
        test_db.commit()

        # Deduct stock manually since we skipped checkout
        p.stock -= 2
        test_db.commit()

        res = client.post(f"/api/admin/payments/{p_conf.id}/refund", headers=super_admin_headers)
        assert res.status_code == 200

        audit_restore = test_db.query(InventoryAudit).filter(InventoryAudit.order_id == o_conf.id).first()
        assert audit_restore is not None
        assert audit_restore.adjustment_type == "REFUND_RESTORATION"
        assert audit_restore.adjustment == 2
        assert audit_restore.previous_stock == 8
        assert audit_restore.new_stock == 10

        # 2. inventory_conflict -> refund -> stock unchanged -> NO audit restoration
        o_conf2 = Order(user_id=base_user.id, order_number="MV-REF-C2", status="inventory_conflict", subtotal=20.0, total_amount=20.0, currency="INR", **shipping_info)
        test_db.add(o_conf2)
        test_db.commit()
        test_db.add(OrderItem(order_id=o_conf2.id, product_id=p.id, product_name="Refund Prod", product_slug="refund-prod", unit_price=10.0, quantity=2, subtotal=20.0))
        p_conf2 = Payment(order_id=o_conf2.id, provider="razorpay", provider_order_id="c2", provider_payment_id="pay_c2", status="captured", amount=20.0)
        test_db.add(p_conf2)
        test_db.commit()

        res = client.post(f"/api/admin/payments/{p_conf2.id}/refund", headers=super_admin_headers)
        assert res.status_code == 200

        audit_conflict = test_db.query(InventoryAudit).filter(InventoryAudit.order_id == o_conf2.id).first()
        assert audit_conflict is None # No stock was restored because it wasn't deducted

def test_rollback_integrity(test_db: Session, super_admin_headers, base_user):
    from app.services import inventory_service
    import pytest
    from fastapi import HTTPException
    cat = Category(name="Inv Cat 5", slug="inv-cat-5")
    test_db.add(cat)
    test_db.commit()

    p = Product(category_id=cat.id, name="Rollback Prod", slug="rollback-prod", price=10, stock=20)
    test_db.add(p)
    test_db.commit()

    try:
        # Simulate stock update but rollback before commit
        inventory_service.admin_adjust_stock(test_db, p.id, -5, base_user.id, "Testing rollback")
        # trigger an error intentionally
        raise RuntimeError("simulate failure")
    except RuntimeError:
        test_db.rollback()

    # Verify stock unchanged and no audit
    test_db.refresh(p)
    assert p.stock == 20
    assert test_db.query(InventoryAudit).filter(InventoryAudit.product_id == p.id).count() == 0
