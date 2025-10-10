from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole

class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: UserRole = UserRole.EDITOR

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    role: UserRole
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class LoginResponse(BaseModel):
    user: UserResponse
    message: str = "Login successful"

class LogoutResponse(BaseModel):
    message: str = "Logout successful"
