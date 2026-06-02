import { Router } from "express";
import { q } from "../db.js";
import { authRequired, requireRole } from "../auth.js";

export const flashcardRoutes = Router();
flashcardRoutes.use(authRequired);

// Admin/Teacher creates or updates flashcards
flashcardRoutes.post("/", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const { lessonId, front, back, difficulty, tags } = req.body ?? {};
    if (!lessonId || !front || !back) {
      return res.status(400).json({ error: "lessonId, front, and back are required" });
    }

    // Verify lesson exists and get its grade info
    const [lesson] = await q(`
      SELECT l.id, l.title, s.name as subject_name, g.name as grade_name 
      FROM lessons l 
      JOIN subjects s ON l.subject_id = s.id 
      JOIN grades g ON s.grade_id = g.id 
      WHERE l.id = $1
    `, [lessonId]);

    if (!lesson) {
      return res.status(400).json({ error: "Lesson not found" });
    }

    const [flashcard] = await q(
      `INSERT INTO flashcards (lesson_id, front, back, difficulty, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [lessonId, front, back, difficulty || "medium", tags || [], (req as any).user.id]
    );
    
    res.status(201).json({ flashcard });
  } catch (error) {
    console.error("Error creating flashcard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all flashcards for admin/teacher or grade-accessible flashcards for students
flashcardRoutes.get("/", authRequired, async (req, res) => {
  try {
    const user = (req as any).user;
    const { lessonId, difficulty, limit } = req.query;

    let query = "";
    let params: any[] = [];
    
    if (user.role === "admin" || user.role === "teacher") {
      // Admin/teacher can see all flashcards
      query = `
        SELECT f.*, 
               COUNT(fr.id) as review_count,
               AVG(CASE WHEN fr.quality >= 3 THEN 1.0 ELSE 0.0 END) as avg_success_rate
        FROM flashcards f 
        LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id
        WHERE ($1::text IS NULL OR f.lesson_id = $1)
          AND ($2::text IS NULL OR f.difficulty = $2)
        GROUP BY f.id
        ORDER BY f.created_at DESC
      `;
      params = [lessonId as string || null, difficulty as string || null];
    } else {
      // Students see flashcards for their grade (via class assignment)
      query = `
        SELECT f.*, 
               fr.quality as last_quality,
               fr.ease_factor,
               fr.interval_days,
               fr.next_review_date,
               fr.review_count,
               l.title as lesson_title,
               s.name as subject_name,
               g.name as grade_name
        FROM flashcards f
        JOIN lessons l ON f.lesson_id = l.id
        JOIN subjects s ON l.subject_id = s.id
        JOIN grades g ON s.grade_id = g.id
        JOIN class_students cs ON cs.student_id = $1
        JOIN classes c ON c.id = cs.class_id AND c.grade_id = g.id
        LEFT JOIN flashcard_reviews fr ON (f.id = fr.flashcard_id AND fr.student_id = $1)
        WHERE ($2::text IS NULL OR f.lesson_id = $2)
          AND ($3::text IS NULL OR f.difficulty = $3)
        ORDER BY 
          CASE WHEN fr.next_review_date IS NULL THEN 0 ELSE 1 END,
          fr.next_review_date ASC,
          f.created_at DESC
      `;
      params = [user.id, lessonId as string || null, difficulty as string || null];
    }

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(parseInt(limit as string));
    }

    const flashcards = await q(query, params);
    res.json({ flashcards });
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get due flashcards for spaced repetition (grade-based access)
flashcardRoutes.get("/due", requireRole("student"), async (req, res) => {
  try {
    const user = (req as any).user;
    const { limit = 20 } = req.query;

    const dueFlashcards = await q(`
      SELECT f.*, 
             fr.quality as last_quality,
             fr.ease_factor,
             fr.interval_days,
             fr.next_review_date,
             fr.review_count,
             l.title as lesson_title,
             s.name as subject_name,
             g.name as grade_name
      FROM flashcards f
      JOIN lessons l ON f.lesson_id = l.id
      JOIN subjects s ON l.subject_id = s.id
      JOIN grades g ON s.grade_id = g.id
      JOIN class_students cs ON cs.student_id = $1
      JOIN classes c ON c.id = cs.class_id AND c.grade_id = g.id
      LEFT JOIN flashcard_reviews fr ON (f.id = fr.flashcard_id AND fr.student_id = $1)
      WHERE fr.next_review_date IS NULL 
         OR fr.next_review_date <= NOW()
      ORDER BY 
        CASE WHEN fr.next_review_date IS NULL THEN 0 ELSE 1 END,
        fr.next_review_date ASC
      LIMIT $2
    `, [user.id, parseInt(limit as string)]);

    res.json({ flashcards: dueFlashcards });
  } catch (error) {
    console.error("Error fetching due flashcards:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Student reviews a flashcard (spaced repetition)
flashcardRoutes.post("/:id/review", requireRole("student"), async (req, res) => {
  try {
    const user = (req as any).user;
    const flashcardId = req.params.id;
    const { quality } = req.body ?? {}; // quality: 0-5 (0=total blackout, 5=perfect response)

    if (quality === undefined || quality < 0 || quality > 5) {
      return res.status(400).json({ error: "Quality must be between 0 and 5" });
    }

    // Get previous review data
    const [prevReview] = await q(`
      SELECT * FROM flashcard_reviews 
      WHERE flashcard_id = $1 AND student_id = $2
    `, [flashcardId, user.id]);

    // Spaced repetition algorithm (SM-2)
    let easeFactor = prevReview?.ease_factor || 2.5;
    let interval = prevReview?.interval_days || 0;
    let reviewCount = (prevReview?.review_count || 0) + 1;

    if (quality >= 3) {
      // Correct response
      if (reviewCount === 1) {
        interval = 1;
      } else if (reviewCount === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
    } else {
      // Incorrect response - reset interval but keep some progress
      interval = 1;
      reviewCount = 1;
    }

    // Update ease factor
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Minimum ease factor

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Insert or update review
    if (prevReview) {
      await q(`
        UPDATE flashcard_reviews 
        SET quality = $1, ease_factor = $2, interval_days = $3, 
            next_review_date = $4, review_count = $5, reviewed_at = NOW()
        WHERE flashcard_id = $6 AND student_id = $7
      `, [quality, easeFactor, interval, nextReviewDate, reviewCount, flashcardId, user.id]);
    } else {
      await q(`
        INSERT INTO flashcard_reviews 
        (flashcard_id, student_id, quality, ease_factor, interval_days, next_review_date, review_count, reviewed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [flashcardId, user.id, quality, easeFactor, interval, nextReviewDate, reviewCount]);
    }

    res.json({ 
      success: true, 
      nextReviewDate,
      interval,
      easeFactor: parseFloat(easeFactor.toFixed(2))
    });
  } catch (error) {
    console.error("Error reviewing flashcard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get flashcard statistics for admin/teacher
flashcardRoutes.get("/stats", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const [stats] = await q(`
      SELECT 
        COUNT(DISTINCT f.id) as total_flashcards,
        COUNT(DISTINCT fr.student_id) as active_students,
        COUNT(fr.id) as total_reviews,
        AVG(CASE WHEN fr.quality >= 3 THEN 1.0 ELSE 0.0 END) as avg_success_rate,
        COUNT(CASE WHEN fr.next_review_date <= NOW() THEN 1 END) as cards_due_now
      FROM flashcards f
      LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id
    `);

    const subjectStats = await q(`
      SELECT 
        l.subject_id,
        COUNT(DISTINCT f.id) as flashcard_count,
        COUNT(fr.id) as review_count,
        AVG(CASE WHEN fr.quality >= 3 THEN 1.0 ELSE 0.0 END) as success_rate
      FROM flashcards f
      JOIN lessons l ON f.lesson_id = l.id
      LEFT JOIN flashcard_reviews fr ON f.id = fr.flashcard_id
      GROUP BY l.subject_id
      ORDER BY flashcard_count DESC
    `);

    const recentActivity = await q(`
      SELECT 
        DATE(fr.reviewed_at) as date,
        COUNT(*) as reviews,
        COUNT(*) FILTER (WHERE fr.quality >= 3) as successful_reviews
      FROM flashcard_reviews fr
      WHERE fr.reviewed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(fr.reviewed_at)
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({ 
      stats,
      subjectStats,
      recentActivity
    });
  } catch (error) {
    console.error("Error fetching flashcard stats:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update flashcard
flashcardRoutes.patch("/:id", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const flashcardId = req.params.id;
    const { front, back, difficulty, tags } = req.body || {};
    
    if (!front && !back && !difficulty && !tags) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    let query = "UPDATE flashcards SET ";
    let values = [];
    let updates = [];

    if (front) {
      updates.push(`front = $${values.length + 1}`);
      values.push(front);
    }
    
    if (back) {
      updates.push(`back = $${values.length + 1}`);
      values.push(back);
    }

    if (difficulty) {
      updates.push(`difficulty = $${values.length + 1}`);
      values.push(difficulty);
    }

    if (tags !== undefined) {
      updates.push(`tags = $${values.length + 1}`);
      values.push(tags);
    }

    query += updates.join(", ");
    query += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(flashcardId);

    const [flashcard] = await q(query, values);
    
    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.json({ flashcard });
  } catch (error) {
    console.error("Error updating flashcard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete flashcard
flashcardRoutes.delete("/:id", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const flashcardId = req.params.id;
    
    // Delete reviews first
    await q(`DELETE FROM flashcard_reviews WHERE flashcard_id = $1`, [flashcardId]);
    
    // Delete flashcard
    const [flashcard] = await q(`DELETE FROM flashcards WHERE id = $1 RETURNING *`, [flashcardId]);
    
    if (!flashcard) {
      return res.status(404).json({ error: "Flashcard not found" });
    }

    res.json({ success: true, message: "Flashcard deleted successfully" });
  } catch (error) {
    console.error("Error deleting flashcard:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});