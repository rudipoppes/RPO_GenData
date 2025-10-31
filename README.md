# RPO GenData Service

A FastAPI-based service for generating dynamic test data with configurable fields and types, featuring a React admin interface.

## 🚀 Production Deployment

### Quick Start

```bash
# Clone repository
git clone https://github.com/rudipoppes/RPO_GenData.git
cd RPO_GenData

# Validate system requirements
./validate-deployment.sh

# Run one-command deployment
./deploy.sh production
```

### System Requirements

**Ubuntu/Debian:**
```bash
# Install Node.js (if not available)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs npm
```

**Python 3.12+** (usually pre-installed)

### Access Information

After deployment, the service will be accessible at:
- **Frontend**: `http://your-server:8088/`
- **Admin Interface**: `http://your-server:8088/admin`
- **API Documentation**: `http://your-server:8088/api/docs`
- **Health Check**: `http://your-server:8088/api/health`

### ⚠️ Default Credentials

**IMPORTANT: Change after first login!**

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Username**: `admin`

### Deployment Scripts

**Validation (Pre-deployment):**
```bash
./validate-deployment.sh
```
✅ Checks system dependencies (Python 3.12+, Node.js, npm)
✅ Validates python3-venv availability
✅ Validates directory structure
✅ Validates configuration files
✅ Provides clear installation instructions for missing packages

**Deployment:**
```bash
./deploy.sh production
```
✅ Creates virtual environment properly
✅ Installs all Python dependencies including pydantic-settings
✅ Builds frontend application
✅ Runs database migrations
✅ Starts service with health checks
✅ Automatic error handling and rollback capability

**Manual Service Start:**
```bash
# Foreground:
./start_service.sh

# Background:
nohup ./start_service.sh > service.log 2>&1 &
```

**Rollback (if needed):**
```bash
./rollback.sh <timestamp>
```

**Note:** The `build.sh` script is outdated and redundant. Use `deploy.sh` instead for complete deployment.

### Configuration

Environment variables configured via `.env` file:
```bash
# Copy template and customize
cp .env.template .env

# Key settings to update:
PROJECT_ROOT=/path/to/your/RPO_GenData
SECRET_KEY=generate-secure-random-key
BACKEND_CORS_ORIGINS='["http://your-server:8088"]'
```

### Features

- **🔐 Authentication**: Cookie-based session management for admin interface
- **📊 Data Generation**: Configurable fields (fixed, ranges, patterns, timestamps)
- **🎲 Randomization**: Non-linear progression for increment/decrement fields with 0-500% variation
- **🔑 API Keys**: Scoped access with fine-grained permissions
- **⚙️ Admin UI**: React-based interface for collections and configuration
- **🔄 Database Migrations**: Alembic-based version control
- **📋 Import/Export**: JSON-based configuration management
- **🏥 Health Checks**: Built-in health monitoring endpoints

### Project Structure

```
RPO_GenData/
├── backend/              # FastAPI backend
│   ├── app/            # Application modules
│   ├── venv/           # Python virtual environment (auto-created)
│   ├── requirements.txt # Python dependencies
│   └── start_server.py  # Server startup
├── frontend/            # React frontend
│   ├── dist/           # Built files (auto-created)
│   └── package.json    # Node dependencies
├── data/               # Database directory (auto-created)
├── .env.template        # Configuration template
├── deploy.sh           # Main deployment script
├── validate-deployment.sh # System validation
├── start_service.sh    # Service starter
└── rollback.sh         # Emergency rollback
```

### API Usage

**Authentication:**
```bash
# Admin login (returns cookie for subsequent requests)
curl -c cookies.txt -X POST http://your-server:8088/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

**Data Generation:**
```bash
# Requires API key (from admin interface or manual creation)
curl -H "X-API-Key: your-api-key" \
  http://your-server:8088/api/data/YourCollection/Performance
```

### Development

**For development with hot reloading:**

**Backend:**
```bash
cd backend
source venv/bin/activate
python start_server.py
```

**Frontend:**
```bash
cd frontend
npm install
npm run build  # Production build
npm run dev    # Development server (if needed)
```

### Troubleshooting

**Port 8088 not accessible:**
1. Check firewall: `sudo ufw allow 8088`
2. Verify service is running: `ps aux | grep "python start_server.py"`
3. Check service logs: `tail -f service.log`
4. Verify service binding: `ss -tulpn | grep 8088`

**Virtual environment issues:**
- Recreate venv: `cd backend && rm -rf venv && python3 -m venv venv`
- Install dependencies: `source venv/bin/activate && pip install -r requirements.txt`

**Database issues:**
- Run migrations: `cd backend && source venv/bin/activate && alembic upgrade head`
- Check database: `sqlite3 ../data/gendata.db ".tables"`

**Frontend build issues:**
- Install dependencies: `cd frontend && npm install`
- Rebuild: `npm run build`

For detailed deployment guide, see `DEPLOYMENT.md` in the repository.

---

**Version**: Production Ready  
**Last Updated**: October 2025  
**Port**: 8088 (single-port architecture)