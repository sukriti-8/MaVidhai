import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.models.category import Category
from app.models.product import Product
from tests.test_payments import test_db, auth_headers_user1, auth_headers_user2

client = TestClient(app)

@pytest.fixture
def super_admin_headers(test_db: Session, auth_headers_user1):
    from app.models.user import User
    user = test_db.query(User).filter(User.email == "userpay1@example.com").first()
    original_role = user.role
    user.role = "SUPER_ADMIN"
    test_db.commit()
    yield auth_headers_user1
    user.role = original_role
    test_db.commit()

def test_admin_category_rbac(auth_headers_user2, super_admin_headers):
    # Anonymous -> 401
    res = client.get("/api/admin/categories")
    assert res.status_code == 401

    # CUSTOMER -> 403
    res = client.get("/api/admin/categories", headers=auth_headers_user2)
    assert res.status_code == 403

    # SUPER_ADMIN -> 200
    res = client.get("/api/admin/categories", headers=super_admin_headers)
    assert res.status_code == 200

def test_admin_category_create(test_db: Session, super_admin_headers):
    unique_slug = f"test-admin-category-{uuid.uuid4().hex[:8]}"
    res = client.post("/api/admin/categories", json={
        "name": "Test Admin Category",
        "slug": unique_slug
    }, headers=super_admin_headers)
    
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Test Admin Category"
    # The slug is generated dynamically; ensure it matches the pattern
    assert data["slug"].startswith('test-admin-category-')
    created_slug = data["slug"]
    assert data["is_active"] is True
    
    # Duplicate slug -> 409
    # Attempt to create a duplicate using the same slug as the first category
    res = client.post("/api/admin/categories", json={
        "name": "Another Category",
        "slug": created_slug
    }, headers=super_admin_headers)
    assert res.status_code == 409

def test_admin_category_update(test_db: Session, super_admin_headers):
    unique_slug = f"update-me-{uuid.uuid4().hex[:8]}"
    cat = Category(name="Update Me", slug=unique_slug, is_active=True)
    test_db.add(cat)
    test_db.commit()
    test_db.refresh(cat)
    
    updated_slug = f"updated-category-{uuid.uuid4().hex[:8]}"
    res = client.put(f"/api/admin/categories/{cat.id}", json={
        "name": "Updated Category",
        "slug": updated_slug
    }, headers=super_admin_headers)

    assert res.status_code == 200
    data = res.json()
    assert data["name"] == "Updated Category"
    assert data["slug"] == updated_slug

def test_admin_category_deactivate(test_db: Session, super_admin_headers):
    unique_slug = f"deactivate-me-{uuid.uuid4().hex[:8]}"
    cat = Category(name="Deactivate Me", slug=unique_slug, is_active=True)
    test_db.add(cat)
    test_db.commit()
    test_db.refresh(cat)
    
    res = client.delete(f"/api/admin/categories/{cat.id}", headers=super_admin_headers)
    assert res.status_code == 200
    
    test_db.refresh(cat)
    assert cat.is_active is False

def test_cannot_deactivate_category_with_active_products(test_db: Session, super_admin_headers):
    unique_slug = str(uuid.uuid4())
    cat = Category(name="Has Products", slug=unique_slug, is_active=True)
    test_db.add(cat)
    test_db.commit()
    test_db.refresh(cat)
    
    prod = Product(
        category_id=cat.id,
        name="Test Product",
        slug=str(uuid.uuid4()),
        price=10.0,
        availability=True,
        stock=5
    )
    test_db.add(prod)
    test_db.commit()
    
    res = client.delete(f"/api/admin/categories/{cat.id}", headers=super_admin_headers)
    assert res.status_code == 400
    assert "active products" in res.json()["detail"]
    
    test_db.refresh(cat)
    assert cat.is_active is True
