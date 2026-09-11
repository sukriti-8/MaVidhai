from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.order import OrderItem
from collections import defaultdict

def reserve_and_deduct_stock(db: Session, items: list[OrderItem]) -> bool:
    """
    Attempts to atomically lock, validate, and deduct stock for all items.
    Returns True if successful (stock deducted).
    Returns False if any product is missing or lacks stock (zero deduction).
    
    WARNING: Caller must handle transaction boundaries (commit/rollback).
    """
    # 1. Aggregate required quantities per product ID to handle duplicates safely
    required_quantities = defaultdict(int)
    for item in items:
        required_quantities[item.product_id] += item.quantity
        
    locked_products = {}
    conflict_found = False
    
    # 2. Lock and validate aggregate quantities
    # Sorting product_ids prevents deadlocks if multiple transactions lock the same products.
    # Filter out None product_ids (happens if ON DELETE SET NULL occurred) which are guaranteed conflicts.
    valid_product_ids = [pid for pid in required_quantities.keys() if pid is not None]
    
    if len(valid_product_ids) < len(required_quantities):
        # A product_id was None
        conflict_found = True
        
    for product_id in sorted(valid_product_ids):
        required_qty = required_quantities[product_id]
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
        
        if not product or product.stock < required_qty:
            conflict_found = True
        else:
            locked_products[product_id] = product
            
    # 3. Branch: Conflict -> No mutation
    if conflict_found:
        return False
        
    # 4. Branch: Success -> Deduct aggregate quantities
    for product_id, required_qty in required_quantities.items():
        product = locked_products[product_id]
        product.stock -= required_qty
        
    return True
