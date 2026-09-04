from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Optional
import math
from app.database.connection import get_db
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse
from app.services import order_service, order_query_service

router = APIRouter(prefix="/api/orders", tags=["Orders"])

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return order_service.create_order(db=db, user=current_user, order_data=order_data)

@router.get("", response_model=OrderListResponse)
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    orders, total = order_query_service.get_user_orders(db=db, user=current_user, page=page, limit=limit)
    pages = math.ceil(total / limit) if total > 0 else 1
    
    return {
        "items": orders,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages
    }

@router.get("/{order_number}", response_model=OrderResponse)
def get_order(
    order_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return order_query_service.get_user_order_by_number(db=db, user=current_user, order_number=order_number)

