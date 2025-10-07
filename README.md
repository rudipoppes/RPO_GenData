# RPO_GenData - Data Generation API with Admin Interface

## Project Overview

RPO_GenData is a comprehensive data generation system that allows users to define collections and fields with various generation rules. It provides both a public API for data generation and a complete admin interface for managing collections, fields, users, and API keys.

## 🎯 Current Status: Backend Complete ✅

### ✅ Completed Features

#### **Core Backend Infrastructure**
- **FastAPI Application**: Full REST API server running on port 8088
- **SQLAlchemy Database**: SQLite database with complete schema and migrations
- **Authentication System**: JWT-based auth with HTTP-only cookies
- **Password Security**: Argon2id password hashing as specified
- **Role-Based Access Control**: Admin/Editor/Viewer roles with proper permissions

#### **Public Data Generation API**
- **Endpoint**: `GET /api/{collectionName}/{collectionType}`
- **Authentication**: API key authentication (X-API-Key or Authorization: Bearer)
- **Data Generation**: All value types implemented:
  - `TEXT_FIXED`, `NUMBER_FIXED`, `FLOAT_FIXED`: Return stored values
  - `EPOCH_NOW`: Current Unix timestamp
  - `NUMBER_RANGE`, `FLOAT_RANGE`: Random values within specified ranges
  - `INCREMENT`, `DECREMENT`: Stateful counters with database persistence
- **Response Format**: JSON with collection metadata and generated data
- **URL Encoding**: Proper handling of collection names with spaces/special characters

#### **Complete Admin API**
- **Authentication Endpoints**: `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/change-password`
- **User Management**: Full CRUD operations for users (Admin only)
- **Collection Management**: Create, read, update, delete collections with ownership
- **Field Management**: CRUD operations for fields with validation
- **API Key Management**: Generate, manage, revoke API keys with collection scoping

#### **Advanced Features**
- **Field Validation**: Comprehensive validation of field configurations
- **Access Control**: Collection-level permissions and API key scoping  
- **State Persistence**: INCREMENT/DECREMENT fields maintain state between calls
- **Error Handling**: Proper HTTP status codes and descriptive error messages
- **Database Constraints**: Referential integrity and unique constraints

#### **Testing & Quality**
- **Comprehensive Test Suite**: 15 automated tests covering all major functionality
- **Test Coverage**: Authentication, collections, fields, data generation, validation
- **All Tests Pass**: ✅ Full backend functionality verified

## 🚀 Quick Start

### Prerequisites
- Python 3.12+
- SQLite (included with Python)

### Installation & Setup
```bash
# Clone the repository
cd /path/to/RPO_GenData

# Install Python dependencies
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Initialize database and create admin user
python -c "from app.db.init_db import create_initial_admin_user; create_initial_admin_user()"

# Start the server
python start_server.py
```

### Default Admin User
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin

### Server Access
- **API Server**: http://localhost:8088
- **API Documentation**: http://localhost:8088/api/docs
- **Health Check**: http://localhost:8088/health

## 🔧 API Usage Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:8088/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Create Collection & Fields
```bash
# Create collection (requires authentication)
curl -X POST http://localhost:8088/admin/collections \
  -H "Content-Type: application/json" \
  -d '{"name": "Truck Data01"}'

# Create performance fields
curl -X POST http://localhost:8088/admin/collections/1/fields \
  -H "Content-Type: application/json" \
  -d '{
    "collection_type": "Performance",
    "field_name": "Meters_Travelled", 
    "value_type": "INCREMENT",
    "start_number": 700,
    "step_number": 1,
    "reset_number": 1000
  }'

curl -X POST http://localhost:8088/admin/collections/1/fields \
  -H "Content-Type: application/json" \
  -d '{
    "collection_type": "Performance",
    "field_name": "Fuel used",
    "value_type": "NUMBER_RANGE", 
    "range_start_number": 5,
    "range_end_number": 15
  }'
```

### Generate API Key
```bash
# Create API key
curl -X POST http://localhost:8088/admin/api-keys \
  -H "Content-Type: application/json" \
  -d '{"label": "My API Key"}'
```

### Generate Data
```bash
# Use the API key from above response
curl -H "X-API-Key: YOUR_API_KEY_HERE" \
  http://localhost:8088/api/Truck%20Data01/Performance
```

**Response Example:**
```json
{
  "collection": "Truck Data01",
  "type": "Performance", 
  "generated_at_epoch": 1738875302,
  "data": {
    "Meters_Travelled": 734,
    "Fuel used": 8
  }
}
```

## 🧪 Running Tests

```bash
cd backend
source venv/bin/activate
python -m pytest tests/ -v
```

**Current Test Results**: ✅ 15/15 tests passing

## 📁 Project Structure

```
RPO_GenData/
├── README.md                 # This file
├── docs/
│   └── solution.md          # Detailed specifications
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLAlchemy database models
│   │   ├── schemas/        # Pydantic request/response models
│   │   ├── api/            # API endpoint routers
│   │   ├── auth/           # Authentication utilities
│   │   ├── generators/     # Data generation logic
│   │   ├── db/             # Database configuration
│   │   └── core/           # App configuration
│   ├── tests/              # Test suite
│   ├── migrations/         # Alembic database migrations  
│   ├── requirements.txt    # Python dependencies
│   └── start_server.py     # Server startup script
├── frontend/               # React admin UI (planned)
└── data/                   # SQLite database storage
    └── gendata.db          # Main database file
```

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with roles and authentication
- **collections**: Data collection definitions with ownership
- **fields**: Field definitions with generation rules
- **api_keys**: API key management with scoping
- **api_key_scopes**: Permission scopes for API keys
- **api_key_allowed**: Collection access control for API keys

### Supported Field Types
- **Fixed Values**: `TEXT_FIXED`, `NUMBER_FIXED`, `FLOAT_FIXED`
- **Dynamic Values**: `EPOCH_NOW`, `NUMBER_RANGE`, `FLOAT_RANGE` 
- **Stateful Counters**: `INCREMENT`, `DECREMENT` with persistence

## 🔐 Security Features

- **Argon2id Password Hashing**: Industry-standard password security
- **JWT Authentication**: Secure session management with HTTP-only cookies
- **API Key Authentication**: SHA-256 hashed API keys with prefix display
- **Role-Based Access Control**: Admin/Editor/Viewer permission levels
- **Collection Ownership**: Users can only access their own collections
- **API Key Scoping**: Keys can be restricted to specific collections/types

## 📊 Current Progress

### ✅ Completed (Backend - 100%)
1. ✅ **Project Structure & Environment**: Virtual environment, dependencies
2. ✅ **Database Models & Migrations**: Complete SQLAlchemy schema with Alembic
3. ✅ **Data Generation Engine**: All value types with validation
4. ✅ **Public API**: Data generation endpoint with authentication
5. ✅ **Authentication System**: JWT auth, password management, user roles
6. ✅ **Admin API**: Complete CRUD operations for all entities

### 🔄 Remaining Tasks
7. **React Frontend Structure**: Vite + React admin UI setup
8. **Admin UI Pages**: Login, collections, fields, API keys, users management
9. **Import/Export**: JSON configuration management
10. **ScienceLogic Integration**: Sample calls, JMESPath, YAML snippets
11. **Build & Deployment**: Production configuration
12. **Testing & Documentation**: Frontend tests and deployment docs

## 🎯 Next Steps

The backend is fully functional and ready for production use. The next logical steps are:

1. **Frontend Development**: Create the React-based admin interface
2. **Integration Testing**: End-to-end testing with real scenarios  
3. **Production Deployment**: Configure for production environment
4. **ScienceLogic Integration**: Build the integration tools and examples

## 📞 Support

The backend API is fully documented at `/api/docs` when running the server. All endpoints include comprehensive OpenAPI documentation with examples.

---

**Project Status**: Backend Complete ✅ | Frontend Pending 🔄 | Ready for UI Development 🚀
