from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from fastapi import HTTPException, status
from app.models.user import User
from app.models.order import Order
from app.models.payment import Payment

def get_customer_metrics(db: Session, user_id: int) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    payment_stats = db.query(
        func.count(func.distinct(Order.id)).label('total_orders'),
        func.sum(Payment.amount).label('lifetime_value'),
        func.min(Order.created_at).label('first_order_date'),
        func.max(Order.created_at).label('last_order_date')
    ).join(Order, Order.id == Payment.order_id)\
     .filter(Order.user_id == user_id, Payment.status == 'captured').first()
     
    total_orders = payment_stats.total_orders or 0
    lifetime_value = float(payment_stats.lifetime_value or 0.0)
    average_order_value = lifetime_value / total_orders if total_orders > 0 else 0.0
    
    return {
        "user_id": user_id,
        "account_created_at": user.created_at,
        "first_order_date": payment_stats.first_order_date,
        "last_order_date": payment_stats.last_order_date,
        "total_orders": total_orders,
        "lifetime_value": lifetime_value,
        "average_order_value": average_order_value
    }

def get_customer_orders(db: Session, user_id: int, page: int, limit: int) -> dict:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    query = select(Order).where(Order.user_id == user_id).order_by(desc(Order.created_at), desc(Order.id))
    
    count_query = select(func.count()).select_from(query.subquery())
    total = db.execute(count_query).scalar() or 0
    
    pages = (total + limit - 1) // limit
    orders = db.execute(query.offset((page - 1) * limit).limit(limit)).scalars().all()
    
    return {
        "items": orders,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }
