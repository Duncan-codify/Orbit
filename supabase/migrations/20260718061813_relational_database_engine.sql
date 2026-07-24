/*
# Relational Database Engine Schema

## Summary
Creates a fully normalized relational database engine powering a Notion/Airtable-style experience.
Every property is dynamic — no column names are hardcoded in SQL. All data lives in a single
record_values table keyed by (record_id, property_id).

## New Tables

### databases
The top-level container. Each database has a name, icon, description, and optional cover.

### database_views
Each database can have many saved views (Table, Board, Gallery, etc.).
Views store their own filters, sorting, grouping, hidden columns, and display settings,
but all point to the same underlying records.

### database_properties
Dynamic columns. Each property has a type (text, number, select, etc.) and a JSON config
for type-specific settings (decimal places, currency symbol, date format, etc.).
Position controls display order.

### database_records
Rows in a database. Each record also has a position for manual sorting.

### record_values
One row per (record, property) pair. The value is stored as JSONB so every type
(text, number, boolean, date, array for multi-select) is handled uniformly.

### property_options
Selectable options for Select / Multi-select / Status properties.
Each option has a label and a color.

### view_filters
Saved filter rules per view: which property, what operator, and what value.

### view_sorts
Saved sort rules per view: which property, direction, and priority.

### view_groupings
Saved grouping configuration per view.

## Security
- RLS enabled on all tables.
- Single-tenant (no auth) — policies grant anon + authenticated full CRUD.
*/

-- ─── databases ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS databases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL DEFAULT 'Untitled Database',
  icon        text,
  cover       text,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE databases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_databases" ON databases;
CREATE POLICY "anon_select_databases" ON databases FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_databases" ON databases;
CREATE POLICY "anon_insert_databases" ON databases FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_databases" ON databases;
CREATE POLICY "anon_update_databases" ON databases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_databases" ON databases;
CREATE POLICY "anon_delete_databases" ON databases FOR DELETE TO anon, authenticated USING (true);

-- ─── database_views ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS database_views (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id         uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name                text NOT NULL DEFAULT 'View',
  type                text NOT NULL DEFAULT 'table',
  icon                text,
  position            integer NOT NULL DEFAULT 0,
  is_default          boolean NOT NULL DEFAULT false,
  is_pinned           boolean NOT NULL DEFAULT false,
  is_favorite         boolean NOT NULL DEFAULT false,
  hidden_properties   uuid[] NOT NULL DEFAULT '{}',
  row_height          text NOT NULL DEFAULT 'medium',
  card_size           text NOT NULL DEFAULT 'medium',
  color_settings      jsonb NOT NULL DEFAULT '{}',
  calendar_property   uuid,
  group_by_property   uuid,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_database_views_database_id ON database_views(database_id);

ALTER TABLE database_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_database_views" ON database_views;
CREATE POLICY "anon_select_database_views" ON database_views FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_database_views" ON database_views;
CREATE POLICY "anon_insert_database_views" ON database_views FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_database_views" ON database_views;
CREATE POLICY "anon_update_database_views" ON database_views FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_database_views" ON database_views;
CREATE POLICY "anon_delete_database_views" ON database_views FOR DELETE TO anon, authenticated USING (true);

-- ─── database_properties ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS database_properties (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  name        text NOT NULL,
  type        text NOT NULL DEFAULT 'text',
  position    integer NOT NULL DEFAULT 0,
  is_primary  boolean NOT NULL DEFAULT false,
  config      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_database_properties_database_id ON database_properties(database_id);

ALTER TABLE database_properties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_database_properties" ON database_properties;
CREATE POLICY "anon_select_database_properties" ON database_properties FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_database_properties" ON database_properties;
CREATE POLICY "anon_insert_database_properties" ON database_properties FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_database_properties" ON database_properties;
CREATE POLICY "anon_update_database_properties" ON database_properties FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_database_properties" ON database_properties;
CREATE POLICY "anon_delete_database_properties" ON database_properties FOR DELETE TO anon, authenticated USING (true);

-- ─── database_records ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS database_records (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  database_id uuid NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_database_records_database_id ON database_records(database_id);

ALTER TABLE database_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_database_records" ON database_records;
CREATE POLICY "anon_select_database_records" ON database_records FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_database_records" ON database_records;
CREATE POLICY "anon_insert_database_records" ON database_records FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_database_records" ON database_records;
CREATE POLICY "anon_update_database_records" ON database_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_database_records" ON database_records;
CREATE POLICY "anon_delete_database_records" ON database_records FOR DELETE TO anon, authenticated USING (true);

-- ─── record_values ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS record_values (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid NOT NULL REFERENCES database_records(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES database_properties(id) ON DELETE CASCADE,
  value       jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_record_values_record_id ON record_values(record_id);
CREATE INDEX IF NOT EXISTS idx_record_values_property_id ON record_values(property_id);

ALTER TABLE record_values ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_record_values" ON record_values;
CREATE POLICY "anon_select_record_values" ON record_values FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_record_values" ON record_values;
CREATE POLICY "anon_insert_record_values" ON record_values FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_record_values" ON record_values;
CREATE POLICY "anon_update_record_values" ON record_values FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_record_values" ON record_values;
CREATE POLICY "anon_delete_record_values" ON record_values FOR DELETE TO anon, authenticated USING (true);

-- ─── property_options ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS property_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES database_properties(id) ON DELETE CASCADE,
  label       text NOT NULL,
  color       text NOT NULL DEFAULT 'gray',
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_options_property_id ON property_options(property_id);

ALTER TABLE property_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_property_options" ON property_options;
CREATE POLICY "anon_select_property_options" ON property_options FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_property_options" ON property_options;
CREATE POLICY "anon_insert_property_options" ON property_options FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_property_options" ON property_options;
CREATE POLICY "anon_update_property_options" ON property_options FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_property_options" ON property_options;
CREATE POLICY "anon_delete_property_options" ON property_options FOR DELETE TO anon, authenticated USING (true);

-- ─── view_filters ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS view_filters (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id     uuid NOT NULL REFERENCES database_views(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES database_properties(id) ON DELETE CASCADE,
  operator    text NOT NULL DEFAULT 'equals',
  value       jsonb,
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE view_filters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_view_filters" ON view_filters;
CREATE POLICY "anon_select_view_filters" ON view_filters FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_view_filters" ON view_filters;
CREATE POLICY "anon_insert_view_filters" ON view_filters FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_view_filters" ON view_filters;
CREATE POLICY "anon_update_view_filters" ON view_filters FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_view_filters" ON view_filters;
CREATE POLICY "anon_delete_view_filters" ON view_filters FOR DELETE TO anon, authenticated USING (true);

-- ─── view_sorts ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS view_sorts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id     uuid NOT NULL REFERENCES database_views(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES database_properties(id) ON DELETE CASCADE,
  direction   text NOT NULL DEFAULT 'asc',
  position    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE view_sorts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_view_sorts" ON view_sorts;
CREATE POLICY "anon_select_view_sorts" ON view_sorts FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_view_sorts" ON view_sorts;
CREATE POLICY "anon_insert_view_sorts" ON view_sorts FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_view_sorts" ON view_sorts;
CREATE POLICY "anon_update_view_sorts" ON view_sorts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_view_sorts" ON view_sorts;
CREATE POLICY "anon_delete_view_sorts" ON view_sorts FOR DELETE TO anon, authenticated USING (true);

-- ─── view_groupings ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS view_groupings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id     uuid NOT NULL REFERENCES database_views(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES database_properties(id) ON DELETE CASCADE,
  collapsed_groups jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE view_groupings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_view_groupings" ON view_groupings;
CREATE POLICY "anon_select_view_groupings" ON view_groupings FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_view_groupings" ON view_groupings;
CREATE POLICY "anon_insert_view_groupings" ON view_groupings FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_view_groupings" ON view_groupings;
CREATE POLICY "anon_update_view_groupings" ON view_groupings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_view_groupings" ON view_groupings;
CREATE POLICY "anon_delete_view_groupings" ON view_groupings FOR DELETE TO anon, authenticated USING (true);
