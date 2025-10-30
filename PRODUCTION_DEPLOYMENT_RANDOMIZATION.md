# Production Deployment Guide - Increment/Decrement Randomization Feature

## Overview
This guide covers deploying the new increment/decrement randomization feature to production.

## What Changed
- **Database Schema**: Added `randomization_percentage` column to `fields` and `spike_schedule_fields` tables
- **Backend Logic**: Enhanced value generation with configurable randomization
- **Frontend UI**: Added randomization controls for INCREMENT/DECREMENT fields
- **API Updates**: All relevant endpoints now handle the new field

## Pre-Deployment Checklist

### 1. Backup Current Database
```bash
# Backup existing database
cp data/gendata.db data/gendata.db.backup.$(date +%Y%m%d_%H%M%S)
```

### 2. Verify Current State
```bash
# Check current running version
curl -s http://your-server:8088/api/health

# Check database tables
sqlite3 data/gendata.db ".schema fields" | grep -c "randomization"
# Should return 0 (column doesn't exist yet)
```

## Production Deployment Steps

### Option 1: Full Deploy (Recommended)
```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Deploy using existing script
./deploy.sh production
```
**The deployment script automatically:**
- Runs `alembic upgrade head` (applies the randomization migration)
- Builds frontend with new UI
- Restarts the service
- Validates deployment

### Option 2: Manual Deploy
```bash
# 1. Pull changes
git pull origin main

# 2. Run database migration
cd backend
source venv/bin/activate
alembic upgrade head

# 3. Build frontend
cd ../frontend
npm run build

# 4. Restart service
cd ..
pkill -f "python start_server.py"
nohup ./start_service.sh > service.log 2>&1 &
```

## Post-Deployment Verification

### 1. Database Verification
```bash
# Verify new columns exist
sqlite3 data/gendata.db "PRAGMA table_info(fields);" | grep randomization
# Should show: randomization_percentage|FLOAT|0|'0.0'|0

sqlite3 data/gendata.db "PRAGMA table_info(spike_schedule_fields);" | grep randomization  
# Should show: randomization_percentage|FLOAT|0|'0.0'|0
```

### 2. Service Health Check
```bash
# Check service is running
curl -s http://your-server:8088/api/health

# Should return: {"status":"healthy","service":"Data Generator API"}
```

### 3. API Documentation
```bash
# Verify API docs accessible
curl -s http://your-server:8088/api/docs | grep -i swagger
```

### 4. Frontend Functionality
1. Navigate to: `http://your-server:8088`
2. Login with admin credentials
3. Go to Collections → Create/Collection → Add Field
4. Select INCREMENT or DECREMENT type
5. Verify "Randomization Percentage (%)" field appears
6. Create field with randomization value (e.g., 15%)
7. Edit field to verify randomization value persists

### 5. API Testing
```bash
# Test field creation with randomization
curl -X POST http://your-server:8088/api/admin/collections/{collection_id}/fields \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_session=your_session_cookie" \
  -d '{
    "collection_type": "Performance",
    "field_name": "test_random_increment",
    "value_type": "INCREMENT", 
    "start_number": 1000,
    "step_number": 100,
    "randomization_percentage": 15.0
  }'
```

## Rollback Plan

If issues occur:

### Quick Rollback
```bash
# Rollback database migration
cd backend
source venv/bin/activate
alembic downgrade -1

# Restart service
pkill -f "python start_server.py"
nohup ./start_service.sh > service.log 2>&1 &
```

### Full Rollback to Previous Version
```bash
# 1. Checkout previous commit
git checkout <previous_commit_hash>

# 2. Run rollback script (if available)
./rollback.sh <timestamp>

# 3. Or manually restore database
cp data/gendata.db.backup.<timestamp> data/gendata.db

# 4. Rebuild and restart
./deploy.sh production
```

## Migration Details

### Database Changes
- **Column Added**: `randomization_percentage FLOAT DEFAULT 0.0`
- **Tables Affected**: `fields`, `spike_schedule_fields`
- **Backwards Compatible**: Existing records get default value 0.0

### Alembic Migration
- **File**: `backend/migrations/versions/31bc7369b465_add_randomization_percentage_to_.py`
- **Upgrade**: Adds columns with defaults
- **Downgrade**: Removes columns cleanly

### Impact Assessment
- **Zero Downtime**: Migration is additive only
- **No Data Loss**: Existing records get default values
- **Backwards Compatible**: API responses include new field as null/0 for existing records
- **Frontend**: Gracefully handles missing randomization values

## Testing in Production

### Test Increment Field
1. Create field: Start=1000, Step=100, Randomization=15%
2. Make multiple API calls to the field
3. Verify non-linear progression (values should vary between ~85-115 steps)
4. Check trend remains upward overall

### Test Spike Schedule
1. Create spike schedule with INCREMENT field
2. Set different randomization for spike period
3. Verify spike overrides use spike randomization settings
4. Verify normal periods use field randomization settings

## Monitoring

### Database Size Impact
```bash
# Check database size before/after
ls -lh data/gendata.db
```

### Performance Monitoring
```bash
# Monitor API response times
curl -w "@curl-format.txt" -o /dev/null -s http://your-server:8088/api/data/YourCollection/Performance

# curl-format.txt content:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

### Error Monitoring
```bash
# Monitor service logs
tail -f service.log | grep -i error

# Check for migration issues
grep -i "migration\|alembic" service.log
```

## Support Contact

If issues arise during deployment:

1. **Check service logs**: `tail -f service.log`
2. **Verify migration success**: Check database columns exist
3. **Validate API functionality**: Test basic CRUD operations
4. **Rollback if needed**: Use rollback procedures above

The deployment script includes built-in validation and should handle the migration automatically.