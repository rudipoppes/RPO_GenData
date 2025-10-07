# Data Generator Service

A FastAPI-based service for generating dynamic test data with configurable fields and types, featuring a React admin interface.

## Features

- **Backend API**: FastAPI service with SQLite database
- **Admin UI**: React-based web interface for managing collections and API keys
- **Authentication**: Role-based access with JWT tokens and API keys
- **Data Generation**: Configurable fields with multiple value types (fixed, ranges, patterns, etc.)
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
   python run_service.py
   ```

The service will be available on **port 8088**:
- **Admin UI**: http://localhost:8088/
- **API**: http://localhost:8088/api/
- **API Documentation**: http://localhost:8088/docs

## Default Credentials

- **Username**: admin
- **Password**: admin123

## Project Structure

```
├── backend/              # FastAPI backend
│   ├── models.py        # SQLAlchemy models
│   ├── database.py      # Database configuration
│   ├── auth.py          # Authentication utilities
│   ├── logic.py         # Data generation logic
│   ├── schemas.py       # Pydantic schemas
│   ├── main.py          # FastAPI app
│   └── routers/         # API route handlers
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # React hooks
│   │   ├── services/    # API services
│   │   └── types/       # TypeScript types
│   └── dist/           # Built frontend files
├── docs/               # Documentation
├── run_service.py      # Service runner
└── build.sh           # Build script
```

## Port Configuration

The service runs on port **8088** to avoid conflicts with existing services on ports 3000 and 4000, as specified in the solution requirements.

## Development

For development with hot reloading:

**Backend only:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend only (dev server):**
```bash
cd frontend
npm run dev  # Runs on port 8088 with proxy to backend on 8000
```

**Full service:**
```bash
python run_service.py  # Serves both frontend and backend on port 8088
```

## API Usage

### Authentication
```bash
# Login
curl -X POST http://localhost:8088/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### Data Generation
```bash
# Generate data (requires API key)
curl -H "X-API-Key: your-api-key" \
  http://localhost:8088/api/YourCollection/Performance
```

For complete API documentation, visit http://localhost:8088/docs
