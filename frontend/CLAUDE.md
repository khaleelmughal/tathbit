# Frontend — Vite + React + TypeScript

## Run
```
npm install
npm run dev     # http://localhost:5173  (proxies /api -> http://localhost:4000)
```

## What's here
- `src/App.jsx` — the complete working app (onboarding, dashboard, subjects,
  lessons, quiz engine for 5 question types, flashcards w/ spaced repetition,
  exam practice, planner, progress, and a local parent/admin area). All Grade-5
  content is currently inline in this file AND mirrored to `src/data/syllabus.json`.
- `src/main.tsx` — mounts App; installs a localStorage-backed `window.storage`
  so progress persists in the browser with no edits to App.jsx.
- `src/lib/api.ts` — fetch client + `staffLogin` / `studentLogin`.
- `src/lib/storage.ts` — `StorageAdapter` with `LocalAdapter` (now) and
  `ApiAdapter` (later). Swap the exported `storage` when the backend is live.

## Next steps in Claude Code
1. Add login screens: student (username+PIN), staff (email+password). On success,
   store the JWT via `setToken` and branch the UI by role.
2. For logged-in students, load/save progress through `ApiAdapter` instead of
   localStorage (the shapes match — `student_state.data` is the same blob).
3. Build the admin console + teacher dashboard as new screens/routes.
4. As the file grows, split App.jsx into `/components`, `/lib`, typed `/data`.
   Keep the existing design system (colors `T`, fonts, `Card`/`Btn`/`Ring`).

## Don't
- Don't introduce Next.js or any meta-framework. Vite stays.
- Don't change the visual language without reason — the calm cream/green look is
  intentional and child-friendly.
