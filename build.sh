#!/bin/bash
set -e

echo "Building Data Generator Service..."

# Build frontend
echo "Building frontend..."
cd frontend
npm run build
cd ..

echo "Frontend built successfully!"
echo ""
echo "To run the service:"
echo "  python run_service.py"
echo ""
echo "Service will be available on:"
echo "  - Admin UI: http://localhost:8088/"
echo "  - API: http://localhost:8088/api/"
echo "  - API Documentation: http://localhost:8088/docs"
echo ""
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"
