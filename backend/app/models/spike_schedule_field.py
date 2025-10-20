from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from app.models.field import CollectionType, ValueType
from datetime import datetime, timezone

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
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Relationships
    spike_schedule = relationship("SpikeSchedule", back_populates="spike_fields")
    original_field = relationship("Field")
