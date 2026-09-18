import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
from tests.test_admin_categories import super_admin_headers

client = TestClient(app)

def test_admin_orders_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/orders")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/orders", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/orders", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_orders_listing(test_db: Session, super_admin_headers):
    # Ensure there are some orders
    res = client.get("/api/admin/orders?page=1&limit=10", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    assert "total" in data

def test_admin_order_detail(test_db: Session, super_admin_headers):
    # Grab first order
    order = test_db.query(Order).first()
    if not order:
        pytest.skip("No orders to test")

    res = client.get(f"/api/admin/orders/{order.id}", headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["id"] == order.id

    # Non-existent
    res = client.get("/api/admin/orders/99999", headers=super_admin_headers)
    assert res.status_code == 404

def test_admin_status_transitions(test_db: Session, super_admin_headers):
    # Create a fresh order explicitly
    from app.services.order_service import generate_order_number
    from app.models.user import User
    
    user = test_db.query(User).filter(User.email == "userpay2@example.com").first()
    new_order = Order(
        user_id=user.id,
        order_number=generate_order_number(),
        status="pending",
        subtotal=10.0,
        total_amount=10.0,
        shipping_full_name="Test",
        shipping_email="test@example.com",
        shipping_phone="123",
        shipping_address_line1="123",
        shipping_city="City",
        shipping_state="State",
        shipping_postal_code="123",
        shipping_country="IN"
    )
    test_db.add(new_order)
    test_db.commit()
    test_db.refresh(new_order)

    # 1. pending -> confirmed without payment should fail
    res = client.patch(f"/api/admin/orders/{new_order.id}/status", json={"status": "confirmed"}, headers=super_admin_headers)
    assert res.status_code == 400
    assert "payment" in res.json()["detail"].lower()

    # 2. pending -> cancelled should succeed
    res = client.patch(f"/api/admin/orders/{new_order.id}/status", json={"status": "cancelled"}, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["status"] == "cancelled"

    # 3. cancelled -> anything should fail
    res = client.patch(f"/api/admin/orders/{new_order.id}/status", json={"status": "shipped"}, headers=super_admin_headers)
    assert res.status_code == 400
    assert "cancelled" in res.json()["detail"].lower()

def test_double_cancellation(test_db: Session, super_admin_headers):
    from app.models.order import OrderItem
    from app.services.order_service import generate_order_number
    from app.models.category import Category
    from app.models.user import User
    cat = test_db.query(Category).first()
    
    # 1. Setup product
    prod = Product(
        category_id=cat.id,
        name="Test Cancel Double",
        slug="test-cancel-double",
        price=10.0,
        availability=True,
        stock=5
    )
    test_db.add(prod)
    test_db.commit()
    test_db.refresh(prod)
    
    # 2. Setup order that is confirmed
    user = test_db.query(User).filter(User.email == "userpay2@example.com").first()
    new_order = Order(
        user_id=user.id,
        order_number=generate_order_number(),
        status="confirmed",
        subtotal=10.0,
        total_amount=10.0,
        shipping_full_name="Test",
        shipping_email="test@example.com",
        shipping_phone="123",
        shipping_address_line1="123",
        shipping_city="City",
        shipping_state="State",
        shipping_postal_code="123",
        shipping_country="IN"
    )
    test_db.add(new_order)
    test_db.flush()
    
    item = OrderItem(
        order_id=new_order.id,
        product_id=prod.id,
        product_name=prod.name,
        product_slug=prod.slug,
        unit_price=10.0,
        quantity=2,
        subtotal=20.0
    )
    test_db.add(item)
    test_db.commit()

    # Cancel once -> stock should increase by 2
    res = client.patch(f"/api/admin/orders/{new_order.id}/status", json={"status": "cancelled"}, headers=super_admin_headers)
    assert res.status_code == 200
    test_db.refresh(prod)
    assert prod.stock == 7

    # Cancel twice -> should fail and stock should remain 7
    res = client.patch(f"/api/admin/orders/{new_order.id}/status", json={"status": "cancelled"}, headers=super_admin_headers)
    assert res.status_code == 400
    test_db.refresh(prod)
    assert prod.stock == 7
