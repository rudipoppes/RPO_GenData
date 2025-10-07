from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, UniqueConstraint, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum

class CollectionType(str, enum.Enum):
    PERFORMANCE = "Performance"
    CONFIGURATION = "Configuration"

class ValueType(str, enum.Enum):
    TEXT_FIXED = "TEXT_FIXED"
    NUMBER_FIXED = "NUMBER_FIXED" 
    FLOAT_FIXED = "FLOAT_FIXED"
    EPOCH_NOW = "EPOCH_NOW"
    NUMBER_RANGE = "NUMBER_RANGE"
    FLOAT_RANGE = "FLOAT_RANGE"
    INCREMENT = "INCREMENT"
    DECREMENT = "DECREMENT"

class Field(Base):
    __tablename__ = "fields"
    __table_args__ = (
        UniqueConstraint('collection_id', 'collection_type', 'field_name', name='unique_field_per_collection_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    collection_type = Column(Enum(CollectionType), nullable=False)
    field_name = Column(String, nullable=False)
    value_type = Column(Enum(ValueType), nullable=False)
    
    # Fixed value fields
    fixed_value_text = Column(String, nullable=True)
    fixed_value_number = Column(Integer, nullable=True)
    fixed_value_float = Column(Float, nullable=True)
    
    # Range fields
    range_start_number = Column(Integer, nullable=True)
    range_end_number = Column(Integer, nullable=True)
    range_start_float = Column(Float, nullable=True)
    range_end_float = Column(Float, nullable=True)
    float_precision = Column(Integer, nullable=True, default=2)
    
    # Increment/Decrement fields
    start_number = Column(Float, nullable=True)
    step_number = Column(Float, nullable=True)
    reset_number = Column(Float, nullable=True)
    current_number = Column(Float, nullable=True)  # Persisted state
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    collection = relationship("Collection", back_populates="fields")
