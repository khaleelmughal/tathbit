import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const questionRoutes = Router();
questionRoutes.use(authRequired);

// ---------------------------------------------------------------------------
//  Create a question. Teacher/admin choose status each time:
//    'active' = live to students now,  'draft' = saved for later review.
// ---------------------------------------------------------------------------
questionRoutes.post("/", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const { gradeId, subjectId, lessonId, type, prompt, payload, explanation, difficulty, status } = req.body ?? {};
    if (!type || !prompt) return res.status(400).json({ error: "type and prompt required" });
    const [row] = await q(
      `INSERT INTO questions (grade_id, subject_id, lesson_id, type, prompt, payload, explanation, difficulty, status, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [gradeId || null, subjectId || null, lessonId || null, type, prompt, payload || {}, explanation || null,
       difficulty || "medium", status === "draft" ? "draft" : "active", (req as any).user.id]
    );
    res.status(201).json(row);
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------------------------------------------------------------------
//  Paginated + searchable + filterable list.
//  Query params (all optional):
//    page (1-based), pageSize (default 20, max 100),
//    search   - ILIKE against prompt/explanation,
//    status   - 'active' | 'draft',
//    gradeId, subjectId, lessonId, type, difficulty,
//    mine=1   - only the caller's own questions (teachers always limited to own)
//  Returns: { questions, total, page, pageSize, totalPages }
// ---------------------------------------------------------------------------
questionRoutes.get("/", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const u = (req as any).user;
    const {
      page = "1", pageSize = "20", search, status, gradeId, subjectId,
      lessonId, type, difficulty, mine,
    } = req.query as Record<string, string>;

    const limit = Math.min(Math.max(parseInt(pageSize) || 20, 1), 100);
    const pageNum = Math.max(parseInt(page) || 1, 1);
    const offset = (pageNum - 1) * limit;

    // Teachers only ever see their own questions; admin can opt in with mine=1.
    const ownerId = u.role === "teacher" ? u.id : (mine === "1" ? u.id : null);

    const where: string[] = [];
    const params: any[] = [];
    const add = (clause: string, val: any) => { params.push(val); where.push(clause.replace("$$", `$${params.length}`)); };

    if (ownerId)    add("created_by = $$::uuid", ownerId);
    if (status)     add("status = $$", status);
    if (gradeId)    add("grade_id = $$", gradeId);
    if (subjectId)  add("subject_id = $$", subjectId);
    if (lessonId)   add("lesson_id = $$", lessonId);
    if (type)       add("type = $$", type);
    if (difficulty) add("difficulty = $$", difficulty);
    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      where.push(`(prompt ILIKE $${params.length} OR explanation ILIKE $${params.length})`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [{ count }] = await q(`SELECT COUNT(*)::int AS count FROM questions ${whereSql}`, params);

    const rows = await q(
      `SELECT * FROM questions ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      questions: rows,
      total: count,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.max(Math.ceil(count / limit), 1),
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Subject/status counts for the filter chips (cheap, grouped).
questionRoutes.get("/facets", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const u = (req as any).user;
    const ownerId = u.role === "teacher" ? u.id : null;
    const rows = await q(
      `SELECT subject_id, status, COUNT(*)::int AS count
       FROM questions
       WHERE ($1::uuid IS NULL OR created_by = $1::uuid)
       GROUP BY subject_id, status`,
      [ownerId]
    );
    res.json({ facets: rows });
  } catch (error) {
    console.error("Error fetching facets:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Single question (used by the edit screen so it always has fresh payload).
questionRoutes.get("/:id", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const [row] = await q(`SELECT * FROM questions WHERE id = $1`, [req.params.id]);
    if (!row) return res.status(404).json({ error: "Question not found" });
    res.json(row);
  } catch (error) {
    console.error("Error fetching question:", error);
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

// Bulk import - teacher pastes many questions at once.
questionRoutes.post("/import", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body?.items;
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Provide a non-empty array of questions" });
    const created: any[] = [];
    for (const it of items) {
      if (!it.type || !it.prompt) continue;
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

// Update a question (admin or owner only). updated_at maintained by trigger.
questionRoutes.put("/:id", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const user = (req as any).user;
    const questionId = req.params.id;
    const { gradeId, subjectId, lessonId, type, prompt, payload, explanation, difficulty, status } = req.body ?? {};

    const [question] = await q(`SELECT * FROM questions WHERE id = $1`, [questionId]);
    if (!question) return res.status(404).json({ error: "Question not found" });
    if (user.role !== "admin" && question.created_by !== user.id) {
      return res.status(403).json({ error: "You can only update questions you created" });
    }
    if (!type || !prompt) return res.status(400).json({ error: "type and prompt are required" });

    const [updated] = await q(
      `UPDATE questions
       SET grade_id = $1, subject_id = $2, lesson_id = $3, type = $4, prompt = $5,
           payload = $6, explanation = $7, difficulty = $8, status = $9
       WHERE id = $10 RETURNING *`,
      [gradeId || null, subjectId || null, lessonId || null, type, prompt, payload || {}, explanation || null,
       difficulty || "medium", status === "draft" ? "draft" : "active", questionId]
    );
    res.json(updated);
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a question (admin or owner only).
questionRoutes.delete("/:id", requireRole("teacher", "admin"), async (req, res) => {
  try {
    const user = (req as any).user;
    const questionId = req.params.id;
    const [question] = await q(`SELECT * FROM questions WHERE id = $1`, [questionId]);
    if (!question) return res.status(404).json({ error: "Question not found" });
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
