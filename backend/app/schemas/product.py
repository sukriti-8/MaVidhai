from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.category import CategoryResponse
class ProductCreate(BaseModel):
    category_id: int
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=200)
    price: Decimal | None = Field(None, gt=0)
    mrp: Decimal | None = Field(None, gt=0)
    description: str | None = Field(None, max_length=5000)
    details: str | None = Field(None, max_length=2000)
    material: str | None = Field(None, max_length=500)
    dimensions: str | None = Field(None, max_length=500)
    colour: str | None = Field(None, max_length=100)
    care: str | None = Field(None, max_length=1000)
    badge: str | None = Field(None, max_length=100)
    availability: bool = True
    is_active: bool = True
    show_in_catalogue: bool = True
    stock: int = Field(0, ge=0)
    image_url: str | None = None
    images: list[str] | None = Field(None, max_length=10)

class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(None, min_length=1, max_length=200)
    slug: str | None = Field(None, min_length=1, max_length=200)
    price: Decimal | None = Field(None, gt=0)
    mrp: Decimal | None = Field(None, gt=0)
    description: str | None = Field(None, max_length=5000)
    details: str | None = Field(None, max_length=2000)
    material: str | None = Field(None, max_length=500)
    dimensions: str | None = Field(None, max_length=500)
    colour: str | None = Field(None, max_length=100)
    care: str | None = Field(None, max_length=1000)
    badge: str | None = Field(None, max_length=100)
    availability: bool | None = None
    is_active: bool | None = None
    show_in_catalogue: bool | None = None
# stock is specifically excluded here to enforce delta-based adjustments
    image_url: str | None = None
    images: list[str] | None = Field(None, max_length=10)

class ProductStockUpdate(BaseModel):
    delta: int
    reason: str

class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    price: Decimal | None = None
    mrp: Decimal | None = None
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool
    is_active: bool
    show_in_catalogue: bool
    stock: int
    image_url: str | None = None
    images: list[str] | None = None

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