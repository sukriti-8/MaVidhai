from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.connection import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse, PaginatedProductResponse
from app.services import product_service

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get(
    "",
    response_model=PaginatedProductResponse,
)
def get_products(
    category: str | None = None,
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    available: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, total = product_service.get_products(
        db=db,
        category=category,
        min_price=min_price,
        max_price=max_price,
        available=available,
        page=page,
        limit=limit
    )
    
    pages = (total + limit - 1) // limit if total > 0 else 0
    
    return {
        "items": items,
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages
    }

@router.get(
    "/{slug}",
    response_model=ProductResponse,
)
def get_product(slug: str, db: Session = Depends(get_db)):
    stmt = select(Product).where(Product.slug == slug)
    product = db.execute(stmt).scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
        
    return product
