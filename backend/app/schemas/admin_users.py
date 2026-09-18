from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

class UserAdminResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedUserResponse(BaseModel):
    items: List[UserAdminResponse]
    page: int
    limit: int
    total: int
    pages: int

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=100)
    email: Optional[EmailStr] = None

class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="Role must be one of the supported roles like CUSTOMER or SUPER_ADMIN")

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class CustomerIntelligenceResponse(BaseModel):
    user_id: int
    account_created_at: datetime
    first_order_date: Optional[datetime] = None
    last_order_date: Optional[datetime] = None
    total_orders: int
    lifetime_value: float
    average_order_value: float
