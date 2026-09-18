from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select, func, or_
from app.database.connection import get_db
from app.models.payment import Payment
from app.models.order import Order
from app.models.user import User
from app.utils.dependencies import get_super_admin
from app.schemas.admin_payments import (
    AdminPaymentResponse,
    PaginatedAdminPaymentResponse,
    PaymentReconciliationResponse,
    PaymentStatus,
    AdminRefundResponse,
    AdminRefundRecoveryResponse
)

router = APIRouter(prefix="/api/admin/payments", tags=["admin_payments"])

@router.get(
    "/reconciliation",
    response_model=List[PaymentReconciliationResponse]
)
def get_payment_reconciliation(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    """
    Identifies payments requiring internal attention.
    Specifically flags:
    1. Captured payments on inventory_conflict orders.
    2. Captured payments on cancelled orders.
    """
    reconciliation_results = []
    
    # Base query for captured payments
    base_stmt = select(Payment).join(Order).options(selectinload(Payment.order)).where(
        Payment.status == "captured"
    )
    
    # 1. Captured + inventory_conflict
    conflict_stmt = base_stmt.where(Order.status == "inventory_conflict")
    conflict_payments = db.execute(conflict_stmt).scalars().all()
    
    for payment in conflict_payments:
        reconciliation_results.append(PaymentReconciliationResponse(
            payment_id=payment.id,
            order_id=payment.order_id,
            payment_status=payment.status,
            order_status=payment.order.status,
            reason="CAPTURED_PAYMENT_WITH_INVENTORY_CONFLICT",
            action_required="REFUND"
        ))
        
    # 2. Captured + cancelled
    cancelled_stmt = base_stmt.where(Order.status == "cancelled")
    cancelled_payments = db.execute(cancelled_stmt).scalars().all()
    
    for payment in cancelled_payments:
        reconciliation_results.append(PaymentReconciliationResponse(
            payment_id=payment.id,
            order_id=payment.order_id,
            payment_status=payment.status,
            order_status=payment.order.status,
            reason="CAPTURED_PAYMENT_WITH_CANCELLED_ORDER",
            action_required="REFUND"
        ))
        
    return reconciliation_results

@router.get(
    "",
    response_model=PaginatedAdminPaymentResponse
)
def get_admin_payments(
    status: PaymentStatus | None = None,
    provider_order_id: str | None = None,
    provider_payment_id: str | None = None,
    order_number: str | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    stmt = select(Payment).join(Order).options(selectinload(Payment.order))
    
    if status:
        stmt = stmt.where(Payment.status == status)
        
    if provider_order_id:
        search_term = f"%{provider_order_id.strip()}%"
        stmt = stmt.where(Payment.provider_order_id.ilike(search_term))
        
    if provider_payment_id:
        search_term = f"%{provider_payment_id.strip()}%"
        stmt = stmt.where(Payment.provider_payment_id.ilike(search_term))
        
    if order_number:
        search_term = f"%{order_number.strip()}%"
        stmt = stmt.where(Order.order_number.ilike(search_term))
        
    # Count total
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()
    
    # Pagination & Ordering
    stmt = stmt.order_by(Payment.created_at.desc(), Payment.id.desc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)
    
    items = db.execute(stmt).scalars().all()
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages
    }

@router.get(
    "/{payment_id}",
    response_model=AdminPaymentResponse
)
def get_admin_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    stmt = select(Payment).options(selectinload(Payment.order)).where(Payment.id == payment_id)
    payment = db.execute(stmt).scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    return payment

@router.post(
    "/{payment_id}/refund",
    response_model=AdminRefundResponse
)
def refund_admin_payment(
    payment_id: int,
    current_admin: User = Depends(get_super_admin)
):
    from app.services.payment_service import admin_refund_payment
    return admin_refund_payment(payment_id, current_admin)

@router.post(
    "/{payment_id}/refund/recover",
    response_model=AdminRefundRecoveryResponse
)
def recover_admin_payment_refund(
    payment_id: int,
    current_admin: User = Depends(get_super_admin)
):
    from app.services.payment_service import recover_admin_refund
    return recover_admin_refund(payment_id, current_admin)
