# Phase 1 Testing Results (WIP)

Scope: Code-only changes (no schema changes applied yet)

Manual Checks
- Admin Users page
  - [ ] Creating user with default role Editor works
  - [ ] Role dropdown has only Editor and Admin
  - [ ] Editing user disables username field and shows helper text
  - [ ] Updating role/email works; attempting to change username blocked by UI
- Profile page
  - [ ] Username is read-only and not editable
  - [ ] Email update works
  - [ ] Password change works

Backend API
- [ ] PATCH /admin/users/{id} ignores username changes (schema removed)
- [ ] PATCH /admin/profile ignores username changes (schema removed)
- [ ] Default role for new users is Editor when not specified

Automated Tests
- [ ] Existing tests pass locally
- [ ] Add/Update unit tests for username immutability and role set (pending)

Notes
- After schema approval and migration, add DB tests for constraints.
