from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.api.public import router as public_router

# Create FastAPI app
app = FastAPI(
    title="RPO GenData API",
    description="Data generation API with admin interface",
    version="1.0.0",
    openapi_url=f"{settings.api_prefix}/openapi.json",
    docs_url=f"{settings.api_prefix}/docs",
    redoc_url=f"{settings.api_prefix}/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(public_router, prefix=settings.api_prefix, tags=["public"])

# Serve static files for the admin UI (to be added later)
static_dir = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
if os.path.exists(static_dir):
    app.mount("/admin", StaticFiles(directory=static_dir, html=True), name="admin")

    @app.get("/admin/{path:path}")
    async def serve_admin(path: str):
        """Serve the admin SPA for any admin route."""
        return FileResponse(os.path.join(static_dir, "index.html"))

# Health check endpoint
@app.get("/")
async def root():
    return {"message": "RPO GenData API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
