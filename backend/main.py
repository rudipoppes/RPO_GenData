from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import os
import uvicorn

from backend.database import create_tables, SessionLocal
from backend.models import User
from backend.auth import hash_password
from backend.routers.public import router as public_router
from backend.routers.auth import router as auth_router
from backend.routers.admin_collections import router as admin_collections_router
from backend.routers.admin_api_keys import router as admin_api_keys_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_tables()
    
    # Create default admin user
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                username="admin",
                password_hash=hash_password("admin123"),
                role="admin"
            )
            db.add(admin_user)
            db.commit()
            print("Created default admin user: admin / admin123")
    finally:
        db.close()
    
    yield
    # Shutdown
    pass

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
    allow_origins=["*"],  # In production, be more specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(public_router, prefix="/api", tags=["public"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(admin_collections_router, prefix="/api/admin", tags=["admin-collections"])
app.include_router(admin_api_keys_router, prefix="/api/admin", tags=["admin-api-keys"])

# Check if frontend dist directory exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_dist_path):
    # Mount static files
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="static")
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    # Serve the React app
    @app.get("/{path:path}")
    async def serve_spa(path: str):
        # For API routes, let them be handled by the API routers
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # For static assets
        if path.startswith("assets/") or path.endswith(('.js', '.css', '.svg', '.png', '.jpg', '.ico')):
            file_path = os.path.join(frontend_dist_path, path)
            if os.path.exists(file_path):
                return FileResponse(file_path)
        
        # For all other routes, serve index.html (SPA routing)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
    
    # Serve index.html for root path
    @app.get("/")
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
else:
    print("Frontend dist directory not found. Running API only.")
    
    @app.get("/")
    async def root():
        return {"message": "Data Generator API is running. Frontend not available."}

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
