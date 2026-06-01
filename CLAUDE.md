# Madrasah Revision — project guide for Claude Code

A revision app for a single madrasah using the **Tas-heel series**. NOT Next.js
(never use Next.js here). NOT multi-tenant. One deployment, one admin.

## Stack (fixed — do not substitute)
- **Frontend:** Vite + React + TypeScript. Inline-style design system (warm cream
  + madrasah green, Fraunces + Plus Jakarta Sans). Keep this look.
- **Backend:** Express (ESM, run with `tsx`).
- **Database:** PostgreSQL only. No Supabase, no Firebase, no third-party services.
- **Auth:** email+password (admin, teachers) and username+PIN (students). All
  secrets bcrypt-hashed in Postgres. JWT bearer tokens. No SSO, no OAuth.

## Roles (keep simple)
- **Admin** — exactly one. Creates teachers, creates students + their logins,
  assigns students to a teacher's class. Top of the tree.
- **Teacher** — email+password. Owns **one** class. Sees that class's progress,
  adds questions (chooses *publish now* or *save as draft* each time), views syllabus.
- **Student** — username+PIN (Muhammad is 10). Revises, takes quizzes, flashcards.

## Data model
`admin → creates teacher → teacher owns ONE class (UNIQUE) → admin assigns
students into it (a student is in ONE class, UNIQUE)`. See `db/schema.sql`.

## Layout
- `frontend/` — the student/teacher/admin app. `src/App.jsx` is the working
  single-file app (1100+ lines, all 5 Grade-5 subjects). Persists via
  `window.storage` → localStorage (see `src/main.tsx`).
- `backend/`  — Express API + Postgres. Routes under `src/routes/`.
- `db/`       — `schema.sql` (run once) + this is the source of truth for tables.
- `frontend/src/data/syllabus.json` — extracted content, also seeded into Postgres.

## Content status (IMPORTANT)
Only **Grade 5** has real, book-accurate content (transcribed from the uploaded
Tas-heel PDFs). Grades 1-4, 6, 11, 12 exist as **empty shells** in the DB. Do NOT
invent Islamic content — it must come from the actual books. Islamic content must
be reviewed by a parent/teacher before going live.

## Build order from here (suggested)
1. Run locally (see README) — Muhammad can use the frontend on localStorage today.
2. Wire `frontend` auth screens (admin / teacher / student login) to the API.
3. Route App.jsx's `store` through `src/lib/storage.ts` `ApiAdapter` for logged-in
   students so progress syncs to Postgres.
4. Build the admin console (create teachers, create students, assign to class).
5. Build the teacher dashboard (class progress, add-question form → `/api/questions`).
6. Refactor App.jsx into `/components`, `/lib`, typed `/data` as it grows.
7. Add grades 1-4 etc. content as PDFs arrive (seed or admin content editor).

## Conventions
- Keep components small; keep content separate from UI; keep the quiz engine
  data-driven (it already renders any question type from a `type` + payload).
- Don't add a framework. Don't reach for a hosted service. Plain Express + pg.
