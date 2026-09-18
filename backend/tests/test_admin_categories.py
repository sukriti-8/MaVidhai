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

def test_admin_category_validation(test_db: Session, super_admin_headers):
    # Empty name -> 422
    res = client.post("/api/admin/categories", json={
        "name": "",
        "slug": f"valid-slug-{uuid.uuid4().hex[:8]}"
    }, headers=super_admin_headers)
    assert res.status_code == 422

    # Whitespace-only name -> 422 (because strip_whitespace should reduce it to "")
    res = client.post("/api/admin/categories", json={
        "name": "   ",
        "slug": f"valid-slug-{uuid.uuid4().hex[:8]}"
    }, headers=super_admin_headers)
    assert res.status_code == 422

    # Empty slug -> 422
    res = client.post("/api/admin/categories", json={
        "name": "Valid Name",
        "slug": ""
    }, headers=super_admin_headers)
    assert res.status_code == 422

def test_admin_category_create_and_uniqueness(test_db: Session, super_admin_headers):
    name = f"Test Admin Category {uuid.uuid4().hex[:8]}"
    slug = f"test-admin-cat-{uuid.uuid4().hex[:8]}"
    
    res = client.post("/api/admin/categories", json={
        "name": name,
        "slug": slug
    }, headers=super_admin_headers)
    
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == name
    assert data["slug"] == slug
    assert data["is_active"] is True
    
    # Duplicate slug -> 400
    res = client.post("/api/admin/categories", json={
        "name": f"Another Name {uuid.uuid4().hex[:8]}",
        "slug": slug
    }, headers=super_admin_headers)
    assert res.status_code == 400
    
    # Duplicate name -> 400
    res = client.post("/api/admin/categories", json={
        "name": name,
        "slug": f"another-slug-{uuid.uuid4().hex[:8]}"
    }, headers=super_admin_headers)
    assert res.status_code == 400

def test_admin_category_update_and_uniqueness(test_db: Session, super_admin_headers):
    name1 = f"Cat One {uuid.uuid4().hex[:8]}"
    slug1 = f"cat-one-{uuid.uuid4().hex[:8]}"
    cat1 = Category(name=name1, slug=slug1, is_active=True)
    test_db.add(cat1)
    
    name2 = f"Cat Two {uuid.uuid4().hex[:8]}"
    slug2 = f"cat-two-{uuid.uuid4().hex[:8]}"
    cat2 = Category(name=name2, slug=slug2, is_active=True)
    test_db.add(cat2)
    test_db.commit()
    test_db.refresh(cat1)
    test_db.refresh(cat2)
    
    # Update to duplicate name -> 400
    res = client.put(f"/api/admin/categories/{cat2.id}", json={
        "name": name1
    }, headers=super_admin_headers)
    assert res.status_code == 400
    
    # Update to duplicate slug -> 400
    res = client.put(f"/api/admin/categories/{cat2.id}", json={
        "slug": slug1
    }, headers=super_admin_headers)
    assert res.status_code == 400
    
    # Valid update
    new_name = f"Updated Cat Two {uuid.uuid4().hex[:8]}"
    res = client.put(f"/api/admin/categories/{cat2.id}", json={
        "name": new_name
    }, headers=super_admin_headers)
    assert res.status_code == 200
    assert res.json()["name"] == new_name

def test_admin_category_deactivate(test_db: Session, super_admin_headers):
    unique_slug = f"deactivate-me-{uuid.uuid4().hex[:8]}"
    cat = Category(name=f"Deactivate Me {uuid.uuid4().hex[:8]}", slug=unique_slug, is_active=True)
    test_db.add(cat)
    test_db.commit()
    test_db.refresh(cat)
    
    res = client.delete(f"/api/admin/categories/{cat.id}", headers=super_admin_headers)
    assert res.status_code == 200
    
    test_db.refresh(cat)
    assert cat.is_active is False

def test_cannot_deactivate_category_with_active_products(test_db: Session, super_admin_headers):
    unique_slug = str(uuid.uuid4())
    cat = Category(name=f"Has Products {uuid.uuid4().hex[:8]}", slug=unique_slug, is_active=True)
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
