from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate
from app.services import cart_service

router = APIRouter(prefix="/api/cart", tags=["cart"])

@router.get("", response_model=CartResponse)
def get_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_service.get_cart(db, current_user.id)

@router.post("/items", response_model=CartResponse)
def add_cart_item(item_in: CartItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_service.add_item(db, current_user.id, item_in)

@router.patch("/items/{item_id}", response_model=CartResponse)
def update_cart_item(item_id: int, item_update: CartItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_service.update_item(db, current_user.id, item_id, item_update)

@router.delete("/items/{item_id}", response_model=CartResponse)
def remove_cart_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_service.remove_item(db, current_user.id, item_id)

@router.delete("", response_model=CartResponse)
def clear_cart(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return cart_service.clear_cart(db, current_user.id)
