// ============================================================================
//  scaffold.mjs — runs ON YOUR MACHINE (where the PDFs live).
//  Scans data/pdf/grade-XX/*.pdf, classifies each file into a subject/track,
//  and creates EMPTY per-subject content files + a manifest.csv.
//  Non-destructive: never overwrites a content file that already has lessons.
//
//  Run from the project root:  node scripts/scaffold.mjs
// ============================================================================
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PDF_DIR = path.join(ROOT, "data", "pdf");
const CONTENT_DIR = path.join(ROOT, "content");

// ---- filename -> {subject, track, variant, shared} ------------------------
// Order matters: more specific patterns first.
function classify(file) {
  const f = file.toLowerCase();
  const has = (s) => f.includes(s);

  // Shared / cross-grade books (not a graded subject)
  if (has("100_sunnat") || has("100-sunnat") || has("sunnats")) return { subject: "100-sunnats", shared: true };
  if (has("essential_duas") || has("essential-duas")) return { subject: "essential-duas", shared: true };
  if (has("tasheelud") || has("tasheel-ud") || has("duroosul") === false && (has("duas") || has("duaa"))) return { subject: "duas", shared: true };
  if (has("amma")) return { subject: "amma-para", shared: true };
  if (has("tuhfatul_banaat") || has("tuhfatul-banaat")) return { subject: "tuhfatul-banaat", shared: true };
  if (has("tuhfatush_shabaab") || has("tuhfatush-shabaab")) return { subject: "tuhfatush-shabaab", shared: true };

  // Shafi'i Fiqh — its own track
  if (has("shafiee") || has("shafii") || has("shafi-i") || has("shafi'i")) return { subject: "fiqh", track: "tasheel-shafii" };

  // Combined KZN Ahaadeeth wal Akhlaaq book -> its own subject so it doesn't collide
  if (has("ahaadeeth_wal") || has("ahadeeth-wal") || has("ahaadeeth-wal") || has("ahadeeth_wal"))
    return { subject: "ahadeeth-wal-akhlaaq", variant: "kzn" };

  // Duroosul Qur'aan (e.g. grade 9)
  if (has("duroos") || has("duroosil")) return { subject: "duroosul-quraan" };

  // Core graded subjects
  if (has("aqaaid") || has("aqa-id") || has("aqaa-id")) return { subject: "aqaaid", variant: has("basic") ? "basic" : undefined };
  if (has("akhlaaq") || has("akhlaq")) return { subject: "akhlaaq" };
  if (has("fiqh")) return { subject: "fiqh", variant: has("basic") ? "basic" : undefined };
  if (has("hadeeth") || has("ahaadeeth") || has("ahadeeth")) return { subject: "hadeeth" };
  if (has("history") || has("taareekh") || has("tareekh") || has("seerah")) return { subject: "islamic-history" };

  return { subject: "unclassified" };
}

const SUBJECT_NAMES = {
  aqaaid: "Aqaa-id", akhlaaq: "Akhlaaq", fiqh: "Fiqh", hadeeth: "Hadeeth",
  "islamic-history": "Tareekh (Islamic History)", "ahadeeth-wal-akhlaaq": "Ahaadeeth wal Akhlaaq",
  "duroosul-quraan": "Duroosul Qur'aan", "100-sunnats": "100 Sunnats", duas: "Duas",
  "essential-duas": "Essential Duas", "amma-para": "Amma Para",
  "tuhfatul-banaat": "Tuhfatul Banaat", "tuhfatush-shabaab": "Tuhfatush Shabaab",
  unclassified: "Unclassified — needs manual check",
};

const stripZero = (n) => String(parseInt(n, 10));
const gradeIdFromFolder = (folder) => {
  const m = folder.match(/(\d+)/g);
  if (!m) return null; // e.g. "grade-shafiee-fiqh" has no folder grade
  return "g" + m.map(stripZero).join("-"); // grade-04 -> g5? no: -> g4 ; grade-11-and-12 -> g11-12
};
// Some books carry the grade in the FILENAME instead (e.g. fiqh-shafiee-grade-2.pdf).
const gradeIdFromFile = (file) => {
  const m = file.toLowerCase().match(/(?:grade|gr|g)[-_ ]?(\d+)/);
  return m ? "g" + stripZero(m[1]) : null;
};

function emptyContentFile({ track, gradeId, subjectId, subjectName, sources }) {
  return {
    track, gradeId, subjectId, subjectName,
    tagline: "",
    sources,                       // [{ pdf, note }]
    status: "needs_content",       // needs_content | in_progress | review | done
    lessons: [],                   // filled by Claude Code / teachers
  };
}

function run() {
  if (!fs.existsSync(PDF_DIR)) {
    console.error("No data/pdf folder found. Put your grade-XX folders under data/pdf/ first.");
    process.exit(1);
  }
  const manifest = [["track", "gradeId", "subject", "variant", "shared", "filename"]];
  const folders = fs.readdirSync(PDF_DIR).filter((d) => fs.statSync(path.join(PDF_DIR, d)).isDirectory());
  let created = 0, skipped = 0;

  // group files by (track, gradeId, subjectId)
  const groups = {};
  for (const folder of folders) {
    const folderGrade = gradeIdFromFolder(folder);
    const files = fs.readdirSync(path.join(PDF_DIR, folder)).filter((f) => f.toLowerCase().endsWith(".pdf"));
    for (const file of files) {
      const c = classify(file);
      const track = c.shared ? "shared" : (c.track || "tasheel");
      // Grade resolution: filename grade wins (handles shafii folder + mixed folders),
      // else the folder grade, else "gX".
      const gradeId = gradeIdFromFile(file) || folderGrade || "gX";
      const subjectId = c.shared ? c.subject : `${gradeId}-${c.subject}${c.variant ? "-" + c.variant : ""}`;
      const key = `${track}|${c.shared ? "shared" : gradeId}|${subjectId}`;
      (groups[key] ||= { track, gradeId: c.shared ? "shared" : gradeId, subjectId, base: c.subject, variant: c.variant, sources: [] })
        .sources.push({ pdf: `${folder}/${file}`, note: c.variant || "" });
      manifest.push([track, gradeId, c.subject, c.variant || "", c.shared ? "yes" : "", `${folder}/${file}`]);
    }
  }

  for (const g of Object.values(groups)) {
    const dir = path.join(CONTENT_DIR, g.track, g.gradeId);
    fs.mkdirSync(dir, { recursive: true });
    const fp = path.join(dir, `${g.subjectId}.json`);
    if (fs.existsSync(fp)) {
      const existing = JSON.parse(fs.readFileSync(fp, "utf8"));
      if (existing.lessons && existing.lessons.length) { skipped++; continue; } // keep filled content
    }
    fs.writeFileSync(fp, JSON.stringify(emptyContentFile({
      track: g.track, gradeId: g.gradeId, subjectId: g.subjectId,
      subjectName: SUBJECT_NAMES[g.base] || g.base, sources: g.sources,
    }), null, 2));
    created++;
  }

  fs.mkdirSync(CONTENT_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONTENT_DIR, "manifest.csv"), manifest.map((r) => r.join(",")).join("\n"));
  console.log(`Scaffold complete. Created ${created} content file(s), skipped ${skipped} already-filled.`);
  console.log(`Manifest: content/manifest.csv  (${manifest.length - 1} PDFs mapped)`);
}
run();
