import json
import uuid
from decimal import Decimal
from unittest.mock import patch

import pytest
from sqlalchemy.orm import Session

from app.database.connection import SessionLocal
from app.models.cart import Cart, CartItem
from app.models.category import Category
from app.models.order import Order
from app.models.payment import Payment
from app.models.product import Product
from app.models.user import User
from app.routes import admin_products
from app.schemas.order import OrderCreate
from app.schemas.product import ProductCreate
from app.services import cart_service, order_service, product_service
from app.services.payment_webhook_service import process_webhook


@pytest.fixture
def test_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def customer(test_db: Session) -> User:
    user = User(
        full_name="Review Regression Customer",
        email=f"review-{uuid.uuid4().hex}@example.com",
        password_hash="test-only",
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user


@pytest.fixture
def catalog_product(test_db: Session) -> Product:
    product = (
        test_db.query(Product)
        .filter(Product.slug == "handwoven-cotton-saree-pink-deep-purple")
        .one()
    )
    return product


def _shipping_data() -> OrderCreate:
    return OrderCreate(
        shipping_full_name="Review Regression Customer",
        shipping_email="review@example.com",
        shipping_phone="9876543210",
        shipping_address_line1="1 Test Street",
        shipping_city="Chennai",
        shipping_state="Tamil Nadu",
        shipping_postal_code="600001",
        shipping_country="India",
    )


@pytest.mark.parametrize("event_name", ["payment.failed", "payment_link.expired"])
def test_order_reserves_stock_and_unpaid_payment_releases_it(
    test_db: Session, customer: User, catalog_product: Product, event_name: str
) -> None:
    original_stock = catalog_product.stock
    cart = Cart(user_id=customer.id)
    test_db.add(cart)
    test_db.flush()
    test_db.add(CartItem(cart_id=cart.id, product_id=catalog_product.id, quantity=2))
    test_db.commit()

    order = order_service.create_order(test_db, customer, _shipping_data())
    test_db.refresh(catalog_product)
    assert catalog_product.stock == original_stock - 2
    assert order.stock_reserved is True
    assert order.stock_reserved_until is not None

    payment = Payment(
        order_id=order.id,
        provider="razorpay",
        provider_order_id=f"plink_{uuid.uuid4().hex}",
        amount=order.total_amount,
        currency=order.currency,
        status="created",
    )
    test_db.add(payment)
    test_db.commit()

    if event_name == "payment.failed":
        event_payload = {
            "payment": {
                "entity": {
                    "id": f"pay_{uuid.uuid4().hex}",
                    "order_id": payment.provider_order_id,
                }
            }
        }
    else:
        event_payload = {
            "payment_link": {"entity": {"id": payment.provider_order_id}}
        }
    payload = {
        "id": f"evt_{uuid.uuid4().hex}",
        "event": event_name,
        "payload": event_payload,
    }
    with patch(
        "app.services.payment_webhook_service.payment_provider.verify_webhook_signature",
        return_value=True,
    ):
        process_webhook(test_db, json.dumps(payload).encode(), "test-signature", payload["id"])

    test_db.refresh(catalog_product)
    test_db.refresh(order)
    assert catalog_product.stock == original_stock
    assert order.stock_reserved is False
    assert order.status == "cancelled"


def test_unavailable_cart_product_stays_visible_and_removable(
    test_db: Session, customer: User, catalog_product: Product
) -> None:
    original_availability = catalog_product.availability
    cart = Cart(user_id=customer.id)
    test_db.add(cart)
    test_db.flush()
    test_db.add(CartItem(cart_id=cart.id, product_id=catalog_product.id, quantity=1))
    catalog_product.availability = False
    test_db.commit()

    response = cart_service.get_cart(test_db, customer.id)
    assert len(response.items) == 1
    item_id = response.items[0].id

    response = cart_service.remove_item(test_db, customer.id, item_id)
    assert response.items == []

    catalog_product.availability = original_availability
    test_db.commit()


def test_admin_product_saves_mrp_images_and_deactivation_hides_it(
    test_db: Session,
) -> None:
    category = test_db.query(Category).filter(Category.slug == "sarees").one()
    admin = User(
        full_name="Review Regression Admin",
        email=f"admin-{uuid.uuid4().hex}@example.com",
        password_hash="test-only",
        role="SUPER_ADMIN",
    )
    test_db.add(admin)
    test_db.commit()
    test_db.refresh(admin)

    created = admin_products.create_product(
        ProductCreate(
            category_id=category.id,
            name="Review Regression Product",
            slug=f"review-regression-{uuid.uuid4().hex}",
            price=Decimal("100.00"),
            mrp=Decimal("125.00"),
            stock=3,
            image_url="/images/cover.jpg",
            images=["/images/cover.jpg", "/images/side.jpg"],
        ),
        test_db,
        admin,
    )
    assert created.mrp == Decimal("125.00")
    assert created.images == ["/images/cover.jpg", "/images/side.jpg"]

    admin_products.deactivate_product(created.id, test_db, admin)
    public_products, _ = product_service.get_products(test_db)
    admin_products_list, _ = product_service.get_products(test_db, include_hidden=True)
    assert all(product.id != created.id for product in public_products)
    assert any(product.id == created.id for product in admin_products_list)
