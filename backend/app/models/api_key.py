from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
import enum

class APIKeyStatus(str, enum.Enum):
    ACTIVE = "active"
    REVOKED = "revoked"

class APIKey(Base):
    __tablename__ = "api_keys"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    key_prefix = Column(String, nullable=False)  # First few chars of key for display
    key_hash = Column(String, nullable=False, index=True)  # Hashed full key
    label = Column(String, nullable=False)  # User-defined label
    status = Column(Enum(APIKeyStatus), default=APIKeyStatus.ACTIVE, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="api_keys")
    scopes = relationship("APIKeyScope", back_populates="api_key", cascade="all, delete-orphan")
    allowed_collections = relationship("APIKeyAllowed", back_populates="api_key", cascade="all, delete-orphan")

class APIKeyScope(Base):
    __tablename__ = "api_key_scopes"

    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    scope = Column(String, nullable=False)  # e.g., "data:read"

    # Relationships
    api_key = relationship("APIKey", back_populates="scopes")

class APIKeyAllowed(Base):
    __tablename__ = "api_key_allowed"

    id = Column(Integer, primary_key=True, index=True)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=False)
    collection_id = Column(Integer, ForeignKey("collections.id"), nullable=False)
    collection_type = Column(String, nullable=True)  # Optional: restrict to Performance or Configuration

    # Relationships
    api_key = relationship("APIKey", back_populates="allowed_collections")
    collection = relationship("Collection", back_populates="api_key_allowed")
