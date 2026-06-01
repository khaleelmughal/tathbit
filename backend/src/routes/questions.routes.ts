import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const questionRoutes = Router();
questionRoutes.use(authRequired);

// Teacher (or admin) adds a question. They choose status each time:
//   'active' = live to students now,  'draft' = saved for later review.
questionRoutes.post("/", requireRole("teacher", "admin"), async (req, res) => {
  const { gradeId, subjectId, lessonId, type, prompt, payload, explanation, difficulty, status } = req.body ?? {};
  if (!type || !prompt) return res.status(400).json({ error: "type and prompt required" });
  const [row] = await q(
    `INSERT INTO questions (grade_id, subject_id, lesson_id, type, prompt, payload, explanation, difficulty, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [gradeId, subjectId, lessonId || null, type, prompt, payload || {}, explanation || null,
     difficulty || "medium", status === "draft" ? "draft" : "active", (req as any).user.id]
  );
  res.status(201).json(row);
});

// List questions a teacher created (filter by status / subject).
questionRoutes.get("/", requireRole("teacher", "admin"), async (req, res) => {
  const u = (req as any).user;
  const { status, subjectId } = req.query;
  const rows = await q(
    `SELECT * FROM questions
     WHERE ($1::text IS NULL OR created_by = $1)
       AND ($2::text IS NULL OR status = $2)
       AND ($3::text IS NULL OR subject_id = $3)
     ORDER BY created_at DESC`,
    [u.role === "teacher" ? u.id : null, (status as string) || null, (subjectId as string) || null]
  );
  res.json(rows);
});

// Flip a draft live (or back to draft).
questionRoutes.patch("/:id/status", requireRole("teacher", "admin"), async (req, res) => {
  const { status } = req.body ?? {};
  const [row] = await q(`UPDATE questions SET status=$1 WHERE id=$2 RETURNING *`,
    [status === "draft" ? "draft" : "active", req.params.id]);
  res.json(row);
});

// Bulk import — teacher pastes many questions at once (their own worksheet).
// Accepts either a JSON array of question objects, or rows already parsed
// client-side. Each item: { subjectId, lessonId?, type, prompt, payload, explanation?, difficulty?, status? }
questionRoutes.post("/import", requireRole("teacher", "admin"), async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : req.body?.items;
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Provide a non-empty array of questions" });
  const created: any[] = [];
  for (const it of items) {
    if (!it.type || !it.prompt) continue; // skip malformed rows
    const [row] = await q(
      `INSERT INTO questions (grade_id, subject_id, lesson_id, type, prompt, payload, explanation, difficulty, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [it.gradeId || null, it.subjectId || null, it.lessonId || null, it.type, it.prompt,
       it.payload || {}, it.explanation || null, it.difficulty || "medium",
       it.status === "active" ? "active" : "draft", (req as any).user.id]
    );
    created.push(row.id);
  }
  res.status(201).json({ imported: created.length });
});
