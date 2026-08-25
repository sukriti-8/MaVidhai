import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import get_db, SessionLocal
from app.models.product import Product
from typing import Dict, Any

client = TestClient(app)

@pytest.fixture
def test_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def auth_headers_user1(test_db: Session) -> Dict[str, str]:
    # Register user1 (may fail if exists, that's ok)
    try:
        client.post("/api/auth/register", json={
            "email": "usercart1@example.com",
            "password": "password123",
            "full_name": "User Cart One"
        })
    except:
        pass
    # Login
    response = client.post("/api/auth/login", json={
        "email": "usercart1@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user2(test_db: Session) -> Dict[str, str]:
    try:
        client.post("/api/auth/register", json={
            "email": "usercart2@example.com",
            "password": "password123",
            "full_name": "User Cart Two"
        })
    except:
        pass
    # Login
    response = client.post("/api/auth/login", json={
        "email": "usercart2@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_product(test_db: Session) -> Product:
    product = test_db.query(Product).filter(Product.slug == "handcrafted-brass-lamp").first()
    return product

def test_cart_unauthorized():
    response = client.get("/api/cart")
    assert response.status_code == 401

def test_get_or_create_cart(auth_headers_user1: Dict[str, str]):
    response = client.get("/api/cart", headers=auth_headers_user1)
    assert response.status_code == 200
    data = response.json()
    # It might have items if run multiple times, so just check structure
    assert "items" in data
    assert "item_count" in data
    assert "subtotal" in data

def test_add_item_to_cart(auth_headers_user1: Dict[str, str], sample_product: Product):
    # Clear cart first
    client.delete("/api/cart", headers=auth_headers_user1)
    
    response = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 2
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert data["items"][0]["product"]["id"] == sample_product.id
    assert float(data["items"][0]["subtotal"]) == float(sample_product.price * 2)
    assert data["item_count"] == 2
    assert float(data["subtotal"]) == float(sample_product.price * 2)

def test_add_item_duplicate_increments(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/cart", headers=auth_headers_user1)
    
    client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 2
    })
    response = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 3
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 5

def test_add_invalid_product(auth_headers_user1: Dict[str, str]):
    response = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": 99999,
        "quantity": 1
    })
    assert response.status_code == 404

def test_invalid_quantity(auth_headers_user1: Dict[str, str], sample_product: Product):
    response = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 0
    })
    assert response.status_code == 422
    
    response = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 105
    })
    assert response.status_code == 422

def test_update_item(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/cart", headers=auth_headers_user1)
    res = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 1
    })
    item_id = res.json()["items"][0]["id"]
    
    update_res = client.patch(f"/api/cart/items/{item_id}", headers=auth_headers_user1, json={
        "quantity": 4
    })
    assert update_res.status_code == 200
    assert update_res.json()["items"][0]["quantity"] == 4

def test_remove_item(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/cart", headers=auth_headers_user1)
    res = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 1
    })
    item_id = res.json()["items"][0]["id"]
    
    del_res = client.delete(f"/api/cart/items/{item_id}", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert len(del_res.json()["items"]) == 0

def test_clear_cart(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 1
    })
    clear_res = client.delete("/api/cart", headers=auth_headers_user1)
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
    assert clear_res.json()["item_count"] == 0

def test_ownership_isolation(auth_headers_user1: Dict[str, str], auth_headers_user2: Dict[str, str], sample_product: Product):
    client.delete("/api/cart", headers=auth_headers_user1)
    client.delete("/api/cart", headers=auth_headers_user2)
    
    # User 1 adds item
    res = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 2
    })
    item_id = res.json()["items"][0]["id"]
    
    # User 2 tries to update User 1's item
    update_res = client.patch(f"/api/cart/items/{item_id}", headers=auth_headers_user2, json={
        "quantity": 5
    })
    assert update_res.status_code == 404
    
    # User 2 tries to delete User 1's item
    del_res = client.delete(f"/api/cart/items/{item_id}", headers=auth_headers_user2)
    assert del_res.status_code == 404
    
    # User 2 cart is still empty
    cart2_res = client.get("/api/cart", headers=auth_headers_user2)
    assert len(cart2_res.json()["items"]) == 0

def test_price_integrity(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/cart", headers=auth_headers_user1)
    res = client.post("/api/cart/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id,
        "quantity": 2,
        "price": 1.0  # Should be ignored
    })
    if res.status_code == 200:
        data = res.json()
        assert float(data["subtotal"]) == float(sample_product.price * 2)
