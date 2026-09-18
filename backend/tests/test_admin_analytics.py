import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.main import app
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.order import Order, OrderItem
from app.models.payment import Payment, PaymentRefund
from tests.test_payments import test_db
import uuid

client = TestClient(app)

@pytest.fixture
def auth_headers_superadmin(test_db: Session) -> dict:
    user = test_db.query(User).filter(User.email == "adminanalytics@example.com").first()
    if not user:
        response = client.post("/api/auth/register", json={
            "email": "adminanalytics@example.com",
            "password": "password123",
            "full_name": "Admin Analytics"
        })
        user = test_db.query(User).filter(User.email == "adminanalytics@example.com").first()
    
    user.role = "SUPER_ADMIN"
    user.is_active = True
    test_db.commit()

    response = client.post("/api/auth/login", json={
        "email": "adminanalytics@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_customer(test_db: Session) -> dict:
    user = test_db.query(User).filter(User.email == "customeranalytics@example.com").first()
    if not user:
        response = client.post("/api/auth/register", json={
            "email": "customeranalytics@example.com",
            "password": "password123",
            "full_name": "Customer Analytics"
        })
        user = test_db.query(User).filter(User.email == "customeranalytics@example.com").first()
    
    user.role = "CUSTOMER"
    test_db.commit()

    response = client.post("/api/auth/login", json={
        "email": "customeranalytics@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_analytics_data(test_db: Session, auth_headers_customer):
    # Create category and products
    cat = Category(name="Analytics Cat", slug=f"cat-{uuid.uuid4().hex[:6]}")
    test_db.add(cat)
    test_db.commit()

    prod1 = Product(category_id=cat.id, name="Zero Seller", slug=f"zs-{uuid.uuid4().hex[:6]}", price=100.0, stock=50, availability=True)
    prod2 = Product(category_id=cat.id, name="Top Seller", slug=f"ts-{uuid.uuid4().hex[:6]}", price=200.0, stock=5, availability=True)
    prod3 = Product(category_id=cat.id, name="Out of Stock Prod", slug=f"oos-{uuid.uuid4().hex[:6]}", price=150.0, stock=0, availability=False)
    test_db.add_all([prod1, prod2, prod3])
    test_db.commit()

    user = test_db.query(User).filter(User.email == "customeranalytics@example.com").first()
    
    # Create orders for Prod2
    o1 = Order(user_id=user.id, order_number=f"ORD-A-{uuid.uuid4().hex[:6]}", status="confirmed", subtotal=400.0, total_amount=400.0, shipping_full_name="a", shipping_email="a", shipping_phone="a", shipping_address_line1="a", shipping_city="a", shipping_state="a", shipping_postal_code="a", shipping_country="a")
    test_db.add(o1)
    test_db.commit()
    test_db.refresh(o1)

    oi1 = OrderItem(order_id=o1.id, product_id=prod2.id, product_name=prod2.name, product_slug=prod2.slug, unit_price=200.0, quantity=2, subtotal=400.0)
    test_db.add(oi1)

    # Payment captured for o1
    p1 = Payment(order_id=o1.id, provider="provider", provider_order_id=f"pay-{uuid.uuid4().hex[:6]}", amount=400.0, status="captured")
    test_db.add(p1)
    test_db.commit()

    # Cancelled order
    o2 = Order(user_id=user.id, order_number=f"ORD-C-{uuid.uuid4().hex[:6]}", status="cancelled", subtotal=200.0, total_amount=200.0, shipping_full_name="a", shipping_email="a", shipping_phone="a", shipping_address_line1="a", shipping_city="a", shipping_state="a", shipping_postal_code="a", shipping_country="a")
    test_db.add(o2)
    test_db.commit()
    test_db.refresh(o2)
    
    oi2 = OrderItem(order_id=o2.id, product_id=prod2.id, product_name=prod2.name, product_slug=prod2.slug, unit_price=200.0, quantity=1, subtotal=200.0)
    test_db.add(oi2)
    test_db.commit()

    return {
        "cat": cat,
        "prod_zero": prod1,
        "prod_top": prod2,
        "prod_oos": prod3,
        "user": user,
        "captured_order": o1,
        "cancelled_order": o2
    }

def test_dashboard_rbac(auth_headers_customer):
    res = client.get("/api/admin/analytics/dashboard", headers=auth_headers_customer)
    assert res.status_code == 403
    
    res = client.get("/api/admin/analytics/dashboard")
    assert res.status_code == 401

def test_dashboard_metrics(auth_headers_superadmin, sample_analytics_data):
    today = date.today()
    start_str = (today - timedelta(days=1)).isoformat()
    end_str = today.isoformat()

    res = client.get(f"/api/admin/analytics/dashboard?start_date={start_str}&end_date={end_str}", headers=auth_headers_superadmin)
    assert res.status_code == 200
    data = res.json()
    
    assert data["revenue"]["gross_captured"] >= 400.0
    assert data["orders"]["total"] >= 2
    assert data["orders"]["captured"] >= 1
    assert data["orders"]["cancelled"] >= 1
    assert data["inventory"]["low_stock"] >= 1 # Prod2 is stock 5
    assert data["inventory"]["out_of_stock"] >= 1 # Prod3 is stock 0

def test_revenue_timeseries(auth_headers_superadmin, sample_analytics_data):
    res = client.get("/api/admin/analytics/revenue-timeseries?interval=day", headers=auth_headers_superadmin)
    assert res.status_code == 200
    data = res.json()
    assert data["interval"] == "day"
    assert len(data["data"]) > 0

def test_invalid_interval(auth_headers_superadmin):
    res = client.get("/api/admin/analytics/revenue-timeseries?interval=yearly", headers=auth_headers_superadmin)
    assert res.status_code == 400

def test_product_analytics(auth_headers_superadmin, sample_analytics_data):
    res = client.get("/api/admin/analytics/products?limit=100", headers=auth_headers_superadmin)
    assert res.status_code == 200
    data = res.json()
    
    # Assert prod_zero is in lowest sellers
    lowest = [p["product_id"] for p in data["lowest_sellers"]]
    assert sample_analytics_data["prod_zero"].id in lowest

    # Assert Prod2 is in top sellers
    top = [p["product_id"] for p in data["top_by_quantity"]]
    assert sample_analytics_data["prod_top"].id in top

def test_customer_analytics(auth_headers_superadmin, sample_analytics_data):
    res = client.get("/api/admin/analytics/customers", headers=auth_headers_superadmin)
    assert res.status_code == 200
    data = res.json()
    
    # Assert the customer is in top customers
    top = [c["user_id"] for c in data["top_customers_by_period_revenue"]]
    assert sample_analytics_data["user"].id in top
