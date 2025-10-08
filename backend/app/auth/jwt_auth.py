from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends, Cookie, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.user import User

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token with renewable session support."""
    to_encode = data.copy()
    now = datetime.utcnow()
    
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    # Add session metadata for sliding sessions
    to_encode.update({
        "exp": expire,
        "iat": now.timestamp(),
        "renewable_until": (now + timedelta(hours=settings.max_session_hours)).timestamp()
    })
    
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError:
        return None

def should_refresh_token(payload: Dict[str, Any]) -> bool:
    """Check if token should be refreshed (within refresh threshold of expiry)."""
    if not payload:
        return False
    
    exp = payload.get("exp")
    renewable_until = payload.get("renewable_until")
    
    if not exp or not renewable_until:
        return False
    
    now = datetime.utcnow().timestamp()
    
    # Don't refresh if past renewable window
    if now > renewable_until:
        return False
    
    # Refresh if token expires within threshold
    time_until_expiry = exp - now
    threshold_seconds = settings.refresh_threshold_minutes * 60
    
    return 0 < time_until_expiry <= threshold_seconds

def get_current_user_from_token(token: str, db: Session) -> Optional[User]:
    """Get the current user from a JWT token."""
    payload = verify_token(token)
    if payload is None:
        return None
    
    user_id = payload.get("sub")
    if user_id is None:
        return None
    
    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return None
    
    user = db.query(User).filter(User.id == user_id).first()
    return user

async def get_current_user(
    response: Response,
    session_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """Dependency to get current authenticated user with auto-refresh capability."""
    
    if not session_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    payload = verify_token(session_token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Check if session is still renewable
    renewable_until = payload.get("renewable_until")
    if renewable_until and datetime.utcnow().timestamp() > renewable_until:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired - please log in again"
        )
    
    user = get_current_user_from_token(session_token, db)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    
    # Auto-refresh if needed
    if should_refresh_token(payload):
        new_token = create_access_token(data={"sub": str(user.id)})
        response.set_cookie(
            key="session_token",
            value=new_token,
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax",
            max_age=settings.access_token_expire_minutes * 60
        )
        # Add header to indicate refresh occurred
        response.headers["X-Token-Refreshed"] = "true"
    
    # Update last login time
    user.last_login_at = datetime.utcnow()
    db.commit()
    
    return user

async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to ensure the current user is an admin."""
    from app.models.user import UserRole
    
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

async def get_current_admin_or_editor_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Dependency to ensure the current user is an admin or editor."""
    from app.models.user import UserRole
    
    if current_user.role not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin or Editor access required"
        )
    return current_user
