import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.models.user import User
from app.models.product import Product
from app.models.order import Order
from app.models.payment import Payment
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2, client
import uuid

@pytest.fixture
def super_admin_headers(test_db: Session, auth_headers_user1: dict):
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    original_role = user.role
    user.role = "SUPER_ADMIN"
    test_db.commit()
    yield auth_headers_user1
    user.role = original_role
    test_db.commit()

@pytest.fixture
def intelligence_setup(test_db: Session):
    customer = test_db.query(User).filter(User.email == "userpay2@example.com").first()
    if not customer:
        from app.utils.security import hash_password
        customer = User(email="userpay2@example.com", full_name="Customer 2", password_hash=hash_password("password123"), role="CUSTOMER")
        test_db.add(customer)
        test_db.commit()
        test_db.refresh(customer)

    test_db.query(Payment).filter(Payment.order.has(user_id=customer.id)).delete(synchronize_session=False)
    test_db.query(Order).filter(Order.user_id == customer.id).delete(synchronize_session=False)
    test_db.commit()
    
    base_order_args = dict(
        user_id=customer.id,
        shipping_full_name="John Doe",
        shipping_email="a@b.com",
        shipping_phone="1234567890",
        shipping_address_line1="123 Main St",
        shipping_city="City",
        shipping_state="State",
        shipping_postal_code="12345",
        shipping_country="Country",
        currency="INR"
    )

    o1 = Order(order_number=f"ORD-{uuid.uuid4().hex[:8]}", status="DELIVERED", total_amount=100.0, subtotal=100.0, **base_order_args)
    test_db.add(o1)
    test_db.commit()
    p1 = Payment(order_id=o1.id, amount=100.0, status="captured", provider="stripe", provider_order_id=f"p_o1_{uuid.uuid4().hex[:8]}")
    test_db.add(p1)
    
    o2 = Order(order_number=f"ORD-{uuid.uuid4().hex[:8]}", status="INVENTORY_CONFLICT", total_amount=50.0, subtotal=50.0, **base_order_args)
    test_db.add(o2)
    test_db.commit()
    p2 = Payment(order_id=o2.id, amount=50.0, status="captured", provider="stripe", provider_order_id=f"p_o2_{uuid.uuid4().hex[:8]}")
    test_db.add(p2)
    
    o3 = Order(order_number=f"ORD-{uuid.uuid4().hex[:8]}", status="PENDING", total_amount=200.0, subtotal=200.0, **base_order_args)
    test_db.add(o3)
    test_db.commit()
    p3 = Payment(order_id=o3.id, amount=200.0, status="failed", provider="stripe", provider_order_id=f"p_o3_{uuid.uuid4().hex[:8]}")
    test_db.add(p3)

    o4 = Order(order_number=f"ORD-{uuid.uuid4().hex[:8]}", status="CANCELLED", total_amount=300.0, subtotal=300.0, **base_order_args)
    test_db.add(o4)
    test_db.commit()
    
    p1_fail = Payment(order_id=o1.id, amount=100.0, status="failed", provider="stripe", provider_order_id=f"p_o1_fail_{uuid.uuid4().hex[:8]}")
    test_db.add(p1_fail)
    test_db.commit()

    return customer

def test_customer_intelligence(super_admin_headers, test_db, intelligence_setup):
    customer = intelligence_setup
    response = client.get(f"/api/admin/users/{customer.id}/intelligence", headers=super_admin_headers)
    assert response.status_code == 200
    data = response.json()
    
    assert data["lifetime_value"] == 150.0
    assert data["total_orders"] == 2
    assert data["average_order_value"] == 75.0
    
def test_customer_intelligence_rbac(auth_headers_user2, test_db, intelligence_setup):
    customer = intelligence_setup
    resp = client.get(f"/api/admin/users/{customer.id}/intelligence")
    assert resp.status_code == 401
    resp = client.get(f"/api/admin/users/{customer.id}/intelligence", headers=auth_headers_user2)
    assert resp.status_code == 403
    
def test_customer_intelligence_404(super_admin_headers):
    resp = client.get("/api/admin/users/999999/intelligence", headers=super_admin_headers)
    assert resp.status_code == 404

def test_customer_orders_endpoint(super_admin_headers, test_db, intelligence_setup):
    customer = intelligence_setup
    resp = client.get(f"/api/admin/users/{customer.id}/orders", headers=super_admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 4
    assert data["total"] == 4

def test_customer_orders_endpoint_rbac(auth_headers_user2, intelligence_setup):
    customer = intelligence_setup
    resp = client.get(f"/api/admin/users/{customer.id}/orders", headers=auth_headers_user2)
    assert resp.status_code == 403

def test_order_search_amount_filters(super_admin_headers, test_db, intelligence_setup):
    resp = client.get("/api/admin/orders?min_amount=100", headers=super_admin_headers)
    assert resp.status_code == 200
    for order in resp.json()["items"]:
        assert order["total_amount"] >= 100.0

    resp2 = client.get("/api/admin/orders?max_amount=99", headers=super_admin_headers)
    assert resp2.status_code == 200
    for order in resp2.json()["items"]:
        assert order["total_amount"] <= 99.0

    resp3 = client.get("/api/admin/orders?min_amount=200&max_amount=100", headers=super_admin_headers)
    assert resp3.status_code == 400

def test_order_search_amount_sort(super_admin_headers, test_db, intelligence_setup):
    resp = client.get("/api/admin/orders?sort=amount_desc", headers=super_admin_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    amounts = [item["total_amount"] for item in items]
    assert amounts == sorted(amounts, reverse=True)

def test_order_search_date_filters(super_admin_headers, test_db, intelligence_setup):
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    resp = client.get(f"/api/admin/orders?start_date={today}&end_date={today}", headers=super_admin_headers)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) >= 4
    
    resp2 = client.get(f"/api/admin/orders?start_date={tomorrow}&end_date={tomorrow}", headers=super_admin_headers)
    assert resp2.status_code == 200
    assert len(resp2.json()["items"]) == 0

def test_payment_history_timeline(super_admin_headers, test_db, intelligence_setup):
    customer = intelligence_setup
    orders = test_db.query(Order).filter(Order.user_id == customer.id).all()
    target_order = next(o for o in orders if float(o.total_amount) == 100.0)
    
    resp = client.get(f"/api/admin/orders/{target_order.id}", headers=super_admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    
    assert "payment_history" in data
    history = data["payment_history"]
    assert len(history) == 2
    statuses = [p["status"] for p in history]
    assert "captured" in statuses
    assert "failed" in statuses
