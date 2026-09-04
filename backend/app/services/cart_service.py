from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from app.models.cart import Cart, CartItem
from app.models.product import Product
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartResponse, CartItemResponse, CartProductResponse

def _build_cart_response(cart: Cart) -> CartResponse:
    items_response = []
    item_count = 0
    subtotal = 0
    for item in cart.items:
        item_subtotal = item.product.price * item.quantity
        items_response.append(CartItemResponse(
            id=item.id,
            quantity=item.quantity,
            product=CartProductResponse.model_validate(item.product),
            subtotal=item_subtotal
        ))
        item_count += item.quantity
        subtotal += item_subtotal
        
    return CartResponse(items=items_response, item_count=item_count, subtotal=subtotal)

def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = db.execute(select(Cart).where(Cart.user_id == user_id)).scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
    return cart

def get_cart(db: Session, user_id: int) -> CartResponse:
    cart = get_or_create_cart(db, user_id)
    return _build_cart_response(cart)

def add_item(db: Session, user_id: int, item_in: CartItemCreate) -> CartResponse:
    cart = get_or_create_cart(db, user_id)
    
    product = db.execute(select(Product).where(Product.id == item_in.product_id)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if not product.availability:
        raise HTTPException(status_code=400, detail="Product is not available")
        
    cart_item = db.execute(
        select(CartItem).where(CartItem.cart_id == cart.id, CartItem.product_id == item_in.product_id)
    ).scalar_one_or_none()
    
    if cart_item:
        cart_item.quantity += item_in.quantity
        if cart_item.quantity > 100:
            cart_item.quantity = 100
    else:
        cart_item = CartItem(cart_id=cart.id, product_id=item_in.product_id, quantity=item_in.quantity)
        db.add(cart_item)
        
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)

def update_item(db: Session, user_id: int, item_id: int, item_update: CartItemUpdate) -> CartResponse:
    cart = get_or_create_cart(db, user_id)
    cart_item = db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    ).scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    cart_item.quantity = item_update.quantity
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)

def remove_item(db: Session, user_id: int, item_id: int) -> CartResponse:
    cart = get_or_create_cart(db, user_id)
    cart_item = db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    ).scalar_one_or_none()
    
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
        
    db.delete(cart_item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)

def clear_cart(db: Session, user_id: int) -> CartResponse:
    cart = get_or_create_cart(db, user_id)
    for item in cart.items:
        db.delete(item)
    db.commit()
    db.refresh(cart)
    return _build_cart_response(cart)
