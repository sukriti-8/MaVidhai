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
    assert data["category"]["id"] == sample_category.id
    
    # Duplicate slug -> 409
    # Duplicate slug – use same slug as first product to trigger conflict
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Admin Prod 1 Copy",
        "slug": product_slug,
        "price": 50.0,
        "availability": True,
        "stock": 5
    }, headers=super_admin_headers)
    
    assert res.status_code == 409

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
    
    # Change multiple fields
    res = client.put(f"/api/admin/products/{prod.id}", json={
        "price": 99.99,
        "details": "New details",
        "image_url": "http://example.com/new.jpg",
        "availability": False,
        "stock": 0
    }, headers=super_admin_headers)
    
    assert res.status_code == 200
    data = res.json()
    assert data["price"] == "99.99"
    assert data["details"] == "New details"
    assert data["image_url"] == "http://example.com/new.jpg"
    assert data["availability"] is False
    assert data["stock"] == 0
    # Ensure slug unchanged
    assert data["slug"] == unique_slug

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

def test_product_inventory_safety(test_db: Session, super_admin_headers, sample_category):
    # stock = 10 -> accepted
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Inv Prod 1",
        "slug": f"inv-prod-1-{uuid.uuid4().hex[:8]}",
        "price": 10.0,
        "stock": 10
    }, headers=super_admin_headers)
    assert res.status_code == 201
    
    # stock = 0 -> accepted
    res = client.post("/api/admin/products", json={
        "category_id": sample_category.id,
        "name": "Inv Prod 2",
        "slug": f"inv-prod-2-{uuid.uuid4().hex[:8]}",
        "price": 10.0,
        "stock": 0
    }, headers=super_admin_headers)
    assert res.status_code == 201
    
    # stock = -1 -> Pydantic might reject if we add Field(ge=0), but DB constraint should definitely reject.
    # Currently schema doesn't restrict, let's see if we get a 500/IntegrityError due to our DB CheckConstraint.
    # Because of FastAPI/SQLAlchemy we should expect 500 if unhandled, or we should handle it to 400.
    # For now let's just make sure it doesn't create the product successfully.
    import sqlalchemy.exc
    with pytest.raises(sqlalchemy.exc.IntegrityError):
        prod = Product(
            category_id=sample_category.id,
            name="Inv Prod 3",
            slug="inv-prod-3",
            price=10.0,
            stock=-1
        )
        test_db.add(prod)
        test_db.commit()
    test_db.rollback()
