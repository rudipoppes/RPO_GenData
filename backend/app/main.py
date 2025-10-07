from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.api.public import router as public_router
from app.api.auth import router as auth_router
from app.api.admin_collections import router as admin_collections_router
from app.api.admin_api_keys import router as admin_api_keys_router

# Create FastAPI app
app = FastAPI(
    title="Data Generator Service",
    description="Data generation API with admin interface",
    version="1.0.0",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for external access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers FIRST (before catch-all route)
app.include_router(public_router, prefix=f"{settings.api_prefix}/data", tags=["public"])
app.include_router(auth_router, prefix=f"{settings.api_prefix}/auth", tags=["authentication"])
app.include_router(admin_collections_router, prefix=f"{settings.api_prefix}/admin", tags=["admin-collections"])
app.include_router(admin_api_keys_router, prefix=f"{settings.api_prefix}/admin", tags=["admin-api-keys"])

# Health check for API
@app.get(f"{settings.api_prefix}/health")
async def health_check():
    return {"status": "healthy", "service": "Data Generator API"}

# Check if frontend dist directory exists
frontend_dist_path = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(frontend_dist_path):
    # Mount static assets
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist_path, "assets")), name="assets")
    
    # Root path for React app
    @app.get("/", include_in_schema=False)
    async def serve_root():
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
    
    # Catch-all route for React SPA - but EXCLUDE API paths
    @app.get("/{path:path}", include_in_schema=False)
    async def serve_spa(path: str):
        # DO NOT serve API routes - let them return 404 instead of serving React app
        if path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        
        # For static assets
        if path.startswith("assets/") or path.endswith(('.js', '.css', '.svg', '.png', '.jpg', '.ico')):
            file_path = os.path.join(frontend_dist_path, path)
            if os.path.exists(file_path):
                return FileResponse(file_path)
        
        # For all other routes (React SPA routing)
        return FileResponse(os.path.join(frontend_dist_path, "index.html"))
        
else:
    print("Frontend dist directory not found. Running API only.")
    
    # Root endpoint when no frontend
    @app.get("/")
    async def root():
        return {"message": "Data Generator API", "version": "1.0.0", "docs": f"{settings.api_prefix}/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
