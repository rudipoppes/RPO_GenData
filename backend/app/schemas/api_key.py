from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.api_key import APIKeyStatus

class APIKeyCreate(BaseModel):
    label: str
    expires_at: Optional[datetime] = None
    collection_ids: Optional[List[int]] = None  # If None, access to all owned collections

class APIKeyUpdate(BaseModel):
    label: Optional[str] = None
    status: Optional[APIKeyStatus] = None
    expires_at: Optional[datetime] = None

class APIKeyResponse(BaseModel):
    id: int
    user_id: int
    key_prefix: str
    label: str
    status: APIKeyStatus
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class APIKeyCreateResponse(APIKeyResponse):
    key: str  # Full key shown only once during creation

class APIKeyScope(BaseModel):
    scope: str
    
class APIKeyAllowedCollection(BaseModel):
    collection_id: int
    collection_name: str
    collection_type: Optional[str] = None
