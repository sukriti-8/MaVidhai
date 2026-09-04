from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.wishlist import WishlistResponse, WishlistItemCreate
from app.services import wishlist_service

router = APIRouter(prefix="/api/wishlist", tags=["wishlist"])

@router.get("", response_model=WishlistResponse)
def get_wishlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return wishlist_service.get_wishlist(db, current_user.id)

@router.post("/items", response_model=WishlistResponse)
def add_wishlist_item(item_in: WishlistItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return wishlist_service.add_item(db, current_user.id, item_in)

@router.delete("/items/{item_id}", response_model=WishlistResponse)
def remove_wishlist_item(item_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return wishlist_service.remove_item(db, current_user.id, item_id)

@router.delete("", response_model=WishlistResponse)
def clear_wishlist(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return wishlist_service.clear_wishlist(db, current_user.id)
