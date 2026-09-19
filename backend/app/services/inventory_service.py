from sqlalchemy.orm import Session
from app.models.product import Product
from app.models.order import OrderItem
from collections import defaultdict
from app.models.inventory_audit import InventoryAudit

def reserve_and_deduct_stock(db: Session, items: list[OrderItem], order_id: int | None = None) -> bool:
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
        prev_stock = product.stock
        product.stock -= required_qty
        
        audit = InventoryAudit(
            product_id=product.id,
            admin_id=None,
            order_id=order_id,
            adjustment_type="ORDER_RESERVATION",
            previous_stock=prev_stock,
            adjustment=-required_qty,
            new_stock=product.stock,
            reason=None
        )
        db.add(audit)
        
    return True

def restore_stock(db: Session, items: list[OrderItem], order_id: int | None = None, adjustment_type: str = "ORDER_CANCELLATION") -> None:
    """
    Restores stock for items in a cancelled order.
    Caller must handle transaction boundaries (commit/rollback).
    """
    restoration_quantities = defaultdict(int)
    for item in items:
        if item.product_id is not None:
            restoration_quantities[item.product_id] += item.quantity
            
    # Lock and update in sorted order to avoid deadlocks
    for product_id in sorted(restoration_quantities.keys()):
        required_qty = restoration_quantities[product_id]
        product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
        if product:
            prev_stock = product.stock
            product.stock += required_qty
            
            audit = InventoryAudit(
                product_id=product.id,
                admin_id=None,
                order_id=order_id,
                adjustment_type=adjustment_type,
                previous_stock=prev_stock,
                adjustment=required_qty,
                new_stock=product.stock,
                reason=None
            )
            db.add(audit)

def admin_adjust_stock(db: Session, product_id: int, delta: int, admin_id: int, reason: str) -> Product:
    """
    Adjusts the stock of a product by the given delta (positive or negative).
    Returns the updated Product if successful.
    Raises HTTPException if product not found or if resulting stock is negative.
    """
    from fastapi import HTTPException, status
    
    if delta == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Stock adjustment delta cannot be 0"
        )
        
    if not reason or not reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Reason is required for manual stock adjustments"
        )
    
    product = db.query(Product).filter(Product.id == product_id).with_for_update().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    new_stock = product.stock + delta
    if new_stock < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=f"Cannot reduce stock below 0. Current stock is {product.stock}"
        )
        
    prev_stock = product.stock
    product.stock = new_stock
    
    audit = InventoryAudit(
        product_id=product.id,
        admin_id=admin_id,
        order_id=None,
        adjustment_type="ADMIN_ADJUSTMENT",
        previous_stock=prev_stock,
        adjustment=delta,
        new_stock=product.stock,
        reason=reason.strip()
    )
    db.add(audit)
    
    return product

def admin_bulk_adjust_stock(db: Session, items: list, admin_id: int) -> dict:
    from fastapi import HTTPException, status
    
    # Validation Phase
    seen_products = set()
    for item in items:
        if item.product_id in seen_products:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate product_id {item.product_id} in bulk adjustment"
            )
        seen_products.add(item.product_id)
        
        if item.delta == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock adjustment delta cannot be 0 for product_id {item.product_id}"
            )
            
        if not item.reason or not item.reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Reason is required for product_id {item.product_id}"
            )
            
    # Deterministic Locking Phase
    sorted_items = sorted(items, key=lambda x: x.product_id)
    
    adjusted_products = []
    
    for item in sorted_items:
        product = db.query(Product).filter(Product.id == item.product_id).with_for_update().first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product_id {item.product_id} not found"
            )
            
        new_stock = product.stock + item.delta
        if new_stock < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reduce stock below 0 for product_id {item.product_id}. Current stock is {product.stock}"
            )
            
        prev_stock = product.stock
        product.stock = new_stock
        
        audit = InventoryAudit(
            product_id=product.id,
            admin_id=admin_id,
            order_id=None,
            adjustment_type="ADMIN_ADJUSTMENT",
            previous_stock=prev_stock,
            adjustment=item.delta,
            new_stock=product.stock,
            reason=item.reason.strip()
        )
        db.add(audit)
        
        adjusted_products.append(product)
        
    return {"message": f"Successfully adjusted {len(adjusted_products)} products"}

