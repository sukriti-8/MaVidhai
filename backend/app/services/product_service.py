from decimal import Decimal
from typing import Tuple, List
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.product import Product
from app.models.category import Category

def get_products(
    db: Session,
    category: str | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    available: bool | None = None,
    page: int = 1,
    limit: int = 20
) -> Tuple[List[Product], int]:
    
    if min_price is not None and max_price is not None:
        if min_price > max_price:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="min_price cannot be greater than max_price"
            )

    stmt = select(Product)
    
    if category:
        stmt = stmt.join(Category, Product.category_id == Category.id).where(Category.slug == category)
        
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    
    if max_price is not None:
        stmt = stmt.where(Product.price <= max_price)
        
    if available is not None:
        stmt = stmt.where(Product.availability == available)
        
    # Count total matching products
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.execute(count_stmt).scalar_one()
    
    # Pagination & Deterministic Ordering
    stmt = stmt.order_by(Product.id.asc())
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)
    
    items = db.execute(stmt).scalars().all()
    
    return items, total
