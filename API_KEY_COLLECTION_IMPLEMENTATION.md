# API Key-Collection Integration Implementation Plan

## Current Status Analysis (Research Completed)

### ✅ **Backend Components (COMPLETE)**
- Database schema with proper relationships:
  - `api_keys` table with user relationship
  - `api_key_scopes` table (uses "data:read" scope)  
  - `api_key_allowed` table for collection access control
- Full CRUD API endpoints in `/app/api/admin_api_keys.py`:
  - `POST /api-keys` - accepts `collection_ids` parameter
  - `GET /api-keys/{id}/allowed-collections` - view permissions
  - Proper validation ensuring user owns collections
- API key authentication working for public data endpoint

### 🔄 **Frontend Components (INCOMPLETE)**
- Basic API key CRUD UI exists in `ApiKeys.tsx`
- **MISSING**: Collection selection during creation
- **MISSING**: Full API key display with copy functionality
- **MISSING**: Collection permission management UI

## Implementation Tasks

### **Task 1: Enhanced API Key Creation UI**

#### 1.1 Fix API Key Display & Copy Functionality
**Problem**: After creation, only partial key shown, no copy function, no proper warning
**Solution**: 
- Show complete API key in secure modal/popup
- Add copy-to-clipboard functionality
- Display security warning about one-time visibility
- Proper "I understand" confirmation before hiding

**Files to Modify**:
- `frontend/src/pages/ApiKeys.tsx` - Enhance `CreateApiKeyForm` component
- Add copy functionality and better key display modal

#### 1.2 Add Collection Selection to API Key Creation
**Problem**: No UI to select which collections API key can access
**Solution**:
- Load user's collections in create form
- Add multi-select checkboxes or dropdown
- Include "All Collections" option (send empty array)
- Show collection names and IDs for clarity

**Backend API**: Already supports `collection_ids` parameter in `APIKeyCreate` schema

### **Task 2: API Key Permission Display**

#### 2.1 Show Collection Permissions on API Key List
**Problem**: API key list doesn't show which collections each key can access
**Solution**:
- Load allowed collections for each API key
- Display collection names (not just "API Access")
- Add "View Details" or expand functionality

**Backend API**: Use existing `GET /api-keys/{id}/allowed-collections` endpoint

#### 2.2 Collection Permission Details Modal
**Problem**: No way to see full permission details
**Solution**:
- Add "View Permissions" button/link
- Modal showing all allowed collections
- Show collection types if specified (Performance/Configuration)

### **Task 3: Collection-Side API Key Management**

#### 3.1 Add API Access Tab to Collection Detail
**Problem**: No way to see which API keys have access to a collection
**Solution**:
- Add "API Access" tab to `CollectionDetail.tsx`
- Show list of API keys that can access this collection
- Display key labels, creation dates, status

**Backend API**: Create new endpoint `GET /admin/collections/{id}/api-keys`

#### 3.2 Manage API Key Access from Collection
**Problem**: Can't grant/revoke collection access from collection page
**Solution**:
- Add "Grant Access" button to add new API keys
- Add "Revoke Access" for existing keys
- Confirmation dialogs for destructive actions

### **Task 4: Advanced Permission Management**

#### 4.1 Edit API Key Collections (Future)
**Problem**: Can't modify collection permissions after creation
**Solution**:
- Add "Edit Permissions" functionality
- Allow adding/removing collection access
- Bulk permission management

## Technical Implementation Details

### **Frontend API Integration**
Current API endpoints available:
```typescript
// Already implemented
apiKeysApi.create(data: CreateAPIKeyRequest) // supports collection_ids
apiKeysApi.list()
apiKeysApi.get(id)
apiKeysApi.revoke(id)
apiKeysApi.delete(id)

// Need to add
apiKeysApi.getAllowedCollections(id) // GET /api-keys/{id}/allowed-collections
collectionsApi.getApiKeys(id) // GET /admin/collections/{id}/api-keys (NEW)
```

### **Data Flow**
1. **API Key Creation**: 
   - User selects collections → Frontend sends `collection_ids` → Backend validates ownership → Creates key + permissions
2. **Permission Display**: 
   - Load API key → Fetch allowed collections → Display collection names
3. **Collection View**: 
   - Load collection → Fetch associated API keys → Show access list

### **Security Considerations**
- Only show collections user owns
- Validate all collection access permissions
- Never log or expose full API keys after initial display
- Proper confirmation for destructive actions

## File Structure

```
frontend/src/
├── pages/
│   ├── ApiKeys.tsx                 # ✅ Exists, needs enhancement
│   └── CollectionDetail.tsx        # ✅ Exists, needs API Access tab
├── components/
│   ├── ApiKeyCreateForm.tsx        # 🔄 Extract and enhance from ApiKeys.tsx
│   ├── ApiKeyPermissionModal.tsx   # 🆕 New component
│   └── CollectionApiKeysList.tsx   # 🆕 New component
├── services/
│   └── api.ts                      # ✅ Exists, needs additional endpoints
└── types/
    └── api.ts                      # ✅ Exists, may need additional types
```

## Implementation Priority

### **Phase 1: Critical UX Fixes**
1. ✅ Fix API key display with copy functionality (immediate)
2. ✅ Add collection selection to creation form (immediate)

### **Phase 2: Permission Visibility** 
3. Show collection permissions on API key list
4. Add permission details modal

### **Phase 3: Collection Management**
5. Add API access tab to collection detail
6. Collection-side permission management

### **Phase 4: Advanced Features**
7. Edit existing API key permissions
8. Bulk permission management
9. API key usage analytics (future)

## Backend API Status

### **Existing & Working**
- ✅ API key CRUD operations
- ✅ Collection selection during creation (`collection_ids`)
- ✅ Permission validation (user must own collections)
- ✅ API key authentication for data generation
- ✅ `GET /api-keys/{id}/allowed-collections` endpoint

### **May Need Enhancement**
- 🔄 Add `GET /admin/collections/{id}/api-keys` endpoint
- 🔄 Add collection names to API key list responses (join query)
- 🔄 Bulk permission update endpoints (future)

## Testing Checklist

### **Functional Testing**
- [ ] Create API key with no collection restrictions (all collections)
- [ ] Create API key with specific collection restrictions
- [ ] Verify API key can only access permitted collections
- [ ] Test copy-to-clipboard functionality
- [ ] Verify one-time key display security
- [ ] Test collection permission display accuracy
- [ ] Test API key revoke/delete from both sides

### **Security Testing**
- [ ] Verify users can only create keys for owned collections
- [ ] Test API key validation on public endpoints
- [ ] Ensure deleted collections cascade remove permissions
- [ ] Verify proper permission validation

## Next Actions

**Immediate (This Session)**:
1. Enhance `ApiKeys.tsx` with proper key display + copy functionality
2. Add collection selection to API key creation form
3. Test basic collection-restricted API key creation

**Follow-up Sessions**:
1. Add collection permission display to API key list
2. Implement collection-side API key management
3. Add advanced permission editing capabilities

---

**Last Updated**: 2025-10-07
**Status**: Ready to implement Phase 1 enhancements
**Current Working Commit**: 5b58a4e (bulk delete functionality complete)

## Implementation Progress Update

### ✅ **COMPLETED: Phase 1 Critical UX Fixes**

#### 1.1 Enhanced API Key Display & Copy Functionality
**Status**: ✅ **COMPLETE**
**Changes Made**:
- Added secure modal popup showing complete API key after creation
- Implemented copy-to-clipboard functionality with visual feedback
- Added proper security warning about one-time visibility
- Required user acknowledgment checkbox before hiding key
- Professional UI with proper styling and icons

#### 1.2 Collection Selection in API Key Creation
**Status**: ✅ **COMPLETE** 
**Changes Made**:
- Added radio button selection: "All Collections" vs "Specific Collections"
- Loads user's collections dynamically in creation form
- Multi-select checkboxes for specific collection permissions
- Proper validation - requires at least one collection if not "all"
- Sends `collection_ids` parameter to backend API correctly

**Files Modified**:
- ✅ `frontend/src/pages/ApiKeys.tsx` - Complete rewrite with enhanced functionality
- ✅ Frontend build successful without TypeScript errors

### **Current Functionality**
1. ✅ **Secure API Key Creation**: 
   - Complete key displayed once with copy functionality
   - Security warning and acknowledgment required
   - Professional modal UI with proper UX flow

2. ✅ **Collection Access Control**:
   - "All Collections" option (sends undefined collection_ids)
   - "Specific Collections" with checkboxes (sends selected IDs)
   - Dynamic loading of user's available collections
   - Proper validation and form handling

3. ✅ **Backend Integration**:
   - Uses existing `CreateAPIKeyRequest` interface
   - Sends `collection_ids` parameter correctly 
   - Backend validates and creates proper permissions

### **Ready for Testing**
- ✅ Frontend built and deployed
- ✅ Backend server running with existing API key endpoints
- ✅ Collection selection UI functional
- ✅ Secure API key display with copy functionality

### **Next Phase Actions**
**Phase 2: Permission Visibility** (Next session)
1. Show collection permissions on API key list
2. Add "View Permissions" modal for detailed access info
3. Display collection names instead of generic "API Access"

---

**Last Updated**: 2025-10-07 21:52
**Status**: Phase 1 Complete - Ready for user testing and Phase 2 implementation
