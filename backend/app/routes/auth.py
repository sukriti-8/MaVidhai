from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.connection import get_db
from app.models.user import User
from app.schemas.auth import RegisterRequest, UserResponse
from app.utils.security import hash_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Normalize email
    normalized_email = request.email.lower()
    
    # Check if email exists
    stmt = select(User).where(User.email == normalized_email)
    existing_user = db.execute(stmt).scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )
    
    # Hash password
    hashed_password = hash_password(request.password)
    
    # Create user
    new_user = User(
        full_name=request.full_name,
        email=normalized_email,
        password_hash=hashed_password,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user
