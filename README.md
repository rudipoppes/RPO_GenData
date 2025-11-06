# RPO GenData Service

A FastAPI-based service for generating dynamic test data with configurable fields and types, featuring a React admin interface.

## 🚀 Quick Start

```bash
# Clone and deploy
git clone https://github.com/rudipoppes/RPO_GenData.git
cd RPO_GenData
./deploy.sh production
```

> **📖 For detailed deployment instructions, see [`1_How_to_deploy_RPO_GenData.md`](1_How_to_deploy_RPO_GenData.md)**

## ✨ Features

- **🔐 Authentication**: Cookie-based session management for admin interface
- **📊 Data Generation**: Configurable fields (fixed, ranges, patterns, timestamps)
- **🎲 Randomization**: Non-linear progression for increment/decrement fields (0-500% variation)
- **🔑 API Keys**: Scoped access with fine-grained permissions
- **⚙️ Admin UI**: React-based interface for collections and configuration
- **🔄 Database Migrations**: Alembic-based version control
- **📋 Import/Export**: JSON-based configuration management
- **🏥 Health Checks**: Built-in health monitoring endpoints
- **🎯 Environment Identification**: Visual server identification for development/staging/production environments

## 🔗 Access Points

After deployment, the service is available at:
- **Frontend**: `http://your-server:8088/`
- **Admin Interface**: `http://your-server:8088/admin`
- **API Documentation**: `http://your-server:8088/api/docs`
- **Health Check**: `http://your-server:8088/api/health`

## ⚠️ Default Credentials

**IMPORTANT: Change after first login!**
- **Email**: `admin@example.com`
- **Password**: `admin123`

## 🛠️ Development

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
npm run build
```

## 🎯 Environment Identification

The service includes visual environment identification to help distinguish between different server deployments (development, staging, production). 

**Purpose**: These images are **NOT** product branding - they serve purely as visual indicators to quickly identify which server environment you're working on.

**Files to Customize**:
- `frontend/public/server-logo.svg` - Small logo shown in the navigation menu bar (32px height)
- `frontend/public/server-login.svg` - Larger image shown on the login page (96px height)

**Usage**:
- Replace the placeholder SVG files with environment-specific visuals
- Use different colors, text, or icons for each environment (e.g., "DEV", "STAGING", "PROD")
- Changes appear immediately after browser refresh - no service restart required
- Images are static files served from the frontend's `public/` directory

## 📁 Project Structure

```
RPO_GenData/
├── backend/          # FastAPI application
├── frontend/         # React interface
│   └── public/       # Static assets (server-logo.svg, server-login.svg)
├── data/            # SQLite database
├── deploy.sh        # One-command deployment
└── *.md            # Documentation files
```

## 📚 Documentation

- **[Deployment Guide](1_How_to_deploy_RPO_GenData.md)** - Detailed server setup and configuration
- **[Increment/Decrement Randomization](INCREMENT_DECREMENT_RANDOMIZATION.md)** - Feature documentation
- **[Production Deployment](PRODUCTION_DEPLOYMENT_RANDOMIZATION.md)** - Production deployment guide

---

**Version**: Production Ready  
**Port**: 8088 (single-port architecture)  
**Last Updated**: October 2025