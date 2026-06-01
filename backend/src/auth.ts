import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

export type Role = "admin" | "teacher" | "student";
export interface AuthUser { id: string; role: Role; name: string; }

export const hash = (secret: string) => bcrypt.hash(secret, 10);
export const verify = (secret: string, hashed: string) => bcrypt.compare(secret, hashed);
export const sign = (u: AuthUser) => jwt.sign(u, SECRET, { expiresIn: "30d" });

// Attaches req.user when a valid Bearer token is present.
export function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in" });
  try {
    (req as any).user = jwt.verify(token, SECRET) as AuthUser;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Restrict a route to certain roles.
export const requireRole = (...roles: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as AuthUser | undefined;
    if (!user || !roles.includes(user.role)) return res.status(403).json({ error: "Not allowed" });
    next();
  };
