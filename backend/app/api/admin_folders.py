from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.collection import Collection
from app.schemas.folder import FolderCreate, FolderUpdate, FolderResponse
from app.auth.jwt_auth import get_current_user

router = APIRouter()

@router.post("/folders", response_model=FolderResponse)
async def create_folder(
    data: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    parent: Optional[Collection] = None
    if data.parent_folder_id:
        parent = (
            db.query(Collection)
            .filter(Collection.id == data.parent_folder_id, Collection.is_folder == True)
            .first()
        )
        if not parent:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parent folder not found")
        # User isolation: non-admins can only create under their own folders
        if current_user.role != UserRole.ADMIN and parent.owner_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for parent folder")

    # Determine owner for folder
    owner_id = current_user.id if current_user.role != UserRole.ADMIN else (parent.owner_id if parent else current_user.id)

    # Create folder record
    folder = Collection(
        name=data.name,
        owner_id=owner_id,
        is_folder=True,
        parent_folder_id=parent.id if parent else None,
    )
    # Construct folder_path (best-effort)
    if parent and parent.folder_path:
        folder.folder_path = f"{parent.folder_path}{data.name}/"

    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder

@router.get("/folders", response_model=List[FolderResponse])
async def list_folders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(Collection).filter(Collection.is_folder == True)
    if current_user.role != UserRole.ADMIN:
        q = q.filter(Collection.owner_id == current_user.id)
    return q.all()

@router.put("/folders/{folder_id}", response_model=FolderResponse)
async def update_folder(
    folder_id: int,
    data: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.query(Collection).filter(Collection.id == folder_id, Collection.is_folder == True).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    if current_user.role != UserRole.ADMIN and folder.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    if data.name:
        folder.name = data.name
        if folder.folder_path:
            parent_path = folder.folder_path.rsplit('/', 2)[0] + '/' if '/' in folder.folder_path.strip('/') else '/'
            folder.folder_path = f"{parent_path}{data.name}/"

    if data.parent_folder_id is not None:
        if data.parent_folder_id == 0:
            folder.parent_folder_id = None
            folder.folder_path = None
        else:
            new_parent = (
                db.query(Collection)
                .filter(Collection.id == data.parent_folder_id, Collection.is_folder == True)
                .first()
            )
            if not new_parent:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Destination folder not found")
            if current_user.role != UserRole.ADMIN and new_parent.owner_id != current_user.id:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for destination")
            folder.parent_folder_id = new_parent.id
            if new_parent.folder_path:
                folder.folder_path = f"{new_parent.folder_path}{folder.name}/"

    db.commit()
    db.refresh(folder)
    return folder

@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    folder = db.query(Collection).filter(Collection.id == folder_id, Collection.is_folder == True).first()
    if not folder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Folder not found")
    if current_user.role != UserRole.ADMIN and folder.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted"}
