import { Router } from "express";
import { q } from "../db.js";
import { verify, sign } from "../auth.js";

export const authRoutes = Router();

// Staff login (admin or teacher) — email + password
authRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });
  const [user] = await q(`SELECT * FROM users WHERE email = $1 AND role IN ('admin','teacher')`, [email.toLowerCase()]);
  if (!user || !(await verify(password, user.password_hash)))
    return res.status(401).json({ error: "Wrong email or password" });
  const auth = { id: user.id, role: user.role, name: user.name };
  res.json({ token: sign(auth), user: auth });
});

// Student login — username + PIN
authRoutes.post("/student-login", async (req, res) => {
  const { username, pin } = req.body ?? {};
  if (!username || !pin) return res.status(400).json({ error: "Username and PIN required" });
  const [user] = await q(`SELECT * FROM users WHERE username = $1 AND role = 'student'`, [username.toLowerCase()]);
  if (!user || !(await verify(String(pin), user.password_hash)))
    return res.status(401).json({ error: "Wrong username or PIN" });
  const auth = { id: user.id, role: user.role, name: user.name };
  res.json({ token: sign(auth), user: auth });
});

// Who am I (used by the frontend on load)
authRoutes.get("/me", (req, res) => res.json({ user: (req as any).user }));
