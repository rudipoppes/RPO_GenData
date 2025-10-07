#!/usr/bin/env python3
"""
Data Generator Service Runner
Runs the complete service on port 8088 serving both API and frontend.
"""
import uvicorn
import os
import sys

# Add project root and backend to path
project_root = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(project_root, 'backend')
sys.path.insert(0, project_root)
sys.path.insert(0, backend_path)

if __name__ == "__main__":
    print("Starting Data Generator Service on port 8088...")
    print("Backend API: http://0.0.0.0:8088/api/")
    print("Admin UI: http://0.0.0.0:8088/")
    print("API Docs: http://0.0.0.0:8088/docs")
    
    # Change to backend directory so relative imports work
    os.chdir(backend_path)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8088,
        reload=True,
        reload_dirs=[backend_path, os.path.join(project_root, "frontend/dist")]
    )
