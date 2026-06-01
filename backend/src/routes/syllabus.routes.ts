import { Router } from "express";
import { q } from "../db.js";
import { authRequired } from "../auth.js";

export const syllabusRoutes = Router();
syllabusRoutes.use(authRequired);

// Full syllabus tree (grades -> subjects -> lessons). Active questions attached.
syllabusRoutes.get("/", async (_req, res) => {
  const grades = await q(`SELECT * FROM grades ORDER BY position`);
  const subjects = await q(`SELECT * FROM subjects ORDER BY position`);
  const lessons = await q(`SELECT * FROM lessons ORDER BY position`);
  res.json({ grades, subjects, lessons });
});

// Active questions for a lesson (what students get).
syllabusRoutes.get("/lesson/:lessonId/questions", async (req, res) => {
  res.json(await q(
    `SELECT id, type, prompt, payload, explanation, difficulty
     FROM questions WHERE lesson_id = $1 AND status = 'active'
     ORDER BY created_at`, [req.params.lessonId]));
});
