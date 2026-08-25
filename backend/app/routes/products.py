from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.connection import get_db
from app.models.product import Product
from app.schemas.product import ProductResponse

router = APIRouter(prefix="/api/products", tags=["products"])

@router.get(
    "",
    response_model=List[ProductResponse],
)
def get_products(db: Session = Depends(get_db)):
    stmt = select(Product)
    products = db.execute(stmt).scalars().all()
    return products

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
