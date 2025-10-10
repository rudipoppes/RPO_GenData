-- Phase 1 Database Schema Changes (Prepared for review, NOT applied)
-- Baseline: commit 3db4f59

-- 1) Collections table: add folder support
ALTER TABLE collections ADD COLUMN IF NOT EXISTS folder_path VARCHAR;
ALTER TABLE collections ADD COLUMN IF NOT EXISTS parent_folder_id INTEGER REFERENCES collections(id);
ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_folder BOOLEAN DEFAULT false;

-- Remove global uniqueness of names (will be replaced by folder_path uniqueness)
-- Note: Drop index only if it exists and is known; adjust index name to your DB
-- Example for SQLite (indexes are named automatically); for Postgres adjust accordingly
-- DROP INDEX IF EXISTS ix_collections_name;

-- Ensure unique folder_path and index on parent
CREATE UNIQUE INDEX IF NOT EXISTS ix_collections_folder_path ON collections(folder_path);
CREATE INDEX IF NOT EXISTS ix_collections_parent_folder ON collections(parent_folder_id);

-- 2) API key allowed: add folder_path for folder-based scoping (keep collection_id during migration)
ALTER TABLE api_key_allowed ADD COLUMN IF NOT EXISTS folder_path VARCHAR;

-- 3) User role migration (convert VIEWER -> EDITOR)
-- This will only be run when applying migration; included here for completeness
UPDATE users SET role = 'Editor' WHERE role = 'Viewer';

-- 4) Optional: enforce username immutability at application level (no DB changes here)
