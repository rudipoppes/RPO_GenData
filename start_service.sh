#!/bin/bash
# Data Generator Service Starter for AWS
# This script starts the service on port 8088 accessible from external IP

echo "Starting Data Generator Service on port 8088..."
echo "Service will be accessible at:"
echo "  - External: http://3.26.11.198:8088/"
echo "  - Internal: http://localhost:8088/"
echo "  - API Docs: http://3.26.11.198:8088/api/docs"
echo ""
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""

cd backend
source venv/bin/activate
python start_server.py
