from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict

class ProductResponse(BaseModel):
    id: int
    category_id: int
    name: str
    slug: str
    description: str | None
    price: Decimal
    material: str | None
    dimensions: str | None
    availability: bool
    image_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
