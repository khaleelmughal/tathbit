import { Router } from "express";
import { q } from "../db.js";
import { verify, sign, authRequired } from "../auth.js";

export const authRoutes = Router();

// Staff login (admin or teacher) — email + password
authRoutes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const [user] = await q(`SELECT * FROM users WHERE email = $1 AND role IN ('admin','teacher')`, [email.toLowerCase()]);
    if (!user || !(await verify(password, user.password_hash)))
      return res.status(401).json({ error: "Wrong email or password" });
    const auth = { id: user.id, role: user.role, name: user.name };
    res.json({ token: sign(auth), user: auth });
  } catch (error) {
    console.error("Error during staff login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Student login — username + PIN
authRoutes.post("/student-login", async (req, res) => {
  try {
    const { username, pin } = req.body ?? {};
    if (!username || !pin) return res.status(400).json({ error: "Username and PIN required" });
    const [user] = await q(`SELECT * FROM users WHERE username = $1 AND role = 'student'`, [username.toLowerCase()]);
    if (!user || !(await verify(String(pin), user.password_hash)))
      return res.status(401).json({ error: "Wrong username or PIN" });
    const auth = { id: user.id, role: user.role, name: user.name };
    res.json({ token: sign(auth), user: auth });
  } catch (error) {
    console.error("Error during student login:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Who am I (used by the frontend on load)
authRoutes.get("/me", authRequired, async (req, res) => {
  try {
    const user = (req as any).user;
    
    if (user.role === "teacher") {
      // Get teacher's class information
      const [teacherData] = await q(`
        SELECT u.id, u.role, u.name, u.email, c.id as class_id, c.name as class_name
        FROM users u
        LEFT JOIN classes c ON c.teacher_id = u.id
        WHERE u.id = $1
      `, [user.id]);
      
      if (teacherData) {
        res.json({ 
          user: { 
            ...user, 
            classId: teacherData.class_id, 
            className: teacherData.class_name,
            email: teacherData.email
          } 
        });
      } else {
        res.json({ user });
      }
    } else if (user.role === "student") {
      // Get student's class information
      const [studentData] = await q(`
        SELECT u.id, u.role, u.name, u.username, c.id as class_id, c.name as class_name
        FROM users u
        LEFT JOIN class_students cs ON cs.student_id = u.id
        LEFT JOIN classes c ON c.id = cs.class_id
        WHERE u.id = $1
      `, [user.id]);
      
      if (studentData) {
        res.json({ 
          user: { 
            ...user, 
            username: studentData.username,
            classId: studentData.class_id, 
            className: studentData.class_name 
          } 
        });
      } else {
        res.json({ user });
      }
    } else {
      // Admin - just return basic user info
      res.json({ user });
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
