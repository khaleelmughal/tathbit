import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getQuestions, updateQuestionStatus, deleteQuestion, getSyllabus,
} from "../lib/api";
import { lookupFriendlyName } from "../lib/utils";
import AddQuestionForm from "./AddQuestionForm";
import {
  Search, Plus, Edit2, Trash2, Check, X, ChevronLeft, ChevronRight,
  Eye, EyeOff, FileText, AlertCircle,
} from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
  danger: "#C0563B", dangerSoft: "#FBEFEC",
};
const TYPE_LABEL = {
  "multiple-choice": "Multiple choice", "true-false": "True / False",
  "fill-blank": "Fill blank", "short-answer": "Short answer", "match": "Match",
};
const PAGE_SIZE = 20;

const Badge = ({ children, color = T.ink2, bg = T.paper2 }) => (
  <span style={{ background: bg, color, padding: "3px 9px", borderRadius: 99, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>
);

// One compact, self-contained answer summary per type — the answer is always visible.
function AnswerLine({ q }) {
  const p = q.payload || {};
  const wrap = { fontSize: 13, color: T.ink2, marginTop: 8, lineHeight: 1.5 };
  if (q.type === "multiple-choice") {
    return (
      <div style={{ ...wrap, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {(p.options || []).map((o, i) => {
          const correct = o === p.correctAnswer;
          return (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px", borderRadius: 8, fontSize: 12.5,
              border: `1px solid ${correct ? T.green : T.line}`, background: correct ? T.greenSoft : T.card,
              color: correct ? T.green : T.ink2, fontWeight: correct ? 700 : 500,
            }}>{correct && <Check size={13} />}{o}</span>
          );
        })}
      </div>
    );
  }
  if (q.type === "true-false")
    return <div style={wrap}>Answer: <b style={{ color: T.green }}>{p.correctAnswer ? "True" : "False"}</b></div>;
  if (q.type === "fill-blank")
    return <div style={wrap}>Answer: <b style={{ color: T.green }}>{p.correctAnswer}</b>{p.acceptedAnswers?.length ? <span style={{ color: T.faint }}> (also: {p.acceptedAnswers.join(", ")})</span> : null}</div>;
  if (q.type === "short-answer")
    return <div style={wrap}>Accepts: <b style={{ color: T.green }}>{(p.acceptedAnswers || []).join(", ")}</b></div>;
  if (q.type === "match")
    return <div style={wrap}>{(p.pairs || []).map((pr, i) => <span key={i}>{pr.left} → <b style={{ color: T.green }}>{pr.right}</b>{i < p.pairs.length - 1 ? "  ·  " : ""}</span>)}</div>;
  return null;
}

function Row({ q, syllabus, onEdit, onDelete, onToggle, busy }) {
  const subjectName = lookupFriendlyName(q.subject_id, syllabus.grades, syllabus.subjects, syllabus.lessons);
  const active = q.status === "active";
  return (
    <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: "16px 18px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6, alignItems: "center" }}>
            <Badge color={active ? T.green : T.gold} bg={active ? T.greenSoft : "#F6EFD6"}>{active ? "Active" : "Draft"}</Badge>
            <Badge>{subjectName}</Badge>
            <Badge color="#6D5BD0" bg="#ECE9FB">{TYPE_LABEL[q.type] || q.type}</Badge>
            <Badge color={q.difficulty === "hard" ? T.danger : q.difficulty === "medium" ? "#D97706" : T.green}
              bg={q.difficulty === "hard" ? T.dangerSoft : q.difficulty === "medium" ? "#FFFBEB" : T.greenSoft}>{q.difficulty}</Badge>
          </div>
          <div style={{ fontSize: 15, color: T.ink, fontWeight: 600, lineHeight: 1.4 }}>{q.prompt}</div>
          <AnswerLine q={q} />
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <IconBtn title={active ? "Unpublish" : "Publish"} onClick={() => onToggle(q)} disabled={busy}>
            {active ? <EyeOff size={16} /> : <Eye size={16} />}
          </IconBtn>
          <IconBtn title="Edit" onClick={() => onEdit(q)} disabled={busy}><Edit2 size={16} /></IconBtn>
          <IconBtn title="Delete" danger onClick={() => onDelete(q)} disabled={busy}><Trash2 size={16} /></IconBtn>
        </div>
      </div>
    </div>
  );
}
const IconBtn = ({ children, onClick, title, danger, disabled }) => (
  <button title={title} onClick={onClick} disabled={disabled}
    style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${T.line}`, background: T.card,
      color: danger ? T.danger : T.ink2, cursor: disabled ? "not-allowed" : "pointer", display: "grid", placeItems: "center", opacity: disabled ? 0.5 : 1 }}>
    {children}
  </button>
);

const selectStyle = { padding: "9px 12px", border: `1.5px solid ${T.line}`, borderRadius: 9, fontSize: 13.5, background: T.card, color: T.ink, cursor: "pointer", fontFamily: "inherit" };

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,26,23,.45)", zIndex: 1000, display: "grid", placeItems: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: T.paper, borderRadius: 18, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px", borderBottom: `1px solid ${T.line}`, flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontFamily: "Fraunces, serif", fontSize: 20, color: T.ink }}>{title}</h2>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", color: T.ink2 }}><X size={22} /></button>
        </div>
        <div style={{ padding: "20px 22px", overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}

export default function QuestionManager({ refreshTrigger, isAdmin = false }) {
  const [data, setData] = useState({ questions: [], total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syllabus, setSyllabus] = useState({ grades: [], subjects: [], lessons: [] });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [subjectId, setSubjectId] = useState("all");
  const [type, setType] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  // Debounce the search box → query.
  const debounce = useRef();
  useEffect(() => {
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(debounce.current);
  }, [searchInput]);

  useEffect(() => { getSyllabus().then(setSyllabus).catch(() => {}); }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true); setError("");
      const r = await getQuestions({ page, pageSize: PAGE_SIZE, search, status, subjectId, type, difficulty, mine: !isAdmin });
      setData(r);
    } catch (e) { setError(e.message || "Failed to load questions"); }
    finally { setLoading(false); }
  }, [page, search, status, subjectId, type, difficulty, isAdmin]);

  useEffect(() => { load(); }, [load, refreshTrigger]);
  useEffect(() => { setPage(1); }, [status, subjectId, type, difficulty]);

  const subjectsForGrade = syllabus.subjects || [];

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (q) => { setEditing(q); setModalOpen(true); };
  const onSuccess = () => { setModalOpen(false); setEditing(null); load(); };

  const toggle = async (q) => {
    setBusyId(q.id);
    try { await updateQuestionStatus(q.id, q.status === "active" ? "draft" : "active"); await load(); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  };
  const remove = async (q) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) return;
    setBusyId(q.id);
    try { await deleteQuestion(q.id); await load(); }
    catch (e) { setError(e.message); } finally { setBusyId(null); }
  };

  const start = data.total === 0 ? 0 : (data.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(data.page * PAGE_SIZE, data.total);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontFamily: "Fraunces, serif", fontSize: 26, color: T.ink, margin: 0 }}>Question Bank</h1>
          <p style={{ color: T.ink2, margin: "4px 0 0", fontSize: 14 }}>{data.total} questions{search || status !== "all" || subjectId !== "all" || type !== "all" || difficulty !== "all" ? " match your filters" : ""}</p>
        </div>
        <button onClick={openCreate} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: T.green, color: "#fff", border: "none", borderRadius: 10, padding: "12px 18px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
          <Plus size={18} /> Add question
        </button>
      </div>

      {/* Search + filters */}
      <div style={{ background: T.card, border: `1px solid ${T.line}`, borderRadius: 14, padding: 14, marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 260px" }}>
          <Search size={17} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.faint }} />
          <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search question text…"
            style={{ width: "100%", padding: "10px 12px 10px 38px", border: `1.5px solid ${T.line}`, borderRadius: 9, fontSize: 14, boxSizing: "border-box", color: T.ink, background: T.card }} />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="all">All status</option><option value="active">Active</option><option value="draft">Draft</option>
        </select>
        <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={selectStyle}>
          <option value="all">All subjects</option>
          {subjectsForGrade.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={selectStyle}>
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} style={selectStyle}>
          <option value="all">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
      </div>

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.dangerSoft, color: T.danger, padding: "10px 14px", borderRadius: 10, marginBottom: 14, fontSize: 14 }}>
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 50, color: T.ink2 }}>Loading…</div>
      ) : data.questions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.ink2, background: T.card, border: `1px dashed ${T.line}`, borderRadius: 14 }}>
          <FileText size={36} color={T.faint} style={{ marginBottom: 10 }} />
          <p style={{ margin: 0 }}>No questions match. Try clearing filters or add a new one.</p>
        </div>
      ) : (
        <>
          {data.questions.map((q) => (
            <Row key={q.id} q={q} syllabus={syllabus} onEdit={openEdit} onDelete={remove} onToggle={toggle} busy={busyId === q.id} />
          ))}
          {/* Pagination */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18, flexWrap: "wrap", gap: 10 }}>
            <span style={{ color: T.ink2, fontSize: 13.5 }}>Showing {start}–{end} of {data.total}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <PageBtn disabled={data.page <= 1} onClick={() => setPage(data.page - 1)}><ChevronLeft size={16} /> Prev</PageBtn>
              <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>Page {data.page} / {data.totalPages}</span>
              <PageBtn disabled={data.page >= data.totalPages} onClick={() => setPage(data.page + 1)}>Next <ChevronRight size={16} /></PageBtn>
            </div>
          </div>
        </>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} title={editing ? "Edit question" : "New question"}>
        <AddQuestionForm editingQuestion={editing} onSuccess={onSuccess} />
      </Modal>
    </div>
  );
}

const PageBtn = ({ children, onClick, disabled }) => (
  <button onClick={onClick} disabled={disabled}
    style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "8px 14px", borderRadius: 9, border: `1.5px solid ${T.line}`, background: disabled ? T.paper2 : T.card, color: disabled ? T.faint : T.ink, cursor: disabled ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 600 }}>
    {children}
  </button>
);
