#!/usr/bin/env python3
"""
RPO GenData Server Startup Script
"""
import uvicorn
from app.main import app
from app.core.config import settings
from app.db.init_db import create_initial_admin_user

def main():
    """Start the server with database initialization."""
    print("Initializing database...")
    create_initial_admin_user()
    
    print(f"Starting RPO GenData server on {settings.host}:{settings.port}")
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )

if __name__ == "__main__":
    main()
