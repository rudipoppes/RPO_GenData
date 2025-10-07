from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import Dict, Any
import time
from datetime import datetime
from urllib.parse import unquote

from app.db.database import get_db
from app.auth.api_key_auth import get_api_key_from_header, verify_collection_access
from app.models.api_key import APIKey
from app.models.collection import Collection
from app.models.field import Field, CollectionType
from app.generators.value_generator import ValueGenerator

router = APIRouter()

@router.get("/{collection_name}/{collection_type}")
async def get_generated_data(
    collection_name: str = Path(..., description="URL-encoded collection name"),
    collection_type: str = Path(..., description="Collection type: Performance or Configuration"),
    api_key: APIKey = Depends(get_api_key_from_header),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate and return data for a collection.
    
    - **collection_name**: The name of the collection (URL-encoded)
    - **collection_type**: Either "Performance" or "Configuration" (case-insensitive)
    """
    
    # URL decode the collection name
    decoded_collection_name = unquote(collection_name)
    
    # Validate collection type
    collection_type = collection_type.lower()
    if collection_type not in ["performance", "configuration"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="collection_type must be 'Performance' or 'Configuration'"
        )
    
    # Normalize to enum value
    collection_type_enum = CollectionType.PERFORMANCE if collection_type == "performance" else CollectionType.CONFIGURATION
    
    # Verify API key has access to this collection and type
    has_access = await verify_collection_access(
        api_key, decoded_collection_name, collection_type, db
    )
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this collection"
        )
    
    # Get the collection
    collection = db.query(Collection).filter(Collection.name == decoded_collection_name).first()
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collection not found"
        )
    
    # Get fields for this collection and type
    fields = db.query(Field).filter(
        Field.collection_id == collection.id,
        Field.collection_type == collection_type_enum
    ).all()
    
    if not fields:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No fields found for collection '{decoded_collection_name}' type '{collection_type_enum.value}'"
        )
    
    # Generate data for each field
    data = {}
    for field in fields:
        try:
            value = ValueGenerator.generate_value(field, db)
            data[field.field_name] = value
        except Exception as e:
            # Log the error but don't expose internal details
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error generating value for field '{field.field_name}'"
            )
    
    # Update API key last used time
    api_key.last_used_at = datetime.utcnow()
    db.commit()
    
    return {
        "collection": decoded_collection_name,
        "type": collection_type_enum.value,
        "generated_at_epoch": int(time.time()),
        "data": data
    }
