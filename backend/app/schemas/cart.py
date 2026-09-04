from pydantic import BaseModel, Field
from typing import List
from decimal import Decimal

class CartItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1, le=100)

class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1, le=100)

class CartProductResponse(BaseModel):
    id: int
    name: str
    slug: str
    price: Decimal
    image_url: str | None = None
    
    class Config:
        from_attributes = True

class CartItemResponse(BaseModel):
    id: int
    quantity: int
    product: CartProductResponse
    subtotal: Decimal
    
    class Config:
        from_attributes = True

class CartResponse(BaseModel):
    items: List[CartItemResponse]
    item_count: int
    subtotal: Decimal
