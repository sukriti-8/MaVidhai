from pydantic import BaseModel, Field, model_validator
from typing import List

class BulkAvailabilityRequest(BaseModel):
    product_ids: List[int] = Field(..., min_length=1, max_length=100)
    availability: bool
    
    @model_validator(mode='after')
    def validate_unique_ids(self) -> 'BulkAvailabilityRequest':
        if len(self.product_ids) != len(set(self.product_ids)):
            raise ValueError("Duplicate product IDs are not allowed")
        return self

class BulkCategoryRequest(BaseModel):
    product_ids: List[int] = Field(..., min_length=1, max_length=100)
    category_id: int
    
    @model_validator(mode='after')
    def validate_unique_ids(self) -> 'BulkCategoryRequest':
        if len(self.product_ids) != len(set(self.product_ids)):
            raise ValueError("Duplicate product IDs are not allowed")
        return self

class CatalogSummaryResponse(BaseModel):
    total_categories: int
    active_categories: int
    total_products: int
    active_products: int
    products_without_category: int
