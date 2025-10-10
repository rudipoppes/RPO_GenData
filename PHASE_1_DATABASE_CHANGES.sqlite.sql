-- Phase 1 Database Schema Changes for SQLite
-- 1) Collections: add folder support columns
ALTER TABLE collections ADD COLUMN folder_path TEXT;
ALTER TABLE collections ADD COLUMN parent_folder_id INTEGER REFERENCES collections(id);
ALTER TABLE collections ADD COLUMN is_folder INTEGER DEFAULT 0;

-- Remove global uniqueness of names
DROP INDEX IF EXISTS ix_collections_name;

-- Ensure unique folder_path and parent index
CREATE UNIQUE INDEX IF NOT EXISTS ix_collections_folder_path ON collections(folder_path);
CREATE INDEX IF NOT EXISTS ix_collections_parent_folder ON collections(parent_folder_id);

-- 2) API key allowed: add folder_path column
ALTER TABLE api_key_allowed ADD COLUMN folder_path TEXT;

-- 3) Role migration
UPDATE users SET role = 'Editor' WHERE role = 'Viewer';
