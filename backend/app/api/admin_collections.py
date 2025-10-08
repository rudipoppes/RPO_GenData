from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import List
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.field import Field
from app.schemas.collection import (
    CollectionCreate, CollectionUpdate, CollectionResponse,
    FieldCreate, FieldUpdate, FieldResponse, CollectionWithFields
)
from app.auth.jwt_auth import get_current_user, get_current_admin_or_editor_user, get_current_admin_user
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
    
    # Load owner relationship and construct response manually
    db.refresh(db_collection)
    owner = db.query(User).filter(User.id == db_collection.owner_id).first()
    
    return CollectionResponse(
        id=db_collection.id,
        name=db_collection.name,
        owner_id=db_collection.owner_id,
        owner_username=owner.username,
        created_at=db_collection.created_at,
        updated_at=db_collection.updated_at
    )

@router.get("/collections", response_model=List[CollectionWithFields])
async def list_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List collections accessible to the current user."""
    from app.models.user import UserRole
    
    if current_user.role == UserRole.ADMIN:
        # Admin can see all collections
        collections = db.query(Collection).options(joinedload(Collection.fields), joinedload(Collection.owner)).all()
    else:
        # Editors and Viewers can only see their own collections
        collections = db.query(Collection).options(joinedload(Collection.fields), joinedload(Collection.owner)).filter(Collection.owner_id == current_user.id).all()
    
    result = []
    for c in collections:
        # Manually construct response with proper owner data
        collection_data = {
            "id": c.id,
            "name": c.name,
            "owner_id": c.owner_id,
            "owner_username": c.owner.username,  # Computed from relationship
            "created_at": c.created_at,
            "updated_at": c.updated_at,
            "fields": [FieldResponse.from_orm(f) for f in c.fields]
        }
        result.append(CollectionWithFields(**collection_data))
    return result

@router.get("/collections/{collection_id}", response_model=CollectionWithFields)
async def get_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific collection with its fields."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).options(joinedload(Collection.owner)).filter(Collection.id == collection_id).first()
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
    
    # Manually construct response with owner data
    collection_data = {
        "id": collection.id,
        "name": collection.name,
        "owner_id": collection.owner_id,
        "owner_username": collection.owner.username,
        "created_at": collection.created_at,
        "updated_at": collection.updated_at,
        "fields": [FieldResponse.from_orm(f) for f in fields]
    }
    return CollectionWithFields(**collection_data)

@router.patch("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: int,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Update a collection."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).options(joinedload(Collection.owner)).filter(Collection.id == collection_id).first()
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
    
    # Load owner relationship and construct response manually
    owner = db.query(User).filter(User.id == collection.owner_id).first()
    
    return CollectionResponse(
        id=collection.id,
        name=collection.name,
        owner_id=collection.owner_id,
        owner_username=owner.username,
        created_at=collection.created_at,
        updated_at=collection.updated_at
    )

from typing import List

class BulkDeleteCollectionsRequest(BaseModel):
    collection_ids: List[int]

@router.delete("/collections/bulk")
async def bulk_delete_collections(
    request: BulkDeleteCollectionsRequest,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Delete multiple collections and their associated fields and API key permissions."""
    from app.models.user import UserRole
    
    collection_ids = request.collection_ids
    
    if not collection_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No collection IDs provided"
        )
    
    # Fetch all collections to be deleted with their owners
    collections = db.query(Collection).options(joinedload(Collection.owner)).filter(
        Collection.id.in_(collection_ids)
    ).all()
    
    # Check if all requested collections exist
    found_ids = {c.id for c in collections}
    missing_ids = set(collection_ids) - found_ids
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collections not found: {sorted(list(missing_ids))}"
        )
    
    # Check access permissions for all collections
    denied_collections = []
    for collection in collections:
        if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
            denied_collections.append(collection.name)
    
    if denied_collections:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied to collections: {denied_collections}"
        )
    
    # Count associated records that will be deleted
    total_fields = 0
    
    for collection in collections:
        # Count fields
        field_count = db.query(Field).filter(Field.collection_id == collection.id).count()
        total_fields += field_count
    
    # Delete all collections (cascade will handle fields and API key permissions)
    deleted_names = [c.name for c in collections]
    for collection in collections:
        db.delete(collection)
    
    db.commit()
    
    return {
        "message": f"Successfully deleted {len(collections)} collection(s)",
        "deleted_collections": deleted_names,
        "deleted_count": len(collections),
        "cascade_deleted": {
            "fields": total_fields
        }
    }

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Delete a collection."""
    from app.models.user import UserRole
    
    collection = db.query(Collection).options(joinedload(Collection.owner)).filter(Collection.id == collection_id).first()
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
    
    collection = db.query(Collection).options(joinedload(Collection.owner)).filter(Collection.id == collection_id).first()
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

from pydantic import BaseModel

class CopyCollectionRequest(BaseModel):
    count: int = Field(..., ge=1, le=10, description="Number of copies to create (1-10)")

class CopyCollectionResponse(BaseModel):
    copied_collections: List[CollectionResponse]
    success_count: int
    message: str

@router.post("/collections/{collection_id}/copy", response_model=CopyCollectionResponse)
async def copy_collection(
    collection_id: int,
    request: CopyCollectionRequest,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Copy a collection multiple times with all its fields.
    New collections are owned by the current user.
    """
    
    # Get the original collection
    original_collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not original_collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Get all fields from the original collection  
    original_fields = db.query(Field).filter(Field.collection_id == collection_id).all()
    
    copied_collections = []
    
    try:
        for i in range(1, request.count + 1):
            # Generate unique name
            copy_name = f"{original_collection.name} (Copy {i})"
            
            # Check if name already exists and increment if needed
            existing_count = 1
            final_name = copy_name
            while db.query(Collection).filter(Collection.name == final_name).first():
                existing_count += 1
                final_name = f"{original_collection.name} (Copy {existing_count})"
            
            # Create new collection
            new_collection = Collection(
                name=final_name,
                description=original_collection.description,
                owner_id=current_user.id,  # New owner is the copier
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            db.add(new_collection)
            db.flush()  # Get the new collection ID
            
            # Copy all fields
            for original_field in original_fields:
                new_field = Field(
                    collection_id=new_collection.id,
                    collection_type=original_field.collection_type,
                    field_name=original_field.field_name,
                    value_type=original_field.value_type,
                    fixed_value_text=original_field.fixed_value_text,
                    fixed_value_number=original_field.fixed_value_number,
                    fixed_value_float=original_field.fixed_value_float,
                    range_start_number=original_field.range_start_number,
                    range_end_number=original_field.range_end_number,
                    range_start_float=original_field.range_start_float,
                    range_end_float=original_field.range_end_float,
                    float_precision=original_field.float_precision,
                    start_number=original_field.start_number,
                    step_number=original_field.step_number,
                    reset_number=original_field.reset_number,
                    current_number=original_field.current_number,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow()
                )
                db.add(new_field)
            
            copied_collections.append(CollectionResponse.from_orm(new_collection))
        
        # Commit all changes
        db.commit()
        
        return CopyCollectionResponse(
            copied_collections=copied_collections,
            success_count=len(copied_collections),
            message=f"Successfully created {len(copied_collections)} copies of '{original_collection.name}'"
        )
        
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Failed to create copies due to naming conflicts. Please try again."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to copy collection: {str(e)}"
        )
