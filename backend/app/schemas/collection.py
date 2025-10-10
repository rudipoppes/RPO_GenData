from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.field import CollectionType, ValueType

class CollectionCreate(BaseModel):
    name: str
    parent_folder_id: Optional[int] = None

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    parent_folder_id: Optional[int] = None

class CollectionResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    owner_username: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FieldCreate(BaseModel):
    collection_type: CollectionType
    field_name: str
    value_type: ValueType
    
    # Fixed value fields
    fixed_value_text: Optional[str] = None
    fixed_value_number: Optional[int] = None
    fixed_value_float: Optional[float] = None
    
    # Range fields
    range_start_number: Optional[int] = None
    range_end_number: Optional[int] = None
    range_start_float: Optional[float] = None
    range_end_float: Optional[float] = None
    float_precision: Optional[int] = 2
    
    # Increment/Decrement fields
    start_number: Optional[float] = None
    step_number: Optional[float] = None
    reset_number: Optional[float] = None

class FieldUpdate(BaseModel):
    field_name: Optional[str] = None
    value_type: Optional[ValueType] = None
    
    # Fixed value fields
    fixed_value_text: Optional[str] = None
    fixed_value_number: Optional[int] = None
    fixed_value_float: Optional[float] = None
    
    # Range fields
    range_start_number: Optional[int] = None
    range_end_number: Optional[int] = None
    range_start_float: Optional[float] = None
    range_end_float: Optional[float] = None
    float_precision: Optional[int] = None
    
    # Increment/Decrement fields
    start_number: Optional[float] = None
    step_number: Optional[float] = None
    reset_number: Optional[float] = None

class FieldResponse(BaseModel):
    id: int
    collection_id: int
    collection_type: CollectionType
    field_name: str
    value_type: ValueType
    
    # Fixed value fields
    fixed_value_text: Optional[str] = None
    fixed_value_number: Optional[int] = None
    fixed_value_float: Optional[float] = None
    
    # Range fields
    range_start_number: Optional[int] = None
    range_end_number: Optional[int] = None
    range_start_float: Optional[float] = None
    range_end_float: Optional[float] = None
    float_precision: Optional[int] = None
    
    # Increment/Decrement fields
    start_number: Optional[float] = None
    step_number: Optional[float] = None
    reset_number: Optional[float] = None
    current_number: Optional[float] = None
    
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CollectionWithFields(CollectionResponse):
    fields: List[FieldResponse] = []
