from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, or_, func

from app.database.connection import get_db
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment
from app.schemas.admin_orders import (
    AdminOrderResponse,
    AdminOrderListResponse,
    AdminOrderStatusUpdate,
    AdminPaymentDetail,
    PaymentHistoryItem
)
from app.utils.dependencies import get_super_admin
from app.services import order_service
from datetime import date, timedelta

router = APIRouter(prefix="/api/admin/orders", tags=["admin_orders"])

def build_admin_order_response(order: Order) -> AdminOrderResponse:
    payment = None
    latest_payment = max(order.payments, key=lambda p: (p.created_at, p.id)) if order.payments else None
    if latest_payment:
        payment = AdminPaymentDetail(
            status=latest_payment.status,
            provider_order_id=latest_payment.provider_order_id,
            provider_payment_id=latest_payment.provider_payment_id,
            amount=float(latest_payment.amount)
        )
        
    payment_history = []
    sorted_payments = sorted(order.payments, key=lambda p: (p.created_at, p.id)) if order.payments else []
    for p in sorted_payments:
        payment_history.append(PaymentHistoryItem(
            status=p.status,
            provider_payment_id=p.provider_payment_id,
            amount=float(p.amount),
            timestamp=p.created_at
        ))
        
    resp = AdminOrderResponse.model_validate(order)
    resp.payment = payment
    resp.payment_history = payment_history
    return resp

@router.get("", response_model=AdminOrderListResponse)
def get_orders(
    search: Optional[str] = Query(None, min_length=1),
    status_filter: Optional[str] = Query(None, alias="status"),
    payment_status_filter: Optional[str] = Query(None, alias="payment_status"),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    min_amount: Optional[float] = Query(None, ge=0),
    max_amount: Optional[float] = Query(None, ge=0),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("desc"),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    if min_amount is not None and max_amount is not None and min_amount > max_amount:
        raise HTTPException(status_code=400, detail="min_amount cannot be greater than max_amount")
        
    query = select(Order)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(Order.shipping_email.ilike(search_term))
        
    if status_filter:
        query = query.where(Order.status == status_filter)
        
    if payment_status_filter:
        query = query.join(Order.payments).where(Payment.status == payment_status_filter)
        
    if start_date:
        query = query.where(Order.created_at >= start_date)
        
    if end_date:
        query = query.where(Order.created_at < end_date + timedelta(days=1))
        
    if min_amount is not None:
        query = query.where(Order.total_amount >= min_amount)
        
    if max_amount is not None:
        query = query.where(Order.total_amount <= max_amount)
        
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0
    
    if sort == "asc":
        query = query.order_by(Order.created_at.asc(), Order.id.asc())
    elif sort == "amount_desc":
        query = query.order_by(Order.total_amount.desc(), Order.id.desc())
    else:
        query = query.order_by(Order.created_at.desc(), Order.id.desc())
        
    query = query.offset((page - 1) * limit).limit(limit)
    orders = db.execute(query).scalars().all()
    
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    items = [build_admin_order_response(order) for order in orders]
    
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages
    }

@router.get("/{order_id}", response_model=AdminOrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    return build_admin_order_response(order)

@router.patch("/{order_id}/status", response_model=AdminOrderResponse)
def update_order_status(
    order_id: int,
    request: AdminOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    order = order_service.admin_update_order_status(db, order_id, request.status, current_admin.id)
    return build_admin_order_response(order)
