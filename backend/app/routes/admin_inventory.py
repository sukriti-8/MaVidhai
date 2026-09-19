from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.database.connection import get_db
from app.models.user import User
from app.models.product import Product
from app.models.category import Category
from app.models.inventory_audit import InventoryAudit
from app.utils.dependencies import get_super_admin
from app.schemas.admin_inventory import (
    PaginatedAdminInventoryProductResponse,
    PaginatedInventoryAuditResponse,
    AdminInventoryProductResponse,
    InventoryAuditResponse,
    BulkInventoryAdjustmentRequest,
    InventorySummaryResponse
)
from app.services.inventory_service import admin_bulk_adjust_stock
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/api/admin/inventory", tags=["admin_inventory"])

LOW_STOCK_THRESHOLD = 10

@router.get("", response_model=PaginatedAdminInventoryProductResponse)
def get_inventory(
    search: Optional[str] = None,
    category_slug: Optional[str] = None,
    low_stock: Optional[bool] = None,
    out_of_stock: Optional[bool] = None,
    availability: Optional[bool] = None,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    query = db.query(Product)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
        
    if category_slug:
        query = query.join(Category).filter(Category.slug == category_slug)
        
    if low_stock is True:
        query = query.filter(Product.stock <= LOW_STOCK_THRESHOLD, Product.stock > 0)
    elif low_stock is False:
        query = query.filter(Product.stock > LOW_STOCK_THRESHOLD)
        
    if out_of_stock is True:
        query = query.filter(Product.stock == 0)
    elif out_of_stock is False:
        query = query.filter(Product.stock > 0)
        
    if availability is not None:
        query = query.filter(Product.availability == availability)
        
    # Deterministic sorting
    query = query.order_by(Product.stock.asc(), Product.id.asc())
    
    total = query.count()
    products = query.offset((page - 1) * size).limit(size).all()
    
    items = []
    for p in products:
        items.append(AdminInventoryProductResponse(
            id=p.id,
            name=p.name,
            slug=p.slug,
            price=float(p.price),
            stock=p.stock,
            availability=p.availability,
            category_id=p.category_id,
            is_low_stock=p.stock <= LOW_STOCK_THRESHOLD and p.stock > 0,
            is_out_of_stock=p.stock == 0
        ))
        
    return PaginatedAdminInventoryProductResponse(
        items=items,
        total=total,
        page=page,
        size=size
    )

@router.get("/audit", response_model=PaginatedInventoryAuditResponse)
def get_inventory_audit(
    product_id: Optional[int] = None,
    admin_id: Optional[int] = None,
    adjustment_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    query = db.query(InventoryAudit)
    
    if product_id is not None:
        query = query.filter(InventoryAudit.product_id == product_id)
        
    if admin_id is not None:
        query = query.filter(InventoryAudit.admin_id == admin_id)
        
    if adjustment_type:
        query = query.filter(InventoryAudit.adjustment_type == adjustment_type)
        
    if start_date:
        query = query.filter(InventoryAudit.created_at >= start_date)
        
    if end_date:
        query = query.filter(InventoryAudit.created_at < end_date + timedelta(days=1))
        
    query = query.order_by(InventoryAudit.created_at.desc(), InventoryAudit.id.desc())
    
    total = query.count()
    audits = query.offset((page - 1) * size).limit(size).all()
    
    return PaginatedInventoryAuditResponse(
        items=[InventoryAuditResponse.model_validate(a) for a in audits],
        total=total,
        page=page,
        size=size
    )

@router.get("/summary", response_model=InventorySummaryResponse)
def get_inventory_summary(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    total_stock = db.query(func.sum(Product.stock)).scalar() or 0
    low_stock = db.query(Product).filter(Product.stock <= LOW_STOCK_THRESHOLD, Product.stock > 0).count()
    out_of_stock = db.query(Product).filter(Product.stock == 0).count()
    
    available = db.query(Product).filter(Product.availability == True).count()
    unavailable = db.query(Product).filter(Product.availability == False).count()
    
    return InventorySummaryResponse(
        total_stock=total_stock,
        low_stock_count=low_stock,
        out_of_stock_count=out_of_stock,
        availability_breakdown={"available": available, "unavailable": unavailable}
    )

@router.patch("/bulk-adjust")
def bulk_adjust_inventory(
    request: BulkInventoryAdjustmentRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin)
):
    result = admin_bulk_adjust_stock(db, request.items, current_admin.id)
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="INVENTORY_BULK_ADJUSTMENT",
        entity_type="INVENTORY",
        entity_id=None,
        details={
            "batch_size": len(request.items),
            "updated_count": result.get("updated_count")
        }
    )
    
    db.commit()
    return result
