from pydantic import BaseModel
from typing import List
from decimal import Decimal

class WishlistItemCreate(BaseModel):
    product_id: int

class WishlistProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    image_url: str | None = None
    
    class Config:
        from_attributes = True

class WishlistItemResponse(BaseModel):
    id: int
    product: WishlistProductResponse
    
    class Config:
        from_attributes = True

class WishlistResponse(BaseModel):
    items: List[WishlistItemResponse]
    count: int
