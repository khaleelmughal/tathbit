import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const progressRoutes = Router();
progressRoutes.use(authRequired);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const asUuid = (v: any) => (typeof v === "string" && UUID_RE.test(v) ? v : null);

// ---------------------------------------------------------------------------
// Student progress blob (whole frontend state, last-write-wins).
// ---------------------------------------------------------------------------
progressRoutes.get("/me", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const [row] = await q(`SELECT data FROM student_state WHERE student_id = $1`, [id]);
  res.json(row?.data ?? null);
});

progressRoutes.put("/me", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  await q(
    `INSERT INTO student_state (student_id, data, updated_at) VALUES ($1,$2,now())
     ON CONFLICT (student_id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
    [id, req.body ?? {}]
  );
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Finished quiz. Writes ONE quiz_sessions row + ONE attempts row per question
// (so is_correct / question_id populate every analytics report) + an activity
// event. This is what makes the dashboards real.
// ---------------------------------------------------------------------------
progressRoutes.post("/quiz", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const {
    mode = null, subjectId = null, lessonId = null, gradeId = null,
    score = 0, total = 0, durationMs = null, startedAt = null,
    answers = [],
  } = req.body ?? {};

  try {
    const [session] = await q(
      `INSERT INTO quiz_sessions (student_id, grade_id, subject_id, lesson_id, mode, score, total, duration_ms, started_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [id, gradeId, subjectId, lessonId, mode, score, total, durationMs,
       startedAt ? new Date(startedAt) : null]
    );
    const sessionId = session.id;

    for (const a of (Array.isArray(answers) ? answers : [])) {
      await q(
        `INSERT INTO attempts
           (student_id, question_id, grade_id, subject_id, lesson_id, type, mode, is_correct, time_ms, session_id, score, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, asUuid(a.questionId), gradeId, a.subjectId ?? subjectId, a.lessonId ?? lessonId,
         a.type ?? null, mode, a.isCorrect === true, a.timeMs ?? null, sessionId,
         a.isCorrect === true ? 1 : 0, 1]
      );
    }

    await q(
      `INSERT INTO activity_events (student_id, type, subject_id, lesson_id, meta)
       VALUES ($1,'quiz_complete',$2,$3,$4)`,
      [id, subjectId, lessonId, JSON.stringify({ mode, score, total, durationMs })]
    );

    res.json({ ok: true, sessionId });
  } catch (error) {
    console.error("Error logging quiz:", (error as Error).message);
    res.status(500).json({ error: "Could not log quiz" });
  }
});

// ---------------------------------------------------------------------------
// Flashcard review batch. result is one of: known | learning | forgot.
// ---------------------------------------------------------------------------
progressRoutes.post("/flashcards", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const { reviews = [] } = req.body ?? {};
  try {
    let n = 0;
    for (const r of (Array.isArray(reviews) ? reviews : [])) {
      if (!r || !r.cardId || !r.result) continue;
      await q(
        `INSERT INTO flashcard_results (student_id, card_id, subject_id, lesson_id, grade_id, front, result)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id, String(r.cardId), r.subjectId ?? null, r.lessonId ?? null,
         r.gradeId ?? null, r.front ?? null, String(r.result)]
      );
      n++;
    }
    if (n > 0) {
      await q(
        `INSERT INTO activity_events (student_id, type, meta) VALUES ($1,'flashcard_session',$2)`,
        [id, JSON.stringify({ reviewed: n })]
      );
    }
    res.json({ ok: true, count: n });
  } catch (error) {
    console.error("Error logging flashcards:", (error as Error).message);
    res.status(500).json({ error: "Could not log flashcards" });
  }
});

// ---------------------------------------------------------------------------
// Lightweight activity ping (login / logout / lesson_view).
// ---------------------------------------------------------------------------
progressRoutes.post("/activity", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const { type, subjectId = null, lessonId = null, meta = null } = req.body ?? {};
  if (!type) return res.status(400).json({ error: "type required" });
  try {
    await q(
      `INSERT INTO activity_events (student_id, type, subject_id, lesson_id, meta)
       VALUES ($1,$2,$3,$4,$5)`,
      [id, String(type), subjectId, lessonId, meta ? JSON.stringify(meta) : null]
    );
    res.json({ ok: true });
  } catch (error) {
    console.error("Error logging activity:", (error as Error).message);
    res.status(500).json({ error: "Could not log activity" });
  }
});

// Legacy single-row logger (kept so older clients do not break).
progressRoutes.post("/attempt", requireRole("student"), async (req, res) => {
  const id = (req as any).user.id;
  const { subjectId, lessonId, mode, score, total } = req.body ?? {};
  await q(`INSERT INTO attempts (student_id, subject_id, lesson_id, mode, score, total)
           VALUES ($1,$2,$3,$4,$5,$6)`, [id, subjectId || null, lessonId || null, mode || null, score ?? 0, total ?? 0]);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Teacher/admin: full picture for ONE student.
// ---------------------------------------------------------------------------
progressRoutes.get("/student/:id", requireRole("teacher", "admin"), async (req, res) => {
  const sid = req.params.id;
  try {
    const [state] = await q(`SELECT data FROM student_state WHERE student_id = $1`, [sid]);

    const [stats] = await q(
      `SELECT COUNT(*) AS total_answers,
              COUNT(*) FILTER (WHERE is_correct) AS correct_answers,
              ROUND(COUNT(*) FILTER (WHERE is_correct) * 100.0 / NULLIF(COUNT(*),0), 1) AS success_rate
       FROM attempts WHERE student_id = $1 AND question_id IS NOT NULL`, [sid]);

    const sessions = await q(
      `SELECT id, mode, subject_id, lesson_id, score, total, duration_ms, completed_at
       FROM quiz_sessions WHERE student_id = $1 ORDER BY completed_at DESC LIMIT 30`, [sid]);

    const subjectBreakdown = await q(
      `SELECT subject_id,
              COUNT(*) AS answers,
              COUNT(*) FILTER (WHERE is_correct) AS correct,
              ROUND(COUNT(*) FILTER (WHERE is_correct) * 100.0 / NULLIF(COUNT(*),0), 1) AS success_rate
       FROM attempts WHERE student_id = $1 AND question_id IS NOT NULL
       GROUP BY subject_id ORDER BY answers DESC`, [sid]);

    const weakQuestions = await q(
      `SELECT a.question_id, q.prompt, a.subject_id,
              COUNT(*) AS attempts,
              COUNT(*) FILTER (WHERE a.is_correct) AS correct
       FROM attempts a JOIN questions q ON q.id = a.question_id
       WHERE a.student_id = $1
       GROUP BY a.question_id, q.prompt, a.subject_id
       HAVING COUNT(*) FILTER (WHERE NOT a.is_correct) > 0
       ORDER BY COUNT(*) FILTER (WHERE NOT a.is_correct) DESC LIMIT 15`, [sid]);

    const flashcards = await q(
      `SELECT DISTINCT ON (card_id) card_id, front, subject_id, lesson_id, result, reviewed_at
       FROM flashcard_results WHERE student_id = $1
       ORDER BY card_id, reviewed_at DESC`, [sid]);

    const activity = await q(
      `SELECT type, subject_id, lesson_id, meta, created_at
       FROM activity_events WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50`, [sid]);

    res.json({
      state: state?.data ?? null,
      stats: stats ?? { total_answers: 0, correct_answers: 0, success_rate: null },
      sessions, subjectBreakdown, weakQuestions, flashcards, activity,
    });
  } catch (error) {
    console.error("Error building student progress:", (error as Error).message);
    res.status(500).json({ error: "Could not load student progress" });
  }
});
