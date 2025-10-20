# Spike Schedule Implementation Prompt

## Project Context
You are implementing a "Spike Schedule" feature for a FastAPI + React data generation application. This feature allows users to create time-bound variations of collection field values for performance testing and load simulation.

## Architecture Overview
- **Backend**: FastAPI with SQLAlchemy ORM, Alembic migrations
- **Frontend**: React with TypeScript, Tailwind CSS
- **Database**: SQLite with existing tables: users, collections, fields, api_keys
- **Authentication**: JWT-based with role-based access (Admin/Editor/Viewer)

## Core Requirements

### What Spike Schedules Do
- Temporarily override field values in a collection during a specific time window
- **ONLY** affect performance-type numeric fields: NUMBER_FIXED, FLOAT_FIXED, NUMBER_RANGE, FLOAT_RANGE, INCREMENT, DECREMENT
- Automatically delete when end datetime passes (on-demand cleanup during GET requests)
- **NO overlapping schedules** allowed per collection

### Key Design Decisions
1. **Copy ALL fields** from collection to spike schedule, but only allow editing of numeric performance fields
2. **On-demand cleanup**: Delete expired schedules during data generation GET requests (no background tasks)
3. **No overlapping schedules**: Only one active schedule per collection at any time
4. **Independent state**: Spike fields maintain their own current_number for INCREMENT/DECREMENT

## Implementation Tasks

### Backend Tasks (Priority Order)
1. **Database Models**: Create `SpikeSchedule` and `SpikeScheduleField` models
2. **Migration**: Create Alembic migration for new tables with proper indexes
3. **Pydantic Schemas**: Create request/response schemas with validation
4. **API Endpoints**: Implement CRUD operations with proper authentication/authorization
5. **Data Generation Logic**: Modify `get_generated_data` in `public.py` to check for active spikes
6. **Collection Model Update**: Add spike_schedules relationship

### Frontend Tasks (Priority Order)
1. **TypeScript Types**: Add spike schedule interfaces to `api.ts`
2. **API Service**: Add spikeSchedulesApi methods to `api.ts`
3. **List Page**: Create `SpikeSchedules.tsx` with table view and status badges
4. **Create Page**: Create `CreateSpikeSchedule.tsx` with datetime pickers and field editing
5. **Edit Page**: Create `EditSpikeSchedule.tsx` for modifying existing schedules
6. **UI Integration**: Update Layout navigation, CollectionDetail button, App routes

## Critical Implementation Details

### Database Schema
```sql
-- spike_schedules table
CREATE TABLE spike_schedules (
    id INTEGER PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_datetime DATETIME NOT NULL,
    end_datetime DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- spike_schedule_fields table (copies ALL field data)
CREATE TABLE spike_schedule_fields (
    id INTEGER PRIMARY KEY,
    spike_schedule_id INTEGER NOT NULL REFERENCES spike_schedules(id) ON DELETE CASCADE,
    original_field_id INTEGER NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
    collection_type VARCHAR(13) NOT NULL,
    field_name VARCHAR NOT NULL,
    value_type VARCHAR(12) NOT NULL,
    -- ALL field value columns (same as fields table)
    fixed_value_text VARCHAR,
    fixed_value_number INTEGER,
    fixed_value_float FLOAT,
    range_start_number INTEGER,
    range_end_number INTEGER,
    range_start_float FLOAT,
    range_end_float FLOAT,
    float_precision INTEGER,
    start_number FLOAT,
    step_number FLOAT,
    reset_number FLOAT,
    current_number FLOAT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Data Generation Logic
```python
# In get_generated_data function:
# 1. Check for active spike schedule
# 2. If expired, delete it and use normal fields
# 3. If active, use spike_schedule_fields instead of collection fields
# 4. If no spike, use normal collection fields
```

### UI Behavior
- **Create Spike**: Copy ALL fields, but only show/edit numeric performance fields
- **List View**: Show status badges (Active/Scheduled/Expired)
- **Navigation**: Add "Spikes" menu item
- **Collection Detail**: Add "Create Spike" button next to "Edit Collection"

## Coding Standards

### Backend Standards
- Follow existing patterns in `admin_collections.py` for CRUD operations
- Use proper SQLAlchemy relationships and cascade deletes
- Implement comprehensive error handling with HTTPException
- Validate user permissions (Admin can access all, Editor/Viewer only own collections)
- Use Pydantic validators for datetime validation
- Follow existing naming conventions (snake_case for Python)

### Frontend Standards
- Follow existing patterns in `CollectionDetail.tsx` for forms and modals
- Use TypeScript interfaces matching backend schemas
- Implement proper error handling and loading states
- Use Tailwind CSS classes consistently with existing UI
- Follow existing component structure and naming conventions
- Use React hooks properly (useState, useEffect, etc.)

### Database Standards
- Use Alembic for all schema changes
- Create proper indexes for performance
- Use foreign key constraints with CASCADE deletes
- Follow existing naming conventions

## File Structure
```
backend/app/
├── models/
│   ├── spike_schedule.py (NEW)
│   ├── spike_schedule_field.py (NEW)
│   └── collection.py (MODIFY - add relationship)
├── schemas/
│   └── spike_schedule.py (NEW)
├── api/
│   ├── admin_spike_schedules.py (NEW)
│   └── public.py (MODIFY - data generation logic)
└── migrations/versions/
    └── <id>_add_spike_schedules.py (NEW)

frontend/src/
├── pages/
│   ├── SpikeSchedules.tsx (NEW)
│   ├── CreateSpikeSchedule.tsx (NEW)
│   └── EditSpikeSchedule.tsx (NEW)
├── types/
│   └── api.ts (MODIFY - add spike types)
├── services/
│   └── api.ts (MODIFY - add spike API methods)
├── components/
│   └── Layout.tsx (MODIFY - add navigation)
└── App.tsx (MODIFY - add routes)
```

## Testing Requirements
- Test CRUD operations for spike schedules
- Test data generation with/without active spikes
- Test automatic cleanup of expired schedules
- Test permission validation
- Test datetime validation and overlap prevention
- Test UI form validation and error handling

## Success Criteria
- Users can create spike schedules from collection pages
- Spike schedules automatically activate/deactivate based on datetime
- Data generation uses spike values when active, normal values otherwise
- Expired schedules are automatically cleaned up
- UI provides clear status indicators and management interface
- All existing functionality remains unchanged

## Important Notes
- **DO NOT** implement background tasks for cleanup
- **DO NOT** allow overlapping schedules
- **DO NOT** modify configuration or text fields in spikes
- **DO** copy all fields but only allow editing of numeric performance fields
- **DO** maintain independent state for INCREMENT/DECREMENT fields
- **DO** follow existing code patterns and conventions

Start with the database layer and work your way up to the frontend. Test each component thoroughly before moving to the next. The existing codebase is well-structured, so follow the established patterns closely.

## Detailed Implementation Plan Reference

For complete implementation details, refer to the `SPIKE_SCHEDULES_IMPLEMENTATION_PLAN.md` file in the repository root. This contains:
- Complete database schema with indexes
- Full model implementations
- Complete API endpoint implementations
- Detailed frontend component specifications
- Migration scripts
- Testing strategies

The plan file contains all the code examples, exact file structures, and implementation details needed to complete this feature successfully.
