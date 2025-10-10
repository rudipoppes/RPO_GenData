from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.api_key import APIKey, APIKeyStatus, APIKeyScope, APIKeyAllowed
from app.models.collection import Collection
from app.schemas.api_key import (
    APIKeyCreate, APIKeyUpdate, APIKeyEditRequest, APIKeyResponse, 
    APIKeyCreateResponse, APIKeyScope as APIKeyScopeSchema
)
from app.auth.jwt_auth import get_current_user
from app.auth.api_key_auth import generate_api_key, hash_api_key

router = APIRouter()

@router.post("/api-keys", response_model=APIKeyCreateResponse)
async def create_api_key(
    api_key_data: APIKeyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new API key."""
    
    # Generate API key
    full_key, prefix, key_hash = generate_api_key()
    
    # Create API key record
    db_api_key = APIKey(
        user_id=current_user.id,
        key_prefix=prefix,
        key_hash=key_hash,
        label=api_key_data.label,
        expires_at=api_key_data.expires_at
    )
    
    db.add(db_api_key)
    db.commit()
    db.refresh(db_api_key)
    
    # Add default scope
    db_scope = APIKeyScope(
        api_key_id=db_api_key.id,
        scope="data:read"
    )
    db.add(db_scope)
    
    # Add collection restrictions if specified
    if api_key_data.collection_ids:
        for collection_id in api_key_data.collection_ids:
            # Verify collection exists (Admin can access all, others only owned)
            from app.models.user import UserRole
            if current_user.role == UserRole.ADMIN:
                collection = db.query(Collection).filter(Collection.id == collection_id).first()
            else:
                collection = db.query(Collection).filter(
                    Collection.id == collection_id,
                    Collection.owner_id == current_user.id
                ).first()
            if not collection:
                db.rollback()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Collection {collection_id} not found or not accessible"
                )
            
            db_allowed = APIKeyAllowed(
                api_key_id=db_api_key.id,
                collection_id=collection_id
            )
            db.add(db_allowed)
    
    db.commit()
    
    # Return response with full key (shown only once)
    response_data = APIKeyResponse.from_orm(db_api_key).dict()
    response_data["key"] = full_key
    
    return APIKeyCreateResponse(**response_data)

@router.get("/api-keys", response_model=List[APIKeyResponse])
async def list_api_keys(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List API keys for the current user."""
    from app.models.user import UserRole
    
    if current_user.role == UserRole.ADMIN:
        # Admin can see all API keys
        api_keys = db.query(APIKey).all()
    else:
        # Users can only see their own API keys
        api_keys = db.query(APIKey).filter(APIKey.user_id == current_user.id).all()
    
    return [APIKeyResponse.from_orm(key) for key in api_keys]

@router.get("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def get_api_key(
    api_key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific API key."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    return APIKeyResponse.from_orm(api_key)

@router.patch("/api-keys/{api_key_id}", response_model=APIKeyResponse)
async def update_api_key(
    api_key_id: int,
    api_key_data: APIKeyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an API key."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    # Update fields
    update_data = api_key_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(api_key, key, value)
    
    db.commit()
    db.refresh(api_key)
    
    return APIKeyResponse.from_orm(api_key)


@router.put("/api-keys/{api_key_id}/edit", response_model=APIKeyResponse)
async def edit_api_key(
    api_key_id: int,
    edit_data: APIKeyEditRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Edit an API key (label, expiration, and collection access)."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    # Update basic fields
    if edit_data.label is not None:
        api_key.label = edit_data.label
    if edit_data.expires_at is not None:
        api_key.expires_at = edit_data.expires_at
    
    # Update collection access if specified
    if edit_data.collection_ids is not None:
        # Remove existing collection permissions
        db.query(APIKeyAllowed).filter(APIKeyAllowed.api_key_id == api_key_id).delete()
        
        # Add new collection permissions (if not empty, empty means all collections)
        if edit_data.collection_ids:
            for collection_id in edit_data.collection_ids:
                # Verify collection exists and user has access
                if current_user.role == UserRole.ADMIN:
                    collection = db.query(Collection).filter(Collection.id == collection_id).first()
                else:
                    collection = db.query(Collection).filter(
                        Collection.id == collection_id,
                        Collection.owner_id == current_user.id
                    ).first()
                if not collection:
                    db.rollback()
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Collection {collection_id} not found or not accessible"
                    )
                
                db_allowed = APIKeyAllowed(
                    api_key_id=api_key_id,
                    collection_id=collection_id
                )
                db.add(db_allowed)
    
    db.commit()
    db.refresh(api_key)
    
    return APIKeyResponse.from_orm(api_key)
@router.delete("/api-keys/{api_key_id}")
async def delete_api_key(
    api_key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an API key."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    db.delete(api_key)
    db.commit()
    
    return {"message": "API key deleted successfully"}

@router.post("/api-keys/{api_key_id}/revoke")
async def revoke_api_key(
    api_key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke an API key (set status to revoked)."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    api_key.status = APIKeyStatus.REVOKED
    db.commit()
    
    return {"message": "API key revoked successfully"}

@router.get("/api-keys/{api_key_id}/allowed-collections")
async def get_api_key_allowed_collections(
    api_key_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get collections allowed for an API key."""
    from app.models.user import UserRole
    
    api_key = db.query(APIKey).filter(APIKey.id == api_key_id).first()
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API key not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and api_key.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this API key"
        )
    
    allowed_collections = db.query(APIKeyAllowed).filter(
        APIKeyAllowed.api_key_id == api_key_id
    ).all()
    
    results = []
    for allowed in allowed_collections:
        collection = db.query(Collection).filter(Collection.id == allowed.collection_id).first()
        if collection:
            results.append({
                "collection_id": collection.id,
                "collection_name": collection.name,
                "collection_type": allowed.collection_type
            })
    
    return results
