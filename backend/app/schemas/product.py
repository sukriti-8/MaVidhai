from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    price: Decimal
    description: str | None = None
    details: str | None = None
    material: str | None = None
    dimensions: str | None = None
    colour: str | None = None
    care: str | None = None
    badge: str | None = None
    availability: bool
    image_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedProductResponse(BaseModel):
    items: list[ProductResponse]
    page: int
    limit: int
    total: int
    pages: int
