from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator, Field

class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100)
    
    @field_validator('name', 'slug')
    @classmethod
    def strip_and_check_length(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 1:
            raise ValueError('must have at least 1 character')
        return v

class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(None, min_length=1, max_length=100)
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
