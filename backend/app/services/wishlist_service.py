from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException
from app.models.wishlist import Wishlist, WishlistItem
from app.models.product import Product
from app.schemas.wishlist import WishlistItemCreate, WishlistResponse, WishlistItemResponse, WishlistProductResponse

def _build_wishlist_response(wishlist: Wishlist) -> WishlistResponse:
    items_response = []
    count = 0
    for item in wishlist.items:
        items_response.append(WishlistItemResponse(
            id=item.id,
            product=WishlistProductResponse.model_validate(item.product)
        ))
        count += 1
        
    return WishlistResponse(items=items_response, count=count)

def get_or_create_wishlist(db: Session, user_id: int) -> Wishlist:
    wishlist = db.execute(select(Wishlist).where(Wishlist.user_id == user_id)).scalar_one_or_none()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)
    return wishlist

def get_wishlist(db: Session, user_id: int) -> WishlistResponse:
    wishlist = get_or_create_wishlist(db, user_id)
    return _build_wishlist_response(wishlist)

def add_item(db: Session, user_id: int, item_in: WishlistItemCreate) -> WishlistResponse:
    wishlist = get_or_create_wishlist(db, user_id)
    
    product = db.execute(select(Product).where(Product.id == item_in.product_id)).scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    wishlist_item = db.execute(
        select(WishlistItem).where(WishlistItem.wishlist_id == wishlist.id, WishlistItem.product_id == item_in.product_id)
    ).scalar_one_or_none()
    
    if not wishlist_item:
        wishlist_item = WishlistItem(wishlist_id=wishlist.id, product_id=item_in.product_id)
        db.add(wishlist_item)
        db.commit()
        db.refresh(wishlist)
        
    return _build_wishlist_response(wishlist)

def remove_item(db: Session, user_id: int, item_id: int) -> WishlistResponse:
    wishlist = get_or_create_wishlist(db, user_id)
    wishlist_item = db.execute(
        select(WishlistItem).where(WishlistItem.id == item_id, WishlistItem.wishlist_id == wishlist.id)
    ).scalar_one_or_none()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Wishlist item not found")
        
    db.delete(wishlist_item)
    db.commit()
    db.refresh(wishlist)
    return _build_wishlist_response(wishlist)

def clear_wishlist(db: Session, user_id: int) -> WishlistResponse:
    wishlist = get_or_create_wishlist(db, user_id)
    for item in wishlist.items:
        db.delete(item)
    db.commit()
    db.refresh(wishlist)
    return _build_wishlist_response(wishlist)
