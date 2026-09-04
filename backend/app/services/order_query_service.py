from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Tuple, List
from app.models.order import Order
from app.models.user import User

def get_user_orders(db: Session, user: User, page: int = 1, limit: int = 20) -> Tuple[List[Order], int]:
    offset = (page - 1) * limit
    
    # Query orders belonging to current user
    query = db.query(Order).filter(Order.user_id == user.id)
    
    # Get total count for pagination
    total = query.count()
    
    # Order by newest first (created_at DESC, id DESC as tiebreaker)
    orders = query.order_by(Order.created_at.desc(), Order.id.desc()).offset(offset).limit(limit).all()
    
    return orders, total

def get_user_order_by_number(db: Session, user: User, order_number: str) -> Order:
    order = db.query(Order).filter(
        Order.order_number == order_number,
        Order.user_id == user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
        
    # Get latest payment status
    from app.models.payment import Payment
    latest_payment = db.query(Payment).filter(
        Payment.order_id == order.id
    ).order_by(Payment.created_at.desc()).first()
    
    order.payment_status = latest_payment.status if latest_payment else "pending"
        
    return order
