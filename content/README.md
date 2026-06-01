# content/ — the syllabus question bank (source of truth for seeding)

Per-subject JSON files, one per (track, grade, subject):

```
content/
  tasheel/        # standard Hanafi Tas-heel
    g4/g4-fiqh.json
    g5/g5-aqaaid.json   ...
  tasheel-shafii/ # SEPARATE Shafi'i Fiqh track
    g2/g2-fiqh.json ...
  shared/         # cross-grade books (duas, 100 sunnats, tuhfatul banaat, ...)
    shared/duas.json ...
  manifest.csv    # which PDF maps to which subject (generated)
```

## How content gets here
1. `node scripts/scaffold.mjs` — scans `data/pdf/grade-XX/` and creates empty
   shells + `manifest.csv`. Non-destructive (won't overwrite filled files).
2. Claude Code fills each file from its PDF — see **INGESTION.md**.
3. `npm run db:seed` — loads every content file into Postgres.

## Status field per file
`needs_content` → empty · `in_progress` → partly filled · `review` → done, awaiting
parent/teacher check · `done` → reviewed and live.

**Grade 5 is the worked example** (real content from the books). Copy its shape.
Islamic content must be reviewed by a parent/teacher before students use it.
