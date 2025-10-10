from pydantic import BaseModel
from typing import Optional, List

class FolderCreate(BaseModel):
    name: str
    parent_folder_id: Optional[int] = None

class FolderUpdate(BaseModel):
    name: Optional[str] = None
    parent_folder_id: Optional[int] = None

class FolderResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    folder_path: Optional[str] = None
    parent_folder_id: Optional[int] = None
    is_folder: bool

    class Config:
        from_attributes = True

class FolderNode(FolderResponse):
    children: List['FolderNode'] = []

    class Config:
        from_attributes = True
