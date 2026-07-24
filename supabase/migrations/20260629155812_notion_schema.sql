/*
# Create Notion-like Block-Based Database Schema

1. New Tables
- `workspaces`: Top-level containers for organizing content
  - id (uuid, primary key)
  - name (text, not null)
  - icon (text, default '📁')
  - created_at (timestamp)

- `blocks`: The unified core table - every entity (page, text, heading, todo, image, database, etc.) is a block
  - id (uuid, primary key)
  - workspace_id (uuid, references workspaces)
  - parent_id (uuid, self-referencing for tree structure, nullable for root blocks)
  - type (text, not null - paragraph, heading1, heading2, heading3, bulletList, numberedList, todo, quote, code, divider, image, page, database)
  - content (text, the block's text content)
  - properties (jsonb, dynamic data like checked status for todos, icon for pages, columns for databases)
  - children (uuid[], ordered array of child block IDs for tree structure)
  - created_at (timestamp)
  - updated_at (timestamp)

- `collections`: Metadata for user-defined databases
  - id (uuid, primary key)
  - block_id (uuid, references blocks - the database block this belongs to)
  - workspace_id (uuid, references workspaces)
  - name (text, not null)
  - schema (jsonb, defines custom columns/properties)
  - created_at (timestamp)

- `collection_views`: Stores view configurations (table, board, calendar, etc.)
  - id (uuid, primary key)
  - collection_id (uuid, references collections)
  - name (text, not null)
  - type (text, not null - table, board, calendar, gallery, timeline)
  - query_config (jsonb, sorting, filtering, visible properties)
  - created_at (timestamp)

- `collection_rows`: Individual rows in a database, each is a block
  - id (uuid, primary key)
  - collection_id (uuid, references collections)
  - block_id (uuid, references blocks - the page block representing this row)
  - cells (jsonb, maps column IDs to cell values)
  - created_at (timestamp)
  - updated_at (timestamp)

2. Indexes
- idx_blocks_workspace: Fast workspace lookups
- idx_blocks_parent: Fast tree traversal
- idx_blocks_type: Filter by block type
- idx_collection_rows_collection: Fast row lookups by collection

3. Security
- Enable RLS on all tables
- Single-tenant app (no auth) - allow anon + authenticated full CRUD access
- All data is intentionally shared/public within the workspace context
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. WORKSPACES
CREATE TABLE IF NOT EXISTS workspaces (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    icon text NOT NULL DEFAULT '📁',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_workspaces" ON workspaces;
CREATE POLICY "anon_crud_workspaces" ON workspaces FOR ALL
TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. BLOCKS (The Core Engine)
CREATE TABLE IF NOT EXISTS blocks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
    
    -- Block type discriminator
    type text NOT NULL CHECK (
        type IN ('paragraph', 'heading1', 'heading2', 'heading3', 'bulletList', 'numberedList', 
                 'todo', 'quote', 'code', 'divider', 'image', 'page', 'database')
    ),
    
    -- Text content
    content text DEFAULT '',
    
    -- Dynamic properties (JSONB for flexibility)
    -- For pages: { icon: '📋', cover: 'url' }
    -- For todos: { checked: boolean }
    -- For databases: { columns: [...], rows: [...] } (or separate tables)
    -- For images: { url: '...', caption: '...' }
    properties jsonb DEFAULT '{}'::jsonb,
    
    -- Ordered array of child block UUIDs
    -- Parent stores the order, not the children themselves
    children uuid[] DEFAULT ARRAY[]::uuid[],
    
    -- Timestamps
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add parent_id constraint after table creation (self-referencing)
ALTER TABLE blocks DROP CONSTRAINT IF EXISTS blocks_parent_id_fkey;
ALTER TABLE blocks ADD CONSTRAINT blocks_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES blocks(id) ON DELETE CASCADE;

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_blocks" ON blocks;
CREATE POLICY "anon_select_blocks" ON blocks FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_blocks" ON blocks;
CREATE POLICY "anon_insert_blocks" ON blocks FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_blocks" ON blocks;
CREATE POLICY "anon_update_blocks" ON blocks FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_blocks" ON blocks;
CREATE POLICY "anon_delete_blocks" ON blocks FOR DELETE
TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blocks_workspace ON blocks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_blocks_parent ON blocks(parent_id);
CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);

-- 3. COLLECTIONS (Database metadata)
CREATE TABLE IF NOT EXISTS collections (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    block_id uuid NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
    workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name text NOT NULL,
    
    -- Schema defines custom columns
    -- Example: { "col_status": { "name": "Status", "type": "select", "options": [...] } }
    schema jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    created_at timestamptz DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_collections" ON collections;
CREATE POLICY "anon_crud_collections" ON collections FOR ALL
TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. COLLECTION VIEWS
CREATE TABLE IF NOT EXISTS collection_views (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    name text NOT NULL,
    
    -- View type: table, board, calendar, gallery, timeline
    type text NOT NULL CHECK (type IN ('table', 'board', 'calendar', 'gallery', 'timeline')),
    
    -- Query configuration: sorting, filtering, visible columns
    -- Example: { "sort": [{ "column": "col_date", "direction": "asc" }], "filter": [], "visible": ["col_status"] }
    query_config jsonb NOT NULL DEFAULT '{"sort": [], "filter": [], "visible": []}'::jsonb,
    
    created_at timestamptz DEFAULT now()
);

ALTER TABLE collection_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_collection_views" ON collection_views;
CREATE POLICY "anon_crud_collection_views" ON collection_views FOR ALL
TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. COLLECTION ROWS
CREATE TABLE IF NOT EXISTS collection_rows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    block_id uuid REFERENCES blocks(id) ON DELETE CASCADE,
    
    -- Cell values mapped by column ID
    -- Example: { "col_status": "opt-2", "col_date": "2026-06-30", "title": "Build API" }
    cells jsonb NOT NULL DEFAULT '{}'::jsonb,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE collection_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_crud_collection_rows" ON collection_rows;
CREATE POLICY "anon_crud_collection_rows" ON collection_rows FOR ALL
TO anon, authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_collection_rows_collection ON collection_rows(collection_id);

-- 6. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blocks_updated_at ON blocks;
CREATE TRIGGER trigger_blocks_updated_at
    BEFORE UPDATE ON blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_collection_rows_updated_at ON collection_rows;
CREATE TRIGGER trigger_collection_rows_updated_at
    BEFORE UPDATE ON collection_rows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();