from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship, backref
from app.db.database import Base
from datetime import datetime

class Collection(Base):
    __tablename__ = "collections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # Hierarchy support
    folder_path = Column(String, unique=True, index=True, nullable=True)
    parent_folder_id = Column(Integer, ForeignKey("collections.id"), nullable=True)
    is_folder = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    owner = relationship("User", back_populates="collections")
    fields = relationship("Field", back_populates="collection", cascade="all, delete-orphan")
    api_key_allowed = relationship("APIKeyAllowed", back_populates="collection", cascade="all, delete-orphan")
    # Self-referential folder hierarchy
    parent_folder = relationship(
        "Collection",
        remote_side=[id],
        backref=backref("children", cascade="all, delete-orphan"),
        foreign_keys=[parent_folder_id],
    )

    # Helper methods
    def get_path(self) -> str:
        if self.folder_path:
            return self.folder_path
        # Build from parents if folder_path not set
        parts = []
        node = self
        while node is not None:
            if node.name:
                parts.append(node.name)
            node = node.parent_folder
        return "/".join(reversed(parts))
