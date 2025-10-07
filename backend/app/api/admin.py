from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.auth.jwt_auth import get_current_admin_or_editor_user
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_admin_or_editor_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics for admin users.
    """
    try:
        # Count collections
        total_collections = db.query(Collection).count()
        
        # Count API keys - placeholder for now
        total_api_keys = 0  # This would need to be implemented with proper API key tracking
        
        # Request counts - placeholder for now  
        total_requests_today = 0  # This would need to be implemented with proper request tracking
        total_requests_month = 0  # This would need to be implemented with proper request tracking
        
        return {
            "total_collections": total_collections,
            "total_api_keys": total_api_keys,
            "total_requests_today": total_requests_today,
            "total_requests_month": total_requests_month
        }
    except Exception as e:
        logger.error(f"Failed to get dashboard stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get dashboard statistics")
