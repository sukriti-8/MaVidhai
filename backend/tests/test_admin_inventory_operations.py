import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, date
from app.models.product import Product
from app.models.inventory_audit import InventoryAudit
from app.models.category import Category
from app.models.user import User
from app.main import app
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2, client

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
def sample_product(test_db: Session):
    uid = str(uuid.uuid4())[:8]
    category = Category(name=f"Test Cat {uid}", slug=f"test-cat-{uid}")
    test_db.add(category)
    test_db.commit()
    test_db.refresh(category)
    
    product = Product(
        name=f"Test Product 1 {uid}",
        slug=f"test-product-1-{uid}",
        price=100.0,
        stock=100,
        availability=True,
        category_id=category.id
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)
    return product

def test_bulk_adjust_inventory_success(super_admin_headers: dict, test_db: Session, sample_product: Product):
    # Create a second product for bulk testing
    uid2 = str(uuid.uuid4())[:8]
    product2 = Product(
        name=f"Test Product 2 {uid2}",
        slug=f"test-product-2-{uid2}",
        price=10.0,
        stock=50,
        availability=True,
        category_id=sample_product.category_id
    )
    test_db.add(product2)
    test_db.commit()
    test_db.refresh(product2)

    payload = {
        "items": [
            {"product_id": sample_product.id, "delta": 5, "reason": "Restock A"},
            {"product_id": product2.id, "delta": -10, "reason": "Damage B"}
        ]
    }
    
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully adjusted 2 products"
    
    test_db.refresh(sample_product)
    test_db.refresh(product2)
    
    assert sample_product.stock == 105
    assert product2.stock == 40
    
    audits = test_db.query(InventoryAudit).order_by(InventoryAudit.id.desc()).limit(2).all()
    assert len(audits) == 2

def test_bulk_adjust_inventory_empty_batch(super_admin_headers: dict):
    payload = {"items": []}
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    assert response.status_code == 422

def test_bulk_adjust_inventory_duplicate_products(super_admin_headers: dict, sample_product: Product):
    payload = {
        "items": [
            {"product_id": sample_product.id, "delta": 5, "reason": "A"},
            {"product_id": sample_product.id, "delta": 10, "reason": "B"}
        ]
    }
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    assert response.status_code == 400
    assert "Duplicate product_id" in response.json()["detail"]

def test_bulk_adjust_inventory_zero_delta(super_admin_headers: dict, sample_product: Product):
    payload = {
        "items": [
            {"product_id": sample_product.id, "delta": 0, "reason": "Zero"}
        ]
    }
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    assert response.status_code == 400

def test_bulk_adjust_inventory_negative_stock(super_admin_headers: dict, sample_product: Product):
    payload = {
        "items": [
            {"product_id": sample_product.id, "delta": -1000, "reason": "Oversell"}
        ]
    }
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    assert response.status_code == 400

def test_bulk_adjust_inventory_transaction_rollback(super_admin_headers: dict, test_db: Session, sample_product: Product):
    # If one product fails, nothing should be saved
    product2 = Product(
        name="Test Product 3",
        slug="test-product-3",
        price=10.0,
        stock=50,
        availability=True,
        category_id=sample_product.category_id
    )
    test_db.add(product2)
    test_db.commit()
    test_db.refresh(product2)
    
    initial_stock1 = sample_product.stock
    initial_stock2 = product2.stock
    initial_audit_count = test_db.query(InventoryAudit).count()

    payload = {
        "items": [
            {"product_id": sample_product.id, "delta": 5, "reason": "Good"},
            {"product_id": product2.id, "delta": -1000, "reason": "Fails"}
        ]
    }
    
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    
    assert response.status_code == 400
    
    test_db.refresh(sample_product)
    test_db.refresh(product2)
    assert sample_product.stock == initial_stock1
    assert product2.stock == initial_stock2
    assert test_db.query(InventoryAudit).count() == initial_audit_count

def test_get_inventory_summary(super_admin_headers: dict, test_db: Session, sample_product: Product):
    response = client.get(
        "/api/admin/inventory/summary",
        headers=super_admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_stock" in data
    assert "low_stock_count" in data
    assert "out_of_stock_count" in data
    assert "availability_breakdown" in data
    assert "available" in data["availability_breakdown"]

def test_get_inventory_audit_date_filters(super_admin_headers: dict, test_db: Session, sample_product: Product):
    # Make an adjustment
    client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json={"items": [{"product_id": sample_product.id, "delta": 5, "reason": "Test Date Filter"}]}
    )
    
    today = date.today().isoformat()
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    
    # Test valid date range
    response = client.get(
        f"/api/admin/inventory/audit?start_date={today}&end_date={today}",
        headers=super_admin_headers
    )
    assert response.status_code == 200
    assert len(response.json()["items"]) >= 1

    # Test future date range (should be empty)
    response = client.get(
        f"/api/admin/inventory/audit?start_date={tomorrow}&end_date={tomorrow}",
        headers=super_admin_headers
    )
    assert response.status_code == 200
    assert len(response.json()["items"]) == 0

def test_bulk_adjust_rbac_unauthenticated():
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        json={"items": [{"product_id": 1, "delta": 1, "reason": "A"}]}
    )
    assert response.status_code == 401

def test_bulk_adjust_rbac_customer(auth_headers_user2: dict):
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=auth_headers_user2,
        json={"items": [{"product_id": 1, "delta": 1, "reason": "A"}]}
    )
    assert response.status_code == 403

def test_summary_rbac_unauthenticated():
    response = client.get("/api/admin/inventory/summary")
    assert response.status_code == 401

def test_summary_rbac_customer(auth_headers_user2: dict):
    response = client.get("/api/admin/inventory/summary", headers=auth_headers_user2)
    assert response.status_code == 403

def test_audit_default_pagination(super_admin_headers: dict, test_db: Session):
    response = client.get("/api/admin/inventory/audit", headers=super_admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["size"] == 50
    assert data["page"] == 1
    
    response2 = client.get("/api/admin/inventory/audit?page=2&size=10", headers=super_admin_headers)
    assert response2.status_code == 200
    data2 = response2.json()
    assert data2["page"] == 2
    assert data2["size"] == 10

def test_audit_filters_combined(super_admin_headers: dict, test_db: Session, sample_product: Product):
    client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json={"items": [{"product_id": sample_product.id, "delta": 5, "reason": "Test Filters"}]}
    )
    
    today = date.today().isoformat()
    response = client.get(
        f"/api/admin/inventory/audit?product_id={sample_product.id}&adjustment_type=ADMIN_ADJUSTMENT&start_date={today}",
        headers=super_admin_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) >= 1
    item = data["items"][0]
    assert item["product_id"] == sample_product.id
    assert item["adjustment_type"] == "ADMIN_ADJUSTMENT"

def test_bulk_adjust_input_ordering(super_admin_headers: dict, test_db: Session, sample_product: Product):
    p2 = Product(name=f"TP2 {uuid.uuid4()}", slug=f"tp2-{uuid.uuid4()}", price=10.0, stock=50, availability=True, category_id=sample_product.category_id)
    p3 = Product(name=f"TP3 {uuid.uuid4()}", slug=f"tp3-{uuid.uuid4()}", price=10.0, stock=50, availability=True, category_id=sample_product.category_id)
    test_db.add_all([p2, p3])
    test_db.commit()
    test_db.refresh(p2)
    test_db.refresh(p3)
    
    payload = {
        "items": [
            {"product_id": p3.id, "delta": 1, "reason": "C"},
            {"product_id": sample_product.id, "delta": 1, "reason": "A"},
            {"product_id": p2.id, "delta": 1, "reason": "B"}
        ]
    }
    
    response = client.patch(
        "/api/admin/inventory/bulk-adjust",
        headers=super_admin_headers,
        json=payload
    )
    assert response.status_code == 200
    
    audits = test_db.query(InventoryAudit).order_by(InventoryAudit.id.desc()).limit(3).all()
    sorted_pids = sorted([sample_product.id, p2.id, p3.id])
    
    assert audits[0].product_id == sorted_pids[2]
    assert audits[1].product_id == sorted_pids[1]
    assert audits[2].product_id == sorted_pids[0]
