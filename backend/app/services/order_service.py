from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.schemas.order import OrderCreate
from app.models.user import User
from app.services.audit_service import log_admin_action
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
        # Load the current product state with row-level lock
        product = db.query(Product).filter(Product.id == cart_item.product_id).with_for_update().first()
        
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
            
        if cart_item.quantity > product.stock:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Not enough stock for product '{product.name}'. Requested: {cart_item.quantity}, Available: {product.stock}"
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

def reconcile_inventory_conflict(db: Session, order_number: str) -> Order:
    # 1. Load the order with appropriate locking.
    order = db.query(Order).filter(Order.order_number == order_number).with_for_update().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    # 2. Verify it is inventory_conflict
    if order.status != "inventory_conflict":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order is not in inventory_conflict state")
        
    # 3. Verify its latest payment is captured
    if order.payment_status != "captured":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order payment is not captured")
        
    from app.services import inventory_service
    
    # 4. Use inventory service to securely lock and deduct
    success = inventory_service.reserve_and_deduct_stock(db, order.items, order.id)
    
    if success:
        order.status = "confirmed"
    
    # 8. Commit atomically
    db.commit()
    db.refresh(order)
    
    # 9. Return the updated order/state
    return order

def admin_update_order_status(db: Session, order_id: int, new_status: str, admin_id: int) -> Order:
    from app.services import inventory_service
    
    # 1. Lock the order
    order = db.query(Order).filter(Order.id == order_id).with_for_update().first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    old_status = order.status
    
    if old_status == "cancelled":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot change status of a cancelled order")
        
    if new_status == old_status:
        return order
        
    # State machine rules
    if new_status == "confirmed":
        if old_status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot transition from {old_status} to confirmed")
        if order.payment_status != "captured":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot confirm order without captured payment")
            
        success = inventory_service.reserve_and_deduct_stock(db, order.items, order.id)
        if not success:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Insufficient stock to confirm order")
        order.status = "confirmed"
        
    elif new_status == "shipped":
        if old_status != "confirmed":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot transition from {old_status} to shipped")
        order.status = "shipped"
        
    elif new_status == "delivered":
        if old_status != "shipped":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot transition from {old_status} to delivered")
        order.status = "delivered"
        
    elif new_status == "cancelled":
        cancel_order_internal(db, order)
        
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported state transition to {new_status}")
        
    action_name = "ORDER_CANCELLED" if new_status == "cancelled" else "ORDER_STATUS_CHANGED"
    log_admin_action(
        db=db,
        admin_id=admin_id,
        action=action_name,
        entity_type="ORDER",
        entity_id=str(order.id),
        details={"old_status": old_status, "new_status": new_status}
    )
        
    db.commit()
    db.refresh(order)
    return order

def cancel_order_internal(db: Session, order: Order, adjustment_type: str = "ORDER_CANCELLATION"):
    """
    Cancels an order and restores inventory if needed.
    Does not commit the transaction, so it can be composed in larger atomic operations.
    Assumes the order is already locked.
    """
    from app.services import inventory_service
    
    if order.status == "cancelled":
        return # already cancelled
        
    if order.status in ["confirmed", "shipped", "delivered"]:
        inventory_service.restore_stock(db, order.items, order.id, adjustment_type)
        
    order.status = "cancelled"
