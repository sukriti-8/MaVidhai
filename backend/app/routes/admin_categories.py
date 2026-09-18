from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.database.connection import get_db
from app.models.category import Category
from app.models.product import Product
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.utils.dependencies import get_super_admin
from app.services.audit_service import log_admin_action

router = APIRouter(prefix="/api/admin/categories", tags=["admin_categories"])

@router.get(
    "",
    response_model=List[CategoryResponse],
)
def get_admin_categories(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    stmt = select(Category)
    categories = db.execute(stmt).scalars().all()
    return categories

@router.post(
    "",
    response_model=CategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    request: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    stmt = select(Category).where(func.lower(Category.slug) == request.slug.lower())
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category slug already exists",
        )
        
    stmt_name = select(Category).where(func.lower(Category.name) == request.name.lower())
    if db.execute(stmt_name).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category name already exists",
        )
        
    category = Category(
        name=request.name,
        slug=request.slug,
        is_active=True,
    )
    db.add(category)
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CATEGORY_CREATED",
        entity_type="CATEGORY",
        entity_id=request.slug,
        details={"name": request.name}
    )
    
    db.commit()
    db.refresh(category)
    return category

@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
)
def update_category(
    category_id: int,
    request: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    if request.slug is not None and request.slug.lower() != category.slug.lower():
        stmt = select(Category).where(func.lower(Category.slug) == request.slug.lower())
        if db.execute(stmt).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category slug already exists",
            )
            
    if request.name is not None and request.name.lower() != category.name.lower():
        stmt = select(Category).where(func.lower(Category.name) == request.name.lower())
        if db.execute(stmt).scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category name already exists",
            )
            
    if request.name is not None:
        category.name = request.name
    if request.slug is not None:
        category.slug = request.slug
    if request.is_active is not None:
        category.is_active = request.is_active
        
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CATEGORY_UPDATED",
        entity_type="CATEGORY",
        entity_id=str(category.id),
        details={"request": request.model_dump(exclude_unset=True)}
    )
        
    db.commit()
    db.refresh(category)
    return category

@router.delete(
    "/{category_id}",
    response_model=CategoryResponse,
)
def deactivate_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_super_admin),
):
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Prevent deactivation with active products
    stmt = select(Product).where(
        Product.category_id == category_id,
        Product.availability == True
    )
    active_products = db.execute(stmt).scalars().first()
    
    if active_products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate category containing active products",
        )
        
    category.is_active = False
    
    log_admin_action(
        db=db,
        admin_id=current_admin.id,
        action="CATEGORY_DEACTIVATED",
        entity_type="CATEGORY",
        entity_id=str(category.id),
        details={}
    )
    
    db.commit()
    db.refresh(category)
    return category
