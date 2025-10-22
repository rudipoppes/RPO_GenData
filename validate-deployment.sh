#!/bin/bash

# Deployment Validation Script for RPO GenData Service
# This script validates deployment configuration and performs pre-flight checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RPO GenData Deployment Validation ===${NC}"
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

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${GREEN}→${NC} $1"
}

# 1. Check if .env file exists
echo "1. Checking environment configuration..."
if [ -f ".env" ]; then
    print_status 0 ".env file found"
else
    print_warning ".env file not found - using defaults"
    print_info "Copy .env.template to .env and customize for your environment"
fi

# 2. Validate required directories
echo
echo "2. Validating directory structure..."
PROJECT_ROOT="${PROJECT_ROOT:-$(pwd)}"
DATA_DIR="${DATA_DIR:-$PROJECT_ROOT/data}"

[ -d "$PROJECT_ROOT" ] && print_status 0 "Project root exists: $PROJECT_ROOT" || print_status 1 "Project root missing: $PROJECT_ROOT"
[ -d "$DATA_DIR" ] && print_status 0 "Data directory exists: $DATA_DIR" || print_status 1 "Data directory missing: $DATA_DIR"
[ -d "backend" ] && print_status 0 "Backend directory exists" || print_status 1 "Backend directory missing"
[ -d "frontend" ] && print_status 0 "Frontend directory exists" || print_status 1 "Frontend directory missing"

# 3. Check system dependencies
echo
echo "3. Checking system dependencies..."

# Check Python 3
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    print_status 0 "Python $PYTHON_VERSION found"
else
    print_status 1 "Python 3 not found. Install: sudo apt install python3 python3-pip"
fi

# Check python3-venv package
if python3 -m venv --help &> /dev/null; then
    print_status 0 "python3-venv is available"
else
    print_status 1 "python3-venv not found. Install: sudo apt install python3${PYTHON_VERSION}-venv"
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js $NODE_VERSION found"
else
    print_status 1 "Node.js not found. Install: sudo apt install nodejs npm"
fi

# Check npm
if command -v npm &> /dev/null; then
    print_status 0 "npm found"
else
    print_status 1 "npm not found. Install: sudo apt install npm"
fi

# 4. Check Python environment
echo
echo "4. Checking Python environment..."
if [ -d "backend/venv" ]; then
    print_status 0 "Python virtual environment exists"
    
    # Activate virtual environment and check dependencies
    source backend/venv/bin/activate
    python -c "import fastapi, uvicorn, sqlalchemy, alembic" 2>/dev/null
    print_status 0 "Python dependencies are installed"
else
    print_warning "Virtual environment not found - will be created during deployment"
fi

# 5. Check database configuration
echo
echo "5. Validating database configuration..."
DATABASE_PATH="${DATABASE_PATH:-$DATA_DIR/gendata.db}"

if [ -f "$DATABASE_PATH" ]; then
    print_status 0 "Database file exists: $DATABASE_PATH"
    
    # Check if database is accessible and has tables
    if command -v sqlite3 &> /dev/null; then
        TABLE_COUNT=$(sqlite3 "$DATABASE_PATH" ".tables" 2>/dev/null | wc -w)
        if [ "$TABLE_COUNT" -gt 0 ]; then
            print_status 0 "Database has $TABLE_COUNT tables"
        else
            print_warning "Database exists but appears to be empty"
            print_info "Run migrations: cd backend && source venv/bin/activate && alembic upgrade head"
        fi
    else
        print_warning "sqlite3 not available - cannot validate database content"
    fi
else
    print_warning "Database file not found: $DATABASE_PATH"
    print_info "Database will be created automatically when service starts"
fi

# 6. Check frontend build
echo
echo "6. Validating frontend build..."
if [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist)" ]; then
    print_status 0 "Frontend build exists"
else
    print_warning "Frontend build not found"
    print_info "Run: cd frontend && npm install && npm run build"
fi

# 7. Check configuration files
echo
echo "7. Validating configuration files..."
[ -f "backend/app/core/config.py" ] && print_status 0 "Backend configuration exists" || print_status 1 "Backend configuration missing"
[ -f "backend/alembic.ini" ] && print_status 0 "Alembic configuration exists" || print_status 1 "Alembic configuration missing"

# 8. Check for security issues
echo
echo "8. Security validation..."
if grep -r "your-secret-key-change-this-in-production" backend/app/core/config.py > /dev/null; then
    print_warning "Default secret key detected - should be changed in production"
fi

if grep -r "admin123" backend/app/db/init_db.py > /dev/null; then
    print_warning "Default admin password detected - change after first login"
fi

# 8. Port availability check
echo
echo "8. Checking port availability..."
PORT="${PORT:-8088}"
if command -v netstat &> /dev/null; then
    if netstat -tuln 2>/dev/null | grep ":$PORT " > /dev/null; then
        print_warning "Port $PORT appears to be in use"
    else
        print_status 0 "Port $PORT is available"
    fi
else
    print_info "netstat not available - cannot check port availability"
fi

# 9. Final summary
echo
echo -e "${GREEN}=== Validation Complete ===${NC}"
echo -e "${GREEN}Ready to start deployment!${NC}"
echo
echo "Next steps:"
echo "1. Copy .env.template to .env and customize"
echo "2. Run: ./deploy.sh [environment]"