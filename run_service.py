#!/usr/bin/env python3
"""
Data Generator Service Runner
Runs the complete service on port 8088 serving both API and frontend.
"""
import uvicorn
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

if __name__ == "__main__":
    print("Starting Data Generator Service on port 8088...")
    print("Backend API: http://0.0.0.0:8088/api/")
    print("Admin UI: http://0.0.0.0:8088/")
    print("API Docs: http://0.0.0.0:8088/docs")
    
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8088,
        reload=True,
        reload_dirs=["backend", "frontend/dist"]
    )
