import math
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Any

from app.models.admin_audit import AdminAudit

def log_admin_action(
    db: Session,
    admin_id: int,
    action: str,
    entity_type: str,
    entity_id: str | int | None = None,
    details: dict[str, Any] | None = None
) -> AdminAudit:
    """
    Logs an administrative action to the admin_audits table.
    This should be called within the same database transaction as the business mutation.
    """
    audit = AdminAudit(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        details=details
    )
    db.add(audit)
    # Note: caller is responsible for calling db.commit() to ensure atomicity
    return audit

def get_audit_logs(
    db: Session,
    admin_id: int | None = None,
    action: str | None = None,
    entity_type: str | None = None,
    entity_id: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    page: int = 1,
    size: int = 50
) -> tuple[list[AdminAudit], int, int]:
    """
    Retrieves a paginated, chronological stream of security and administrative events.
    """
    query = db.query(AdminAudit)
    
    if admin_id is not None:
        query = query.filter(AdminAudit.admin_id == admin_id)
        
    if action is not None:
        query = query.filter(AdminAudit.action == action)
        
    if entity_type is not None:
        query = query.filter(AdminAudit.entity_type == entity_type)
        
    if entity_id is not None:
        query = query.filter(AdminAudit.entity_id == entity_id)
        
    if start_date is not None:
        query = query.filter(AdminAudit.created_at >= start_date)
        
    if end_date is not None:
        # Include the entire end_date by adding 1 day
        end_date_exclusive = end_date + timedelta(days=1)
        query = query.filter(AdminAudit.created_at < end_date_exclusive)
        
    total = query.count()
    pages = math.ceil(total / size) if total > 0 else 0
    
    query = query.order_by(desc(AdminAudit.created_at), desc(AdminAudit.id))
    items = query.offset((page - 1) * size).limit(size).all()
    
    return items, total, pages
