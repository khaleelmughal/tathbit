import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const progressRoutes = Router();
progressRoutes.use(authRequired);

// Student loads their own progress blob.
progressRoutes.get("/me", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const [row] = await q(`SELECT data FROM student_state WHERE student_id = $1`, [id]);
  res.json(row?.data ?? null);
});

// Student saves their progress blob (whole state, last-write-wins).
progressRoutes.put("/me", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  await q(
    `INSERT INTO student_state (student_id, data, updated_at) VALUES ($1,$2,now())
     ON CONFLICT (student_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [id, req.body ?? {}]
  );
  res.json({ ok: true });
});

// Student logs a finished attempt (feeds teacher dashboards).
progressRoutes.post("/attempt", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const { subjectId, lessonId, mode, score, total } = req.body ?? {};
  await q(`INSERT INTO attempts (student_id, subject_id, lesson_id, mode, score, total)
           VALUES ($1,$2,$3,$4,$5,$6)`, [id, subjectId || null, lessonId || null, mode || null, score ?? 0, total ?? 0]);
  res.json({ ok: true });
});

// Teacher views progress for one student in their class.
progressRoutes.get("/student/:id", requireRole("teacher", "admin"), async (req, res) => {
  const [state] = await q(`SELECT data FROM student_state WHERE student_id = $1`, [req.params.id]);
  const attempts = await q(
    `SELECT subject_id, lesson_id, mode, score, total, completed_at
     FROM attempts WHERE student_id = $1 ORDER BY completed_at DESC LIMIT 50`, [req.params.id]);
  res.json({ state: state?.data ?? null, attempts });
});
