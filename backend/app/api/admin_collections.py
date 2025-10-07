from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.field import Field
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse,
    FieldCreate, FieldUpdate, FieldResponse, CollectionWithFields
)
from app.auth.jwt_auth import get_current_user, get_current_admin_or_editor_user
from app.generators.value_generator import ValueGenerator

router = APIRouter()

@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Create a new collection."""
    
    # Check if collection name already exists
    existing = db.query(Collection).filter(Collection.name == collection_data.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Collection with this name already exists"
        )
    
    db_collection = Collection(
        name=collection_data.name,
        owner_id=current_user.id
    )
    
    db.add(db_collection)
    db.commit()
    db.refresh(db_collection)
    
    return CollectionResponse.from_orm(db_collection)

@router.get("/collections", response_model=List[CollectionResponse])
async def list_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List collections accessible to the current user."""
    from app.models.user import UserRole
    
    if current_user.role == UserRole.ADMIN:
        # Admin can see all collections
        collections = db.query(Collection).all()
    else:
        # Editors and Viewers can only see their own collections
        collections = db.query(Collection).filter(Collection.owner_id == current_user.id).all()
    
    return [CollectionResponse.from_orm(c) for c in collections]

@router.get("/collections/{collection_id}", response_model=CollectionWithFields)
async def get_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific collection with its fields."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this collection"
        )
    
    # Get fields for this collection
    fields = db.query(Field).filter(Field.collection_id == collection_id).all()
    
    collection_dict = CollectionResponse.from_orm(collection).dict()
    collection_dict["fields"] = [FieldResponse.from_orm(f) for f in fields]
    
    return CollectionWithFields(**collection_dict)

@router.patch("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Update a collection."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this collection"
        )
    
    # Update fields
    if collection_data.name is not None:
        # Check if new name already exists
        existing = db.query(Collection).filter(
            Collection.name == collection_data.name,
            Collection.id != collection_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Collection with this name already exists"
            )
        collection.name = collection_data.name
    
    db.commit()
    db.refresh(collection)
    
    return CollectionResponse.from_orm(collection)

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Delete a collection."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this collection"
        )
    
    db.delete(collection)
    db.commit()
    
    return {"message": "Collection deleted successfully"}

# Field endpoints
@router.post("/collections/{collection_id}/fields", response_model=FieldResponse)
async def create_field(
    collection_id: int,
    field_data: FieldCreate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Create a new field for a collection."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this collection"
        )
    
    # Check if field name already exists for this collection and type
    existing = db.query(Field).filter(
        Field.collection_id == collection_id,
        Field.collection_type == field_data.collection_type,
        Field.field_name == field_data.field_name
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field '{field_data.field_name}' already exists for {field_data.collection_type.value} in this collection"
        )
    
    # Create field
    db_field = Field(
        collection_id=collection_id,
        collection_type=field_data.collection_type,
        field_name=field_data.field_name,
        value_type=field_data.value_type,
        fixed_value_text=field_data.fixed_value_text,
        fixed_value_number=field_data.fixed_value_number,
        fixed_value_float=field_data.fixed_value_float,
        range_start_number=field_data.range_start_number,
        range_end_number=field_data.range_end_number,
        range_start_float=field_data.range_start_float,
        range_end_float=field_data.range_end_float,
        float_precision=field_data.float_precision,
        start_number=field_data.start_number,
        step_number=field_data.step_number,
        reset_number=field_data.reset_number,
    )
    
    # Validate field configuration
    errors = ValueGenerator.validate_field_config(db_field)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field configuration errors: {', '.join(errors)}"
        )
    
    try:
        db.add(db_field)
        db.commit()
        db.refresh(db_field)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field with this name already exists for this collection type"
        )
    
    return FieldResponse.from_orm(db_field)

@router.patch("/fields/{field_id}", response_model=FieldResponse)
async def update_field(
    field_id: int,
    field_data: FieldUpdate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Update a field."""
    from app.models.user import UserRole
    
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Check access permissions
    collection = db.query(Collection).filter(Collection.id == field.collection_id).first()
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this field"
        )
    
    # Update fields
    update_data = field_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)
    
    # Validate field configuration
    errors = ValueGenerator.validate_field_config(field)
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Field configuration errors: {', '.join(errors)}"
        )
    
    try:
        db.commit()
        db.refresh(field)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Field with this name already exists for this collection type"
        )
    
    return FieldResponse.from_orm(field)

@router.delete("/fields/{field_id}")
async def delete_field(
    field_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Delete a field."""
    from app.models.user import UserRole
    
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )
    
    # Check access permissions
    collection = db.query(Collection).filter(Collection.id == field.collection_id).first()
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this field"
        )
    
    db.delete(field)
    db.commit()
    
    return {"message": "Field deleted successfully"}
