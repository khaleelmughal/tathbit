-- ============================================================================
--  Analytics backbone — 2026-06-03
--  Makes the existing analytics queries actually work and adds the event log
--  needed for activity feeds, flashcard knowledge tracking, speed/timing and
--  mixed-vs-fixed breakdowns. Safe to re-run (IF NOT EXISTS throughout).
--
--  RUN:  psql "postgres://khaleelmughal@localhost:5432/madrasah" -f db/migrations/2026_06_03_analytics.sql
-- ============================================================================

-- 1) attempts becomes a per-QUESTION log (one row per answered question), so
--    is_correct / question_id are populated and every existing dashboard query
--    (success rate, weakest questions, subject/class breakdowns) lights up.
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS grade_id   TEXT;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS type       TEXT;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS time_ms    INT;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS session_id UUID;
-- per-question rows carry score 0/1; relax the NOT NULL so a bare answer row is fine
ALTER TABLE attempts ALTER COLUMN score DROP NOT NULL;
ALTER TABLE attempts ALTER COLUMN total DROP NOT NULL;
CREATE INDEX IF NOT EXISTS attempts_subject_idx ON attempts(subject_id);
CREATE INDEX IF NOT EXISTS attempts_session_idx ON attempts(session_id);
CREATE INDEX IF NOT EXISTS attempts_completed_idx ON attempts(completed_at);

-- 2) One row per finished quiz: powers time-per-test, speed trends, and the
--    mixed (exam) vs fixed (lesson/quick) split.
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade_id     TEXT,
  subject_id   TEXT,
  lesson_id    TEXT,
  mode         TEXT,            -- quick-quiz | lesson-practice | exam-practice
  score        INT NOT NULL DEFAULT 0,
  total        INT NOT NULL DEFAULT 0,
  duration_ms  INT,
  started_at   TIMESTAMPTZ,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_sessions_student_idx ON quiz_sessions(student_id);
CREATE INDEX IF NOT EXISTS quiz_sessions_completed_idx ON quiz_sessions(completed_at);

-- 3) Flashcard knowledge: what each student knows / is still learning / forgot.
CREATE TABLE IF NOT EXISTS flashcard_results (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id     TEXT NOT NULL,    -- e.g. seed-<lessonId>-<index> or a custom id
  subject_id  TEXT,
  lesson_id   TEXT,
  grade_id    TEXT,
  front       TEXT,             -- snapshot so the manager can show the card text
  result      TEXT NOT NULL,    -- known | learning | forgot
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS flashcard_results_student_idx ON flashcard_results(student_id);
CREATE INDEX IF NOT EXISTS flashcard_results_card_idx ON flashcard_results(card_id);

-- 4) Activity feed: login, logout, lesson reads, quiz + flashcard sessions.
CREATE TABLE IF NOT EXISTS activity_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,    -- login | logout | lesson_view | quiz_complete | flashcard_session
  subject_id  TEXT,
  lesson_id   TEXT,
  meta        JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_events_student_idx ON activity_events(student_id);
CREATE INDEX IF NOT EXISTS activity_events_created_idx ON activity_events(created_at);
