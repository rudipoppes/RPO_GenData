from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from passlib.context import CryptContext

from app.db.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse, 
    PasswordChangeRequest, UserProfileUpdate
)
from app.auth.jwt_auth import get_current_user, get_current_admin_user

router = APIRouter()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Admin-only user management endpoints
@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """List all users (Admin only)."""
    users = db.query(User).all()
    return [UserResponse.from_orm(user) for user in users]

@router.post("/users", response_model=UserResponse)
async def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new user (Admin only)."""
    
    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Check if username already exists
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create user
    hashed_password = pwd_context.hash(user_data.password)
    db_user = User(
        email=user_data.email,
        username=user_data.username,
        password_hash=hashed_password,
        role=user_data.role
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return UserResponse.from_orm(db_user)

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get a specific user (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return UserResponse.from_orm(user)

@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a user (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check email uniqueness if email is being changed
    if user_data.email and user_data.email != user.email:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_data.email
    
    # Check username uniqueness if username is being changed
    if user_data.username and user_data.username != user.username:
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        user.username = user_data.username
    
    # Update role if provided
    if user_data.role:
        user.role = user_data.role
    
    # Hash new password if provided
    if user_data.password:
        user.password_hash = pwd_context.hash(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return UserResponse.from_orm(user)

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a user (Admin only)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

# Self-service endpoints (all authenticated users)
@router.get("/profile", response_model=UserResponse)
async def get_profile(
    current_user: User = Depends(get_current_user)
):
    """Get current user's profile."""
    return UserResponse.from_orm(current_user)

@router.patch("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile."""
    
    # Check email uniqueness if email is being changed
    if profile_data.email and profile_data.email != current_user.email:
        if db.query(User).filter(User.email == profile_data.email).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        current_user.email = profile_data.email
    
    # Check username uniqueness if username is being changed
    if profile_data.username and profile_data.username != current_user.username:
        if db.query(User).filter(User.username == profile_data.username).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        current_user.username = profile_data.username
    
    db.commit()
    db.refresh(current_user)
    
    return UserResponse.from_orm(current_user)

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change current user's password."""
    
    # Verify current password
    if not pwd_context.verify(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    # Hash and save new password
    current_user.password_hash = pwd_context.hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
