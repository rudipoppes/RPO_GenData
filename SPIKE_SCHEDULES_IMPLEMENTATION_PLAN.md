# Spike Schedule Implementation Plan

## Overview
This plan details the implementation of "Spike Schedules" - a feature that allows users to create time-bound variations of collection field values, primarily for performance testing and load simulation scenarios.

## Core Requirements Analysis

### What are Spike Schedules?
- **Purpose**: Temporarily override field values in a collection during a specific time window
- **Target Fields**: Only performance-type numeric fields (NUMBER_FIXED, FLOAT_FIXED, NUMBER_RANGE, FLOAT_RANGE, INCREMENT, DECREMENT)
- **Field Storage**: ALL fields are copied from collection to spike schedule, but only numeric performance fields can be modified
- **Exclusions**: No spike schedules for configuration fields or text/epoch fields (they're copied but not editable)
- **Lifecycle**: Automatically deleted when the end datetime passes
- **Use Case**: Simulating load spikes, performance variations, or special event scenarios

### User Workflows

#### 1. Create Spike Schedule
- **From Collections List Page** (`/collections`): Add "Spikes" link in top menu
- **From Individual Collection Page** (`/collections/:id`): Add "Create Spike" button next to "Edit Collection"
- **Process**:
  1. User clicks "Create Spike" 
  2. System copies ALL fields from the collection (both Performance and Configuration)
  3. Modal/form opens with:
     - Schedule name field
     - Start datetime picker
     - End datetime picker
     - Editable field values (ONLY performance numeric fields shown in UI)
     - Configuration/text/epoch fields are hidden but copied with original values
  4. User modifies numeric performance field values as needed
  5. Save creates spike schedule record with ALL fields

#### 2. List All Spike Schedules
- **Location**: New top menu item "Spikes" (in Layout.tsx navigation)
- **Display**: Table showing all spike schedules with:
  - Schedule name
  - Associated collection name
  - Start datetime
  - End datetime
  - Status (Active/Scheduled/Expired)
  - Actions (Edit, Delete)

#### 3. Manage Spike Schedules
- **Edit**: Modify start/end datetimes and numeric performance field values
- **Delete**: Remove spike schedule immediately
- **View**: See which fields are modified and their spike values

### Technical Architecture

## Database Design

### New Table: `spike_schedules`
```sql
CREATE TABLE spike_schedules (
    id INTEGER PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(collection_id) REFERENCES collections(id)
);
```

### New Table: `spike_schedule_fields`
**IMPORTANT**: This table stores copies of ALL fields, not just numeric ones.

```sql
CREATE TABLE spike_schedule_fields (
    id INTEGER PRIMARY KEY,
    spike_schedule_id INTEGER NOT NULL REFERENCES spike_schedules(id) ON DELETE CASCADE,
    original_field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    collection_type VARCHAR(13) NOT NULL,
    field_name VARCHAR NOT NULL,
    value_type VARCHAR(12) NOT NULL,
    
    -- All possible field value columns (same as fields table)
    fixed_value_text VARCHAR,
    fixed_value_number INTEGER,
    fixed_value_float FLOAT,
    range_start_number INTEGER,
    range_end_number INTEGER,
    range_start_float FLOAT,
    range_end_float FLOAT,
    float_precision INTEGER,
    start_number FLOAT,
    step_number FLOAT,
    reset_number FLOAT,
    current_number FLOAT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY(spike_schedule_id) REFERENCES spike_schedules(id),
    FOREIGN KEY(original_field_id) REFERENCES fields(id)
);
```

### Indexes for Performance
```sql
CREATE INDEX idx_spike_schedules_collection ON spike_schedules(collection_id);
CREATE INDEX idx_spike_schedules_datetime ON spike_schedules(start_datetime, end_datetime);
CREATE INDEX idx_spike_schedule_fields_schedule ON spike_schedule_fields(spike_schedule_id);
CREATE INDEX idx_spike_schedule_fields_original ON spike_schedule_fields(original_field_id);
```

## Backend Implementation

### 1. Database Models (`/backend/app/models/`)

**New File: `spike_schedule.py`**
```python
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime

class SpikeSchedule(Base):
    __tablename__ = "spike_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    name = Column(String, nullable=False)
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    collection = relationship("Collection", back_populates="spike_schedules")
    spike_fields = relationship("SpikeScheduleField", back_populates="spike_schedule", cascade="all, delete-orphan")
```

**New File: `spike_schedule_field.py`**
```python
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.field import CollectionType, ValueType
from datetime import datetime

class SpikeScheduleField(Base):
    __tablename__ = "spike_schedule_fields"
    
    id = Column(Integer, primary_key=True, index=True)
    spike_schedule_id = Column(Integer, ForeignKey("spike_schedules.id"), nullable=False)
    original_field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    
    # Copy field metadata
    collection_type = Column(Enum(CollectionType), nullable=False)
    field_name = Column(String, nullable=False)
    value_type = Column(Enum(ValueType), nullable=False)
    
    # Copy ALL field values (same as Field model)
    fixed_value_text = Column(String, nullable=True)
    fixed_value_number = Column(Integer, nullable=True)
    fixed_value_float = Column(Float, nullable=True)
    range_start_number = Column(Integer, nullable=True)
    range_end_number = Column(Integer, nullable=True)
    range_start_float = Column(Float, nullable=True)
    range_end_float = Column(Float, nullable=True)
    float_precision = Column(Integer, nullable=True, default=2)
    start_number = Column(Float, nullable=True)
    step_number = Column(Float, nullable=True)
    reset_number = Column(Float, nullable=True)
    current_number = Column(Float, nullable=True)  # Independent state for INCREMENT/DECREMENT
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    spike_schedule = relationship("SpikeSchedule", back_populates="spike_fields")
    original_field = relationship("Field")
```

**Update: `collection.py`**
- Add relationship: `spike_schedules = relationship("SpikeSchedule", back_populates="collection", cascade="all, delete-orphan")`

### 2. Pydantic Schemas (`/backend/app/schemas/`)

**New File: `spike_schedule.py`**
```python
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
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

class SpikeScheduleCreate(BaseModel):
    collection_id: int
    name: str
    start_datetime: datetime
    end_datetime: datetime
    spike_fields: List[SpikeScheduleFieldCreate]  # Only modified fields sent from UI
    
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

class SpikeScheduleFieldResponse(BaseModel):
    """Response includes all field data"""
    id: int
    original_field_id: int
    collection_type: CollectionType
    field_name: str
    value_type: ValueType
    is_editable: bool  # Computed: True for numeric performance fields
    
    # All field values
    fixed_value_text: Optional[str]
    fixed_value_number: Optional[int]
    fixed_value_float: Optional[float]
    range_start_number: Optional[int]
    range_end_number: Optional[int]
    range_start_float: Optional[float]
    range_end_float: Optional[float]
    float_precision: Optional[int]
    start_number: Optional[float]
    step_number: Optional[float]
    reset_number: Optional[float]
    current_number: Optional[float]
    
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
```

### 3. API Endpoints (`/backend/app/api/`)

**New File: `admin_spike_schedules.py`**
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime

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
    now = datetime.utcnow()
    if now < schedule.start_datetime:
        return "scheduled"
    elif now > schedule.end_datetime:
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
    
    schedule.updated_at = datetime.utcnow()
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
```

### 4. Data Generation Logic Update (`/backend/app/api/public.py`)

**Modify `get_generated_data` function**:
```python
from app.models.spike_schedule import SpikeSchedule
from app.models.spike_schedule_field import SpikeScheduleField

@router.get("/{collection_name}/{collection_type}")
async def get_generated_data(...):
    # ... existing validation code ...
    
    # Check for active spike schedule
    now = datetime.utcnow()
    active_spike = db.query(SpikeSchedule).filter(
        SpikeSchedule.collection_id == collection.id,
        SpikeSchedule.start_datetime <= now,
        SpikeSchedule.end_datetime >= now
    ).first()
    
    # Generate data
    data = {}
    
    if active_spike:
        # Use spike schedule fields (ALL fields, not just collection fields)
        spike_fields = db.query(SpikeScheduleField).filter(
            SpikeScheduleField.spike_schedule_id == active_spike.id,
            SpikeScheduleField.collection_type == collection_type_enum
        ).all()
        
        for spike_field in spike_fields:
            # Create temporary field object with spike values
            temp_field = Field(
                id=spike_field.original_field_id,
                collection_id=collection.id,
                collection_type=spike_field.collection_type,
                field_name=spike_field.field_name,
                value_type=spike_field.value_type,
                fixed_value_text=spike_field.fixed_value_text,
                fixed_value_number=spike_field.fixed_value_number,
                fixed_value_float=spike_field.fixed_value_float,
                range_start_number=spike_field.range_start_number,
                range_end_number=spike_field.range_end_number,
                range_start_float=spike_field.range_start_float,
                range_end_float=spike_field.range_end_float,
                float_precision=spike_field.float_precision,
                start_number=spike_field.start_number,
                step_number=spike_field.step_number,
                reset_number=spike_field.reset_number,
                current_number=spike_field.current_number
            )
            
            try:
                value = ValueGenerator.generate_value(temp_field, db)
                
                # Update spike field's current_number if it changed
                if temp_field.current_number != spike_field.current_number:
                    spike_field.current_number = temp_field.current_number
                    db.flush()
                
                data[spike_field.field_name] = value
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Error generating value for field '{spike_field.field_name}'"
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
```

### 5. Background Cleanup Job

**Update `/backend/app/main.py`**:
```python
import asyncio
from datetime import datetime
from app.models.spike_schedule import SpikeSchedule
from app.db.database import SessionLocal

async def cleanup_expired_spike_schedules():
    """Background task to delete expired spike schedules every 5 minutes."""
    while True:
        await asyncio.sleep(300)  # 5 minutes
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired_schedules = db.query(SpikeSchedule).filter(
                SpikeSchedule.end_datetime < now
            ).all()
            
            if expired_schedules:
                for schedule in expired_schedules:
                    db.delete(schedule)
                db.commit()
                print(f"Deleted {len(expired_schedules)} expired spike schedules")
        except Exception as e:
            print(f"Error cleaning up spike schedules: {e}")
            db.rollback()
        finally:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    # ... existing admin user creation ...
    
    # Start cleanup task
    cleanup_task = asyncio.create_task(cleanup_expired_spike_schedules())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()

# Add spike schedules router
from app.api.admin_spike_schedules import router as spike_schedules_router
app.include_router(spike_schedules_router, prefix="/api/admin", tags=["admin-spike-schedules"])
```

## Frontend Implementation

### 1. TypeScript Types (`/frontend/src/types/api.ts`)

```typescript
export interface SpikeScheduleField {
  id?: number;
  original_field_id: number;
  collection_type: "Performance" | "Configuration";
  field_name: string;
  value_type: 'TEXT_FIXED' | 'NUMBER_FIXED' | 'FLOAT_FIXED' | 'EPOCH_NOW' | 'NUMBER_RANGE' | 'FLOAT_RANGE' | 'INCREMENT' | 'DECREMENT';
  is_editable: boolean;  // Only true for numeric performance types
  
  // All possible field values
  fixed_value_text?: string;
  fixed_value_number?: number;
  fixed_value_float?: number;
  range_start_number?: number;
  range_end_number?: number;
  range_start_float?: number;
  range_end_float?: number;
  float_precision?: number;
  start_number?: number;
  step_number?: number;
  reset_number?: number;
  current_number?: number;
}

export interface SpikeSchedule {
  id: number;
  collection_id: number;
  collection_name: string;
  name: string;
  start_datetime: string;
  end_datetime: string;
  status: 'scheduled' | 'active' | 'expired';
  spike_fields: SpikeScheduleField[];
  created_at: string;
  updated_at: string;
}

export interface CreateSpikeScheduleRequest {
  collection_id: number;
  name: string;
  start_datetime: string;
  end_datetime: string;
  spike_fields: Array<{
    original_field_id: number;
    fixed_value_number?: number;
    fixed_value_float?: number;
    range_start_number?: number;
    range_end_number?: number;
    range_start_float?: number;
    range_end_float?: number;
    float_precision?: number;
    start_number?: number;
    step_number?: number;
    reset_number?: number;
  }>;
}
```

### 2. API Service (`/frontend/src/services/api.ts`)

```typescript
export const spikeSchedulesApi = {
  list: (): Promise<SpikeSchedule[]> =>
    api.get('/admin/spike-schedules').then(res => res.data),

  listByCollection: (collectionId: number): Promise<SpikeSchedule[]> =>
    api.get(`/admin/collections/${collectionId}/spike-schedules`).then(res => res.data),

  get: (id: number): Promise<SpikeSchedule> =>
    api.get(`/admin/spike-schedules/${id}`).then(res => res.data),

  create: (schedule: CreateSpikeScheduleRequest): Promise<SpikeSchedule> =>
    api.post('/admin/spike-schedules', schedule).then(res => res.data),

  update: (id: number, schedule: Partial<CreateSpikeScheduleRequest>): Promise<SpikeSchedule> =>
    api.patch(`/admin/spike-schedules/${id}`, schedule).then(res => res.data),

  delete: (id: number): Promise<void> =>
    api.delete(`/admin/spike-schedules/${id}`).then(res => res.data),
};
```

### 3. UI Components

Frontend components will:
- Display ALL fields in spike schedule detail view
- Only allow editing of numeric performance fields (is_editable === true)
- Gray out or disable non-editable fields
- Show clear indication which fields are modifiable vs. read-only

## Key Design Decisions Summary

### 1. Field Copying Strategy
- **Decision**: Copy ALL fields (Performance + Configuration) to spike schedule
- **UI Behavior**: Only show/allow editing of numeric performance fields
- **Backend Storage**: Store all fields with their complete configuration
- **Rationale**: 
  - Ensures all fields continue to generate during spike
  - Simplifies data generation logic (use spike fields OR collection fields, not a mix)
  - Configuration fields maintain their values during spike period
  - Text and epoch fields work normally during spike

### 2. Data Generation Logic
- **Simple Check**: Is there an active spike? Yes → use spike_schedule_fields, No → use fields
- **No Merging**: Don't mix spike fields and collection fields
- **Clean Separation**: Either all fields come from spike or all from collection

### 3. Automatic Cleanup
- **Method**: Background task every 5 minutes
- **Action**: Delete schedules where end_datetime < now
- **Logging**: Print count of deleted schedules

### 4. State Management for INCREMENT/DECREMENT
- **Independent State**: Spike fields have their own current_number
- **No Interference**: Original field counters unaffected during spike
- **Clean Resume**: After spike expires, original counters continue from where they were

## Implementation Checklist

- [ ] Create database models (SpikeSchedule, SpikeScheduleField)
- [ ] Create Alembic migration
- [ ] Create Pydantic schemas
- [ ] Implement API endpoints
- [ ] Modify data generation logic in public.py
- [ ] Add background cleanup task
- [ ] Update collection model relationship
- [ ] Create TypeScript types
- [ ] Create API service methods
- [ ] Create SpikeSchedules list page
- [ ] Create CreateSpikeSchedule page
- [ ] Create EditSpikeSchedule page
- [ ] Update Layout navigation
- [ ] Update CollectionDetail with "Create Spike" button
- [ ] Add routes to App.tsx
- [ ] Test all functionality

