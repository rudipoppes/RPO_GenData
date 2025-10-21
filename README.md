# Data Generator Service

A FastAPI-based service for generating dynamic test data with configurable fields and types, featuring a React admin interface.

## Features

- **Backend API**: FastAPI service with SQLite database
- **Admin UI**: React-based web interface for managing collections and API keys
- **Authentication**: Cookie-based session authentication for admin interface
- **Data Generation**: Configurable fields with multiple value types (fixed, ranges, patterns, etc.)
- **API Key Management**: Scoped API keys for external data access
- **Import/Export**: JSON-based configuration management

## Quick Start

1. **Setup the backend environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Build the frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

3. **Run the complete service:**
   ```bash
   nohup ./start_service.sh > service.log 2>&1 &
   ```
   or in the foreground

   ```bash
   ./start_service.sh
   ```

The service will be accessible on **port 8088**:
- **Admin UI**: http://localhost:8088/
- **API Documentation**: http://localhost:8088/api/docs
- **Health Check**: http://localhost:8088/api/health

## Authentication

The service uses **cookie-based authentication** for the admin interface:

- **Admin Login**: Use the admin UI at http://localhost:8088/
- **Initial Setup**: Admin user is created automatically on first startup
- **Session Management**: Login sessions are handled via secure HTTP cookies

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Logout and clear session

### Admin Endpoints (Authentication Required)
- `GET /api/admin/collections` - List collections
- `POST /api/admin/collections` - Create new collection
- `GET /api/admin/api-keys` - List API keys
- `POST /api/admin/api-keys` - Generate new API key

### Public Data Generation (API Key Required)
- `GET /api/data/{collection_name}/{collection_type}` - Generate data for collection

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API route handlers
│   │   ├── auth/        # Authentication modules
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── main.py      # FastAPI app
│   ├── start_server.py  # Server startup script
│   └── requirements.txt # Python dependencies
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── dist/           # Built frontend files
├── docs/               # Documentation
├── start_service.sh    # Service launcher
└── AUTHENTICATION_FIX.md # Authentication troubleshooting guide
```

## Port Configuration

The service runs on **port 8088** to avoid conflicts with existing services on ports 3000 and 4000, as specified in the solution requirements.

## Development

For development with hot reloading:

**Backend only:**
```bash
cd backend
source venv/bin/activate
python start_server.py
```

**Frontend only (dev server):**
```bash
cd frontend
npm run dev  # Runs on port 8088 with proxy to backend
```

## Troubleshooting

### Authentication Issues
If you experience login problems, see [AUTHENTICATION_FIX.md](./AUTHENTICATION_FIX.md) for detailed troubleshooting information.

### Port Conflicts
If port 8088 is not accessible:
1. Check AWS Security Group allows inbound traffic on port 8088
2. Verify no firewall is blocking the port
3. Confirm the service is binding to `0.0.0.0:8088`

## API Usage Examples

### Admin Authentication
```bash
# Login
curl -c cookies.txt -X POST http://localhost:8088/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'

# Access admin endpoints
curl -b cookies.txt http://localhost:8088/api/admin/collections
```

### Data Generation
```bash
# Generate data (requires API key)
curl -H "X-API-Key: your-api-key" \
  http://localhost:8088/api/data/YourCollection/Performance
```

For complete API documentation, visit http://localhost:8088/api/docs

## ✅ Enhanced API Key Management (Complete)

The system now includes comprehensive API key management with the following features:

### 🔐 **API Key Features**
- **Secure Creation**: Full API key displayed once with copy functionality
- **Collection Access Control**: Grant access to all collections or specific ones
- **Permission Display**: Clear indication of which collections each key can access
- **Admin Privileges**: Admins can create API keys for any collection
- **Independent Management**: API keys are managed separately from collections

### 🗂️ **Collection Management**  
- **Bulk Operations**: Multi-select collections for batch deletion
- **Clean Deletion**: Simple confirmation without API key complications
- **Field Counting**: Shows exact number of fields being deleted
- **Cascade Safety**: Database handles permission cleanup automatically

### 🎨 **User Experience**
- **Intuitive UI**: Clean modals for creation and confirmation
- **Security Warnings**: Clear messaging about API key handling
- **Loading States**: Proper feedback during operations
- **Error Handling**: Comprehensive validation and error messages

### 🛠️ **Technical Implementation**
- **RESTful APIs**: Properly structured endpoints for all operations
- **Role-Based Access**: Admin and user permissions handled correctly  
- **Database Relations**: Proper foreign keys and cascade behavior
- **Frontend Build**: Cache-busting and optimized assets

**Status**: Production-ready and fully tested  
**Last Updated**: October 7, 2025
