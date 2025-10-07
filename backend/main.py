import sys
import os

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import uvicorn

from app.db.database import SessionLocal
from app.models.user import User
from app.auth.password import hash_password
from app.api.public import router as public_router
from app.api.auth import router as auth_router
from app.api.admin_collections import router as admin_collections_router
from app.api.admin_api_keys import router as admin_api_keys_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup - just ensure admin user exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                email="admin@example.com",
                password_hash=hash_password("admin123"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Created default admin user: admin / admin123")
    finally:
        db.close()
    
    yield

# Create FastAPI app
app = FastAPI(
    title="Data Generator Service",
    description="API for generating dynamic data with configurable fields and types",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(public_router, prefix="/api", tags=["public"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_collections_router, prefix="/api/admin", tags=["admin-collections"])
app.include_router(admin_api_keys_router, prefix="/api/admin", tags=["admin-api-keys"])

# Health check
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Data Generator API"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8088,
        reload=True
    )
