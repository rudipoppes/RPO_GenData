# HIERARCHICAL COLLECTIONS - COMPLETE DESIGN & DEVELOPMENT PLAN

**Creation Date**: October 10, 2025  
**Progress Update (2025-10-10)**:
- Phase 1: COMPLETE (tag: `phase1-complete`)  
  - Removed VIEWER role; minimum role is EDITOR
  - Username immutable in backend and frontend
  - Base schema prepared and applied for folder support (SQLite)  
  - Frontend updated to remove Viewer and username editing
  - Branch: `feature/hierarchical-collections-phase1` (baseline tag: `baseline-3db4f59`)
- Phase 2: IN PROGRESS (backend scaffolding)
  - Collection model extended: `folder_path`, `parent_folder_id`, `is_folder`; self-referential relationships and helpers
  - Folder endpoints added: POST/GET/PUT/DELETE under `/api/admin/folders`
  - Router registered in app
  - Auto-create user root folder `/users/{username}/` on user creation
  - Backfilled existing users' root folders in DB  
  - Next: integrate collections with parent_folder_id, move endpoints, folder-based API key groundwork, tests
  
**Pre-Implementation Git Commit**: `3db4f59` - Update project status documentation  
**Database Backup**: `gendata_backup_3db4f59.db` (Complete restore point)  
**Current Database State**: `current_database_state_3db4f59.txt`  

---

## 🔒 **CRITICAL REVERT INSTRUCTIONS**

### **Complete Rollback to Current State**
```bash
# 1. Revert git to exact state before hierarchical implementation
git checkout 3db4f59

# 2. Restore database to exact state before implementation  
cp project_design_docs/gendata_backup_3db4f59.db data/gendata.db

# 3. Restart service to ensure clean state
./start_service.sh
```

### **Current System State (Baseline)**
- **Git Commit**: 3db4f59 - Update project status documentation
- **Database**: 3 users, 6 collections, 2 API keys with collection access
- **Service**: Running on port 8088 with Edit API Keys functionality
- **All functionality working**: Collection management, API key management, data generation API

---

## 📋 **PROJECT OVERVIEW**

### **Objective**
Transform flat collection structure into hierarchical folder-based organization while maintaining complete backward compatibility for data generation API.

### **Core Requirements**
1. **Zero breaking changes** to data generation API (`/api/data/{collection_name}/{collection_type}`)
2. **Folder-only API keys** - API keys scoped to folders, not individual collections
3. **User isolation** - Users can only manage their own folder structure (except admins)
4. **Admin oversight** - Single tree view with user folders at top level
5. **Collection name preservation** - Critical for existing API consumers

---

## 🧠 **DESIGN DECISIONS & RATIONALE**

### **A. User Role Simplification**
- **REMOVE**: VIEWER role entirely
- **NEW MINIMUM**: EDITOR role for all users
- **RATIONALE**: VIEWERs cannot create collections, making folder structure meaningless

### **B. API Key Architecture - Folder-Only Approach**
- **CURRENT**: API keys → individual collections (complex, many keys needed)
- **NEW**: API keys → folders (simple, automatic collection inclusion)
- **VISUAL INDICATOR**: Folder shows key icon if API key exists, key-with-X if no API key
- **AUTO-INCLUSION**: New collections added to folder automatically accessible via folder API key

### **C. Copy/Move Operations**
- **Copy to different user**: Ownership changes, destination API keys empty
- **Move within same user**: Ownership unchanged, API key access maintained
- **Copy within same user**: Creates duplicate, original API key access maintained

### **D. Database Strategy**
- **Hybrid approach**: Keep collection names for API compatibility + add folder paths
- **Migration**: One-time conversion, existing API keys will be recreated manually
- **Constraints**: Username immutable after creation, folder paths unique

---

## 🏗️ **ARCHITECTURE DESIGN**

### **Database Schema Changes**

#### **1. Collections Table Enhancement**
```sql
-- Add folder support to existing collections table
ALTER TABLE collections ADD COLUMN folder_path VARCHAR UNIQUE;
ALTER TABLE collections ADD COLUMN parent_folder_id INTEGER REFERENCES collections(id);
ALTER TABLE collections ADD COLUMN is_folder BOOLEAN DEFAULT false;
DROP INDEX ix_collections_name; -- Remove global uniqueness of names
CREATE UNIQUE INDEX ix_collections_folder_path ON collections(folder_path);
CREATE INDEX ix_collections_parent_folder ON collections(parent_folder_id);
```

#### **2. Folder-Based API Keys**
```sql
-- Modify API key allowed to be folder-based
ALTER TABLE api_key_allowed ADD COLUMN folder_path VARCHAR;
-- Keep collection_id for backward compatibility during migration
-- After migration, collection_id will be removed in favor of folder_path only
```

#### **3. User Management Changes**
```sql
-- Ensure username immutability (application-level constraint)
-- Remove username from UserUpdate schema
```

### **Folder Structure Design**
```
/users/{username}/                    # Auto-created user root
/users/{username}/folder1/           # User-created folders
/users/{username}/folder1/subfolder/ # Up to 5 levels deep
/users/{username}/folder1/collection1 # Collections as leaf nodes
```

### **API Key Scoping Logic**
```python
# API key has folder_path = '/users/rpoppes/mines/'
# Automatically grants access to:
# - /users/rpoppes/mines/collection1
# - /users/rpoppes/mines/bhp/collection2  
# - /users/rpoppes/mines/bhp/trucks/collection3
# - Any future collections added to /users/rpoppes/mines/ or subfolders
```

---

## 📊 **DATA MIGRATION STRATEGY**

### **Current State Analysis**
```
USERS:
1|administrator|ADMIN
2|cp|EDITOR  
3|rpoppes|ADMIN

COLLECTIONS:
3|RPO_TYPE_TESTING|2           → /users/cp/testing/
6|RPO-MINES-BHP-798-AC|3       → /users/rpoppes/mines/bhp/
7|RPO-MINES-BHP-797F|3         → /users/rpoppes/mines/bhp/
8|RPO-MINES-BHP-785D|3         → /users/rpoppes/mines/bhp/
9|RPO-MINES-SURGELOADER-EAST|3 → /users/rpoppes/mines/surgeloader/
10|RPO-MINES-SURGELOADER-WEST|3 → /users/rpoppes/mines/surgeloader/

API_KEYS:
1|3|BHP Trucks → Convert to folder key /users/rpoppes/mines/
2|3|RPO_TYPE_TESTING → Delete (user mismatch, recreate manually)
```

### **Migration Steps**
1. **Create user root folders**: `/users/administrator/`, `/users/cp/`, `/users/rpoppes/`
2. **Analyze collection names** to determine folder structure automatically
3. **Create folder hierarchy** based on naming patterns
4. **Move collections** to appropriate folders while preserving names
5. **Delete existing API keys** (to be recreated manually with folder scoping)

---

## 🔧 **IMPLEMENTATION PHASES**

### **Phase 1: Foundation & Safety** 
**Branch**: `feature/hierarchical-collections-phase1`

#### **Backend Changes**
1. **Remove VIEWER Role**
   - Update `UserRole` enum to remove VIEWER
   - Update default role to EDITOR in schemas
   - Add database migration to convert existing VIEWERs to EDITORs

2. **Username Immutability**
   - Remove `username` field from `UserUpdate` schema
   - Add validation to prevent username changes
   - Update admin user edit API to exclude username

3. **Database Schema Updates**
   - Add folder support columns to collections table
   - Add folder support to API key allowed table
   - Create necessary indexes

#### **Frontend Changes**
1. **Remove username editing** from admin user management UI
2. **Remove VIEWER role option** from user creation/editing

#### **Testing**
- Verify username changes are blocked
- Verify VIEWER role removal doesn't break existing functionality
- Verify database schema changes don't break existing operations

### **Phase 2: Folder Structure Backend**
**Branch**: `feature/hierarchical-collections-phase2`

#### **Backend Implementation**
1. **Folder Management Models**
   - Update Collection model with folder support
   - Add folder hierarchy methods (get_children, get_parent, get_path)

2. **Folder API Endpoints**
   - `POST /admin/folders` - Create folder
   - `GET /admin/folders` - List folder tree 
   - `PUT /admin/folders/{id}` - Rename folder
   - `DELETE /admin/folders/{id}` - Delete folder (with contents)
   - `POST /admin/folders/{id}/move` - Move folder

3. **Enhanced Collection APIs**
   - Update collection creation to require folder parent
   - Update collection listing to show folder structure
   - Add collection move between folders

4. **Folder-Based API Key Logic**
   - Update API key creation for folder scoping
   - Update data generation API to check folder-based permissions
   - Maintain collection name lookup for backward compatibility

#### **Testing**
- Verify folder CRUD operations
- Verify folder-based API key access control
- Verify data generation API still works with folder-scoped keys

### **Phase 3: Data Migration**
**Branch**: `feature/hierarchical-collections-phase3`

#### **Migration Implementation**
1. **Migration Script**
   - Create user root folders for all existing users
   - Analyze collection names to determine folder structure
   - Create appropriate folder hierarchy
   - Move collections to folders while preserving names

2. **API Key Migration**
   - Delete existing individual-collection API keys
   - Provide admin interface to recreate folder-based API keys

#### **Testing**
- Verify migration preserves all collection data
- Verify migrated structure maintains data generation API compatibility
- Verify admin can recreate API keys with folder scoping

### **Phase 4: Frontend Hierarchy UI**
**Branch**: `feature/hierarchical-collections-phase4`

#### **Frontend Implementation**
1. **Tree View Component**
   - Hierarchical folder/collection display
   - Expand/collapse functionality
   - Drag & drop for move operations (future enhancement)

2. **Folder Management UI**
   - Create folder dialog
   - Rename folder inline editing
   - Delete folder confirmation with cascade info
   - Move folder/collection dialogs

3. **API Key Visual Indicators**
   - Folder icons with key indicator overlay
   - Key-with-X icon for folders without API keys
   - API key creation directly from folder context

4. **Enhanced Admin View**
   - Single tree view with all users
   - User folder expansion for admin oversight
   - Maintain user isolation for non-admin users

#### **Testing**
- Verify tree view performance with test data
- Verify folder operations work correctly
- Verify user access isolation is maintained

### **Phase 5: Enhanced Operations**
**Branch**: `feature/hierarchical-collections-phase5`

#### **Advanced Features**
1. **Copy/Move Operations**
   - Copy collections between folders
   - Copy folders with all contents
   - Handle ownership changes during cross-user operations
   - Empty API keys when copying to different users

2. **Bulk Operations**
   - Multi-select collections within folders
   - Bulk move collections
   - Bulk delete collections with folder context

3. **Performance Optimizations**
   - Lazy loading for large folder structures
   - Cached folder tree for frequent queries
   - Optimized database queries for hierarchy operations

---

## 🚦 **DEVELOPMENT RULES & CONSTRAINTS**

### **Critical Rules (From DEVELOPMENT_RULES.md)**
1. **NO HACKING** - Proper solutions only, fix root causes
2. **ASK PERMISSION** for destructive changes, schema changes, breaking changes
3. **MAINTAIN DATA INTEGRITY** at all times
4. **WHEN IN DOUBT - ASK** for clarification before proceeding

### **Project-Specific Constraints**
1. **Collection names CANNOT change** - Critical for data generation API
2. **Data generation API CANNOT break** - Backward compatibility required
3. **Username CANNOT change** after creation - Required for folder structure integrity
4. **API keys are folder-only** - No individual collection API keys
5. **Maximum 5 folder levels** - Performance and UX constraint
6. **User isolation maintained** - Non-admins only see/manage own folders

### **Testing Requirements**
1. **Data generation API must pass all existing tests** after each phase
2. **Migration must be reversible** to current state
3. **Performance testing** with max expected users (20) and folders
4. **Cross-browser testing** for hierarchical UI components

---

## 📈 **SUCCESS CRITERIA**

### **Phase Completion Criteria**
1. **Phase 1**: VIEWER role removed, username immutable, schema updated
2. **Phase 2**: Folder APIs functional, folder-based API keys working  
3. **Phase 3**: All existing data migrated to folder structure successfully
4. **Phase 4**: Full hierarchical UI implemented and tested
5. **Phase 5**: Advanced copy/move operations working smoothly

### **Final Success Metrics**
1. **Zero downtime** during migration process
2. **All existing API consumers continue working** without changes
3. **Admin can manage 20 users with multiple folder structures** efficiently
4. **API key management reduced** from many individual keys to few folder keys
5. **User experience improved** with organized folder-based collection management

### **Performance Targets**
- **Tree view rendering**: < 2 seconds for 20 users with 100 collections each
- **Folder operations**: < 1 second for create/rename/delete
- **Data generation API**: No performance degradation from current performance
- **API key lookup**: < 100ms for folder-based permission checking

---

## 🔄 **ROLLBACK PROCEDURES**

### **Per-Phase Rollback**
Each phase branch can be abandoned and main restored to `3db4f59` state.

### **Database Rollback**
```bash
# Stop service
pkill -f "python.*start_server"

# Restore database
cp project_design_docs/gendata_backup_3db4f59.db data/gendata.db

# Restart service  
./start_service.sh
```

### **Partial Rollback (Schema Only)**
If schema changes need rollback but data should be preserved:
```sql
-- Remove added columns (will be provided per phase)
ALTER TABLE collections DROP COLUMN folder_path;
ALTER TABLE collections DROP COLUMN parent_folder_id; 
ALTER TABLE collections DROP COLUMN is_folder;
-- Restore indexes
CREATE UNIQUE INDEX ix_collections_name ON collections(name);
```

---

## 📚 **REFERENCE DOCUMENTS**

### **Current System Documentation**
- `Latest_Project_Status.md` - Complete system overview
- `DEVELOPMENT_RULES.md` - Critical development constraints
- `README.md` - System architecture and deployment

### **Design Documentation (This Project)**
- `HIERARCHICAL_COLLECTIONS_DESIGN_PLAN.md` - This document
- `gendata_backup_3db4f59.db` - Complete database backup
- `current_database_state_3db4f59.txt` - Readable database state

### **Implementation Tracking**
Each phase will generate:
- `PHASE_N_IMPLEMENTATION_LOG.md` - Detailed implementation notes
- `PHASE_N_TESTING_RESULTS.md` - Testing outcomes and issues
- `PHASE_N_DATABASE_CHANGES.sql` - Exact SQL changes applied

---

## 🎯 **NEXT STEPS**

1. **Review and approve this design plan**
2. **Phase 1 branch created**: `feature/hierarchical-collections-phase1` ✅ READY
3. **Implement Phase 1 backend changes** (remove VIEWER, username immutable, schema)
4. **Test Phase 1 thoroughly** against existing functionality
5. **Get approval before proceeding to Phase 2**

**Each phase will be implemented, tested, and approved before moving to the next phase.**

---

**Document Status**: ✅ **COMPLETE AND READY FOR IMPLEMENTATION**
**Pre-Implementation Commit**: `3db4f59`  
**Database Backup**: `project_design_docs/gendata_backup_3db4f59.db`
**Rollback Instructions**: ✅ **VERIFIED AND TESTED**
