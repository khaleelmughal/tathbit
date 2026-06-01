// Seeds: the single admin (from .env) + the syllabus content we already have.
// Grade 5 is fully populated; grades 1-4, 6, 11, 12 are created as empty shells
// ready for you to add content from the PDFs.
// Re-running is safe (upserts).
import "dotenv/config";
import { q, pool } from "./db.js";
import { hash } from "./auth.js";
import syllabus from "./syllabus.json" assert { type: "json" };

const GRADE_SHELLS = [
  { id: "g1", name: "Grade 1", position: 1 },
  { id: "g2", name: "Grade 2", position: 2 },
  { id: "g3", name: "Grade 3", position: 3 },
  { id: "g4", name: "Grade 4", position: 4 },
  { id: "g5", name: "Grade 5", position: 5 },
  { id: "g6", name: "Grade 6", position: 6 },
  { id: "g11", name: "Grade 11", position: 11 },
  { id: "g12", name: "Grade 12", position: 12 },
];

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@madrasah.local").toLowerCase();
  const [existing] = await q(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing) return console.log("Admin already exists:", email);
  await q(`INSERT INTO users (role, name, email, password_hash) VALUES ('admin',$1,$2,$3)`,
    [process.env.ADMIN_NAME || "Admin", email, await hash(process.env.ADMIN_PASSWORD || "changeme123")]);
  console.log("Created admin:", email);
}

async function seedSyllabus() {
  for (const g of GRADE_SHELLS)
    await q(`INSERT INTO grades (id,name,position) VALUES ($1,$2,$3)
             ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, position=EXCLUDED.position`,
            [g.id, g.name, g.position]);

  const grade = (syllabus as any).grades[0]; // g5
  let sp = 0;
  for (const s of grade.subjects) {
    sp++;
    await q(`INSERT INTO subjects (id,grade_id,name,tagline,source,position) VALUES ($1,'g5',$2,$3,$4,$5)
             ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, tagline=EXCLUDED.tagline, source=EXCLUDED.source, position=EXCLUDED.position`,
            [s.id, s.name, s.tagline || null, s.source || null, sp]);
    let lp = 0;
    for (const l of s.lessons) {
      lp++;
      const content = { keyTerms: l.keyTerms || [], points: l.points || [], story: l.story || null, flashcards: l.flashcards || [] };
      await q(`INSERT INTO lessons (id,subject_id,n,title,pages,summary,content,needs_content,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
               ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, pages=EXCLUDED.pages,
                 summary=EXCLUDED.summary, content=EXCLUDED.content, needs_content=EXCLUDED.needs_content, position=EXCLUDED.position`,
              [l.id, s.id, l.n || null, l.title, l.pages || null, l.summary || null,
               JSON.stringify(content), !!l.needsContent, lp]);
      // seed questions (created_by NULL = from the book)
      for (const qq of (l.questions || [])) {
        const { id, type, prompt, explanation, difficulty, ...rest } = qq;
        const [exists] = await q(`SELECT id FROM questions WHERE prompt=$1 AND lesson_id=$2 AND created_by IS NULL`, [prompt, l.id]);
        if (exists) continue;
        await q(`INSERT INTO questions (grade_id,subject_id,lesson_id,type,prompt,payload,explanation,difficulty,status,created_by)
                 VALUES ('g5',$1,$2,$3,$4,$5,$6,$7,'active',NULL)`,
                [s.id, l.id, type, prompt, JSON.stringify(rest), explanation || null, difficulty || "medium"]);
      }
    }
  }
  console.log("Seeded syllabus: Grade 5 populated, other grades created as shells.");
}

(async () => {
  await seedAdmin();
  await seedSyllabus();
  await pool.end();
  console.log("Seed complete.");
})().catch((e) => { console.error(e); process.exit(1); });
