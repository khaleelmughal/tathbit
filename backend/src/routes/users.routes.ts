import { Router } from "express";
import { q } from "../db.js";
import { hash, authRequired, requireRole } from "../auth.js";

export const userRoutes = Router();
userRoutes.use(authRequired);

// Admin creates a teacher (email + password) and their single class.
userRoutes.post("/teachers", requireRole("admin"), async (req, res) => {
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
});

// Admin creates a student (username + PIN) and optionally assigns to a class.
userRoutes.post("/students", requireRole("admin"), async (req, res) => {
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
});

// Admin (re)assigns a student to a class.
userRoutes.post("/assign", requireRole("admin"), async (req, res) => {
  const { studentId, classId } = req.body ?? {};
  await q(`INSERT INTO class_students (class_id, student_id) VALUES ($1,$2)
           ON CONFLICT (student_id) DO UPDATE SET class_id = EXCLUDED.class_id`, [classId, studentId]);
  res.json({ ok: true });
});

// Admin lists everyone; teacher lists only their own class.
userRoutes.get("/", requireRole("admin", "teacher"), async (req, res) => {
  const u = (req as any).user;
  if (u.role === "admin") {
    res.json(await q(`SELECT id, role, name, email, username FROM users ORDER BY role, name`));
  } else {
    res.json(await q(
      `SELECT s.id, s.name, s.username FROM users s
       JOIN class_students cs ON cs.student_id = s.id
       JOIN classes c ON c.id = cs.class_id
       WHERE c.teacher_id = $1 ORDER BY s.name`, [u.id]));
  }
});
