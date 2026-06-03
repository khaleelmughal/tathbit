// import express from "express";
// import cors from "cors";
// import "dotenv/config";
// import { authRequired } from "./auth.js";
// import { authRoutes } from "./routes/auth.routes.js";
// import { userRoutes } from "./routes/users.routes.js";
// import { syllabusRoutes } from "./routes/syllabus.routes.js";
// import { questionRoutes } from "./routes/questions.routes.js";
// import { progressRoutes } from "./routes/progress.routes.js";
// import { flashcardRoutes } from "./routes/flashcards.routes.js";

// const app = express();
// app.use(cors());
// app.use(express.json({ limit: "2mb" }));

// app.get("/api/health", (_req, res) => res.json({ ok: true }));
// app.use("/api/auth", authRoutes);
// app.use("/api/auth/me", authRequired); // protect /me
// app.use("/api/users", userRoutes);
// app.use("/api/syllabus", syllabusRoutes);
// app.use("/api/questions", questionRoutes);
// app.use("/api/progress", progressRoutes);
// app.use("/api/flashcards", flashcardRoutes);

// const PORT = Number(process.env.PORT) || 4000;
// app.listen(PORT, () => console.log(`Madrasah API on http://localhost:${PORT}`));

import app from "./app.js";
const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => console.log(`Madrasah API on http://localhost:${PORT}`));