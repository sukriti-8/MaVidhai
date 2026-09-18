import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.payment import Payment
from app.models.order import Order
from app.models.user import User
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2

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

def test_admin_payments_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/payments")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/payments", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/payments", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_payments_filtering(test_db: Session, super_admin_headers, base_user):
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

    # Setup Orders
    o1 = Order(user_id=base_user.id, order_number="MV-PAY-1", status="confirmed", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    o2 = Order(user_id=base_user.id, order_number="MV-PAY-2", status="pending", subtotal=200.0, total_amount=200.0, currency="INR", **shipping_info)
    test_db.add_all([o1, o2])
    test_db.commit()

    # Setup Payments
    p1 = Payment(order_id=o1.id, provider="razorpay", provider_order_id="order_A1", provider_payment_id="pay_A1", status="captured", amount=100.0, currency="INR")
    p2 = Payment(order_id=o2.id, provider="razorpay", provider_order_id="order_B2", provider_payment_id=None, status="created", amount=200.0, currency="INR")
    test_db.add_all([p1, p2])
    test_db.commit()

    # Test no filters
    res = client.get("/api/admin/payments", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) >= 2
    
    # Test status filter
    res = client.get("/api/admin/payments?status=captured", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert all(item["status"] == "captured" for item in data["items"])
    
    # Test provider_order_id filter (case insensitive)
    res = client.get("/api/admin/payments?provider_order_id=a1", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert any(item["provider_order_id"] == "order_A1" for item in data["items"])
    
    # Test order_number filter
    res = client.get("/api/admin/payments?order_number=pay-1", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert any(item["order"]["order_number"] == "MV-PAY-1" for item in data["items"])
    
    # Clean up (optional as tests are isolated, but good practice)
    test_db.delete(p1)
    test_db.delete(p2)
    test_db.delete(o1)
    test_db.delete(o2)
    test_db.commit()

def test_admin_payments_reconciliation(test_db: Session, super_admin_headers, base_user):
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

    # Setup test anomalies and normals
    # 1. Anomaly: Captured + inventory_conflict
    o_anomaly1 = Order(user_id=base_user.id, order_number="MV-REC-1", status="inventory_conflict", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    # 2. Anomaly: Captured + cancelled
    o_anomaly2 = Order(user_id=base_user.id, order_number="MV-REC-2", status="cancelled", subtotal=200.0, total_amount=200.0, currency="INR", **shipping_info)
    # 3. Normal: Captured + confirmed
    o_normal1 = Order(user_id=base_user.id, order_number="MV-REC-3", status="confirmed", subtotal=300.0, total_amount=300.0, currency="INR", **shipping_info)
    # 4. Normal: Created + pending
    o_normal2 = Order(user_id=base_user.id, order_number="MV-REC-4", status="pending", subtotal=400.0, total_amount=400.0, currency="INR", **shipping_info)
    # 5. Normal: Failed + cancelled
    o_normal3 = Order(user_id=base_user.id, order_number="MV-REC-5", status="cancelled", subtotal=500.0, total_amount=500.0, currency="INR", **shipping_info)
    # 6. Normal: inventory_conflict + failed
    o_normal4 = Order(user_id=base_user.id, order_number="MV-REC-6", status="inventory_conflict", subtotal=600.0, total_amount=600.0, currency="INR", **shipping_info)
    
    test_db.add_all([o_anomaly1, o_anomaly2, o_normal1, o_normal2, o_normal3, o_normal4])
    test_db.commit()
    
    p_anom1 = Payment(order_id=o_anomaly1.id, provider="razorpay", provider_order_id="order_R1", status="captured", amount=100.0)
    p_anom2 = Payment(order_id=o_anomaly2.id, provider="razorpay", provider_order_id="order_R2", status="captured", amount=200.0)
    p_norm1 = Payment(order_id=o_normal1.id, provider="razorpay", provider_order_id="order_R3", status="captured", amount=300.0)
    p_norm2 = Payment(order_id=o_normal2.id, provider="razorpay", provider_order_id="order_R4", status="created", amount=400.0)
    p_norm3 = Payment(order_id=o_normal3.id, provider="razorpay", provider_order_id="order_R5", status="failed", amount=500.0)
    p_norm4 = Payment(order_id=o_normal4.id, provider="razorpay", provider_order_id="order_R6", status="failed", amount=600.0)

    test_db.add_all([p_anom1, p_anom2, p_norm1, p_norm2, p_norm3, p_norm4])
    test_db.commit()
    
    # Test Reconciliation Endpoint
    res = client.get("/api/admin/payments/reconciliation", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    
    anomaly_payment_ids = [item["payment_id"] for item in data]
    
    assert p_anom1.id in anomaly_payment_ids
    assert p_anom2.id in anomaly_payment_ids
    
    # Validate normal payments are strictly excluded
    assert p_norm1.id not in anomaly_payment_ids
    assert p_norm2.id not in anomaly_payment_ids
    assert p_norm3.id not in anomaly_payment_ids
from unittest.mock import patch

@patch("app.services.payment_service.payment_provider.refund_payment")
def test_admin_refund_validation(mock_refund, test_db: Session, super_admin_headers, base_user):
    import uuid
    mock_refund.side_effect = lambda **kwargs: {"provider_refund_id": f"rfnd_{uuid.uuid4()}"}
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
    
    o = Order(user_id=base_user.id, order_number="MV-REF-1", status="pending", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o)
    test_db.commit()

    p_created = Payment(order_id=o.id, provider="razorpay", provider_order_id="r1", status="created", amount=100.0)
    p_failed = Payment(order_id=o.id, provider="razorpay", provider_order_id="r2", status="failed", amount=100.0)
    p_refunded = Payment(order_id=o.id, provider="razorpay", provider_order_id="r3", status="refunded", amount=100.0)
    p_captured = Payment(order_id=o.id, provider="razorpay", provider_order_id="r4", provider_payment_id="pay_r4", status="captured", amount=100.0)
    
    test_db.add_all([p_created, p_failed, p_refunded, p_captured])
    test_db.commit()

    # created -> 400
    res = client.post(f"/api/admin/payments/{p_created.id}/refund", headers=super_admin_headers)
    assert res.status_code == 400

    # failed -> 400
    res = client.post(f"/api/admin/payments/{p_failed.id}/refund", headers=super_admin_headers)
    assert res.status_code == 400

    # refunded -> 400
    res = client.post(f"/api/admin/payments/{p_refunded.id}/refund", headers=super_admin_headers)
    assert res.status_code == 400

    # captured -> 200
    res = client.post(f"/api/admin/payments/{p_captured.id}/refund", headers=super_admin_headers)
    if res.status_code != 200:
        print(res.json())
    assert res.status_code == 200
    assert res.json()["payment"]["status"] == "refunded"

@patch("app.services.payment_service.payment_provider.refund_payment")
def test_admin_refund_order_consequences(mock_refund, test_db: Session, super_admin_headers, base_user):
    import uuid
    mock_refund.side_effect = lambda **kwargs: {"provider_refund_id": f"rfnd_{uuid.uuid4()}"}
    from app.models.product import Product
    from app.models.order import OrderItem
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

    # Setup Category and Product to test inventory restoration
    from app.models.category import Category
    cat = Category(name="Test Cat", slug="test-cat")
    test_db.add(cat)
    test_db.commit()

    prod = Product(name="Test Refund Prod", slug="test-refund-prod", category_id=cat.id, price=100.0, stock=10, availability=True)
    test_db.add(prod)
    test_db.commit()

    # 1. Captured + inventory_conflict -> cancelled (no inventory restore since it wasn't deducted)
    o_conf = Order(user_id=base_user.id, order_number="MV-REF-C1", status="inventory_conflict", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o_conf)
    test_db.commit()
    test_db.add(OrderItem(order_id=o_conf.id, product_id=prod.id, product_name="Test", product_slug="test", unit_price=100.0, quantity=2, subtotal=200.0))
    p_conf = Payment(order_id=o_conf.id, provider="razorpay", provider_order_id="c1", provider_payment_id="pay_c1", status="captured", amount=100.0)
    test_db.add(p_conf)
    test_db.commit()

    res = client.post(f"/api/admin/payments/{p_conf.id}/refund", headers=super_admin_headers)
    if res.status_code != 200:
        print(res.json())
    assert res.status_code == 200
    test_db.refresh(o_conf)
    test_db.refresh(prod)
    assert o_conf.status == "cancelled"
    assert prod.stock == 10 # Unchanged

    # 2. Captured + confirmed -> cancelled (inventory restore)
    o_norm = Order(user_id=base_user.id, order_number="MV-REF-C2", status="confirmed", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o_norm)
    test_db.commit()
    test_db.add(OrderItem(order_id=o_norm.id, product_id=prod.id, product_name="Test", product_slug="test", unit_price=100.0, quantity=2, subtotal=200.0))
    p_norm = Payment(order_id=o_norm.id, provider="razorpay", provider_order_id="c2", provider_payment_id="pay_c2", status="captured", amount=100.0)
    test_db.add(p_norm)
    test_db.commit()
    
    # Simulate deduction for confirmed order
    prod.stock = 8
    test_db.commit()

    res = client.post(f"/api/admin/payments/{p_norm.id}/refund", headers=super_admin_headers)
    if res.status_code != 200:
        print(res.json())
    assert res.status_code == 200
    test_db.refresh(o_norm)
    test_db.refresh(prod)
    assert o_norm.status == "cancelled"
    assert prod.stock == 10 # Restored!

def test_admin_refund_concurrency(test_db: Session, super_admin_headers, base_user):
    from app.models.payment import PaymentRefund
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
    
    o = Order(user_id=base_user.id, order_number="MV-REF-CONC", status="pending", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o)
    test_db.commit()

    p = Payment(order_id=o.id, provider="razorpay", provider_order_id="r1_conc", provider_payment_id="pay_r1_conc", status="captured", amount=100.0)
    test_db.add(p)
    test_db.commit()
    
    # Simulate an active refund in progress
    pr = PaymentRefund(payment_id=p.id, admin_id=base_user.id, amount=100.0, status="pending")
    test_db.add(pr)
    test_db.commit()
    
    res = client.post(f"/api/admin/payments/{p.id}/refund", headers=super_admin_headers)
    assert res.status_code == 409
    assert "already in progress" in res.json()["detail"]

def test_webhook_refund_protection(test_db: Session):
    from app.services.payment_webhook_service import process_webhook
    import json
    import hmac
    import hashlib
    import os
    
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
    
    u = User(email="webhook@example.com", full_name="webhook", password_hash="dummy", role="CUSTOMER")
    test_db.add(u)
    test_db.commit()
    
    o = Order(user_id=u.id, order_number="MV-WH-REF", status="cancelled", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o)
    test_db.commit()

    # Setup refunded payment
    p = Payment(order_id=o.id, provider="razorpay", provider_order_id="order_wh_1", provider_payment_id="pay_wh_1", status="refunded", amount=100.0)
    test_db.add(p)
    test_db.commit()
    
    # Fire delayed captured webhook
    payload = {
        "event": "payment.captured",
        "id": "ev_delayed_cap",
        "payload": {
            "payment": {
                "entity": {
                    "id": "pay_wh_1",
                    "order_id": "order_wh_1"
                }
            }
        }
    }
    raw_body = json.dumps(payload).encode()
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET") or "test_secret"
    os.environ["RAZORPAY_WEBHOOK_SECRET"] = webhook_secret
    signature = hmac.new(webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
    
    # Process webhook
    process_webhook(test_db, raw_body, signature, "ev_delayed_cap")
    
    test_db.refresh(p)
    # Status should remain refunded, NOT captured!
    assert p.status == "refunded"

def test_admin_refund_shipped_delivered_rejection(test_db: Session, super_admin_headers, base_user):
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

    o_shipped = Order(user_id=base_user.id, order_number="MV-SHIPPED", status="shipped", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    o_delivered = Order(user_id=base_user.id, order_number="MV-DELIVERED", status="delivered", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add_all([o_shipped, o_delivered])
    test_db.commit()

    p_shipped = Payment(order_id=o_shipped.id, provider="razorpay", provider_order_id="c_s", provider_payment_id="pay_c_s", status="captured", amount=100.0)
    p_delivered = Payment(order_id=o_delivered.id, provider="razorpay", provider_order_id="c_d", provider_payment_id="pay_c_d", status="captured", amount=100.0)
    test_db.add_all([p_shipped, p_delivered])
    test_db.commit()

    # Shipped -> 400
    res = client.post(f"/api/admin/payments/{p_shipped.id}/refund", headers=super_admin_headers)
    assert res.status_code == 400
    assert "shipped" in res.json()["detail"]

    # Delivered -> 400
    res = client.post(f"/api/admin/payments/{p_delivered.id}/refund", headers=super_admin_headers)
    assert res.status_code == 400
    assert "delivered" in res.json()["detail"]

@patch("app.services.payment_service.payment_provider.fetch_refunds")
def test_admin_refund_recovery(mock_fetch, test_db: Session, super_admin_headers, base_user):
    from app.models.payment import PaymentRefund
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

    # Setup pending refund
    o = Order(user_id=base_user.id, order_number="MV-REC-TEST", status="pending", subtotal=100.0, total_amount=100.0, currency="INR", **shipping_info)
    test_db.add(o)
    test_db.commit()

    p = Payment(order_id=o.id, provider="razorpay", provider_order_id="r1_rec", provider_payment_id="pay_r1_rec", status="captured", amount=100.0)
    test_db.add(p)
    test_db.commit()

    pr = PaymentRefund(payment_id=p.id, admin_id=base_user.id, amount=100.0, status="pending")
    test_db.add(pr)
    test_db.commit()

    # 1. Provider Processed -> Finalizes
    mock_fetch.return_value = [{"receipt": str(pr.id), "status": "processed", "provider_refund_id": "rfnd_mock1"}]
    res = client.post(f"/api/admin/payments/{p.id}/refund/recover", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["resolution"] == "FINALIZED"
    test_db.refresh(pr)
    assert pr.status == "completed"

    # Reset to pending for next test
    pr.status = "pending"
    p.status = "captured"
    test_db.commit()

    # 2. Provider Failed -> Marks failed
    mock_fetch.return_value = [{"receipt": str(pr.id), "status": "failed", "provider_refund_id": "rfnd_mock2"}]
    res = client.post(f"/api/admin/payments/{p.id}/refund/recover", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["resolution"] == "MARKED_FAILED"
    test_db.refresh(pr)
    assert pr.status == "failed"

    # Reset
    pr.status = "pending"
    p.status = "captured"
    test_db.commit()

    # 3. Provider Pending -> UNRESOLVED
    mock_fetch.return_value = [{"receipt": str(pr.id), "status": "pending", "provider_refund_id": "rfnd_mock3"}]
    res = client.post(f"/api/admin/payments/{p.id}/refund/recover", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["resolution"] == "UNRESOLVED"
    test_db.refresh(pr)
    assert pr.status == "pending"

    # 4. Provider Not Found -> UNRESOLVED
    mock_fetch.return_value = []
    res = client.post(f"/api/admin/payments/{p.id}/refund/recover", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["resolution"] == "UNRESOLVED"
    test_db.refresh(pr)
    assert pr.status == "pending"
