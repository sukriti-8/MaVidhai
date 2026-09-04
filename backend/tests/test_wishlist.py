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
    try:
        client.post("/api/auth/register", json={
            "email": "userwish1@example.com",
            "password": "password123",
            "full_name": "User Wish One"
        })
    except:
        pass
    response = client.post("/api/auth/login", json={
        "email": "userwish1@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user2(test_db: Session) -> Dict[str, str]:
    try:
        client.post("/api/auth/register", json={
            "email": "userwish2@example.com",
            "password": "password123",
            "full_name": "User Wish Two"
        })
    except:
        pass
    response = client.post("/api/auth/login", json={
        "email": "userwish2@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def sample_product(test_db: Session) -> Product:
    return test_db.query(Product).filter(Product.slug == "handcrafted-brass-lamp").first()

def test_wishlist_unauthorized():
    response = client.get("/api/wishlist")
    assert response.status_code == 401

def test_get_or_create_wishlist(auth_headers_user1: Dict[str, str]):
    response = client.get("/api/wishlist", headers=auth_headers_user1)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "count" in data

def test_add_item_to_wishlist(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/wishlist", headers=auth_headers_user1)
    
    response = client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1
    assert data["items"][0]["product"]["id"] == sample_product.id
    assert data["count"] == 1

def test_add_item_duplicate_idempotent(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/wishlist", headers=auth_headers_user1)
    
    client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    response = client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 1

def test_add_invalid_product(auth_headers_user1: Dict[str, str]):
    response = client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": 99999
    })
    assert response.status_code == 404

def test_remove_item(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.delete("/api/wishlist", headers=auth_headers_user1)
    res = client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    item_id = res.json()["items"][0]["id"]
    
    del_res = client.delete(f"/api/wishlist/items/{item_id}", headers=auth_headers_user1)
    assert del_res.status_code == 200
    assert len(del_res.json()["items"]) == 0

def test_clear_wishlist(auth_headers_user1: Dict[str, str], sample_product: Product):
    client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    clear_res = client.delete("/api/wishlist", headers=auth_headers_user1)
    assert clear_res.status_code == 200
    assert len(clear_res.json()["items"]) == 0
    assert clear_res.json()["count"] == 0

def test_ownership_isolation(auth_headers_user1: Dict[str, str], auth_headers_user2: Dict[str, str], sample_product: Product):
    client.delete("/api/wishlist", headers=auth_headers_user1)
    client.delete("/api/wishlist", headers=auth_headers_user2)
    
    res = client.post("/api/wishlist/items", headers=auth_headers_user1, json={
        "product_id": sample_product.id
    })
    item_id = res.json()["items"][0]["id"]
    
    del_res = client.delete(f"/api/wishlist/items/{item_id}", headers=auth_headers_user2)
    assert del_res.status_code == 404
    
    wishlist2_res = client.get("/api/wishlist", headers=auth_headers_user2)
    assert len(wishlist2_res.json()["items"]) == 0
