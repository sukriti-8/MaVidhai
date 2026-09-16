from typing import List
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import select

from app.database.connection import get_db
from app.models.product import Product
from app.models.category import Category
from app.models.user import User
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, PaginatedProductResponse
from app.utils.dependencies import get_super_admin
from app.services import product_service

router = APIRouter(prefix="/api/admin/products", tags=["admin_products"])

@router.get(
    "",
    response_model=PaginatedProductResponse,
)
def get_admin_products(
    search: str | None = Query(None, min_length=1),
    category: str | None = None,
    min_price: Decimal | None = Query(None, ge=0),
    max_price: Decimal | None = Query(None, ge=0),
    available: bool | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    items, total = product_service.get_products(
        db=db,
        search=search,
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

@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product(
    request: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    stmt = select(Product).where(Product.slug == request.slug)
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Product slug already exists",
        )
        
    cat_stmt = select(Category).where(Category.id == request.category_id)
    if not db.execute(cat_stmt).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category not found",
        )
        
    product = Product(
        category_id=request.category_id,
        name=request.name,
        slug=request.slug,
        price=request.price,
        description=request.description,
        details=request.details,
        material=request.material,
        dimensions=request.dimensions,
        colour=request.colour,
        care=request.care,
        badge=request.badge,
        availability=request.availability,
        stock=request.stock,
        image_url=request.image_url,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    
    # Load category for response
    return db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product.id)).scalar_one()

@router.put(
    "/{product_id}",
    response_model=ProductResponse,
)
def update_product(
    product_id: int,
    request: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if request.slug is not None and request.slug != product.slug:
        stmt = select(Product).where(Product.slug == request.slug)
        if db.execute(stmt).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product slug already exists",
            )
            
    if request.category_id is not None and request.category_id != product.category_id:
        cat_stmt = select(Category).where(Category.id == request.category_id)
        if not db.execute(cat_stmt).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found",
            )
            
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    
    return db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product.id)).scalar_one()

@router.delete(
    "/{product_id}",
    response_model=ProductResponse,
)
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.availability = False
    db.commit()
    db.refresh(product)
    
    return db.execute(select(Product).options(selectinload(Product.category)).where(Product.id == product.id)).scalar_one()
