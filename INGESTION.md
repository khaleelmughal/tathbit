# Content ingestion guide — for Claude Code (run on the local machine)

This is the recipe for turning the downloaded Tas-heel PDFs into revision content.
**Do this one book at a time.** Never try to do many books in a single run — it
will be slow and may truncate. One subject file per session is the safe unit.

## Why this runs in Claude Code, not the web chat
The Tas-heel books are **scanned images** (no text layer). They must be read
**visually**, page by page. Claude Code runs on the machine where the PDFs live,
so it can open and view them directly. The web chat cannot see local files.

## Where things are
- PDFs:        `data/pdf/grade-XX/*.pdf`
- Content out: `content/<track>/<gradeId>/<subjectId>.json`
- Manifest:    `content/manifest.csv`  (which PDF → which subject)
- Worked example to copy: `content/tasheel/g5/g5-aqaaid.json` (real, filled)

## Step 0 — scaffold (once, after adding PDFs)
```
node scripts/scaffold.mjs
```
Creates an empty content file for every (grade, subject) found in `data/pdf/`,
plus `content/manifest.csv`. Safe to re-run; it never overwrites filled files.

## Step 1 — pick ONE subject file to fill
e.g. `content/tasheel/g4/g4-fiqh.json`. Open its `sources[].pdf` to know which
PDF to read (e.g. `data/pdf/grade-04/fiqh-4.pdf`).

## Step 2 — read the PDF visually
1. Find the **contents page** first → gives the real lesson list, titles, page ranges.
2. Read each lesson's pages. Transcribe faithfully — do **not** paraphrase Qur'an,
   Hadeeth, Arabic, or rulings. Copy them as printed.
3. Where the book has exercises (match, fill-in, short-answer, true/false), turn
   them into questions of the matching `type`.

## Step 3 — fill the lesson objects
Each lesson in the JSON looks like this (copy the shape from the g5 example):
```json
{
  "id": "g4-fiqh-l1",
  "n": 1,
  "title": "Najaasah",
  "pages": "4-7",
  "summary": "2-4 sentence plain summary a 10-year-old understands.",
  "keyTerms": [{ "term": "Najaasah", "meaning": "Impurity" }],
  "points": ["Important point 1", "Important point 2"],
  "story": { "title": "...", "text": "..." },           // or null
  "questions": [
    { "id": "g4-fiqh-l1-q1", "type": "multiple-choice", "difficulty": "easy",
      "prompt": "...", "options": ["a","b","c","d"], "correctAnswer": "a",
      "explanation": "Why." }
  ],
  "flashcards": [{ "front": "Q?", "back": "A." }],
  "needsContent": false,
  "needsReview": false
}
```
Question `type` values and their fields:
- `multiple-choice` → `options: string[]`, `correctAnswer: string`
- `short-answer`    → `acceptedAnswers: string[]` (lowercase variants)
- `fill-blank`      → `correctAnswer: string` (+ optional `acceptedAnswers`)
- `true-false`      → `correctAnswer: boolean`
- `match`           → `pairs: [{ left, right }]`

## Step 4 — flag anything uncertain
- If a page is missing, blurry, or a lesson sequence looks incomplete, set that
  lesson's `"needsReview": true` and add a `"reviewNote"`. (Some lower-grade
  Hadeeth/History PDFs are known to have missing pages.)
- Keep `needsContent: true` only on lessons you haven't filled yet.
- When the whole file is done, set the top-level `"status": "review"` so a
  parent/teacher checks it before it goes live.

## Step 5 — load into Postgres
```
npm run db:seed      # idempotent; re-reads every content file
```

## Golden rules
- **Accuracy over speed.** Islamic content must be reviewed by a parent/teacher
  before students use it. When unsure, mark `needsReview`, don't guess.
- **One book per session.** Commit the finished JSON, then start the next.
- **Don't invent.** If it's not in the book, it doesn't go in.
- Tas-heel Shafi'i Fiqh files live under `content/tasheel-shafii/` and are a
  separate track — keep them separate from the Hanafi Fiqh files.
