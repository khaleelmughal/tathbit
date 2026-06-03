-- ============================================================================
--  Migration: 2026-06-03 fixes
--  SAFE to run on an existing populated database. No DROP, no data loss.
--  Run: psql "$DATABASE_URL" -f db/migrations/2026_06_03_fixes.sql
-- ============================================================================

-- 1) questions.updated_at — the edit route (PUT /api/questions/:id) writes this
--    column, but the original schema never created it, so every edit 500'd.
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Keep it fresh automatically so the app never has to remember to set it.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS questions_set_updated_at ON questions;
CREATE TRIGGER questions_set_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2) lessons.updated_at — same treatment, so the new lesson-content editor
--    (admin editing the green box / key terms / points / story) has it too.
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS lessons_set_updated_at ON lessons;
CREATE TRIGGER lessons_set_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3) Helpful indexes for the paginated/searchable question bank.
CREATE INDEX IF NOT EXISTS questions_grade_idx  ON questions(grade_id);
CREATE INDEX IF NOT EXISTS questions_status_idx ON questions(status);
CREATE INDEX IF NOT EXISTS questions_type_idx   ON questions(type);
-- Trigram search on the prompt (fast ILIKE). pg_trgm ships with Postgres.
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS questions_prompt_trgm_idx
  ON questions USING gin (prompt gin_trgm_ops);
