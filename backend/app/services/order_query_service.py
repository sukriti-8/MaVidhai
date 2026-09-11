from sqlalchemy.orm import Session, selectinload
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

    # Eagerly load items and payments so that the items_count and
    # payment_status properties don't trigger N+1 queries during serialization.
    orders = (
        query
        .options(selectinload(Order.items), selectinload(Order.payments))
        .order_by(Order.created_at.desc(), Order.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

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
        
    return order
