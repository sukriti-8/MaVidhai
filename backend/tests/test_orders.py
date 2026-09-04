import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.main import app
from app.database.connection import SessionLocal
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.models.user import User
from typing import Dict

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
            "email": "userorder1@example.com",
            "password": "password123",
            "full_name": "User Order One"
        })
    except:
        pass
    response = client.post("/api/auth/login", json={
        "email": "userorder1@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def auth_headers_user2(test_db: Session) -> Dict[str, str]:
    try:
        client.post("/api/auth/register", json={
            "email": "userorder2@example.com",
            "password": "password123",
            "full_name": "User Order Two"
        })
    except:
        pass
    response = client.post("/api/auth/login", json={
        "email": "userorder2@example.com",
        "password": "password123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def valid_shipping_data():
    return {
        "shipping_full_name": "Test User",
        "shipping_email": "test@example.com",
        "shipping_phone": "9876543210",
        "shipping_address_line1": "123 Test St",
        "shipping_city": "Test City",
        "shipping_state": "Test State",
        "shipping_postal_code": "12345",
        "shipping_country": "Test Country"
    }

@pytest.fixture
def sample_products(test_db: Session):
    return test_db.query(Product).limit(2).all()

def test_create_order_empty_cart(auth_headers_user1, valid_shipping_data):
    # clear cart
    client.delete("/api/cart", headers=auth_headers_user1)
    
    response = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    assert response.status_code == 400
    assert "Cannot create an order from an empty cart" in response.json()["detail"]

def test_create_order_success(auth_headers_user1, valid_shipping_data, sample_products, test_db: Session):
    client.delete("/api/cart", headers=auth_headers_user1)
    
    product = sample_products[0]
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 2}, headers=auth_headers_user1)
    
    response = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    assert response.status_code == 201
    
    data = response.json()
    assert "order_number" in data
    assert data["status"] == "pending"
    assert data["subtotal"] == float(product.price) * 2
    assert data["total_amount"] == float(product.price) * 2
    
    # Verify cart is empty
    cart_res = client.get("/api/cart", headers=auth_headers_user1)
    assert cart_res.json()["item_count"] == 0
    
    # Verify DB state
    order = test_db.query(Order).filter(Order.id == data["id"]).first()
    assert order is not None
    assert order.shipping_full_name == "Test User"
    
    order_items = test_db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    assert len(order_items) == 1
    assert order_items[0].product_id == product.id
    assert order_items[0].quantity == 2
    assert order_items[0].unit_price == product.price
    assert order_items[0].subtotal == product.price * 2


def test_create_order_unavailable_product(auth_headers_user1, valid_shipping_data, sample_products, test_db: Session):
    client.delete("/api/cart", headers=auth_headers_user1)
    
    product = sample_products[0]
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 1}, headers=auth_headers_user1)
    
    # Set unavailable
    product.availability = False
    test_db.commit()
    
    response = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    assert response.status_code == 409
    assert "currently unavailable" in response.json()["detail"]
    
    # Verify cart untouched
    cart_res = client.get("/api/cart", headers=auth_headers_user1)
    assert cart_res.json()["item_count"] == 1
    
    # Revert
    product.availability = True
    test_db.commit()

def test_create_order_price_snapshot(auth_headers_user1, valid_shipping_data, sample_products, test_db: Session):
    client.delete("/api/cart", headers=auth_headers_user1)
    
    product = sample_products[1]
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 1}, headers=auth_headers_user1)
    
    # Change price in DB before order
    original_price = product.price
    new_price = original_price + 500
    product.price = new_price
    test_db.commit()
    
    response = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    assert response.status_code == 201, response.text
    
    data = response.json()
    assert data["items"][0]["unit_price"] == float(new_price)
    
    # Change price again
    product.price = new_price + 500
    test_db.commit()
    
def test_get_order_history(auth_headers_user1, valid_shipping_data, sample_products, test_db: Session):
    # Get user to clear orders
    user = test_db.query(User).filter(User.email == "userorder1@example.com").first()
    if user:
        test_db.query(Order).filter(Order.user_id == user.id).delete()
        test_db.commit()

    # clear cart
    client.delete("/api/cart", headers=auth_headers_user1)
    
    # create 2 orders
    product = sample_products[0]
    
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 1}, headers=auth_headers_user1)
    res1 = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 2}, headers=auth_headers_user1)
    res2 = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    
    response = client.get("/api/orders", headers=auth_headers_user1)
    assert response.status_code == 200
    
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    # newest first
    assert data["items"][0]["order_number"] == res2.json()["order_number"]
    assert data["items"][1]["order_number"] == res1.json()["order_number"]
    assert "status" in data["items"][0]
    assert "total_amount" in data["items"][0]

def test_get_order_details_and_security(auth_headers_user1, auth_headers_user2, valid_shipping_data, sample_products, test_db: Session):
    client.delete("/api/cart", headers=auth_headers_user1)
    
    product = sample_products[0]
    client.post("/api/cart/items", json={"product_id": product.id, "quantity": 1}, headers=auth_headers_user1)
    res = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    order_number = res.json()["order_number"]
    
    # User 1 can get their order
    details_res = client.get(f"/api/orders/{order_number}", headers=auth_headers_user1)
    assert details_res.status_code == 200
    data = details_res.json()
    assert data["order_number"] == order_number
    assert data["shipping_full_name"] == "Test User"
    assert len(data["items"]) == 1
    
    # User 2 cannot get User 1's order
    details_res_2 = client.get(f"/api/orders/{order_number}", headers=auth_headers_user2)
    assert details_res_2.status_code == 404
    
    # User 2 history is empty
    history_res_2 = client.get("/api/orders", headers=auth_headers_user2)
    assert history_res_2.json()["total"] == 0

def test_product_deletion_preserves_order(auth_headers_user1, valid_shipping_data, sample_products, test_db: Session):
    # Need to create a new product that we can safely delete
    existing_category = sample_products[0].category_id
    new_product = Product(
        name="Delete Me Lamp",
        slug="delete-me-lamp",
        description="Will be deleted",
        price=100.0,
        availability=True,
        category_id=existing_category
    )
    test_db.add(new_product)
    test_db.commit()
    test_db.refresh(new_product)
    
    client.delete("/api/cart", headers=auth_headers_user1)
    client.post("/api/cart/items", json={"product_id": new_product.id, "quantity": 1}, headers=auth_headers_user1)
    res = client.post("/api/orders", json=valid_shipping_data, headers=auth_headers_user1)
    order_number = res.json()["order_number"]
    
    # Delete the product
    test_db.delete(new_product)
    test_db.commit()
    
    # Get order details
    details_res = client.get(f"/api/orders/{order_number}", headers=auth_headers_user1)
    assert details_res.status_code == 200
    data = details_res.json()
    assert data["items"][0]["product_id"] is None
    assert data["items"][0]["product_name"] == "Delete Me Lamp"
    assert data["items"][0]["unit_price"] == 100.0
