import { Router } from "express";
import { q } from "../db.js";
import { hash, authRequired, requireRole } from "../auth.js";

export const userRoutes = Router();
userRoutes.use(authRequired);

// Admin creates a standalone class (without teacher)
userRoutes.post("/classes", requireRole("admin"), async (req, res) => {
  try {
    const { name, gradeId } = req.body ?? {};
    if (!name || !gradeId)
      return res.status(400).json({ error: "name and gradeId required" });
    const [cls] = await q(
      `INSERT INTO classes (name, grade_id) VALUES ($1,$2) RETURNING *`,
      [name, gradeId]
    );
    res.status(201).json({ class: cls });
  } catch (error) {
    console.error("Error creating class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin gets all classes
userRoutes.get("/classes", requireRole("admin"), async (req, res) => {
  try {
    const classes = await q(`
      SELECT 
        c.*, 
        u.name as teacher_name,
        u.email as teacher_email,
        (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as student_count
      FROM classes c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      ORDER BY c.name
    `);
    res.json({ classes });
  } catch (error) {
    console.error("Error fetching classes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get class details with students
userRoutes.get("/classes/:id", requireRole("admin"), async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Get class info
    const [classInfo] = await q(`
      SELECT 
        c.*, 
        u.name as teacher_name,
        u.email as teacher_email
      FROM classes c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      WHERE c.id = $1
    `, [classId]);

    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Get students in class
    const students = await q(`
      SELECT 
        s.id, s.name, s.username, s.created_at,
        COUNT(a.id) as total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_answers,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate
      FROM users s
      JOIN class_students cs ON cs.student_id = s.id
      LEFT JOIN attempts a ON a.student_id = s.id
      WHERE cs.class_id = $1
      GROUP BY s.id, s.name, s.username, s.created_at
      ORDER BY s.name
    `, [classId]);

    res.json({ 
      class: { 
        ...classInfo,
        student_count: students.length 
      }, 
      students 
    });
  } catch (error) {
    console.error("Error fetching class details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update class details
userRoutes.patch("/classes/:id", requireRole("admin"), async (req, res) => {
  try {
    const classId = req.params.id;
    const { name, teacher_id } = req.body || {};
    
    if (!name && !teacher_id) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    let query = "UPDATE classes SET ";
    let values = [];
    let updates = [];

    if (name) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    
    if (teacher_id !== undefined) {
      updates.push(`teacher_id = $${values.length + 1}`);
      values.push(teacher_id || null);
    }

    query += updates.join(", ");
    query += ` WHERE id = $${values.length + 1} RETURNING *`;
    values.push(classId);

    const [updatedClass] = await q(query, values);
    
    if (!updatedClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Get updated class with teacher info
    const [classWithTeacher] = await q(`
      SELECT 
        c.*, 
        u.name as teacher_name,
        u.email as teacher_email,
        (SELECT COUNT(*) FROM class_students cs WHERE cs.class_id = c.id) as student_count
      FROM classes c 
      LEFT JOIN users u ON c.teacher_id = u.id 
      WHERE c.id = $1
    `, [classId]);

    res.json({ class: classWithTeacher });
  } catch (error) {
    console.error("Error updating class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete class
userRoutes.delete("/classes/:id", requireRole("admin"), async (req, res) => {
  try {
    const classId = req.params.id;
    
    // Check if class exists
    const [classInfo] = await q(`SELECT * FROM classes WHERE id = $1`, [classId]);
    if (!classInfo) {
      return res.status(404).json({ error: "Class not found" });
    }

    // Remove students from class first
    await q(`DELETE FROM class_students WHERE class_id = $1`, [classId]);
    
    // Delete the class
    await q(`DELETE FROM classes WHERE id = $1`, [classId]);

    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    console.error("Error deleting class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin creates a teacher (email + password) and their single class.
userRoutes.post("/teachers", requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, className, gradeId } = req.body ?? {};
    if (!name || !email || !password || !gradeId)
      return res.status(400).json({ error: "name, email, password, gradeId required" });
    const [teacher] = await q(
      `INSERT INTO users (role, name, email, password_hash) VALUES ('teacher',$1,$2,$3) RETURNING id, name, email`,
      [name, email.toLowerCase(), await hash(password)]
    );
    const [cls] = await q(
      `INSERT INTO classes (name, grade_id, teacher_id) VALUES ($1,$2,$3) RETURNING *`,
      [className || `${name}'s class`, gradeId, teacher.id]
    );
    res.status(201).json({ teacher, class: cls });
  } catch (error) {
    console.error("Error creating teacher:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin creates a student (username + PIN) and optionally assigns to a class.
userRoutes.post("/students", requireRole("admin"), async (req, res) => {
  try {
    const { name, username, pin, classId } = req.body ?? {};
    if (!name || !username || !pin) return res.status(400).json({ error: "name, username, pin required" });
    const [student] = await q(
      `INSERT INTO users (role, name, username, password_hash) VALUES ('student',$1,$2,$3) RETURNING id, name, username`,
      [name, username.toLowerCase(), await hash(String(pin))]
    );
    if (classId)
      await q(`INSERT INTO class_students (class_id, student_id) VALUES ($1,$2)
               ON CONFLICT (student_id) DO UPDATE SET class_id = EXCLUDED.class_id`, [classId, student.id]);
    res.status(201).json({ student });
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin (re)assigns a student to a class.
userRoutes.post("/assign", requireRole("admin"), async (req, res) => {
  try {
    const { studentId, classId } = req.body ?? {};
    if (!studentId || !classId) {
      return res.status(400).json({ error: "studentId and classId are required" });
    }
    await q(`INSERT INTO class_students (class_id, student_id) VALUES ($1,$2)
             ON CONFLICT (student_id) DO UPDATE SET class_id = EXCLUDED.class_id`, [classId, studentId]);
    res.json({ ok: true });
  } catch (error) {
    console.error("Error assigning student to class:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Admin gets dashboard statistics
userRoutes.get("/stats", requireRole("admin"), async (req, res) => {
  try {
    const [
      totalUsersResult,
      totalClassesResult,
      totalQuestionsResult,
      recentActivityResult,
      usersByRoleResult
    ] = await Promise.all([
      q(`SELECT COUNT(*) as count FROM users WHERE role != 'admin'`),
      q(`SELECT COUNT(*) as count FROM classes`),
      q(`SELECT COUNT(*) as count FROM questions`),
      q(`SELECT COUNT(*) as count FROM attempts WHERE completed_at > NOW() - INTERVAL '7 days'`),
      q(`SELECT role, COUNT(*) as count FROM users WHERE role != 'admin' GROUP BY role`)
    ]);

    const stats = {
      totalUsers: parseInt(totalUsersResult[0]?.count || 0),
      totalClasses: parseInt(totalClassesResult[0]?.count || 0),
      totalQuestions: parseInt(totalQuestionsResult[0]?.count || 0),
      recentActivity: parseInt(recentActivityResult[0]?.count || 0),
      usersByRole: usersByRoleResult.reduce((acc, row) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {})
    };

    res.json({ stats });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Advanced analytics endpoint
userRoutes.get("/analytics", requireRole("admin"), async (req, res) => {
  try {
    // Overall system statistics
    const [systemStats] = await q(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'student') as total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'teacher') as total_teachers,
        (SELECT COUNT(*) FROM classes) as total_classes,
        (SELECT COUNT(*) FROM questions) as total_questions,
        (SELECT COUNT(*) FROM attempts) as total_attempts,
        (SELECT COUNT(*) FROM attempts WHERE is_correct = true) as correct_attempts
    `);

    // Question performance analytics
    const questionPerformance = await q(`
      SELECT 
        q.id,
        q.prompt,
        q.subject_id,
        q.difficulty,
        COUNT(a.id) as attempt_count,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_count,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate
      FROM questions q
      LEFT JOIN attempts a ON q.id = a.question_id
      GROUP BY q.id, q.prompt, q.subject_id, q.difficulty
      HAVING COUNT(a.id) > 0
      ORDER BY attempt_count DESC
      LIMIT 20
    `);

    // Subject performance breakdown
    const subjectPerformance = await q(`
      SELECT 
        q.subject_id,
        COUNT(DISTINCT q.id) as question_count,
        COUNT(a.id) as total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_attempts,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate
      FROM questions q
      LEFT JOIN attempts a ON q.id = a.question_id
      WHERE q.subject_id IS NOT NULL
      GROUP BY q.subject_id
      ORDER BY total_attempts DESC
    `);

    // Student performance analytics
    const studentPerformance = await q(`
      SELECT 
        s.id,
        s.name,
        s.username,
        c.name as class_name,
        COUNT(a.id) as total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_attempts,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate,
        COUNT(DISTINCT DATE(a.completed_at)) as active_days
      FROM users s
      LEFT JOIN class_students cs ON cs.student_id = s.id
      LEFT JOIN classes c ON c.id = cs.class_id
      LEFT JOIN attempts a ON a.student_id = s.id
      WHERE s.role = 'student'
      GROUP BY s.id, s.name, s.username, c.name
      ORDER BY total_attempts DESC
      LIMIT 20
    `);

    // Struggling students (low success rates)
    const strugglingStudents = await q(`
      SELECT 
        s.id,
        s.name,
        s.username,
        c.name as class_name,
        COUNT(a.id) as total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_attempts,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate
      FROM users s
      LEFT JOIN class_students cs ON cs.student_id = s.id
      LEFT JOIN classes c ON c.id = cs.class_id
      LEFT JOIN attempts a ON a.student_id = s.id
      WHERE s.role = 'student'
      GROUP BY s.id, s.name, s.username, c.name
      HAVING COUNT(a.id) >= 5 AND ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) < 60
      ORDER BY success_rate ASC, total_attempts DESC
      LIMIT 10
    `);

    // Most difficult questions
    const difficultQuestions = await q(`
      SELECT 
        q.id,
        q.prompt,
        q.subject_id,
        q.difficulty,
        COUNT(a.id) as attempt_count,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_count,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as success_rate
      FROM questions q
      LEFT JOIN attempts a ON q.id = a.question_id
      GROUP BY q.id, q.prompt, q.subject_id, q.difficulty
      HAVING COUNT(a.id) >= 5
      ORDER BY success_rate ASC, attempt_count DESC
      LIMIT 10
    `);

    // Daily activity trends (last 30 days)
    const dailyActivity = await q(`
      SELECT 
        DATE(completed_at) as date,
        COUNT(*) as attempts,
        COUNT(*) FILTER (WHERE is_correct = true) as correct_attempts
      FROM attempts
      WHERE completed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(completed_at)
      ORDER BY date DESC
    `);

    // Class performance comparison
    const classPerformance = await q(`
      SELECT 
        c.id,
        c.name as class_name,
        c.teacher_id,
        u.name as teacher_name,
        COUNT(DISTINCT s.id) as student_count,
        COUNT(a.id) as total_attempts,
        COUNT(a.id) FILTER (WHERE a.is_correct = true) as correct_attempts,
        ROUND(COUNT(a.id) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(a.id), 0), 1) as class_success_rate
      FROM classes c
      LEFT JOIN users u ON u.id = c.teacher_id
      LEFT JOIN class_students cs ON cs.class_id = c.id
      LEFT JOIN users s ON s.id = cs.student_id
      LEFT JOIN attempts a ON a.student_id = s.id
      GROUP BY c.id, c.name, c.teacher_id, u.name
      ORDER BY total_attempts DESC
    `);

    const analytics = {
      systemStats,
      questionPerformance,
      subjectPerformance,
      studentPerformance,
      strugglingStudents,
      difficultQuestions,
      dailyActivity,
      classPerformance
    };

    res.json({ analytics });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Admin lists everyone; teacher lists only their own class.
userRoutes.get("/", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const u = (req as any).user;
    if (u.role === "admin") {
      const users = await q(`
        SELECT 
          u.id, u.role, u.name, u.email, u.username, u.created_at,
          COALESCE(tc.id, sc.id) as class_id,
          COALESCE(tc.name, sc.name) as class_name
        FROM users u
        LEFT JOIN classes tc ON (u.role = 'teacher' AND tc.teacher_id = u.id)
        LEFT JOIN class_students cs ON (u.role = 'student' AND cs.student_id = u.id)
        LEFT JOIN classes sc ON (u.role = 'student' AND sc.id = cs.class_id)
        ORDER BY u.role, u.name
      `);
      
      res.json({ users: users.map(user => ({ ...user, classId: user.class_id, className: user.class_name })) });
    } else {
      const students = await q(
        `SELECT s.id, s.name, s.username FROM users s
         JOIN class_students cs ON cs.student_id = s.id
         JOIN classes c ON c.id = cs.class_id
         WHERE c.teacher_id = $1 ORDER BY s.name`, [u.id]);
      res.json({ users: students });
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get user details with analytics
userRoutes.get("/:id", requireRole("admin", "teacher"), async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = (req as any).user;
    
    // Get user basic info
    const [user] = await q(`
      SELECT u.id, u.role, u.name, u.email, u.username, u.created_at,
             COALESCE(tc.id, sc.id) as class_id,
             COALESCE(tc.name, sc.name) as class_name
      FROM users u
      LEFT JOIN classes tc ON (u.role = 'teacher' AND tc.teacher_id = u.id)
      LEFT JOIN class_students cs ON (u.role = 'student' AND cs.student_id = u.id)
      LEFT JOIN classes sc ON (u.role = 'student' AND sc.id = cs.class_id)
      WHERE u.id = $1
    `, [userId]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check permissions
    if (requestingUser.role === "teacher") {
      // Teachers can only see their own students
      const [studentInClass] = await q(`
        SELECT 1 FROM class_students cs
        JOIN classes c ON c.id = cs.class_id
        WHERE c.teacher_id = $1 AND cs.student_id = $2
      `, [requestingUser.id, userId]);
      
      if (!studentInClass) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    // Get user analytics if student
    let analytics = null;
    if (user.role === 'student') {
      const [questionStats] = await q(`
        SELECT 
          COUNT(*) as total_attempts,
          COUNT(*) FILTER (WHERE is_correct = true) as correct_answers,
          ROUND(COUNT(*) FILTER (WHERE is_correct = true) * 100.0 / NULLIF(COUNT(*), 0), 1) as success_rate
        FROM attempts WHERE student_id = $1
      `, [userId]);

      const subjectStats = await q(`
        SELECT 
          q.subject_id,
          COUNT(*) as attempts,
          COUNT(*) FILTER (WHERE a.is_correct = true) as correct,
          ROUND(COUNT(*) FILTER (WHERE a.is_correct = true) * 100.0 / NULLIF(COUNT(*), 0), 1) as success_rate
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        WHERE a.student_id = $1
        GROUP BY q.subject_id
        ORDER BY attempts DESC
      `, [userId]);

      const recentActivity = await q(`
        SELECT a.created_at, q.prompt, q.subject_id, a.is_correct
        FROM attempts a
        JOIN questions q ON q.id = a.question_id
        WHERE a.student_id = $1
        ORDER BY a.created_at DESC
        LIMIT 10
      `, [userId]);

      analytics = {
        questionStats: questionStats || { total_attempts: 0, correct_answers: 0, success_rate: 0 },
        subjectStats,
        recentActivity
      };
    }

    res.json({ user: { ...user, classId: user.class_id, className: user.class_name }, analytics });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user details
userRoutes.patch("/:id", requireRole("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, username } = req.body || {};
    
    if (!name && !email && !username) {
      return res.status(400).json({ error: "At least one field must be provided" });
    }

    let query = "UPDATE users SET ";
    let values = [];
    let updates = [];

    if (name) {
      updates.push(`name = $${values.length + 1}`);
      values.push(name);
    }
    
    if (email) {
      updates.push(`email = $${values.length + 1}`);
      values.push(email.toLowerCase());
    }
    
    if (username) {
      updates.push(`username = $${values.length + 1}`);
      values.push(username.toLowerCase());
    }

    query += updates.join(", ");
    query += ` WHERE id = $${values.length + 1} RETURNING id, name, email, username, role, created_at`;
    values.push(userId);

    const [user] = await q(query, values);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    if (error.constraint?.includes('email')) {
      res.status(400).json({ error: "Email already exists" });
    } else if (error.constraint?.includes('username')) {
      res.status(400).json({ error: "Username already exists" });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

// Delete user
userRoutes.delete("/:id", requireRole("admin"), async (req, res) => {
  try {
    const userId = req.params.id;
    const requestingUser = (req as any).user;
    
    // Cannot delete self
    if (userId === requestingUser.id) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    // Check if user exists
    const [user] = await q(`SELECT role FROM users WHERE id = $1`, [userId]);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Delete related data first
    if (user.role === 'student') {
      await q(`DELETE FROM class_students WHERE student_id = $1`, [userId]);
      await q(`DELETE FROM attempts WHERE student_id = $1`, [userId]);
    } else if (user.role === 'teacher') {
      // Remove teacher from classes (don't delete the classes)
      await q(`UPDATE classes SET teacher_id = NULL WHERE teacher_id = $1`, [userId]);
    }

    // Delete questions created by user
    await q(`DELETE FROM questions WHERE created_by = $1`, [userId]);
    
    // Finally delete the user
    await q(`DELETE FROM users WHERE id = $1`, [userId]);

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
