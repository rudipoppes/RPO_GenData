from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime, timezone
from app.models.field import CollectionType, ValueType

class SpikeScheduleFieldCreate(BaseModel):
    """Only includes editable fields - numeric performance types"""
    original_field_id: int
    fixed_value_number: Optional[int] = None
    fixed_value_float: Optional[float] = None
    range_start_number: Optional[int] = None
    range_end_number: Optional[int] = None
    range_start_float: Optional[float] = None
    range_end_float: Optional[float] = None
    float_precision: Optional[int] = None
    start_number: Optional[float] = None
    step_number: Optional[float] = None
    reset_number: Optional[float] = None
    randomization_percentage: Optional[float] = 0.0

class SpikeScheduleCreate(BaseModel):
    collection_id: int
    name: str
    start_datetime: datetime
    end_datetime: datetime
    spike_fields: List[SpikeScheduleFieldCreate]  # Only modified fields sent from UI
    
    @validator('start_datetime', pre=True)
    def make_start_datetime_timezone_aware(cls, v):
        if isinstance(v, datetime):
            return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)
        return v
    
    @validator('end_datetime', pre=True)
    def make_end_datetime_timezone_aware(cls, v):
        if isinstance(v, datetime):
            return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)
        return v
    
    @validator('end_datetime')
    def end_after_start(cls, v, values):
        if 'start_datetime' in values and v <= values['start_datetime']:
            raise ValueError('end_datetime must be after start_datetime')
        return v

class SpikeScheduleUpdate(BaseModel):
    name: Optional[str] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    spike_fields: Optional[List[SpikeScheduleFieldCreate]] = None
    
    @validator('start_datetime', pre=True)
    def make_start_datetime_timezone_aware(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)
        return v
    
    @validator('end_datetime', pre=True)
    def make_end_datetime_timezone_aware(cls, v):
        if v is None:
            return v
        if isinstance(v, datetime):
            return v if v.tzinfo is not None else v.replace(tzinfo=timezone.utc)
        return v
    
    @validator('end_datetime')
    def end_after_start(cls, v, values):
        if v is not None and 'start_datetime' in values and values['start_datetime'] is not None:
            if v <= values['start_datetime']:
                raise ValueError('end_datetime must be after start_datetime')
        return v

class SpikeScheduleFieldResponse(BaseModel):
    """Response includes all field data"""
    id: int
    original_field_id: int
    collection_type: CollectionType
    field_name: str
    value_type: ValueType
    is_editable: bool  # Computed: True for numeric performance fields
    
    # All field values
    fixed_value_text: Optional[str] = None
    fixed_value_number: Optional[int] = None
    fixed_value_float: Optional[float] = None
    range_start_number: Optional[int] = None
    range_end_number: Optional[int] = None
    range_start_float: Optional[float] = None
    range_end_float: Optional[float] = None
    float_precision: Optional[int] = None
    start_number: Optional[float] = None
    step_number: Optional[float] = None
    reset_number: Optional[float] = None
    current_number: Optional[float] = None
    
    # Randomization field - only used for INCREMENT/DECREMENT types
    randomization_percentage: Optional[float] = None
    
    class Config:
        from_attributes = True

class SpikeScheduleResponse(BaseModel):
    id: int
    collection_id: int
    collection_name: str  # Computed from relationship
    name: str
    start_datetime: datetime
    end_datetime: datetime
    status: str  # Computed: "scheduled", "active", or "expired"
    spike_fields: List[SpikeScheduleFieldResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v and v.tzinfo else v.isoformat() + '+00:00'
        }

