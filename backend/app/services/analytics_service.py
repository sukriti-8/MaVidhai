from sqlalchemy.orm import Session
from sqlalchemy import func, case, select, desc
from datetime import date, datetime, timedelta
from typing import List, Tuple
from app.models.order import Order, OrderItem
from app.models.payment import Payment, PaymentRefund
from app.models.product import Product
from app.models.user import User

def _get_datetime_bounds(start_date: date | None, end_date: date | None) -> Tuple[datetime, datetime]:
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    # Inclusive of the entire end_date (i.e. < end_date + 1 day)
    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(end_date + timedelta(days=1), datetime.min.time())
    
    return start_dt, end_dt

def get_dashboard_metrics(db: Session, start_date: date | None = None, end_date: date | None = None) -> dict:
    start_dt, end_dt = _get_datetime_bounds(start_date, end_date)
    
    # 1. Revenue
    gross_captured_query = db.query(func.sum(Payment.amount)).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).scalar()
    gross_captured = float(gross_captured_query) if gross_captured_query else 0.0

    completed_refunds_query = db.query(func.sum(PaymentRefund.amount)).filter(
        PaymentRefund.status == 'processed',
        PaymentRefund.created_at >= start_dt,
        PaymentRefund.created_at < end_dt
    ).scalar()
    refunded = float(completed_refunds_query) if completed_refunds_query else 0.0

    net = gross_captured - refunded

    # 2. Orders
    order_stats = db.query(
        func.count(Order.id).label('total'),
        func.sum(case((Order.status == 'cancelled', 1), else_=0)).label('cancelled'),
        func.sum(case((Order.status == 'inventory_conflict', 1), else_=0)).label('inventory_conflict')
    ).filter(
        Order.created_at >= start_dt,
        Order.created_at < end_dt
    ).first()

    total_orders = int(order_stats.total) if order_stats and order_stats.total else 0
    cancelled_orders = int(order_stats.cancelled) if order_stats and order_stats.cancelled else 0
    inventory_conflict_orders = int(order_stats.inventory_conflict) if order_stats and order_stats.inventory_conflict else 0

    captured_orders_query = db.query(func.count(func.distinct(Payment.order_id))).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).scalar()
    captured_orders = int(captured_orders_query) if captured_orders_query else 0

    # AOV
    aov = gross_captured / captured_orders if captured_orders > 0 else 0.0

    # 3. Customers
    customers_with_orders = db.query(func.count(func.distinct(Order.user_id))).filter(
        Order.created_at >= start_dt,
        Order.created_at < end_dt
    ).scalar()

    new_customers = db.query(func.count(User.id)).filter(
        User.created_at >= start_dt,
        User.created_at < end_dt
    ).scalar()

    # 4. Refunds
    refund_counts = db.query(
        func.sum(case((PaymentRefund.status == 'processed', 1), else_=0)).label('completed_count'),
        func.sum(case((PaymentRefund.status == 'pending', 1), else_=0)).label('pending_count')
    ).filter(
        PaymentRefund.created_at >= start_dt,
        PaymentRefund.created_at < end_dt
    ).first()

    completed_refund_count = int(refund_counts.completed_count) if refund_counts and refund_counts.completed_count else 0
    pending_refund_count = int(refund_counts.pending_count) if refund_counts and refund_counts.pending_count else 0

    # 5. Inventory (Current state, not period-dependent)
    inventory_stats = db.query(
        func.sum(case(((Product.stock <= 10) & (Product.stock > 0), 1), else_=0)).label('low_stock'),
        func.sum(case((Product.stock == 0, 1), else_=0)).label('out_of_stock')
    ).first()
    
    low_stock = int(inventory_stats.low_stock) if inventory_stats and inventory_stats.low_stock else 0
    out_of_stock = int(inventory_stats.out_of_stock) if inventory_stats and inventory_stats.out_of_stock else 0

    return {
        "period": {
            "start_date": start_dt.date(),
            "end_date": (end_dt - timedelta(days=1)).date()
        },
        "revenue": {
            "gross_captured": gross_captured,
            "refunded": refunded,
            "net": net
        },
        "orders": {
            "total": total_orders,
            "captured": captured_orders,
            "cancelled": cancelled_orders,
            "inventory_conflict": inventory_conflict_orders
        },
        "customers": {
            "customers_with_orders": customers_with_orders or 0,
            "new_customers": new_customers or 0
        },
        "refunds": {
            "completed_count": completed_refund_count,
            "completed_amount": refunded,
            "pending_count": pending_refund_count
        },
        "aov": aov,
        "inventory": {
            "low_stock": low_stock,
            "out_of_stock": out_of_stock
        }
    }

def _get_group_by_date_expr(db: Session, column, interval: str):
    dialect = db.bind.dialect.name
    
    # We want format: YYYY-MM-DD
    # For day: %Y-%m-%d
    # For week: %Y-%W (SQLite doesn't directly support week trunc to first day natively easily, so we might just return the week number or group by week but return a string)
    # Actually, for week/month, we can just truncate. Let's use string manipulation or standard date functions.
    # To keep it simple and perfectly database agnostic, we can just group by DAY in the DB and then aggregate in Python for week/month. Or use dialect specific SQL.
    
    if dialect == 'sqlite':
        if interval == 'day':
            return func.strftime('%Y-%m-%d', column)
        elif interval == 'month':
            return func.strftime('%Y-%m', column)
        elif interval == 'week':
            # SQLite %W is week of year. We can group by year-week
            return func.strftime('%Y-%W', column)
    elif dialect == 'postgresql':
        if interval == 'day':
            return func.to_char(column, 'YYYY-MM-DD')
        elif interval == 'month':
            return func.to_char(column, 'YYYY-MM')
        elif interval == 'week':
            return func.to_char(func.date_trunc('week', column), 'YYYY-MM-DD')
    
    # Fallback to day if not matching exactly
    return func.strftime('%Y-%m-%d', column) if dialect == 'sqlite' else func.to_char(column, 'YYYY-MM-DD')

def get_revenue_timeseries(db: Session, interval: str, start_date: date | None = None, end_date: date | None = None) -> dict:
    start_dt, end_dt = _get_datetime_bounds(start_date, end_date)
    
    date_expr = _get_group_by_date_expr(db, Payment.created_at, interval)
    
    results = db.query(
        date_expr.label('date_group'),
        func.sum(Payment.amount).label('revenue'),
        func.count(func.distinct(Payment.order_id)).label('orders_count')
    ).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).group_by('date_group').order_by('date_group').all()
    
    data = []
    for r in results:
        data.append({
            "date": str(r.date_group),
            "revenue": float(r.revenue or 0),
            "orders_count": int(r.orders_count or 0)
        })
        
    return {
        "period": {
            "start_date": start_dt.date(),
            "end_date": (end_dt - timedelta(days=1)).date()
        },
        "interval": interval,
        "data": data
    }

def get_product_analytics(db: Session, start_date: date | None = None, end_date: date | None = None, limit: int = 10) -> dict:
    start_dt, end_dt = _get_datetime_bounds(start_date, end_date)
    
    # Base query for product performance linking Product -> OrderItem -> Order
    # We want products ordered in this period.
    base_perf = db.query(
        Product.id,
        Product.name,
        func.coalesce(func.sum(OrderItem.quantity), 0).label('qty'),
        func.coalesce(func.sum(OrderItem.subtotal), 0).label('rev'),
        func.count(func.distinct(Order.id)).label('orders')
    ).select_from(Product).outerjoin(
        OrderItem, Product.id == OrderItem.product_id
    ).outerjoin(
        Order, (OrderItem.order_id == Order.id) & (Order.created_at >= start_dt) & (Order.created_at < end_dt)
    ).group_by(Product.id, Product.name)
    
    # Top by quantity
    top_qty = base_perf.having(func.sum(OrderItem.quantity) > 0).order_by(desc('qty')).limit(limit).all()
    top_qty_list = [
        {"product_id": r.id, "product_name": r.name, "quantity_sold": int(r.qty or 0), "revenue_generated": float(r.rev or 0), "order_count": int(r.orders or 0)}
        for r in top_qty
    ]
    
    # Top by revenue
    top_rev = base_perf.having(func.sum(OrderItem.subtotal) > 0).order_by(desc('rev')).limit(limit).all()
    top_rev_list = [
        {"product_id": r.id, "product_name": r.name, "quantity_sold": int(r.qty or 0), "revenue_generated": float(r.rev or 0), "order_count": int(r.orders or 0)}
        for r in top_rev
    ]
    
    # Lowest sellers (lowest quantity, including 0)
    lowest = base_perf.order_by('qty').limit(limit).all()
    lowest_list = [
        {"product_id": r.id, "product_name": r.name, "quantity_sold": int(r.qty or 0), "revenue_generated": float(r.rev or 0), "order_count": int(r.orders or 0)}
        for r in lowest
    ]
    
    # Problematic Products
    # inventory_conflict_count from Orders, cancellation_count from cancelled orders
    problem_query = db.query(
        Product.id,
        Product.name,
        func.sum(case((Order.status == 'inventory_conflict', 1), else_=0)).label('conflicts'),
        func.sum(case((Order.status == 'cancelled', 1), else_=0)).label('cancels')
    ).select_from(Product).join(
        OrderItem, Product.id == OrderItem.product_id
    ).join(
        Order, OrderItem.order_id == Order.id
    ).filter(
        Order.created_at >= start_dt,
        Order.created_at < end_dt,
        Order.status.in_(['inventory_conflict', 'cancelled'])
    ).group_by(Product.id, Product.name).having(
        (func.sum(case((Order.status == 'inventory_conflict', 1), else_=0)) > 0) |
        (func.sum(case((Order.status == 'cancelled', 1), else_=0)) > 0)
    ).order_by(desc('conflicts'), desc('cancels')).limit(limit).all()

    prob_list = [
        {"product_id": r.id, "product_name": r.name, "inventory_conflict_count": int(r.conflicts or 0), "cancellation_count": int(r.cancels or 0)}
        for r in problem_query
    ]

    return {
        "top_by_quantity": top_qty_list,
        "top_by_revenue": top_rev_list,
        "lowest_sellers": lowest_list,
        "problematic_products": prob_list
    }

def get_customer_analytics(db: Session, start_date: date | None = None, end_date: date | None = None, limit: int = 10) -> dict:
    start_dt, end_dt = _get_datetime_bounds(start_date, end_date)
    
    new_customers = db.query(func.count(User.id)).filter(
        User.created_at >= start_dt,
        User.created_at < end_dt
    ).scalar() or 0

    # Customers with orders in period
    period_buyers = db.query(func.distinct(Order.user_id).label('user_id')).filter(
        Order.created_at >= start_dt,
        Order.created_at < end_dt
    ).subquery()
    
    # Returning customers: those in period_buyers whose User.created_at < start_dt
    returning_customers = db.query(func.count(User.id)).join(
        period_buyers, User.id == period_buyers.c.user_id
    ).filter(
        User.created_at < start_dt
    ).scalar() or 0

    # Top customers by period revenue (captured payments)
    top_cust_query = db.query(
        User.id,
        User.email,
        User.full_name,
        func.sum(Payment.amount).label('rev'),
        func.count(func.distinct(Order.id)).label('orders_count')
    ).select_from(User).join(
        Order, User.id == Order.user_id
    ).join(
        Payment, Order.id == Payment.order_id
    ).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).group_by(User.id, User.email, User.full_name).order_by(desc('rev')).limit(limit).all()

    top_list = [
        {"user_id": r.id, "email": r.email, "full_name": r.full_name, "period_revenue": float(r.rev or 0), "orders_count": int(r.orders_count or 0)}
        for r in top_cust_query
    ]

    # Global AOV for period
    total_rev_query = db.query(func.sum(Payment.amount)).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).scalar()
    
    total_captured_orders_query = db.query(func.count(func.distinct(Payment.order_id))).filter(
        Payment.status == 'captured',
        Payment.created_at >= start_dt,
        Payment.created_at < end_dt
    ).scalar()
    
    total_rev = float(total_rev_query or 0)
    total_orders = int(total_captured_orders_query or 0)
    aov = total_rev / total_orders if total_orders > 0 else 0.0

    return {
        "new_customers": new_customers,
        "returning_customers": returning_customers,
        "top_customers_by_period_revenue": top_list,
        "average_order_value": aov
    }
