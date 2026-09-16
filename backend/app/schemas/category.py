from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CategoryCreate(BaseModel):
    name: str
    slug: str

class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    is_active: bool | None = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
