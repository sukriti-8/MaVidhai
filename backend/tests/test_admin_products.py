import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.category import Category
from app.models.product import Product
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2
from tests.test_admin_categories import super_admin_headers

client = TestClient(app)

@pytest.fixture
def sample_category(test_db: Session):
    unique_slug = f"product-admin-cat-{uuid.uuid4().hex[:8]}"
    cat = Category(name="Product Admin Cat", slug=unique_slug, is_active=True)
    test_db.add(cat)
    test_db.commit()
    test_db.refresh(cat)
    return cat

def test_admin_product_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/products")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/products", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/products", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_product_create(test_db: Session, super_admin_headers, sample_category):
    product_slug = f"admin-prod-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Admin Prod 1",
        "slug": product_slug,
        "price": 100.50,
        "availability": True,
        "stock": 10
    }, headers=super_admin_headers)
    
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Admin Prod 1"
    assert data["price"] == "100.50"
    assert data["stock"] == 10
    
    # Duplicate slug -> 409
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Admin Prod 1 Copy",
        "slug": product_slug,
        "price": 50.0,
        "availability": True,
        "stock": 5
    }, headers=super_admin_headers)
    
    assert res.status_code == 409
    
    # Negative stock -> 422 Unprocessable Entity (Pydantic validator)
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Admin Prod Neg",
        "slug": f"neg-{uuid.uuid4().hex[:8]}",
        "price": 50.0,
        "availability": True,
        "stock": -5
    }, headers=super_admin_headers)
    assert res.status_code == 422
    
    # Negative price -> 422
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Admin Prod Neg Price",
        "slug": f"negp-{uuid.uuid4().hex[:8]}",
        "price": -10.0,
        "availability": True,
        "stock": 5
    }, headers=super_admin_headers)
    assert res.status_code == 422

def test_admin_product_update(test_db: Session, super_admin_headers, sample_category):
    unique_slug = f"to-update-prod-{uuid.uuid4().hex[:8]}"
    prod = Product(
        category_id=sample_category.id,
        name="To Update Prod",
        slug=unique_slug,
        price=50.0,
        availability=True,
        stock=5
    )
    test_db.add(prod)
    test_db.commit()
    test_db.refresh(prod)
    
    # Change multiple fields but NOT stock
    res = client.put(f"/api/admin/products/{prod.id}", json={
        "price": 99.99,
        "details": "New details",
        "image_url": "http://example.com/new.jpg",
        "availability": False
    }, headers=super_admin_headers)
    
    assert res.status_code == 200
    data = res.json()
    assert data["price"] == "99.99"
    assert data["details"] == "New details"
    assert data["availability"] is False
    assert data["stock"] == 5

    # Passing stock in PUT should be ignored because it's not in ProductUpdate schema
    res = client.put(f"/api/admin/products/{prod.id}", json={
        "price": 100.00,
        "stock": 50
    }, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["stock"] == 5

def test_admin_product_deactivate(test_db: Session, super_admin_headers, sample_category):
    prod = Product(
        category_id=sample_category.id,
        name="Deactivate Prod",
        slug=f"deactivate-prod-{uuid.uuid4().hex[:8]}",
        price=10.0,
        availability=True,
        stock=5
    )
    test_db.add(prod)
    test_db.commit()
    test_db.refresh(prod)
    
    # Deactivate through delete endpoint
    res = client.delete(f"/api/admin/products/{prod.id}", headers=super_admin_headers)
    assert res.status_code == 200
    
    test_db.refresh(prod)
    assert prod.availability is False

def test_admin_product_stock_adjustment(test_db: Session, super_admin_headers, sample_category):
    prod = Product(
        category_id=sample_category.id,
        name="Stock Delta Prod",
        slug=f"stock-delta-{uuid.uuid4().hex[:8]}",
        price=10.0,
        availability=True,
        stock=20
    )
    test_db.add(prod)
    test_db.commit()
    test_db.refresh(prod)
    
    # Add stock
    res = client.patch(f"/api/admin/products/{prod.id}/stock", json={"delta": 10, "reason": "Test addition"}, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["stock"] == 30

    # Reduce stock
    res = client.patch(f"/api/admin/products/{prod.id}/stock", json={"delta": -5, "reason": "Test reduction"}, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["stock"] == 25

    # Try reducing below zero
    res = client.patch(f"/api/admin/products/{prod.id}/stock", json={"delta": -30, "reason": "Test below zero"}, headers=super_admin_headers)
    assert res.status_code == 400
    
    # Stock should remain 25
    test_db.refresh(prod)
    assert prod.stock == 25

def test_admin_product_low_stock_filter(test_db: Session, super_admin_headers, sample_category):
    p1 = Product(category_id=sample_category.id, name="Low Stock", slug=f"low-{uuid.uuid4().hex[:8]}", price=10.0, stock=5)
    p2 = Product(category_id=sample_category.id, name="High Stock", slug=f"high-{uuid.uuid4().hex[:8]}", price=10.0, stock=50)
    test_db.add_all([p1, p2])
    test_db.commit()
    
    res = client.get("/api/admin/products?low_stock=true", headers=super_admin_headers)
    assert res.status_code == 200
    data = res.json()
    items = data["items"]
    
    assert any(p["id"] == p1.id for p in items)
    assert not any(p["id"] == p2.id for p in items)

def test_admin_product_inactive_category_assignment(test_db: Session, super_admin_headers):
    # Create an inactive category
    inactive_cat = Category(
        name=f"Inactive Cat {uuid.uuid4().hex[:8]}", 
        slug=f"inactive-{uuid.uuid4().hex[:8]}", 
        is_active=False
    )
    test_db.add(inactive_cat)
    test_db.commit()
    test_db.refresh(inactive_cat)

    # Attempt to create product in inactive category -> 400
    res = client.post("/api/admin/products", json={
        "category_id": inactive_cat.id,
        "name": "Should Fail",
        "slug": f"fail-{uuid.uuid4().hex[:8]}",
        "price": 10.0,
        "stock": 10
    }, headers=super_admin_headers)
    assert res.status_code == 400
    assert "inactive category" in res.json()["detail"]

    # Create active category and product
    active_cat = Category(
        name=f"Active Cat {uuid.uuid4().hex[:8]}", 
        slug=f"active-{uuid.uuid4().hex[:8]}", 
        is_active=True
    )
    test_db.add(active_cat)
    test_db.commit()
    test_db.refresh(active_cat)

    prod = Product(
        category_id=active_cat.id,
        name="Update Fail Prod",
        slug=f"upfail-{uuid.uuid4().hex[:8]}",
        price=10.0,
        availability=True,
        stock=5
    )
    test_db.add(prod)
    test_db.commit()
    test_db.refresh(prod)

    # Attempt to update product to inactive category -> 400
    res = client.put(f"/api/admin/products/{prod.id}", json={
        "category_id": inactive_cat.id
    }, headers=super_admin_headers)
    assert res.status_code == 400
    assert "inactive category" in res.json()["detail"]
