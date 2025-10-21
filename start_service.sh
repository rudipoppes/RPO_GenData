#!/bin/bash
# Data Generator Service Starter for AWS
# This script starts the service on port 8088 accessible from external IP

echo "Starting Data Generator Service on port 8088..."
echo "Service will be accessible at:"
echo "  - External: http://<hostname>:8088/"
echo "  - Internal: http://localhost:8088/"
echo "  - API Docs: http://<hostname>:8088/api/docs"
echo ""

cd backend
source venv/bin/activate
python start_server.py
