# Phase 1 Implementation Log

Date: 2025-10-10
Branch: feature/hierarchical-collections-phase1
Baseline: 3db4f59
HEAD (start): 168bea2

Summary
- Remove VIEWER role (minimum role is EDITOR)
- Make username immutable after creation
- Frontend: remove username editing and Viewer role option
- Prepare SQL for Phase 1 schema changes (not applied)

Backend Changes
1) Removed VIEWER from UserRole enum; default role now EDITOR
   - File: backend/app/models/user.py
2) User update schemas no longer allow username changes; default role EDITOR
   - File: backend/app/schemas/user.py
   - File: backend/app/schemas/auth.py
3) Admin and Profile update endpoints no longer change username
   - File: backend/app/api/admin_users.py

Frontend Changes
1) Users admin page
   - Default role for create now 'Editor'
   - Role select no longer offers 'Viewer'
   - Username field is disabled during edit, with helper text
   - Update payload excludes username
   - File: frontend/src/pages/Users.tsx
2) Profile page
   - Username is read-only (disabled), not sent to server
   - File: frontend/src/pages/Profile.tsx
3) Types
   - Removed 'Viewer' from role unions
   - Removed username from update types
   - File: frontend/src/types/api.ts

Notes
- No database migrations have been applied in this step.
- A SQL script (PHASE_1_DATABASE_CHANGES.sql) has been prepared for review.
