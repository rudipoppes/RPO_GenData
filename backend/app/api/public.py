from fastapi import APIRouter, Depends, HTTPException, status, Path
from sqlalchemy.orm import Session
from typing import Dict, Any
import time
from datetime import datetime, timezone
from urllib.parse import unquote

from app.db.database import get_db
from app.auth.api_key_auth import get_api_key_from_header, verify_collection_access
from app.models.api_key import APIKey
from app.models.collection import Collection
from app.models.field import Field, CollectionType, ValueType
from app.models.spike_schedule import SpikeSchedule
from app.models.spike_schedule_field import SpikeScheduleField
from app.generators.value_generator import ValueGenerator

router = APIRouter()

# Performance numeric types that can be modified in spike schedules
PERFORMANCE_NUMERIC_TYPES = [
    ValueType.NUMBER_FIXED, ValueType.FLOAT_FIXED,
    ValueType.NUMBER_RANGE, ValueType.FLOAT_RANGE,
    ValueType.INCREMENT, ValueType.DECREMENT
]

def is_field_editable(value_type: ValueType) -> bool:
    """Check if field type is editable in spike schedules."""
    return value_type in PERFORMANCE_NUMERIC_TYPES

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
    
    # Check for active spike schedule
    now = datetime.now(timezone.utc)
    active_spike = db.query(SpikeSchedule).filter(
        SpikeSchedule.collection_id == collection.id,
        SpikeSchedule.start_datetime <= now,
        SpikeSchedule.end_datetime >= now
    ).first()
    
    # Generate data
    data = {}
    
    if active_spike:
        # Get spike configuration for this collection type
        spike_fields = db.query(SpikeScheduleField).filter(
            SpikeScheduleField.spike_schedule_id == active_spike.id,
            SpikeScheduleField.collection_type == collection_type_enum
        ).all()
        
        # Build map of spike configurations for quick lookup
        spike_config_map = {sf.original_field_id: sf for sf in spike_fields}
        
        # Process ALL collection fields (unified field processing)
        all_fields = db.query(Field).filter(
            Field.collection_id == collection.id,
            Field.collection_type == collection_type_enum
        ).all()
        
        for field in all_fields:
            # Check if this field has spike configuration
            spike_config = spike_config_map.get(field.id)
            
            if spike_config and is_field_editable(field.value_type):
                # Create effective field with spike configuration but original field state
                effective_field = Field(
                    id=field.id,
                    collection_id=field.collection_id,
                    collection_type=field.collection_type,
                    field_name=field.field_name,
                    value_type=field.value_type,
                    # Use spike configuration for numeric values
                    fixed_value_text=field.fixed_value_text,
                    fixed_value_number=spike_config.fixed_value_number if spike_config.fixed_value_number is not None else field.fixed_value_number,
                    fixed_value_float=spike_config.fixed_value_float if spike_config.fixed_value_float is not None else field.fixed_value_float,
                    range_start_number=spike_config.range_start_number if spike_config.range_start_number is not None else field.range_start_number,
                    range_end_number=spike_config.range_end_number if spike_config.range_end_number is not None else field.range_end_number,
                    range_start_float=spike_config.range_start_float if spike_config.range_start_float is not None else field.range_start_float,
                    range_end_float=spike_config.range_end_float if spike_config.range_end_float is not None else field.range_end_float,
                    float_precision=spike_config.float_precision if spike_config.float_precision is not None else field.float_precision,
                    start_number=spike_config.start_number if spike_config.start_number is not None else field.start_number,
                    step_number=spike_config.step_number if spike_config.step_number is not None else field.step_number,
                    reset_number=spike_config.reset_number if spike_config.reset_number is not None else field.reset_number,
                    # CRITICAL: Always use original field's current state (single source of truth)
                    current_number=field.current_number,
                    randomization_percentage=spike_config.randomization_percentage if spike_config.randomization_percentage is not None else field.randomization_percentage
                )
            else:
                # Use original field configuration and state
                effective_field = Field(
                    id=field.id,
                    collection_id=field.collection_id,
                    collection_type=field.collection_type,
                    field_name=field.field_name,
                    value_type=field.value_type,
                    fixed_value_text=field.fixed_value_text,
                    fixed_value_number=field.fixed_value_number,
                    fixed_value_float=field.fixed_value_float,
                    range_start_number=field.range_start_number,
                    range_end_number=field.range_end_number,
                    range_start_float=field.range_start_float,
                    range_end_float=field.range_end_float,
                    float_precision=field.float_precision,
                    start_number=field.start_number,
                    step_number=field.step_number,
                    reset_number=field.reset_number,
                    current_number=field.current_number,
                    randomization_percentage=field.randomization_percentage
                )
            
            try:
                value = ValueGenerator.generate_value(effective_field, db)
                
                # CRITICAL: Update original field's state immediately (single source of truth)
                if field.value_type in [ValueType.INCREMENT, ValueType.DECREMENT]:
                    if effective_field.current_number != field.current_number:
                        field.current_number = effective_field.current_number
                        db.flush()
                
                data[field.field_name] = value
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating value for field '{field.field_name}'"
                )
    else:
        # Use normal collection fields
        fields = db.query(Field).filter(
            Field.collection_id == collection.id,
            Field.collection_type == collection_type_enum
        ).all()
        
        if not fields:
            raise HTTPException(
                status_code=404,
                detail=f"No fields found for collection '{decoded_collection_name}' type '{collection_type_enum.value}'"
            )
        
        for field in fields:
            try:
                value = ValueGenerator.generate_value(field, db)
                data[field.field_name] = value
            except Exception as e:
                raise HTTPException(
                    status_code=500,
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
