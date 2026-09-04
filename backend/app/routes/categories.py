from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.connection import get_db
from app.models.category import Category
from app.schemas.category import CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])

@router.get(
    "",
    response_model=List[CategoryResponse],
)
def get_categories(db: Session = Depends(get_db)):
    stmt = select(Category)
    categories = db.execute(stmt).scalars().all()
    return categories
