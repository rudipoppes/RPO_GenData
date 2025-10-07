import hashlib
import secrets
from datetime import datetime
from typing import Optional, Tuple
from fastapi import HTTPException, status, Depends, Header
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.api_key import APIKey, APIKeyStatus
from app.models.user import User

def generate_api_key() -> Tuple[str, str, str]:
    """Generate a new API key and return (full_key, prefix, hash)."""
    full_key = secrets.token_urlsafe(32)
    prefix = full_key[:8]
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    return full_key, prefix, key_hash

def hash_api_key(key: str) -> str:
    """Hash an API key."""
    return hashlib.sha256(key.encode()).hexdigest()

async def get_api_key_from_header(
    x_api_key: Optional[str] = Header(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> APIKey:
    """Extract and validate API key from headers."""
    
    # Try X-API-Key header first
    api_key = x_api_key
    
    # If not found, try Authorization: Bearer
    if not api_key and authorization:
        if authorization.startswith("Bearer "):
            api_key = authorization[7:]
    
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key required"
        )
    
    # Hash the provided key and look it up
    key_hash = hash_api_key(api_key)
    db_api_key = db.query(APIKey).filter(
        APIKey.key_hash == key_hash,
        APIKey.status == APIKeyStatus.ACTIVE
    ).first()
    
    if not db_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Check if key has expired
    if db_api_key.expires_at and db_api_key.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API key has expired"
        )
    
    return db_api_key

async def verify_collection_access(
    api_key: APIKey,
    collection_name: str,
    collection_type: str,
    db: Session
) -> bool:
    """Verify that the API key has access to the specified collection and type."""
    from app.models.collection import Collection
    from app.models.api_key import APIKeyAllowed
    
    # Get the collection
    collection = db.query(Collection).filter(Collection.name == collection_name).first()
    if not collection:
        return False
    
    # Check if this API key has access to this collection
    allowed = db.query(APIKeyAllowed).filter(
        APIKeyAllowed.api_key_id == api_key.id,
        APIKeyAllowed.collection_id == collection.id
    ).first()
    
    if not allowed:
        # Check if key has access to all collections owned by the same user
        if collection.owner_id != api_key.user_id:
            return False
    else:
        # If there's a specific collection type restriction, check it
        if allowed.collection_type and allowed.collection_type.lower() != collection_type.lower():
            return False
    
    return True
