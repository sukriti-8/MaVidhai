from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any

class AdminAuditBase(BaseModel):
    action: str
    entity_type: str
    entity_id: str | None = None
    details: dict[str, Any] | None = None

class AdminAuditCreate(AdminAuditBase):
    admin_id: int

class AdminAuditResponse(AdminAuditBase):
    id: int
    admin_id: int
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedAdminAuditResponse(BaseModel):
    items: list[AdminAuditResponse]
    total: int
    page: int
    size: int
    pages: int
