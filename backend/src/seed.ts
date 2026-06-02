// ============================================================================
//  seed.ts — creates the single admin + loads ALL content files into Postgres.
//  Content lives in /content/<track>/<gradeId>/<subjectId>.json (see scaffold.mjs
//  and INGESTION.md). Re-running is safe (idempotent upserts).
//
//  Tracks become "grades" rows so Tas-heel and Tas-heel Shafi'i sit side by side:
//    tasheel       -> g1..g12        (standard Hanafi Tas-heel)
//    tasheel-shafii -> shafii-g2..    (separate Shafi'i Fiqh track)
//    shared        -> shared          (duas, 100 sunnats, etc.)
// ============================================================================
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { q, pool } from "./db.js";
import { hash } from "./auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.resolve(__dirname, "../../content");

const GRADE_LABEL: Record<string, string> = {
  g1: "Grade 1", g2: "Grade 2", g3: "Grade 3", g4: "Grade 4", g5: "Grade 5",
  g6: "Grade 6", g7: "Grade 7", g8: "Grade 8", g9: "Grade 9", g10: "Grade 10",
  "g11-12": "Grade 11 & 12", shared: "Shared books",
};
const gradePosition = (id: string) => {
  const m = id.match(/\d+/); return m ? parseInt(m[0], 10) : 99;
};
const gradeLabel = (track: string, gradeId: string) => {
  const base = GRADE_LABEL[gradeId] || gradeId;
  return track === "tasheel-shafii" ? `${base} (Shafi'i Fiqh)` : base;
};
// DB grade id must be globally unique across tracks:
const dbGradeId = (track: string, gradeId: string) =>
  track === "tasheel-shafii" ? `shafii-${gradeId}` : gradeId;

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@madrasah.local").toLowerCase();
  const [existing] = await q(`SELECT id FROM users WHERE email = $1`, [email]);
  if (existing) return console.log("Admin already exists:", email);
  await q(`INSERT INTO users (role, name, email, password_hash) VALUES ('admin',$1,$2,$3)`,
    [process.env.ADMIN_NAME || "Admin", email, await hash(process.env.ADMIN_PASSWORD || "changeme123")]);
  console.log("Created admin:", email);
}

function* walkContent(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walkContent(fp);
    else if (entry.name.endsWith(".json")) yield fp;
  }
}

async function seedContent() {
  const seenGrades = new Set<string>();
  let subjects = 0, lessons = 0, questions = 0, files = 0;
  const skippedFiles: string[] = [];

  for (const fp of walkContent(CONTENT_DIR)) {
    let c: any;
    try {
      c = JSON.parse(fs.readFileSync(fp, "utf8"));
    } catch (error) {
      console.warn(`⚠️  Skipping broken JSON file: ${fp}`);
      console.warn(`   Error: ${error.message}`);
      skippedFiles.push(fp);
      continue;
    }
    if (!c.track || !c.gradeId || !c.subjectId) continue; // skip manifest etc.
    files++;
    const gId = dbGradeId(c.track, c.gradeId);

    if (!seenGrades.has(gId)) {
      await q(`INSERT INTO grades (id,name,position) VALUES ($1,$2,$3)
               ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, position=EXCLUDED.position`,
        [gId, gradeLabel(c.track, c.gradeId), gradePosition(c.gradeId)]);
      seenGrades.add(gId);
    }

    await q(`INSERT INTO subjects (id,grade_id,name,tagline,source,position) VALUES ($1,$2,$3,$4,$5,$6)
             ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, tagline=EXCLUDED.tagline, source=EXCLUDED.source`,
      [c.subjectId, gId, c.subjectName || c.subjectId, c.tagline || null,
       (c.sources || []).map((s: any) => s.pdf).join("; ") || null, subjects]);
    subjects++;

    let lp = 0;
    for (const l of (c.lessons || [])) {
      lp++;
      const content = { keyTerms: l.keyTerms || [], points: l.points || [], story: l.story || null, flashcards: l.flashcards || [] };
      const needs = !!l.needsContent || !(l.questions && l.questions.length);
      await q(`INSERT INTO lessons (id,subject_id,n,title,pages,summary,content,needs_content,position)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
               ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, pages=EXCLUDED.pages,
                 summary=EXCLUDED.summary, content=EXCLUDED.content, needs_content=EXCLUDED.needs_content, position=EXCLUDED.position`,
        [l.id, c.subjectId, l.n || null, l.title || `Lesson ${lp}`, l.pages || null,
         l.summary || null, JSON.stringify(content), needs, lp]);
      lessons++;

      for (const qq of (l.questions || [])) {
        const { id, type, prompt, explanation, difficulty, ...rest } = qq;
        const [exists] = await q(`SELECT id FROM questions WHERE prompt=$1 AND lesson_id=$2 AND created_by IS NULL`, [prompt, l.id]);
        if (exists) continue;
        await q(`INSERT INTO questions (grade_id,subject_id,lesson_id,type,prompt,payload,explanation,difficulty,status,created_by)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active',NULL)`,
          [gId, c.subjectId, l.id, type, prompt, JSON.stringify(rest), explanation || null, difficulty || "medium"]);
        questions++;
      }
    }
  }
  console.log(`Seeded ${files} content files: ${seenGrades.size} grades, ${subjects} subjects, ${lessons} lessons, ${questions} questions.`);
  if (files === 0) console.log("No content files yet. Run `node scripts/scaffold.mjs` then fill them (see INGESTION.md).");
  
  if (skippedFiles.length > 0) {
    console.log(`\n⚠️  Skipped ${skippedFiles.length} broken JSON files:`);
    skippedFiles.forEach(file => console.log(`   - ${file}`));
  }
}

(async () => {
  await seedAdmin();
  await seedContent();
  await pool.end();
  console.log("Seed complete.");
})().catch((e) => { console.error(e); process.exit(1); });
