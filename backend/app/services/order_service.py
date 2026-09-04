from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.models.user import User
import datetime
import uuid

def generate_order_number() -> str:
    # Example: MVD-20260825-ABCD1234
    date_str = datetime.datetime.utcnow().strftime("%Y%m%d")
    unique_suffix = uuid.uuid4().hex[:8].upper()
    return f"MVD-{date_str}-{unique_suffix}"

def create_order(db: Session, user: User, order_data: OrderCreate) -> Order:
    # 1. Load user's Cart (with row-level lock to prevent concurrent checkout of the same cart)
    cart = db.query(Cart).with_for_update().filter(Cart.user_id == user.id).first()
    
    if not cart or not cart.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create an order from an empty cart"
        )
    
    # 2. Validate availability and recalculate totals using CURRENT database prices
    order_items_data = []
    subtotal = 0.0
    
    for cart_item in cart.items:
        # Load the current product state
        product = db.query(Product).filter(Product.id == cart_item.product_id).first()
        
        if not product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product with id {cart_item.product_id} no longer exists"
            )
            
        if not product.availability:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product '{product.name}' is currently unavailable"
            )
        
        # Calculate item subtotal using the current unit price
        unit_price = float(product.price)
        item_subtotal = unit_price * cart_item.quantity
        
        order_items_data.append({
            "product_id": product.id,
            "product_name": product.name,
            "product_slug": product.slug,
            "unit_price": unit_price,
            "quantity": cart_item.quantity,
            "subtotal": item_subtotal
        })
        
        subtotal += item_subtotal

    shipping_amount = 0.0
    discount_amount = 0.0
    total_amount = subtotal + shipping_amount - discount_amount
    
    # 3. Create the Order
    db_order = Order(
        user_id=user.id,
        order_number=generate_order_number(),
        status="pending",
        subtotal=subtotal,
        shipping_amount=shipping_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        currency="INR",
        shipping_full_name=order_data.shipping_full_name,
        shipping_email=order_data.shipping_email,
        shipping_phone=order_data.shipping_phone,
        shipping_address_line1=order_data.shipping_address_line1,
        shipping_address_line2=order_data.shipping_address_line2,
        shipping_city=order_data.shipping_city,
        shipping_state=order_data.shipping_state,
        shipping_postal_code=order_data.shipping_postal_code,
        shipping_country=order_data.shipping_country
    )
    db.add(db_order)
    db.flush() # flush to get db_order.id
    
    # 4. Create OrderItems
    for item_data in order_items_data:
        db_item = OrderItem(
            order_id=db_order.id,
            **item_data
        )
        db.add(db_item)
        
    # 5. Clear the Cart (delete cart items)
    db.query(CartItem).filter(CartItem.cart_id == cart.id).delete()
    
    # Commit the transaction
    db.commit()
    db.refresh(db_order)
    
    return db_order
