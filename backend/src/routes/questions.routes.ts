import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const questionRoutes = Router();
questionRoutes.use(authRequired);

// Teacher (or admin) adds a question. They choose status each time:
//   'active' = live to students now,  'draft' = saved for later review.
questionRoutes.post("/", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { gradeId, subjectId, lessonId, type, prompt, payload, explanation, difficulty, status } = req.body ?? {};
    if (!type || !prompt) return res.status(400).json({ error: "type and prompt required" });
    const [row] = await q(
      `INSERT INTO questions (grade_id, subject_id, lesson_id, type, prompt, payload, explanation, difficulty, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [gradeId, subjectId, lessonId || null, type, prompt, payload || {}, explanation || null,
       difficulty || "medium", status === "draft" ? "draft" : "active", (req as any).user.id]
    );
    res.status(201).json(row);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// List questions a teacher created (filter by status / subject).
questionRoutes.get("/", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const u = (req as any).user;
    const { status, subjectId } = req.query;
    const rows = await q(
      `SELECT * FROM questions
       WHERE ($1::uuid IS NULL OR created_by = $1::uuid)
         AND ($2::text IS NULL OR status = $2)
         AND ($3::text IS NULL OR subject_id = $3)
       ORDER BY created_at DESC`,
      [u.role === "teacher" ? u.id : null, (status as string) || null, (subjectId as string) || null]
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Flip a draft live (or back to draft).
questionRoutes.patch("/:id/status", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { status } = req.body ?? {};
    const [row] = await q(`UPDATE questions SET status=$1 WHERE id=$2 RETURNING *`,
      [status === "draft" ? "draft" : "active", req.params.id]);
    res.json(row);
  } catch (error) {
    console.error("Error updating question status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Bulk import — teacher pastes many questions at once (their own worksheet).
// Accepts either a JSON array of question objects, or rows already parsed
// client-side. Each item: { subjectId, lessonId?, type, prompt, payload, explanation?, difficulty?, status? }
questionRoutes.post("/import", requireRole("teacher", "admin"), async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Error importing questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update a question (admin or owner only)
questionRoutes.put("/:id", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const user = (req as any).user;
    const questionId = req.params.id;
    const { gradeId, subjectId, lessonId, type, prompt, payload, explanation, difficulty, status } = req.body ?? {};
    
    // Check if question exists and user has permission to update it
    const [question] = await q(`SELECT * FROM questions WHERE id = $1`, [questionId]);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // Admin can update any question, teacher can only update their own
    if (user.role !== "admin" && question.created_by !== user.id) {
      return res.status(403).json({ error: "You can only update questions you created" });
    }
    
    // Validate required fields
    if (!type || !prompt) {
      return res.status(400).json({ error: "type and prompt are required" });
    }
    
    const [updatedQuestion] = await q(
      `UPDATE questions 
       SET grade_id = $1, subject_id = $2, lesson_id = $3, type = $4, prompt = $5, 
           payload = $6, explanation = $7, difficulty = $8, status = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10 RETURNING *`,
      [gradeId, subjectId, lessonId || null, type, prompt, payload || {}, explanation || null,
       difficulty || "medium", status === "draft" ? "draft" : "active", questionId]
    );
    
    res.json(updatedQuestion);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a question (admin or owner only)
questionRoutes.delete("/:id", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const user = (req as any).user;
    const questionId = req.params.id;
    
    // Check if question exists and user has permission to delete it
    const [question] = await q(`SELECT * FROM questions WHERE id = $1`, [questionId]);
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // Admin can delete any question, teacher can only delete their own
    if (user.role !== "admin" && question.created_by !== user.id) {
      return res.status(403).json({ error: "You can only delete questions you created" });
    }
    
    await q(`DELETE FROM questions WHERE id = $1`, [questionId]);
    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
