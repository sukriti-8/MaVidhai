from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

class CategoryCreate(BaseModel):
    name: str
    slug: str
    
    @field_validator('name', 'slug')
    @classmethod
    def strip_and_check_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError('must have at least 1 character')
        return v

class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    is_active: bool | None = None
    
    @field_validator('name', 'slug')
    @classmethod
    def strip_and_check_length(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if len(v) < 1:
                raise ValueError('must have at least 1 character')
        return v

class CategoryResponse(BaseModel):
    id: int
    name: str
    slug: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
