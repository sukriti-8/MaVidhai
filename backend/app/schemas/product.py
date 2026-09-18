from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.category import CategoryResponse

class ProductCreate(BaseModel):
    category_id: int
    name: str = Field(..., min_length=1)
    slug: str = Field(..., min_length=1)
    price: Decimal = Field(..., gt=0)
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool = True
    stock: int = Field(0, ge=0)
    image_url: str | None = None

class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(None, min_length=1)
    slug: str | None = Field(None, min_length=1)
    price: Decimal | None = Field(None, gt=0)
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool | None = None
    # stock is specifically excluded here to enforce delta-based adjustments
    image_url: str | None = None

class ProductStockUpdate(BaseModel):
    delta: int
    reason: str

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
