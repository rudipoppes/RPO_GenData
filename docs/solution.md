# RPO_GenData – Architecture and Implementation Plan

## 1) Overview
RPO_GenData is a small, maintainable system that lets users define collections and fields with generation rules (epoch time, ranges, increment/decrement) or fixed values (text/number/float). The API returns computed JSON on demand and persists only the state required for increment/decrement fields.

- Public API: GET /api/{Collection_Name}/{Collection_Type}
- Admin UI: React + Vite SPA, served by the backend under /admin
- Backend: FastAPI (Python) on port 8088
- Storage: SQLite via SQLAlchemy
- Auth: Per-user accounts with read-only API keys scoped to owned collections; headers support X-API-Key and Authorization: Bearer
- Import/Export: JSON-based config import (merge by default with dry-run) and export
- SL1 Integration: Per-collection Samples & Integration tab with sample calls, JMESPath expressions, and ScienceLogic Low-Code YAML snippets

## 2) Core requirements
- Collections have a name and two types of data groupings: Performance and Configuration.
- Fields belong to a collection + type, and use one of the supported value types.
- Fixed-only types: TEXT_FIXED, NUMBER_FIXED, FLOAT_FIXED.
- Generated types: EPOCH_NOW (epoch seconds), NUMBER_RANGE, FLOAT_RANGE, INCREMENT, DECREMENT.
- Increment/decrement persist last value across calls; ranges and epoch are computed at request time.
- Public API enforces API keys with read-only scope; keys can be restricted to owned collections.

## 3) Technology choices
- Backend: FastAPI (Python 3.10+), Uvicorn.
- Storage: SQLite (SQLAlchemy ORM) — ideal for ~100 records and simple transactional updates.
- Frontend: React + Vite (TypeScript). Built assets are served by FastAPI at /admin.
- Port: 8088 (to avoid existing services on 3000 and 4000).

## 4) Public API
- Endpoint: GET /api/{collectionName}/{collectionType}
  - collectionType ∈ {Performance, Configuration} (case-insensitive)
  - Requires API key in X-API-Key or Authorization: Bearer.
- Response example (Performance):
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
- Response example (Configuration):
```json
{
  "collection": "Truck Data01",
  "type": "Configuration",
  "generated_at_epoch": 1738875302,
  "data": {
    "Truck-id": 123,
    "Model": "HDX-220",
    "Max Capacity": 200
  }
}
```

## 5) Data model (SQLite via SQLAlchemy)
- collections
  - id (PK)
  - name (TEXT, unique)
  - owner_id (FK users.id)
  - created_at, updated_at
- fields
  - id (PK)
  - collection_id (FK collections.id)
  - collection_type ("Performance" | "Configuration")
  - field_name (TEXT)
  - value_type (TEXT enum: TEXT_FIXED, NUMBER_FIXED, FLOAT_FIXED, EPOCH_NOW, NUMBER_RANGE, FLOAT_RANGE, INCREMENT, DECREMENT)
  - fixed_value_text (TEXT, nullable)
  - fixed_value_number (INTEGER, nullable)
  - fixed_value_float (REAL, nullable)
  - range_start_number (INTEGER, nullable)
  - range_end_number (INTEGER, nullable)
  - range_start_float (REAL, nullable)
  - range_end_float (REAL, nullable)
  - float_precision (INTEGER, nullable, default 2)
  - start_number (REAL, nullable)
  - step_number (REAL, nullable)
  - reset_number (REAL, nullable)
  - current_number (REAL, nullable)  // persisted state for inc/dec
  - created_at, updated_at
- users
  - id (PK), email/username (unique), password_hash (Argon2id), role (Admin/Editor/Viewer)
  - created_at, last_login_at
- api_keys
  - id (PK), user_id (FK users.id), key_prefix, key_hash, label, status (active/revoked)
  - expires_at, last_used_at, created_at
- api_key_scopes
  - (api_key_id, scope) — default is data:read only
- api_key_allowed
  - (api_key_id, collection_id, collection_type) — whitelist

Constraints:
- unique(collection_id, collection_type, field_name)
- NUMBER_RANGE: start <= end
- FLOAT_RANGE: start <= end
- INCREMENT/DECREMENT: start, step, reset required; step > 0

## 6) Generation semantics
- EPOCH_NOW: return int(time.time()) in seconds at request.
- NUMBER_RANGE: random integer in [start, end].
- FLOAT_RANGE: random float in [start, end], rounded to float_precision (default 2).
- INCREMENT:
  - if current is NULL → set to start; emit; next = current + step; if next > reset → start; persist next.
- DECREMENT:
  - if current is NULL → set to start; emit; next = current - step; if next < reset → start; persist next.
- TEXT_FIXED / NUMBER_FIXED / FLOAT_FIXED: return stored value as-is.

## 7) Auth and access control
- Users managed by Admin. Password policy: min length 8, no complexity checks. Argon2id hashing.
- Roles:
  - Admin: manage users/collections/fields, import/export.
  - Editor: manage own collections/fields.
  - Viewer: view own collections.
- API keys:
  - Read-only (data:read) by design. No admin/config write scopes.
  - Scoped to owner’s collections (optionally to specific types).
  - Headers: X-API-Key: <key> or Authorization: Bearer <key>.
  - Plaintext shown once; only key hash stored.

## 8) Admin API (selected)
- Auth: POST /auth/login, POST /auth/logout, POST /auth/change-password
- Users (Admin): GET/POST/PATCH/DELETE /admin/users
- Collections/Fields (Admin/Editor):
  - POST /admin/collections, GET /admin/collections, GET /admin/collections/{name}
  - POST /admin/collections/{name}/fields, PATCH /admin/fields/{id}, DELETE /admin/fields/{id}
- API keys: GET/POST/PATCH/DELETE /admin/api-keys
- Import/Export: POST /admin/export, POST /admin/import?mode=merge&dry_run=true

## 9) Admin UI (React + Vite)
- Pages: Login, Collections list, Collection detail (Performance/Configuration tabs), Fields (table + add/edit), API Keys, Users (Admin), Samples & Integration.
- Samples & Integration (per collection/type):
  - Live sample JSON (uses selected API key)
  - Per-field JMESPath expressions
  - ScienceLogic Low-Code YAML blocks per field and bundled
  - JMESPath tester using jmespath.js

Examples rendered in UI (placeholders {{YOUR_API_KEY}} and URL-encoded names):

Curl:
```bash
curl -s -H "X-API-Key: {{YOUR_API_KEY}}" \
  "http://your-host:8088/api/Truck%20Data01/Performance"
```

PowerShell:
```powershell
Invoke-RestMethod -Method GET `
  -Uri "http://your-host:8088/api/Truck%20Data01/Performance" `
  -Headers @{ "X-API-Key" = "{{YOUR_API_KEY}}" }
```

Python:
```python
import requests
r = requests.get(
    "http://your-host:8088/api/Truck%20Data01/Performance",
    headers={"X-API-Key": "{{YOUR_API_KEY}}"}
)
print(r.json())
```

JMESPath examples:
```yaml
# Specific fields
value_1: data.Meters_Travelled
value_2: data."Fuel used"
# Timestamp
ts: generated_at_epoch
```

ScienceLogic Low-Code YAML — single field:
```yaml
low_code:
  version: 2
  steps:
    - http:
        url: http://your-host:8088/api/Truck%20Data01/Performance
        headers:
          X-API-Key: {{YOUR_API_KEY}}
    - json
    - jmespath:
        value: data."Fuel used"
```

ScienceLogic Low-Code YAML — bundle multiple fields:
```yaml
low_code:
  version: 2
  steps:
    - http:
        url: http://your-host:8088/api/Truck%20Data01/Performance
        headers:
          X-API-Key: {{YOUR_API_KEY}}
    - json
    - jmespath:
        value: {
          "Meters_Travelled": data.Meters_Travelled,
          "Fuel used": data."Fuel used"
        }
```

Configuration example:
```yaml
low_code:
  version: 2
  steps:
    - http:
        url: http://your-host:8088/api/Truck%20Data01/Configuration
        headers:
          X-API-Key: {{YOUR_API_KEY}}
    - json
    - jmespath:
        value: data.Model
```

Guidance:
- Quote field names with spaces/special chars in JMESPath: data."Max Capacity".
- Epoch is in seconds at generated_at_epoch.

## 10) Import/Export
- Export: JSON of collections/fields (optionally inc/dec state) for backup/migration/version control.
- Import: JSON load; default mode merge with dry_run to preview actions.
- Ownership: if exported owner matches an existing user, preserve; else assign to importer.

## 11) Deployment & operations
- Single service on 0.0.0.0:8088 via Uvicorn.
- Systemd unit for auto-restart and logs.
- SQLite DB file at /home/ubuntu/RPO_GenData/data/gendata.db.
- Backups: occasional copy of the DB file.

## 12) Security
- HTTPS recommended via reverse proxy/terminator.
- Rate limit login and API key auth.
- Never log plaintext API keys or passwords.

## 13) Testing
- Unit tests: generators (ranges, precision, inc/dec rollover), epoch seconds, fixed passthrough.
- API tests: CRUD, auth, scoping, data endpoint.
- Manual: curl/PowerShell samples; UI JMESPath tester.

## 14) Roadmap (future)
- Optional 2FA (TOTP) for users.
- Per-field templates for generated text.
- Per-collection rate limiting/quotas.

---

Document status: initial version. Port 8088 is reserved for the backend; existing services on 3000/4000 remain untouched.
