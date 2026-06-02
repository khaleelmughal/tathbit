-- ============================================================================
--  MADRASAH REVISION — PostgreSQL schema
--  Roles: ONE admin (you) -> creates teachers -> each teacher owns ONE class
--         -> admin assigns students into that class.
--  Students log in with username + PIN; admin/teachers with email + password.
--  All secrets are bcrypt-hashed. No third-party auth.
--  Run: psql "$DATABASE_URL" -f db/schema.sql
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()

DROP TABLE IF EXISTS attempts CASCADE;
DROP TABLE IF EXISTS student_state CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS class_students CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ---- Identity -------------------------------------------------------------
-- One table for everyone. Admin/teacher use email+password; students use
-- username+pin. Unused login fields stay NULL. password_hash holds the bcrypt
-- hash of whichever secret applies.
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'student');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role          user_role NOT NULL,
  name          TEXT NOT NULL,
  email         TEXT UNIQUE,            -- admin + teachers
  username      TEXT UNIQUE,            -- students
  password_hash TEXT NOT NULL,          -- bcrypt of password (admin/teacher) or PIN (student)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT login_present CHECK (email IS NOT NULL OR username IS NOT NULL)
);

-- A teacher owns at most ONE class (enforced by UNIQUE teacher_id).
CREATE TABLE classes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  grade_id    TEXT NOT NULL,            -- e.g. 'g5' (see grades.id)
  teacher_id  UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A student is in ONE class at a time (UNIQUE student_id). Relax this UNIQUE
-- later if you ever want multi-class students.
CREATE TABLE class_students (
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (class_id, student_id)
);

-- ---- Syllabus (seeded from data/syllabus, then teachers add questions) -----
CREATE TABLE grades (
  id   TEXT PRIMARY KEY,                -- 'g1'..'g6','g11','g12'
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE subjects (
  id        TEXT PRIMARY KEY,           -- 'aqaaid','akhlaaq',...
  grade_id  TEXT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  tagline   TEXT,
  source    TEXT,
  position  INT NOT NULL DEFAULT 0
);

CREATE TABLE lessons (
  id          TEXT PRIMARY KEY,         -- 'aq-l1',...
  subject_id  TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  n           INT,
  title       TEXT NOT NULL,
  pages       TEXT,
  summary     TEXT,
  -- key terms, important points, story, seed flashcards: kept as JSON for
  -- flexibility per book layout.
  content     JSONB NOT NULL DEFAULT '{}'::jsonb,
  needs_content BOOLEAN NOT NULL DEFAULT false,
  position    INT NOT NULL DEFAULT 0
);

-- Every question type lives here. Type-specific fields (options, pairs,
-- accepted answers, correct answer) go in `payload` JSONB so one table serves
-- multiple-choice / short-answer / fill-blank / true-false / match / etc.
CREATE TABLE questions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_id    TEXT REFERENCES grades(id) ON DELETE CASCADE,
  subject_id  TEXT REFERENCES subjects(id) ON DELETE CASCADE,
  lesson_id   TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  type        TEXT NOT NULL,            -- 'multiple-choice' | 'short-answer' | 'fill-blank' | 'true-false' | 'match'
  prompt      TEXT NOT NULL,
  payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
  explanation TEXT,
  difficulty  TEXT NOT NULL DEFAULT 'medium',
  status      TEXT NOT NULL DEFAULT 'active',   -- 'active' | 'draft'  (teacher chooses each time)
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,  -- NULL = seeded from the book
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX questions_lesson_idx  ON questions(lesson_id);
CREATE INDEX questions_subject_idx ON questions(subject_id);

-- ---- Progress -------------------------------------------------------------
-- Whole-progress blob per student (mirrors the frontend state shape exactly,
-- so the existing app logic works unchanged). Normalise later if needed.
CREATE TABLE student_state (
  student_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Queryable attempt log so teachers get fast dashboards without parsing JSON.
CREATE TABLE attempts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id  UUID REFERENCES questions(id) ON DELETE SET NULL,
  subject_id   TEXT,
  lesson_id    TEXT,
  mode         TEXT,
  is_correct   BOOLEAN,
  score        INT NOT NULL,
  total        INT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX attempts_student_idx ON attempts(student_id);
CREATE INDEX attempts_question_idx ON attempts(question_id);

-- ---- Flashcards -----------------------------------------------------------
-- Spaced repetition flashcards for each lesson
CREATE TABLE flashcards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id   TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  front       TEXT NOT NULL,            -- Question or prompt
  back        TEXT NOT NULL,            -- Answer or explanation
  difficulty  TEXT NOT NULL DEFAULT 'medium',  -- 'easy' | 'medium' | 'hard'
  tags        JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX flashcards_lesson_idx ON flashcards(lesson_id);

-- Spaced repetition review tracking per student
CREATE TABLE flashcard_reviews (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flashcard_id      UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  student_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quality           INT NOT NULL CHECK (quality >= 0 AND quality <= 5),  -- 0-5 quality rating
  ease_factor       DECIMAL(3,2) NOT NULL DEFAULT 2.50,  -- SM-2 algorithm ease factor
  interval_days     INT NOT NULL DEFAULT 1,               -- Days until next review
  next_review_date  TIMESTAMPTZ NOT NULL,                 -- When to review next
  review_count      INT NOT NULL DEFAULT 1,               -- How many times reviewed
  reviewed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(flashcard_id, student_id)  -- One review record per student per flashcard
);
CREATE INDEX flashcard_reviews_student_idx ON flashcard_reviews(student_id);
CREATE INDEX flashcard_reviews_due_idx ON flashcard_reviews(next_review_date);
CREATE INDEX flashcard_reviews_flashcard_idx ON flashcard_reviews(flashcard_id);
