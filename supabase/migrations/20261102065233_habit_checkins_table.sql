/*
# Create habit_checkins table

1. New Tables
- `habit_checkins`: Daily check-in records for habit tracking
  - id (uuid, primary key)
  - record_id (uuid, references database_records — the habit row)
  - check_date (date, the day the check-in is for)
  - completed (boolean, whether the habit was done that day)
  - mood (text, nullable — one of: great, good, okay, low, tough)
  - note (text, nullable — optional journal note for the check-in)
  - created_at (timestamp)
  - updated_at (timestamp)

2. Indexes
- idx_habit_checkins_record_date: Fast lookups per habit + date range
- Unique constraint on (record_id, check_date) so only one check-in per habit per day

3. Security
- RLS enabled on habit_checkins.
- Single-tenant (no auth) — grant CRUD to anon + authenticated.
- All data intentionally shared/public within workspace.
*/

CREATE TABLE IF NOT EXISTS habit_checkins (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id   uuid NOT NULL REFERENCES database_records(id) ON DELETE CASCADE,
  check_date  date NOT NULL,
  completed   boolean NOT NULL DEFAULT true,
  mood        text CHECK (mood IN ('great', 'good', 'okay', 'low', 'tough') OR mood IS NULL),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (record_id, check_date)
);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_record_date
  ON habit_checkins(record_id, check_date);

ALTER TABLE habit_checkins ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON habit_checkins TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_habit_checkins" ON habit_checkins;
CREATE POLICY "anon_select_habit_checkins" ON habit_checkins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_habit_checkins" ON habit_checkins;
CREATE POLICY "anon_insert_habit_checkins" ON habit_checkins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_habit_checkins" ON habit_checkins;
CREATE POLICY "anon_update_habit_checkins" ON habit_checkins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_habit_checkins" ON habit_checkins;
CREATE POLICY "anon_delete_habit_checkins" ON habit_checkins FOR DELETE
  TO anon, authenticated USING (true);
