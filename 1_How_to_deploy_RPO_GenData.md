# RPO GenData Deployment Guide

This guide provides safe deployment instructions for the RPO GenData service on a new server.

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd RPO_GenData

# 2. Switch to main branch (contains deployment system)
git checkout main

# 3. Copy environment template
cp .env.template .env

# 4. Edit .env with your server configuration
nano .env

# 5. Run deployment
./deploy.sh production
```

## Prerequisites

### System Requirements
- Ubuntu 18.04+ or similar Linux distribution
- Python 3.12+
- Node.js 18+
- SQLite3
- Git

### Required Packages
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv nodejs npm sqlite3
```

## Configuration

### 1. Environment Variables
Copy `.env.template` to `.env` and update these values:

**Critical Settings:**
- `PROJECT_ROOT` - Installation directory path
- `DATABASE_PATH` - Database file location
- `SECRET_KEY` - Generate a secure random key
- `HOST` - Server binding IP (0.0.0.0 for external access)
- `PORT` - Service port (default: 8088)
- `BACKEND_CORS_ORIGINS` - Update with your server's IP (e.g., `["http://YOUR_IP:8088"]`)

**Security Settings:**
- Change `SECRET_KEY` from default
- Update `BACKEND_CORS_ORIGINS` with your server IP/domain (e.g., `["http://YOUR_SERVER_IP:8088"]`)
- Set `GH_TOKEN` only if GitHub API access is needed

### 2. Database Path Updates
The deployment script automatically updates these files:
- `backend/app/core/config.py` - Uses environment variables
- `backend/alembic.ini` - Updated with correct database path

## Deployment Process

### 1. Validation
```bash
./validate-deployment.sh
```
This script checks:
- Directory structure
- Python environment and dependencies
- Database configuration and accessibility
- Frontend build status
- Security configuration
- Port availability

### 2. Deployment
```bash
./deploy.sh [environment]
```

The deployment script:
1. **Creates backup** of current configuration
2. **Validates** environment configuration
3. **Sets up** Python virtual environment
4. **Builds** frontend application
5. **Runs** database migrations
6. **Updates** configuration files
7. **Performs** health checks
8. **Tests** service startup

### 3. Service Startup
```bash
# Foreground
./start_service.sh

# Background
nohup ./start_service.sh > service.log 2>&1 &
```

## Post-Deployment

### 1. Access the Service
- **Frontend:** `http://your-server:8088`
- **API Docs:** `http://your-server:8088/api/docs`
- **Admin Interface:** `http://your-server:8088/admin`

### 2. Default Credentials
- **Email:** admin@example.com
- **Password:** admin123
- **Action:** Change immediately after first login!

### 3. Security Checklist
- [ ] Change default admin password
- [ ] Update SECRET_KEY in .env
- [ ] Configure CORS origins for your domain
- [ ] Set up firewall rules
- [ ] Consider HTTPS/SSL setup
- [ ] Configure database backups

## Troubleshooting

### Database Issues
```bash
# Check database status
sqlite3 /path/to/data/gendata.db ".tables"

# Manually run migrations
cd backend
source venv/bin/activate
alembic upgrade head
```

### Service Won't Start
```bash
# Check logs
tail -f service.log

# Validate configuration
./validate-deployment.sh

# Test in foreground
./start_service.sh
```

### Permission Issues
```bash
# Fix permissions
chmod +x *.sh
chown -R $USER:$USER /path/to/RPO_GenData
```

## Rollback

If deployment fails, you can rollback:

```bash
# List available backups
ls /tmp/backups/rpo_backup_*.tar.gz

# Rollback to specific timestamp
./rollback.sh 20251021_143022
```

## Production Considerations

### 1. Security
- Use HTTPS/SSL certificates
- Configure firewall (allow only necessary ports)
- Move from SQLite to PostgreSQL for better performance
- Set up log rotation
- Configure monitoring and alerting

### 2. Performance
- Configure reverse proxy (Nginx)
- Set up process management (systemd)
- Optimize database configuration
- Configure caching if needed

### 3. Backup Strategy
- Regular database backups
- Configuration backups
- Application code versioning
- Disaster recovery plan

### 4. Monitoring
- Service health checks
- Database performance monitoring
- Log monitoring
- Resource usage tracking

## Directory Structure After Deployment

```
/path/to/your/installation/
├── .env                    # Environment configuration
├── .gitignore             # Git ignore rules
├── deploy.sh              # Deployment script
├── validate-deployment.sh # Validation script
├── rollback.sh            # Rollback script
├── start_service.sh       # Service startup script
├── backend/
│   ├── app/               # FastAPI application
│   ├── venv/              # Python virtual environment
│   ├── alembic.ini        # Database migration config
│   └── migrations/        # Database migration files
├── frontend/
│   ├── dist/              # Built frontend files
│   └── node_modules/      # Node dependencies
└── data/
    └── gendata.db         # SQLite database
```

## Support

For deployment issues:
1. Check the validation script output
2. Review service logs
3. Verify environment configuration
4. Check system requirements and permissions