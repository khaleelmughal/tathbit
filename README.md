# Tas-heel Madrasah Revision

A revision app for the Tas-heel series. One **admin** creates **teachers**; each
teacher owns **one class** of **students**. Students revise with lessons, quizzes,
flashcards, exam practice and a two-week planner. **Grade 5 is fully built** with
real content from the books; other grades are ready for content as PDFs arrive.

Stack: **Vite + React + TypeScript** (frontend), **Express** (backend),
**PostgreSQL** (database). No Next.js. No third-party services.

---

## Quick start

### 0. Install everything
```
npm install            # root (workspaces) — installs frontend + backend
```

### 1. Start PostgreSQL
Option A — Docker (easiest):
```
docker compose up -d   # Postgres on localhost:5432 (user/pass/db = madrasah)
```
Option B — your own local Postgres: create a database and set DATABASE_URL.

### 2. Configure the backend
```
cp backend/.env.example backend/.env
# edit backend/.env: DATABASE_URL, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
```

### 3. Create tables + seed
```
psql "postgres://madrasah:madrasah@localhost:5432/madrasah" -f db/schema.sql
npm run db:seed        # creates the admin + loads Grade 5 content
```

### 4. Run
```
npm run dev            # frontend (5173) + backend (4000) together
```
Open http://localhost:5173

---

## Right now vs later
- **Right now:** the frontend works fully on **localStorage** — Muhammad can
  revise Grade 5 today, no backend needed. Just `npm --workspace frontend run dev`.
- **Later (online):** the Express + Postgres backend adds the admin console,
  teacher dashboards, real logins, and synced progress. The frontend's
  `StorageAdapter` swaps from local to API with no rewrite.

## Logins
- **Admin / teachers:** email + password.
- **Students:** username + PIN (easy for young children).
- All hashed with bcrypt in Postgres. Change the seeded admin password after setup.

## Adding content
Only Grade 5 has real content (from the uploaded books). Add other grades by
seeding from their PDFs or via the admin content editor (to be built). **Islamic
content must be reviewed by a parent/teacher before it goes live.**

See `CLAUDE.md` (root and per-folder) for the full architecture and build order.
