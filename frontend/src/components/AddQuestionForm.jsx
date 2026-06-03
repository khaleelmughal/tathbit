import React, { useState, useEffect } from "react";
import { createQuestion, updateQuestion, getSyllabus } from "../lib/api";
import { Plus, Save, Edit, Check, X, Trash2 } from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
  danger: "#C0563B", dangerSoft: "#FBEFEC",
};

const TYPE_LABELS = {
  "multiple-choice": "Multiple choice",
  "true-false": "True / False",
  "fill-blank": "Fill in the blank",
  "short-answer": "Short answer",
  "match": "Match the columns",
};

const labelStyle = { display: "block", color: T.ink, fontSize: 13, fontWeight: 700, marginBottom: 6 };
const fieldStyle = {
  width: "100%", padding: "11px 13px", border: `1.5px solid ${T.line}`, borderRadius: 10,
  fontSize: 15, fontFamily: "Plus Jakarta Sans, sans-serif", background: "white", color: T.ink,
  boxSizing: "border-box", outline: "none",
};

function Field({ label, error, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={labelStyle}>
          {label}{required && <span style={{ color: T.danger, marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error && <div style={{ color: T.danger, fontSize: 12, marginTop: 4, fontWeight: 600 }}>{error}</div>}
    </div>
  );
}

const Select = ({ label, error, required, children, ...p }) => (
  <Field label={label} error={error} required={required}>
    <select {...p} style={{ ...fieldStyle, cursor: "pointer", ...p.style }}>{children}</select>
  </Field>
);
const Input = (p) => <input {...p} style={{ ...fieldStyle, ...p.style }} />;
const Textarea = ({ label, error, required, ...p }) => (
  <Field label={label} error={error} required={required}>
    <textarea {...p} style={{ ...fieldStyle, minHeight: 80, resize: "vertical", ...p.style }} />
  </Field>
);

function Btn({ children, onClick, disabled, variant = "primary", icon, style = {} }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "12px 18px", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer",
    fontSize: 14, fontWeight: 700, fontFamily: "Plus Jakarta Sans, sans-serif", border: "none",
    opacity: disabled ? 0.55 : 1, transition: "all .15s ease",
  };
  const variants = {
    primary: { background: T.green, color: "#fff" },
    secondary: { background: T.card, color: T.ink, border: `1.5px solid ${T.line}` },
    ghost: { background: "transparent", color: T.green, border: `1.5px dashed ${T.line}` },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}>
      {icon}{children}
    </button>
  );
}

export default function AddQuestionForm({ onSuccess, editingQuestion }) {
  const [form, setForm] = useState({
    gradeId: "", subjectId: "", lessonId: "",
    type: "multiple-choice", difficulty: "easy", prompt: "", explanation: "",
  });
  // Type-specific answer state, kept separate so switching type never corrupts data.
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(null);   // multiple-choice
  const [tfAnswer, setTfAnswer] = useState(null);            // true-false (boolean)
  const [fillAnswer, setFillAnswer] = useState("");          // fill-blank
  const [fillAlso, setFillAlso] = useState([]);              // fill-blank extra spellings
  const [accepted, setAccepted] = useState([]);              // short-answer
  const [acceptedDraft, setAcceptedDraft] = useState("");
  const [pairs, setPairs] = useState([{ left: "", right: "" }, { left: "", right: "" }]);

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(null); // {kind:'error'|'ok', text}

  useEffect(() => { loadSyllabus(); }, []);

  async function loadSyllabus() {
    try {
      setLoadingSyllabus(true);
      const r = await getSyllabus();
      setGrades((r.grades || []).sort((a, b) => a.position - b.position));
      setSubjects(r.subjects || []);
      setLessons(r.lessons || []);
    } catch (e) { console.error("Failed to load syllabus:", e); }
    finally { setLoadingSyllabus(false); }
  }

  // Pre-populate when editing — handles every type, including the true/false
  // boolean that the old form blanked out (false is falsy).
  useEffect(() => {
    if (!editingQuestion) return;
    const p = editingQuestion.payload || {};
    setForm({
      gradeId: editingQuestion.grade_id || "",
      subjectId: editingQuestion.subject_id || "",
      lessonId: editingQuestion.lesson_id || "",
      type: editingQuestion.type || "multiple-choice",
      difficulty: editingQuestion.difficulty || "easy",
      prompt: editingQuestion.prompt || "",
      explanation: editingQuestion.explanation || "",
    });
    const opts = Array.isArray(p.options) && p.options.length ? p.options : ["", "", "", ""];
    setOptions(opts);
    setCorrectIndex(p.correctAnswer != null ? opts.findIndex(o => o === p.correctAnswer) : null);
    setTfAnswer(typeof p.correctAnswer === "boolean" ? p.correctAnswer : null);
    setFillAnswer(typeof p.correctAnswer === "string" ? p.correctAnswer : "");
    setFillAlso(editingQuestion.type === "fill-blank" ? (p.acceptedAnswers || []) : []);
    setAccepted(editingQuestion.type === "short-answer" ? (p.acceptedAnswers || []) : []);
    setPairs(Array.isArray(p.pairs) && p.pairs.length ? p.pairs : [{ left: "", right: "" }, { left: "", right: "" }]);
  }, [editingQuestion]);

  const set = (k) => (e) => {
    const v = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (k === "gradeId") { next.subjectId = ""; next.lessonId = ""; }
      if (k === "subjectId") { next.lessonId = ""; }
      return next;
    });
    setErrors({});
  };

  const filteredSubjects = subjects.filter((s) => s.grade_id === form.gradeId);
  const filteredLessons = lessons.filter((l) => l.subject_id === form.subjectId);

  // ---- options helpers (multiple-choice) ----
  const setOption = (i) => (e) => { const n = [...options]; n[i] = e.target.value; setOptions(n); };
  const addOption = () => options.length < 6 && setOptions([...options, ""]);
  const removeOption = (i) => {
    if (options.length <= 2) return;
    const n = options.filter((_, idx) => idx !== i);
    setOptions(n);
    if (correctIndex === i) setCorrectIndex(null);
    else if (correctIndex > i) setCorrectIndex(correctIndex - 1);
  };

  // ---- accepted answers (short-answer) ----
  const addAccepted = () => {
    const v = acceptedDraft.trim();
    if (v && !accepted.includes(v)) setAccepted([...accepted, v]);
    setAcceptedDraft("");
  };

  // ---- match pairs ----
  const setPair = (i, side) => (e) => { const n = pairs.map((p) => ({ ...p })); n[i][side] = e.target.value; setPairs(n); };
  const addPair = () => setPairs([...pairs, { left: "", right: "" }]);
  const removePair = (i) => pairs.length > 2 && setPairs(pairs.filter((_, idx) => idx !== i));

  function buildPayload() {
    switch (form.type) {
      case "multiple-choice": {
        const opts = options.map((o) => o.trim()).filter(Boolean);
        return { options: opts, correctAnswer: correctIndex != null ? (options[correctIndex] || "").trim() : "" };
      }
      case "true-false": return { correctAnswer: tfAnswer === true };
      case "fill-blank": return {
        correctAnswer: fillAnswer.trim(),
        ...(fillAlso.length ? { acceptedAnswers: fillAlso } : {}),
      };
      case "short-answer": return { acceptedAnswers: accepted.map((a) => a.toLowerCase()) };
      case "match": return { pairs: pairs.filter((p) => p.left.trim() && p.right.trim()) };
      default: return {};
    }
  }

  function validate() {
    const e = {};
    if (!form.gradeId) e.gradeId = "Select a grade";
    if (!form.subjectId) e.subjectId = "Select a subject";
    if (!form.prompt.trim()) e.prompt = "Enter the question";
    if (form.type === "multiple-choice") {
      if (options.filter((o) => o.trim()).length < 2) e.options = "Add at least 2 options";
      else if (correctIndex == null || !options[correctIndex]?.trim()) e.options = "Tick the correct option";
    } else if (form.type === "true-false") {
      if (tfAnswer == null) e.answer = "Choose True or False";
    } else if (form.type === "fill-blank") {
      if (!fillAnswer.trim()) e.answer = "Enter the correct answer";
    } else if (form.type === "short-answer") {
      if (!accepted.length) e.answer = "Add at least one accepted answer";
    } else if (form.type === "match") {
      if (buildPayload().pairs.length < 2) e.answer = "Add at least 2 complete pairs";
    }
    return e;
  }

  async function submit(publishNow) {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); setBanner({ kind: "error", text: "Please fix the highlighted fields." }); return; }
    setErrors({}); setLoading(true); setBanner(null);
    try {
      const data = {
        gradeId: form.gradeId, subjectId: form.subjectId, lessonId: form.lessonId || null,
        type: form.type, difficulty: form.difficulty, prompt: form.prompt.trim(),
        payload: buildPayload(), explanation: form.explanation.trim() || null,
        status: publishNow ? "active" : "draft",
      };
      if (editingQuestion) await updateQuestion(editingQuestion.id, data);
      else await createQuestion(data);
      setBanner({ kind: "ok", text: editingQuestion ? "Question updated." : "Question saved." });
      if (onSuccess) onSuccess();
    } catch (err) {
      setBanner({ kind: "error", text: err.message || "Failed to save question." });
    } finally { setLoading(false); }
  }

  const th = T.green;

  return (
    <div>
      {/* Context row — grade / subject / lesson, compact 3-up */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <Select label="Grade" required value={form.gradeId} onChange={set("gradeId")} disabled={loading || loadingSyllabus} error={errors.gradeId}>
          {loadingSyllabus ? <option value="">Loading…</option> : <>
            <option value="">Select grade</option>
            {grades.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </>}
        </Select>
        <Select label="Subject" required value={form.subjectId} onChange={set("subjectId")} disabled={loading || !form.gradeId} error={errors.subjectId}>
          {!form.gradeId ? <option value="">Pick grade first</option>
            : filteredSubjects.length === 0 ? <option value="">No subjects</option>
            : <>
              <option value="">Select subject</option>
              {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </>}
        </Select>
        <Select label="Lesson" value={form.lessonId} onChange={set("lessonId")} disabled={loading || !form.subjectId}>
          {!form.subjectId ? <option value="">Pick subject first</option>
            : filteredLessons.length === 0 ? <option value="">No lessons</option>
            : <>
              <option value="">No specific lesson</option>
              {/* FIX: lessons use `title`, not `name` — this is why the dropdown was blank */}
              {filteredLessons.map((l) => <option key={l.id} value={l.id}>{l.n ? `${l.n}. ` : ""}{l.title}</option>)}
            </>}
        </Select>
      </div>

      {/* Type + difficulty */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Select label="Question type" value={form.type} onChange={set("type")} disabled={loading}>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </Select>
        <Select label="Difficulty" value={form.difficulty} onChange={set("difficulty")} disabled={loading}>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>
      </div>

      <Textarea label="Question" required value={form.prompt} onChange={set("prompt")}
        placeholder="e.g. What does the quality Qadeem mean?" error={errors.prompt} disabled={loading} />

      {/* ---------- Answer area (type-specific) ---------- */}
      {form.type === "multiple-choice" && (
        <Field label="Options — tick the correct one" required error={errors.options}>
          <div style={{ display: "grid", gap: 8 }}>
            {options.map((opt, i) => {
              const isCorrect = correctIndex === i;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button type="button" onClick={() => setCorrectIndex(i)} title="Mark correct"
                    style={{
                      flexShrink: 0, width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${isCorrect ? T.green : T.line}`,
                      background: isCorrect ? T.green : T.card, color: "#fff",
                      display: "grid", placeItems: "center",
                    }}>
                    {isCorrect && <Check size={17} />}
                  </button>
                  <input value={opt} onChange={setOption(i)} placeholder={`Option ${i + 1}`} disabled={loading}
                    style={{ ...fieldStyle, flex: 1, borderColor: isCorrect ? T.green : T.line, background: isCorrect ? T.greenSoft : "#fff" }} />
                  {options.length > 2 && (
                    <button type="button" onClick={() => removeOption(i)} title="Remove"
                      style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${T.line}`, background: T.card, color: T.faint, cursor: "pointer", display: "grid", placeItems: "center" }}>
                      <X size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {options.length < 6 && (
            <Btn variant="ghost" icon={<Plus size={15} />} onClick={addOption} style={{ marginTop: 8, width: "100%" }}>Add option</Btn>
          )}
        </Field>
      )}

      {form.type === "true-false" && (
        <Field label="Correct answer" required error={errors.answer}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[{ v: true, l: "True" }, { v: false, l: "False" }].map(({ v, l }) => {
              const sel = tfAnswer === v;
              return (
                <button key={l} type="button" onClick={() => setTfAnswer(v)} disabled={loading}
                  style={{
                    padding: "16px 0", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer",
                    border: `1.5px solid ${sel ? T.green : T.line}`, background: sel ? T.greenSoft : T.card, color: T.ink,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                  {sel && <Check size={18} color={T.green} />}{l}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      {form.type === "fill-blank" && (
        <>
          <Field label="Correct answer" required error={errors.answer}>
            <Input value={fillAnswer} onChange={(e) => setFillAnswer(e.target.value)} disabled={loading}
              placeholder="The exact word/phrase that fills the blank" />
          </Field>
          <Field label="Also accept (optional alternative spellings)">
            <ChipInput values={fillAlso} onChange={setFillAlso} placeholder="Type an alternative and press Enter" disabled={loading} />
          </Field>
        </>
      )}

      {form.type === "short-answer" && (
        <Field label="Accepted answers — students match any of these" required error={errors.answer}>
          <div style={{ display: "flex", gap: 8 }}>
            <Input value={acceptedDraft} onChange={(e) => setAcceptedDraft(e.target.value)} disabled={loading}
              placeholder="Type an accepted answer and press Enter"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAccepted(); } }} style={{ flex: 1 }} />
            <Btn variant="secondary" icon={<Plus size={15} />} onClick={addAccepted}>Add</Btn>
          </div>
          {accepted.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
              {accepted.map((a, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.greenSoft, color: T.green, borderRadius: 99, padding: "5px 10px", fontSize: 13, fontWeight: 600 }}>
                  {a}
                  <X size={13} style={{ cursor: "pointer" }} onClick={() => setAccepted(accepted.filter((_, idx) => idx !== i))} />
                </span>
              ))}
            </div>
          )}
        </Field>
      )}

      {form.type === "match" && (
        <Field label="Pairs — left matches right" required error={errors.answer}>
          <div style={{ display: "grid", gap: 8 }}>
            {pairs.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input value={p.left} onChange={setPair(i, "left")} placeholder="Term" disabled={loading} style={{ ...fieldStyle, flex: 1 }} />
                <span style={{ color: T.faint, fontWeight: 700 }}>→</span>
                <input value={p.right} onChange={setPair(i, "right")} placeholder="Meaning" disabled={loading} style={{ ...fieldStyle, flex: 1 }} />
                {pairs.length > 2 && (
                  <button type="button" onClick={() => removePair(i)} style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 8, border: `1.5px solid ${T.line}`, background: T.card, color: T.faint, cursor: "pointer", display: "grid", placeItems: "center" }}>
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <Btn variant="ghost" icon={<Plus size={15} />} onClick={addPair} style={{ marginTop: 8, width: "100%" }}>Add pair</Btn>
        </Field>
      )}

      <Textarea label="Explanation (optional, shown after answering)" value={form.explanation}
        onChange={set("explanation")} placeholder="Why is this the answer?" disabled={loading} />

      {banner && (
        <div style={{
          background: banner.kind === "ok" ? "#DCFCE7" : T.dangerSoft, color: banner.kind === "ok" ? "#16A34A" : T.danger,
          padding: "10px 12px", borderRadius: 8, marginBottom: 14, fontSize: 13.5, fontWeight: 600,
        }}>{banner.text}</div>
      )}

      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <Btn variant="secondary" icon={<Save size={16} />} onClick={() => submit(false)} disabled={loading} style={{ flex: 1 }}>
          {loading ? "Saving…" : "Save as draft"}
        </Btn>
        <Btn variant="primary" icon={<Check size={16} />} onClick={() => submit(true)} disabled={loading} style={{ flex: 1 }}>
          {loading ? "Saving…" : editingQuestion ? "Update & publish" : "Publish now"}
        </Btn>
      </div>
    </div>
  );
}

// Small reusable chip input (Enter to add)
function ChipInput({ values, onChange, placeholder, disabled }) {
  const [draft, setDraft] = useState("");
  const add = () => { const v = draft.trim(); if (v && !values.includes(v)) onChange([...values, v]); setDraft(""); };
  return (
    <div>
      <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} disabled={disabled}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} style={fieldStyle} />
      {values.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          {values.map((v, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.paper2, color: T.ink, borderRadius: 99, padding: "5px 10px", fontSize: 13 }}>
              {v}<X size={13} style={{ cursor: "pointer" }} onClick={() => onChange(values.filter((_, idx) => idx !== i))} />
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
