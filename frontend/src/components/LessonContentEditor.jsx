import React, { useState, useEffect } from "react";
import { getSyllabus, getLesson, updateLesson } from "../lib/api";
import { Plus, X, Save, BookOpen, Check, AlertCircle } from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
  danger: "#C0563B", dangerSoft: "#FBEFEC",
};
const labelStyle = { display: "block", color: T.ink, fontSize: 13, fontWeight: 700, marginBottom: 6 };
const fieldStyle = { width: "100%", padding: "11px 13px", border: `1.5px solid ${T.line}`, borderRadius: 10, fontSize: 14.5, fontFamily: "inherit", background: "#fff", color: T.ink, boxSizing: "border-box", outline: "none" };
const selectStyle = { ...fieldStyle, cursor: "pointer" };

const SectionCard = ({ title, icon, children, hint }) => (
  <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: hint ? 4 : 12 }}>
      {icon}<h3 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 17, color: T.ink }}>{title}</h3>
    </div>
    {hint && <p style={{ margin: "0 0 12px", color: T.faint, fontSize: 12.5 }}>{hint}</p>}
    {children}
  </div>
);
const Btn = ({ children, onClick, variant = "primary", icon, disabled, style = {} }) => {
  const v = {
    primary: { background: T.green, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: T.green, border: `1.5px dashed ${T.line}` },
    secondary: { background: T.card, color: T.ink, border: `1.5px solid ${T.line}` },
  }[variant];
  return <button type="button" onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "11px 16px", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.55 : 1, ...v, ...style }}>{icon}{children}</button>;
};

export default function LessonContentEditor() {
  const [syllabus, setSyllabus] = useState({ grades: [], subjects: [], lessons: [] });
  const [gradeId, setGradeId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const [loaded, setLoaded] = useState(null); // the lesson being edited
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState(null);

  const [title, setTitle] = useState("");
  const [pages, setPages] = useState("");
  const [summary, setSummary] = useState("");
  const [keyTerms, setKeyTerms] = useState([]);
  const [points, setPoints] = useState([]);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyText, setStoryText] = useState("");
  const [flashcards, setFlashcards] = useState([]);
  const [arabic, setArabic] = useState([]);

  useEffect(() => { getSyllabus().then(setSyllabus).catch(() => {}); }, []);

  const subjects = syllabus.subjects.filter((s) => s.grade_id === gradeId);
  const lessons = syllabus.lessons.filter((l) => l.subject_id === subjectId);

  useEffect(() => {
    if (!lessonId) { setLoaded(null); return; }
    setBusy(true); setBanner(null);
    getLesson(lessonId).then(({ lesson }) => {
      const c = lesson.content || {};
      setLoaded(lesson);
      setTitle(lesson.title || "");
      setPages(lesson.pages || "");
      setSummary(lesson.summary || "");
      setKeyTerms(c.keyTerms || []);
      setPoints(c.points || []);
      setStoryTitle(c.story?.title || "");
      setStoryText(c.story?.text || "");
      setFlashcards(c.flashcards || []);
      setArabic(c.arabic || []);
    }).catch((e) => setBanner({ kind: "error", text: e.message })).finally(() => setBusy(false));
  }, [lessonId]);

  const save = async () => {
    setBusy(true); setBanner(null);
    try {
      await updateLesson(lessonId, {
        title: title.trim(), pages: pages.trim(), summary: summary.trim(),
        keyTerms: keyTerms.filter((k) => k.term?.trim()),
        points: points.filter((p) => p.trim()),
        story: storyTitle.trim() || storyText.trim() ? { title: storyTitle.trim(), text: storyText.trim() } : null,
        flashcards: flashcards.filter((f) => f.front?.trim() && f.back?.trim()),
        arabic: arabic.filter((a) => a.text?.trim()),
      });
      setBanner({ kind: "ok", text: "Lesson saved. Students will see the update immediately." });
    } catch (e) { setBanner({ kind: "error", text: e.message }); }
    finally { setBusy(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 18 }}>
        <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: T.ink, margin: 0 }}>Lesson Content</h1>
        <p style={{ color: T.ink2, margin: "4px 0 0", fontSize: 14 }}>Edit the summary, key terms, important points and story shown on each lesson page.</p>
      </div>

      {/* Pickers */}
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, marginBottom: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Grade</label>
          <select value={gradeId} onChange={(e) => { setGradeId(e.target.value); setSubjectId(""); setLessonId(""); }} style={selectStyle}>
            <option value="">Select grade</option>
            {[...syllabus.grades].sort((a, b) => a.position - b.position).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Subject</label>
          <select value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setLessonId(""); }} style={selectStyle} disabled={!gradeId}>
            <option value="">{gradeId ? "Select subject" : "Pick grade first"}</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Lesson</label>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)} style={selectStyle} disabled={!subjectId}>
            <option value="">{subjectId ? "Select lesson" : "Pick subject first"}</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.n ? `${l.n}. ` : ""}{l.title}</option>)}
          </select>
        </div>
      </div>

      {banner && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: banner.kind === "ok" ? T.greenSoft : T.dangerSoft, color: banner.kind === "ok" ? T.green : T.danger, padding: "10px 14px", borderRadius: 10, marginBottom: 16, fontSize: 14, fontWeight: 600 }}>
          {banner.kind === "ok" ? <Check size={16} /> : <AlertCircle size={16} />}{banner.text}
        </div>
      )}

      {!lessonId ? (
        <div style={{ textAlign: "center", padding: 60, color: T.ink2, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14 }}>
          <BookOpen size={36} color={T.faint} style={{ marginBottom: 10 }} />
          <p style={{ margin: 0 }}>Choose a grade, subject and lesson to edit its content.</p>
        </div>
      ) : busy && !loaded ? (
        <div style={{ textAlign: "center", padding: 50, color: T.ink2 }}>Loading lesson…</div>
      ) : (
        <>
          <SectionCard title="Heading" icon={<BookOpen size={18} color={T.green} />}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} style={fieldStyle} /></div>
              <div><label style={labelStyle}>Pages</label><input value={pages} onChange={(e) => setPages(e.target.value)} placeholder="e.g. 4-7" style={fieldStyle} /></div>
            </div>
          </SectionCard>

          <SectionCard title="Summary (the green box)" icon={<span style={{ width: 14, height: 14, borderRadius: 4, background: T.green, display: "inline-block" }} />}>
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} style={{ ...fieldStyle, minHeight: 110, resize: "vertical" }} placeholder="The introductory paragraph shown at the top of the lesson." />
          </SectionCard>

          <SectionCard title="Arabic — du'ās &amp; āyāt" icon={<span style={{ fontFamily: "'Noto Naskh Arabic', serif", fontSize: 18 }}>ع</span>}>
            <p style={{ color: T.ink2, margin: "0 0 12px", fontSize: 13 }}>Enter the Arabic text exactly as in the book. Transliteration and meaning are optional and shown when the student taps the card. Leave empty if this lesson has no du'ā or āyah.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {arabic.map((a, i) => (
                <div key={i} style={{ border: `1.5px solid ${T.line}`, borderRadius: 10, padding: 12, position: "relative", background: "#fff" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <textarea value={a.text || ""} onChange={(e) => { const n = [...arabic]; n[i] = { ...n[i], text: e.target.value }; setArabic(n); }} placeholder="النص العربي" dir="rtl" style={{ ...fieldStyle, flex: 1, minHeight: 60, resize: "vertical", fontFamily: "'Noto Naskh Arabic', serif", fontSize: 22, lineHeight: 1.9, textAlign: "right" }} />
                    <RemoveBtn onClick={() => setArabic(arabic.filter((_, x) => x !== i))} />
                  </div>
                  <input value={a.translit || ""} onChange={(e) => { const n = [...arabic]; n[i] = { ...n[i], translit: e.target.value }; setArabic(n); }} placeholder="Transliteration (optional)" style={{ ...fieldStyle, marginTop: 8, fontStyle: "italic" }} />
                  <input value={a.meaning || ""} onChange={(e) => { const n = [...arabic]; n[i] = { ...n[i], meaning: e.target.value }; setArabic(n); }} placeholder="Meaning (optional)" style={{ ...fieldStyle, marginTop: 8 }} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" icon={<Plus size={15} />} onClick={() => setArabic([...arabic, { text: "", translit: "", meaning: "" }])} style={{ marginTop: 10, width: "100%" }}>Add Arabic du'ā / āyah</Btn>
          </SectionCard>

          <SectionCard title="Key terms & new words" icon={<span style={{ fontSize: 16 }}>✨</span>}>
            <div style={{ display: "grid", gap: 8 }}>
              {keyTerms.map((k, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input value={k.arabic || ""} onChange={(e) => { const n = [...keyTerms]; n[i] = { ...n[i], arabic: e.target.value }; setKeyTerms(n); }} placeholder="عربى" dir="rtl" style={{ ...fieldStyle, flex: "0 0 22%", fontFamily: "'Noto Naskh Arabic', serif", fontSize: 17, textAlign: "right" }} />
                  <input value={k.term || ""} onChange={(e) => { const n = [...keyTerms]; n[i] = { ...n[i], term: e.target.value }; setKeyTerms(n); }} placeholder="Term" style={{ ...fieldStyle, flex: "0 0 26%" }} />
                  <input value={k.meaning || ""} onChange={(e) => { const n = [...keyTerms]; n[i] = { ...n[i], meaning: e.target.value }; setKeyTerms(n); }} placeholder="Meaning" style={{ ...fieldStyle, flex: 1 }} />
                  <RemoveBtn onClick={() => setKeyTerms(keyTerms.filter((_, x) => x !== i))} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" icon={<Plus size={15} />} onClick={() => setKeyTerms([...keyTerms, { term: "", meaning: "" }])} style={{ marginTop: 10, width: "100%" }}>Add term</Btn>
          </SectionCard>

          <SectionCard title="Important points" icon={<span style={{ fontSize: 16 }}>📋</span>}>
            <div style={{ display: "grid", gap: 8 }}>
              {points.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <textarea value={p} onChange={(e) => { const n = [...points]; n[i] = e.target.value; setPoints(n); }} placeholder="A key point from the lesson" style={{ ...fieldStyle, flex: 1, minHeight: 52, resize: "vertical" }} />
                  <RemoveBtn onClick={() => setPoints(points.filter((_, x) => x !== i))} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" icon={<Plus size={15} />} onClick={() => setPoints([...points, ""])} style={{ marginTop: 10, width: "100%" }}>Add point</Btn>
          </SectionCard>

          <SectionCard title="Story (optional)" icon={<BookOpen size={18} color={T.green} />}>
            <label style={labelStyle}>Story title</label>
            <input value={storyTitle} onChange={(e) => setStoryTitle(e.target.value)} placeholder="e.g. The Excursion" style={{ ...fieldStyle, marginBottom: 10 }} />
            <label style={labelStyle}>Story text</label>
            <textarea value={storyText} onChange={(e) => setStoryText(e.target.value)} style={{ ...fieldStyle, minHeight: 90, resize: "vertical" }} placeholder="Leave blank to remove the story from this lesson." />
          </SectionCard>

          <SectionCard title="Flashcards" icon={<span style={{ fontSize: 16 }}>🧠</span>} hint="Seed cards shown in the lesson's flashcard deck.">
            <div style={{ display: "grid", gap: 8 }}>
              {flashcards.map((f, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <input value={f.front || ""} onChange={(e) => { const n = [...flashcards]; n[i] = { ...n[i], front: e.target.value }; setFlashcards(n); }} placeholder="Front (question)" style={{ ...fieldStyle, flex: 1 }} />
                  <input value={f.back || ""} onChange={(e) => { const n = [...flashcards]; n[i] = { ...n[i], back: e.target.value }; setFlashcards(n); }} placeholder="Back (answer)" style={{ ...fieldStyle, flex: 1 }} />
                  <RemoveBtn onClick={() => setFlashcards(flashcards.filter((_, x) => x !== i))} />
                </div>
              ))}
            </div>
            <Btn variant="ghost" icon={<Plus size={15} />} onClick={() => setFlashcards([...flashcards, { front: "", back: "" }])} style={{ marginTop: 10, width: "100%" }}>Add flashcard</Btn>
          </SectionCard>

          <div style={{ position: "sticky", bottom: 0, background: T.paper, padding: "14px 0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
            <Btn variant="primary" icon={<Save size={16} />} onClick={save} disabled={busy}>{busy ? "Saving…" : "Save lesson"}</Btn>
          </div>
        </>
      )}
    </div>
  );
}

const RemoveBtn = ({ onClick }) => (
  <button type="button" onClick={onClick} style={{ flexShrink: 0, width: 38, height: 40, borderRadius: 9, border: `1.5px solid ${T.line}`, background: T.card, color: T.faint, cursor: "pointer", display: "grid", placeItems: "center" }}><X size={16} /></button>
);
