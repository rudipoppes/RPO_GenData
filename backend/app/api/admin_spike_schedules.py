from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.collection import Collection
from app.models.field import Field, ValueType
from app.models.spike_schedule import SpikeSchedule
from app.models.spike_schedule_field import SpikeScheduleField
from app.schemas.spike_schedule import (
    SpikeScheduleCreate, SpikeScheduleUpdate, 
    SpikeScheduleResponse, SpikeScheduleFieldResponse
)
from app.auth.jwt_auth import get_current_admin_or_editor_user

router = APIRouter()

PERFORMANCE_NUMERIC_TYPES = [
    ValueType.NUMBER_FIXED, ValueType.FLOAT_FIXED,
    ValueType.NUMBER_RANGE, ValueType.FLOAT_RANGE,
    ValueType.INCREMENT, ValueType.DECREMENT
]

def compute_schedule_status(schedule: SpikeSchedule) -> str:
    """Compute schedule status based on current time."""
    now = datetime.now(timezone.utc)
    
    # Ensure schedule datetimes are timezone-aware (SQLite workaround)
    start_time = schedule.start_datetime
    end_time = schedule.end_datetime
    
    if start_time.tzinfo is None:
        start_time = start_time.replace(tzinfo=timezone.utc)
    if end_time.tzinfo is None:
        end_time = end_time.replace(tzinfo=timezone.utc)
    
    if now < start_time:
        return "scheduled"
    elif now > end_time:
        return "expired"
    else:
        return "active"

def is_field_editable(value_type: ValueType) -> bool:
    """Check if field type is editable in spike schedules."""
    return value_type in PERFORMANCE_NUMERIC_TYPES

@router.post("/spike-schedules", response_model=SpikeScheduleResponse)
async def create_spike_schedule(
    schedule_data: SpikeScheduleCreate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """
    Create a new spike schedule for a collection.
    Copies ALL fields from collection, allows modification of numeric performance fields only.
    """
    # Validate collection exists and user has access
    collection = db.query(Collection).filter(Collection.id == schedule_data.collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check access permissions
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to this collection")
    
    # Get ALL fields from the collection
    all_fields = db.query(Field).filter(Field.collection_id == schedule_data.collection_id).all()
    if not all_fields:
        raise HTTPException(status_code=400, detail="Collection has no fields")
    
    # Create spike schedule
    spike_schedule = SpikeSchedule(
        collection_id=schedule_data.collection_id,
        name=schedule_data.name,
        start_datetime=schedule_data.start_datetime,
        end_datetime=schedule_data.end_datetime
    )
    db.add(spike_schedule)
    db.flush()
    
    # Create a map of modified fields from request
    modified_fields_map = {sf.original_field_id: sf for sf in schedule_data.spike_fields}
    
    # Copy ALL fields to spike schedule
    for field in all_fields:
        # Start with original field values
        spike_field = SpikeScheduleField(
            spike_schedule_id=spike_schedule.id,
            original_field_id=field.id,
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
            current_number=field.current_number
        )
        
        # If this field was modified in the request, update with new values
        if field.id in modified_fields_map and is_field_editable(field.value_type):
            modified = modified_fields_map[field.id]
            # Update only the relevant numeric fields
            if modified.fixed_value_number is not None:
                spike_field.fixed_value_number = modified.fixed_value_number
            if modified.fixed_value_float is not None:
                spike_field.fixed_value_float = modified.fixed_value_float
            if modified.range_start_number is not None:
                spike_field.range_start_number = modified.range_start_number
            if modified.range_end_number is not None:
                spike_field.range_end_number = modified.range_end_number
            if modified.range_start_float is not None:
                spike_field.range_start_float = modified.range_start_float
            if modified.range_end_float is not None:
                spike_field.range_end_float = modified.range_end_float
            if modified.float_precision is not None:
                spike_field.float_precision = modified.float_precision
            if modified.start_number is not None:
                spike_field.start_number = modified.start_number
            if modified.step_number is not None:
                spike_field.step_number = modified.step_number
            if modified.reset_number is not None:
                spike_field.reset_number = modified.reset_number
        
        db.add(spike_field)
    
    db.commit()
    db.refresh(spike_schedule)
    
    # Build response
    return build_spike_schedule_response(spike_schedule, db)

@router.get("/spike-schedules", response_model=List[SpikeScheduleResponse])
async def list_spike_schedules(
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """List all spike schedules accessible to the current user."""
    if current_user.role == UserRole.ADMIN:
        schedules = db.query(SpikeSchedule).options(
            joinedload(SpikeSchedule.collection),
            joinedload(SpikeSchedule.spike_fields)
        ).all()
    else:
        schedules = db.query(SpikeSchedule).join(Collection).filter(
            Collection.owner_id == current_user.id
        ).options(
            joinedload(SpikeSchedule.collection),
            joinedload(SpikeSchedule.spike_fields)
        ).all()
    
    return [build_spike_schedule_response(s, db) for s in schedules]

@router.get("/spike-schedules/{schedule_id}", response_model=SpikeScheduleResponse)
async def get_spike_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Get a specific spike schedule."""
    schedule = db.query(SpikeSchedule).options(
        joinedload(SpikeSchedule.collection),
        joinedload(SpikeSchedule.spike_fields)
    ).filter(SpikeSchedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Spike schedule not found")
    
    # Check access
    if current_user.role != UserRole.ADMIN and schedule.collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return build_spike_schedule_response(schedule, db)

@router.get("/collections/{collection_id}/spike-schedules", response_model=List[SpikeScheduleResponse])
async def list_collection_spike_schedules(
    collection_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """List spike schedules for a specific collection."""
    collection = db.query(Collection).filter(Collection.id == collection_id).first()
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")
    
    # Check access
    if current_user.role != UserRole.ADMIN and collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    schedules = db.query(SpikeSchedule).filter(
        SpikeSchedule.collection_id == collection_id
    ).options(
        joinedload(SpikeSchedule.collection),
        joinedload(SpikeSchedule.spike_fields)
    ).all()
    
    return [build_spike_schedule_response(s, db) for s in schedules]

@router.patch("/spike-schedules/{schedule_id}", response_model=SpikeScheduleResponse)
async def update_spike_schedule(
    schedule_id: int,
    schedule_data: SpikeScheduleUpdate,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Update a spike schedule."""
    schedule = db.query(SpikeSchedule).options(
        joinedload(SpikeSchedule.collection)
    ).filter(SpikeSchedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Spike schedule not found")
    
    # Check access
    if current_user.role != UserRole.ADMIN and schedule.collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Update basic fields
    if schedule_data.name is not None:
        schedule.name = schedule_data.name
    if schedule_data.start_datetime is not None:
        schedule.start_datetime = schedule_data.start_datetime
    if schedule_data.end_datetime is not None:
        schedule.end_datetime = schedule_data.end_datetime
    
    # Update spike fields if provided
    if schedule_data.spike_fields is not None:
        modified_fields_map = {sf.original_field_id: sf for sf in schedule_data.spike_fields}
        
        # Update existing spike fields
        for spike_field in schedule.spike_fields:
            if spike_field.original_field_id in modified_fields_map and is_field_editable(spike_field.value_type):
                modified = modified_fields_map[spike_field.original_field_id]
                # Update numeric values
                for attr in ['fixed_value_number', 'fixed_value_float', 'range_start_number',
                           'range_end_number', 'range_start_float', 'range_end_float',
                           'float_precision', 'start_number', 'step_number', 'reset_number']:
                    value = getattr(modified, attr)
                    if value is not None:
                        setattr(spike_field, attr, value)
    
    schedule.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(schedule)
    
    return build_spike_schedule_response(schedule, db)

@router.delete("/spike-schedules/{schedule_id}")
async def delete_spike_schedule(
    schedule_id: int,
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """Delete a spike schedule."""
    schedule = db.query(SpikeSchedule).options(
        joinedload(SpikeSchedule.collection)
    ).filter(SpikeSchedule.id == schedule_id).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Spike schedule not found")
    
    # Check access
    if current_user.role != UserRole.ADMIN and schedule.collection.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db.delete(schedule)
    db.commit()
    
    return {"message": "Spike schedule deleted successfully"}

def build_spike_schedule_response(schedule: SpikeSchedule, db: Session) -> SpikeScheduleResponse:
    """Build response object with computed fields."""
    spike_fields_response = []
    for sf in schedule.spike_fields:
        spike_fields_response.append(SpikeScheduleFieldResponse(
            id=sf.id,
            original_field_id=sf.original_field_id,
            collection_type=sf.collection_type,
            field_name=sf.field_name,
            value_type=sf.value_type,
            is_editable=is_field_editable(sf.value_type),
            fixed_value_text=sf.fixed_value_text,
            fixed_value_number=sf.fixed_value_number,
            fixed_value_float=sf.fixed_value_float,
            range_start_number=sf.range_start_number,
            range_end_number=sf.range_end_number,
            range_start_float=sf.range_start_float,
            range_end_float=sf.range_end_float,
            float_precision=sf.float_precision,
            start_number=sf.start_number,
            step_number=sf.step_number,
            reset_number=sf.reset_number,
            current_number=sf.current_number
        ))
    
    return SpikeScheduleResponse(
        id=schedule.id,
        collection_id=schedule.collection_id,
        collection_name=schedule.collection.name,
        name=schedule.name,
        start_datetime=schedule.start_datetime,
        end_datetime=schedule.end_datetime,
        status=compute_schedule_status(schedule),
        spike_fields=spike_fields_response,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )

