# Backend — Express + PostgreSQL

ESM TypeScript, run with `tsx`. No build step needed for dev.

## Run
```
cp .env.example .env        # set DATABASE_URL, JWT_SECRET, admin creds
npm install
# ensure Postgres is running and schema is applied (see root README)
npm run seed                # creates admin + seeds Grade 5 content
npm run dev                 # http://localhost:4000
```

## Files
- `src/index.ts` — app + route wiring. Health check at `/api/health`.
- `src/db.ts` — `pg` pool + `q(sql, params)` helper.
- `src/auth.ts` — bcrypt hash/verify, JWT sign, `authRequired`, `requireRole`.
- `src/routes/`
  - `auth.routes.ts` — `POST /api/auth/login` (staff), `POST /api/auth/student-login`, `GET /api/auth/me`
  - `users.routes.ts` — **admin only**: `POST /teachers`, `POST /students`, `POST /assign`, `GET /` (list)
  - `syllabus.routes.ts` — `GET /api/syllabus`, `GET /api/syllabus/lesson/:id/questions`
  - `questions.routes.ts` — teacher/admin add + list + flip draft/active
  - `progress.routes.ts` — student save/load own state + log attempts; teacher reads a student
- `src/seed.ts` — admin + Grade 5 content; grade shells for the rest.

## Rules
- Every secret is bcrypt-hashed. Never store plaintext passwords or PINs.
- Question `payload` is JSONB (options/pairs/acceptedAnswers/correctAnswer) so one
  table serves all question types. Mirror the frontend question shape.
- `questions.status`: 'active' = live to students, 'draft' = hidden. Teacher picks.
- `created_by IS NULL` means a question came from the book (seeded).
