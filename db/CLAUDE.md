# Database — PostgreSQL

`schema.sql` is the source of truth. Apply with:
```
psql "$DATABASE_URL" -f db/schema.sql
```
Tables: users, classes, class_students, grades, subjects, lessons, questions,
student_state, attempts. See comments in schema.sql.

Key constraints that encode the rules:
- `classes.teacher_id UNIQUE` → a teacher owns at most one class.
- `class_students.student_id UNIQUE` → a student is in one class at a time.
- `users.email UNIQUE`, `users.username UNIQUE`, with a CHECK that at least one exists.

`student_state.data` is a JSONB blob mirroring the frontend progress state — the
simplest way to sync without rewriting the app's logic. `attempts` is the
queryable log for fast teacher dashboards. Normalise further only if you need to.
