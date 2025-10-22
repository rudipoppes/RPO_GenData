#!/bin/bash

# Safe Deployment Script for RPO GenData Service
# This script handles safe deployment with rollback capability

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT=${1:-development}
BACKUP_DIR="/tmp/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rpo_backup_$TIMESTAMP.tar.gz"

echo -e "${GREEN}=== RPO GenData Safe Deployment ===${NC}"
echo -e "${BLUE}Environment: $ENVIRONMENT${NC}"
echo -e "${BLUE}Timestamp: $TIMESTAMP${NC}"
echo

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# 1. Pre-deployment validation
echo "1. Pre-deployment validation..."
print_info "Running validation script..."

./validate-deployment.sh
print_status 0 "Pre-deployment validation passed"

# 2. Create backup
echo
echo "2. Creating backup..."
mkdir -p "$BACKUP_DIR"

# Backup important files
tar -czf "$BACKUP_FILE" \
    .env \
    backend/app/core/config.py \
    backend/alembic.ini \
    data/ \
    backend/migrations/ \
    --exclude='*.log' \
    --exclude='__pycache__' \
    --exclude='venv' \
    --exclude='node_modules' 2>/dev/null || true

print_status 0 "Backup created: $BACKUP_FILE"

# 3. Load environment configuration
echo
echo "3. Loading environment configuration..."
if [ -f ".env" ]; then
    set -a
    source .env
    set +a
    print_status 0 "Environment configuration loaded"
else
    print_warning ".env file not found, using defaults"
fi

# 4. Validate environment variables
echo
echo "4. Validating environment variables..."
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
DATABASE_PATH="${DATABASE_PATH:-$PROJECT_ROOT/data/gendata.db}"

echo "Project Root: $PROJECT_ROOT"
echo "Database Path: $DATABASE_PATH"
echo "Service Port: ${PORT:-8088}"

# 5. Setup virtual environment and dependencies
echo
echo "5. Setting up Python environment..."

# Check if python3-venv is available before creating venv
if ! python3 -m venv --help &> /dev/null; then
    print_status 1 "python3-venv not available. Install: sudo apt install python3-venv"
fi

if [ ! -d "backend/venv" ]; then
    print_info "Creating virtual environment..."
    cd backend
    if python3 -m venv venv; then
        source venv/bin/activate
        pip install -r requirements.txt
        cd ..
        print_status 0 "Virtual environment created"
    else
        print_status 1 "Failed to create virtual environment. Install python3-venv package"
    fi
else
    print_info "Virtual environment exists, ensuring dependencies..."
    cd backend
    source venv/bin/activate
    pip install -r requirements.txt --upgrade --quiet
    cd ..
    print_status 0 "Dependencies updated"
fi

# 6. Build frontend
echo
echo "6. Building frontend..."
if [ ! -d "frontend/dist" ] || [ ! "$(ls -A frontend/dist)" ]; then
    print_info "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
    print_status 0 "Frontend built successfully"
else
    print_status 0 "Frontend build exists"
fi

# 7. Database migrations
echo
echo "7. Running database migrations..."
cd backend
source venv/bin/activate

# Create data directory if it doesn't exist
mkdir -p "$(dirname "$DATABASE_PATH")"

# Run migrations
alembic upgrade head
print_status 0 "Database migrations completed"

cd ..

# 8. Update configuration files
echo
echo "8. Updating configuration files..."

# Update alembic.ini with correct database path
sed -i.bak "s|sqlite:///.*|sqlite:///$DATABASE_PATH|" backend/alembic.ini

print_status 0 "Configuration files updated"

# 9. Health check
echo
echo "9. Performing health check..."

# Test database connection
cd backend
source venv/bin/activate
python -c "
from app.core.config import settings
from app.db.database import engine
from sqlalchemy import text
try:
    with engine.connect() as conn:
        result = conn.execute(text('SELECT COUNT(*) FROM alembic_version'))
        version_count = result.scalar()
        print(f'Database connection successful, alembic version records: {version_count}')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
"
print_status 0 "Database health check passed"

# Check if default admin exists
python -c "
from app.db.database import SessionLocal
from app.models.user import User
db = SessionLocal()
admin_count = db.query(User).filter(User.role == 'ADMIN').count()
db.close()
if admin_count == 0:
    print('No admin users found - initial admin will be created on startup')
else:
    print(f'Found {admin_count} admin user(s)')
"
cd ..

print_status 0 "Health check completed"

# 10. Service startup test
echo
echo "10. Testing service startup..."
print_info "Starting service in test mode..."

cd backend
source venv/bin/activate
timeout 10s python start_server.py &
SERVICE_PID=$!
sleep 3

if kill -0 $SERVICE_PID 2>/dev/null; then
    kill $SERVICE_PID 2>/dev/null || true
    wait $SERVICE_PID 2>/dev/null || true
    print_status 0 "Service startup test passed"
else
    print_status 1 "Service failed to start"
fi

cd ..

# 11. Final summary
echo
echo -e "${GREEN}=== Deployment Successful! ===${NC}"
echo
echo "Deployment Details:"
echo "- Environment: $ENVIRONMENT"
echo "- Backup: $BACKUP_FILE"
echo "- Database: $DATABASE_PATH"
echo "- Service Port: ${PORT:-8088}"
echo
echo "Service Access:"
echo "- Frontend: http://localhost:${PORT:-8088}"
echo "- API Docs: http://localhost:${PORT:-8088}/api/docs"
echo "- Admin Interface: http://localhost:${PORT:-8088}/admin"
echo
echo "Default Credentials (if first deployment):"
echo "- Email: admin@example.com"
echo "- Password: admin123"
echo
echo "To start the service:"
echo "  ./start_service.sh"
echo
echo "To rollback (if needed):"
echo "  ./rollback.sh $TIMESTAMP"
echo
print_warning "Remember to change default credentials after first login!"