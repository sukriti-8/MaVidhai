from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict
from app.schemas.category import CategoryResponse

class ProductCreate(BaseModel):
    category_id: int
    name: str
    slug: str
    price: Decimal
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool = True
    stock: int = 0
    image_url: str | None = None

class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = None
    slug: str | None = None
    price: Decimal | None = None
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool | None = None
    stock: int | None = None
    image_url: str | None = None

class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    price: Decimal
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool
    stock: int
    image_url: str | None = None
    
    category: CategoryResponse | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedProductResponse(BaseModel):
    items: list[ProductResponse]
    page: int
    limit: int
    total: int
    pages: int
