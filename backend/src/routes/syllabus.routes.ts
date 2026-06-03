import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const syllabusRoutes = Router();
syllabusRoutes.use(authRequired);

// Flat syllabus tree (grades -> subjects -> lessons). Used by admin pickers.
syllabusRoutes.get("/", async (_req, res) => {
  const grades = await q(`SELECT * FROM grades ORDER BY position`);
  const subjects = await q(`SELECT * FROM subjects ORDER BY position`);
  const lessons = await q(`SELECT * FROM lessons ORDER BY position`);
  res.json({ grades, subjects, lessons });
});

// Full nested tree for ONE grade, shaped to match what the student app needs:
//   { grade, subjects: [ { ...subject, lessons: [ { ...lesson, content fields
//     flattened, questions: [...active questions] } ] } ] }
// This is what lets StudentApp.jsx stop hard-coding the SYLLABUS constant.
syllabusRoutes.get("/tree/:gradeId", async (req, res) => {
  try {
    const gradeId = req.params.gradeId;
    const [grade] = await q(`SELECT * FROM grades WHERE id = $1`, [gradeId]);
    if (!grade) return res.status(404).json({ error: "Grade not found" });

    const subjects = await q(`SELECT * FROM subjects WHERE grade_id = $1 ORDER BY position`, [gradeId]);
    const subjectIds = subjects.map((s: any) => s.id);

    const lessons = subjectIds.length
      ? await q(`SELECT * FROM lessons WHERE subject_id = ANY($1) ORDER BY position`, [subjectIds])
      : [];
    const lessonIds = lessons.map((l: any) => l.id);

    const questions = lessonIds.length
      ? await q(
          `SELECT id, lesson_id, subject_id, type, prompt, payload, explanation, difficulty
           FROM questions WHERE lesson_id = ANY($1) AND status = 'active' ORDER BY created_at`,
          [lessonIds]
        )
      : [];

    const qByLesson: Record<string, any[]> = {};
    for (const qq of questions) {
      // Flatten payload onto the question so the existing engine (which reads
      // q.options / q.correctAnswer / q.pairs / q.acceptedAnswers) works unchanged.
      const flat = { id: qq.id, type: qq.type, prompt: qq.prompt,
        explanation: qq.explanation, difficulty: qq.difficulty, ...(qq.payload || {}) };
      (qByLesson[qq.lesson_id] ||= []).push(flat);
    }

    const lessonsBySubject: Record<string, any[]> = {};
    for (const l of lessons) {
      const c = l.content || {};
      (lessonsBySubject[l.subject_id] ||= []).push({
        id: l.id, n: l.n, title: l.title, pages: l.pages, summary: l.summary,
        keyTerms: c.keyTerms || [], points: c.points || [],
        story: c.story || null, flashcards: c.flashcards || [],
        arabic: c.arabic || [],
        needsContent: l.needs_content,
        questions: qByLesson[l.id] || [],
      });
    }

    res.json({
      grade,
      subjects: subjects.map((s: any) => ({ ...s, lessons: lessonsBySubject[s.id] || [] })),
    });
  } catch (error) {
    console.error("Error building syllabus tree:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// One lesson with its full content blob (for the admin lesson editor).
syllabusRoutes.get("/lesson/:lessonId", async (req, res) => {
  const [lesson] = await q(`SELECT * FROM lessons WHERE id = $1`, [req.params.lessonId]);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  res.json({ lesson });
});

// Active questions for a lesson (what students get).
syllabusRoutes.get("/lesson/:lessonId/questions", async (req, res) => {
  res.json(await q(
    `SELECT id, type, prompt, payload, explanation, difficulty
     FROM questions WHERE lesson_id = $1 AND status = 'active'
     ORDER BY created_at`, [req.params.lessonId]));
});

// Edit a lesson's teaching content (admin/teacher): the green-box summary,
// key terms, important points, story, and seed flashcards live in content JSONB.
// Title / pages can be edited too. Nothing here is hard-coded any more.
syllabusRoutes.patch("/lesson/:lessonId", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const [lesson] = await q(`SELECT * FROM lessons WHERE id = $1`, [lessonId]);
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });

    const { title, pages, summary, keyTerms, points, story, flashcards, arabic } = req.body ?? {};

    // Merge into existing content so partial updates don't wipe other keys.
    const current = lesson.content || {};
    const nextContent = {
      keyTerms: keyTerms !== undefined ? keyTerms : (current.keyTerms || []),
      points:   points   !== undefined ? points   : (current.points || []),
      story:    story    !== undefined ? story    : (current.story ?? null),
      flashcards: flashcards !== undefined ? flashcards : (current.flashcards || []),
      arabic:   arabic   !== undefined ? arabic   : (current.arabic || []),
    };

    const [updated] = await q(
      `UPDATE lessons
       SET title = COALESCE($1, title),
           pages = COALESCE($2, pages),
           summary = COALESCE($3, summary),
           content = $4,
           needs_content = false
       WHERE id = $5 RETURNING *`,
      [title ?? null, pages ?? null, summary ?? null, JSON.stringify(nextContent), lessonId]
    );
    res.json({ lesson: updated });
  } catch (error) {
    console.error("Error updating lesson:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
