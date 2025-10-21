from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    owner = relationship("User", back_populates="collections")
    fields = relationship("Field", back_populates="collection", cascade="all, delete-orphan")
    api_key_allowed = relationship("APIKeyAllowed", back_populates="collection", cascade="all, delete-orphan")
    spike_schedules = relationship("SpikeSchedule", back_populates="collection", cascade="all, delete-orphan")
