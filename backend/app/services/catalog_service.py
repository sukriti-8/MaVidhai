from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status
from app.models.product import Product
from app.models.category import Category
from app.services.audit_service import log_admin_action

def bulk_update_availability(db: Session, product_ids: list[int], availability: bool, admin_id: int):
    # Sort for deterministic locking
    sorted_ids = sorted(product_ids)
    
    # Lock the products
    stmt = select(Product).where(Product.id.in_(sorted_ids)).with_for_update()
    products = db.execute(stmt).scalars().all()
    
    if len(products) != len(sorted_ids):
        # We need to rollback, though with_for_update inside a failed validation doesn't commit anyway
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more products not found")
        
    for product in products:
        product.availability = availability
        
    log_admin_action(
        db=db,
        admin_id=admin_id,
        action="PRODUCT_BULK_AVAILABILITY_UPDATE",
        entity_type="PRODUCT",
        details={
            "batch_size": len(products),
            "product_ids": sorted_ids,
            "availability": availability
        }
    )
        
    db.commit()
    return products

def bulk_update_category(db: Session, product_ids: list[int], category_id: int, admin_id: int):
    # 1. Validate category
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    if not category.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot assign products to inactive category")
        
    # 2. Sort and Lock
    sorted_ids = sorted(product_ids)
    stmt = select(Product).where(Product.id.in_(sorted_ids)).with_for_update()
    products = db.execute(stmt).scalars().all()
    
    if len(products) != len(sorted_ids):
        db.rollback()
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more products not found")
        
    for product in products:
        product.category_id = category_id
        
    log_admin_action(
        db=db,
        admin_id=admin_id,
        action="PRODUCT_BULK_CATEGORY_UPDATE",
        entity_type="PRODUCT",
        details={
            "batch_size": len(products),
            "product_ids": sorted_ids,
            "category_id": category_id
        }
    )
        
    db.commit()
    return products

def get_catalog_summary(db: Session) -> dict:
    total_categories = db.execute(select(func.count(Category.id))).scalar() or 0
    active_categories = db.execute(select(func.count(Category.id)).where(Category.is_active == True)).scalar() or 0
    
    total_products = db.execute(select(func.count(Product.id))).scalar() or 0
    active_products = db.execute(select(func.count(Product.id)).where(Product.availability == True)).scalar() or 0
    
    products_without_category = db.execute(select(func.count(Product.id)).where(Product.category_id.is_(None))).scalar() or 0
    
    return {
        "total_categories": total_categories,
        "active_categories": active_categories,
        "total_products": total_products,
        "active_products": active_products,
        "products_without_category": products_without_category
    }
