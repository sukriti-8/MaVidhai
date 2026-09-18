from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from app.database.connection import get_db
from app.models.user import User
from app.schemas.admin_users import (
    UserAdminResponse,
    PaginatedUserResponse,
    UserUpdateRequest,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
    CustomerIntelligenceResponse
)
from app.schemas.admin_orders import AdminOrderListResponse
from app.routes.admin_orders import build_admin_order_response
from app.utils.dependencies import get_super_admin
from app.services import customer_intelligence_service
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/api/admin/users", tags=["admin_users"])

VALID_ROLES = ["CUSTOMER", "SUPER_ADMIN"]

@router.get("", response_model=PaginatedUserResponse)
def get_users(
    search: Optional[str] = Query(None, min_length=1),
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    query = select(User)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                User.full_name.ilike(search_term),
                User.email.ilike(search_term)
            )
        )
        
    if role:
        query = query.where(User.role == role)
        
    if is_active is not None:
        query = query.where(User.is_active == is_active)
        
    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0
    
    # Pagination
    query = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit)
    items = db.execute(query).scalars().all()
    
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages
    }

@router.get("/{user_id}", response_model=UserAdminResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserAdminResponse)
def update_user(
    user_id: int,
    request: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if request.email and request.email.lower() != user.email:
        normalized_email = request.email.lower()
        stmt = select(User).where(User.email == normalized_email)
        existing = db.execute(stmt).scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already in use",
            )
        user.email = normalized_email
        
    if request.full_name:
        user.full_name = request.full_name
        
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="USER_UPDATED",
        entity_type="USER",
        entity_id=str(user.id),
        details={"request": request.model_dump(exclude_unset=True)}
    )
        
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/role", response_model=UserAdminResponse)
def update_user_role(
    user_id: int,
    request: UserRoleUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    if request.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role specified")
        
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id and request.role != "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="Cannot demote yourself")
        
    user.role = request.role
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="USER_ROLE_CHANGED",
        entity_type="USER",
        entity_id=str(user.id),
        details={"role": request.role}
    )
    
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/status", response_model=UserAdminResponse)
def update_user_status(
    user_id: int,
    request: UserStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_admin.id and request.is_active is False:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")
        
    user.is_active = request.is_active
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="USER_STATUS_CHANGED",
        entity_type="USER",
        entity_id=str(user.id),
        details={"is_active": request.is_active}
    )
    
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}/intelligence", response_model=CustomerIntelligenceResponse)
def get_user_intelligence(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    return customer_intelligence_service.get_customer_metrics(db, user_id)

@router.get("/{user_id}/orders", response_model=AdminOrderListResponse)
def get_user_orders(
    user_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    result = customer_intelligence_service.get_customer_orders(db, user_id, page, limit)
    result["items"] = [build_admin_order_response(order) for order in result["items"]]
    return result
