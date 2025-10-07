from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[UserRole] = None
    password: Optional[str] = None

class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
