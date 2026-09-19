from sqlalchemy.orm import Session
from sqlalchemy import select, func, desc
from datetime import date

from app.models.product import Product
from app.models.order import Order
from app.models.payment import Payment
from app.models.admin_audit import AdminAudit
from app.services import analytics_service

LOW_STOCK_THRESHOLD = 10

def get_dashboard_v2(db: Session, start_date: date, end_date: date) -> dict:
    # 1. Period Metrics (reusing P2.1 analytics logic)
    # The analytics service returns DashboardResponse containing revenue, aov, orders, customers
    # We will grab those directly.
    analytics_data = analytics_service.get_dashboard_metrics(db, start_date, end_date)
    
    metrics = {
        "total_revenue": analytics_data["revenue"]["gross_captured"],
        "average_order_value": analytics_data["aov"],
        "total_orders": analytics_data["orders"]["total"],
        "new_customers": analytics_data["customers"]["new_customers"],
        "returning_customers": analytics_data["customers"]["customers_with_orders"] - analytics_data["customers"]["new_customers"]
    }
    
    # 2. Current inventory snapshot (Point-in-time)
    total_stock = db.execute(select(func.sum(Product.stock))).scalar() or 0
    low_stock_count = db.execute(
        select(func.count(Product.id)).where(Product.stock > 0, Product.stock <= LOW_STOCK_THRESHOLD)
    ).scalar() or 0
    out_of_stock_count = db.execute(
        select(func.count(Product.id)).where(Product.stock == 0)
    ).scalar() or 0
    
    inventory_summary = {
        "total_stock": total_stock,
        "low_stock_count": low_stock_count,
        "out_of_stock_count": out_of_stock_count
    }
    
    # 3. Recent orders (Latest 5, regardless of period)
    recent_orders_query = db.execute(
        select(Order).order_by(desc(Order.created_at), desc(Order.id)).limit(5)
    ).scalars().all()
    
    recent_orders = []
    for order in recent_orders_query:
        # Determine payment status
        # In a real scenario, this might need a join or relationship. Order has .payments
        # We can just get the latest payment or 'pending'
        payment_status = "pending"
        latest_payment = db.execute(
            select(Payment).where(Payment.order_id == order.id).order_by(desc(Payment.created_at)).limit(1)
        ).scalar_one_or_none()
        if latest_payment:
            payment_status = latest_payment.status

        recent_orders.append({
            "id": order.id,
            "order_number": order.order_number,
            "customer": order.shipping_full_name,
            "total_amount": float(order.total_amount),
            "order_status": order.status,
            "payment_status": payment_status,
            "created_at": order.created_at
        })
        
    # 4. Recent audits (Latest 5, regardless of period)
    recent_audits_query = db.execute(
        select(AdminAudit).order_by(desc(AdminAudit.created_at), desc(AdminAudit.id)).limit(5)
    ).scalars().all()
    
    recent_audits = []
    for audit in recent_audits_query:
        recent_audits.append({
            "id": audit.id,
            "admin_id": audit.admin_id,
            "action": audit.action,
            "entity_type": audit.entity_type,
            "entity_id": audit.entity_id,
            "created_at": audit.created_at
        })
        
    return {
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "metrics": metrics,
        "inventory_summary": inventory_summary,
        "recent_orders": recent_orders,
        "recent_audits": recent_audits
    }
