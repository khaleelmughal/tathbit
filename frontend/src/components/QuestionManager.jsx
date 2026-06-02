import React, { useState, useEffect } from "react";
import { getQuestions, updateQuestionStatus, createQuestion, deleteQuestion } from "../lib/api";
import { List, Eye, EyeOff, Edit, Trash2, Plus, HelpCircle, Search, Filter, MoreVertical, BookOpen, Users, BarChart3 } from "lucide-react";
import { LoadingCard } from "./Loading";
import EmptyState from "./EmptyState";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
  red: "#DC2626", redSoft: "#FEF2F2", blue: "#2563EB", blueSoft: "#EFF6FF"
};

const Card = ({ children, style = {}, className = "" }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.line}`,
    borderRadius: "16px", overflow: "hidden", ...style
  }} className={className}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "outline", type = "button", style = {}, icon, loading, size = "md" }) => {
  const sizes = {
    sm: { padding: "6px 12px", fontSize: "12px" },
    md: { padding: "8px 16px", fontSize: "14px" },
    lg: { padding: "12px 24px", fontSize: "16px" }
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        background: variant === "primary" ? T.green : variant === "danger" ? T.red : "transparent",
        color: variant === "primary" || variant === "danger" ? "white" : T.ink,
        border: variant === "primary" || variant === "danger" ? "none" : `1px solid ${T.line}`,
        borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "600", opacity: disabled ? 0.6 : 1,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        display: "flex", alignItems: "center", gap: "6px",
        transition: "all 0.2s ease",
        ...sizes[size],
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = "translateY(0)";
        e.target.style.boxShadow = "none";
      }}
    >
      {loading ? (
        <div style={{
          width: "16px", height: "16px", border: "2px solid currentColor",
          borderTop: "2px solid transparent", borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
      ) : icon}
      {children}
    </button>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusStyle = () => {
    switch (status) {
      case "active": return { bg: "#DCFCE7", color: "#16A34A", icon: "🟢" };
      case "draft": return { bg: "#FEF3C7", color: "#92400E", icon: "📝" };
      default: return { bg: T.line, color: T.faint, icon: "❓" };
    }
  };

  const styles = getStatusStyle();
  
  return (
    <span style={{
      background: styles.bg, color: styles.color,
      padding: "4px 12px", borderRadius: "12px",
      fontSize: "12px", fontWeight: "600",
      textTransform: "capitalize", display: "inline-flex",
      alignItems: "center", gap: "4px"
    }}>
      <span>{styles.icon}</span>
      {status}
    </span>
  );
};

const DifficultyBadge = ({ difficulty }) => {
  const getStyle = () => {
    switch (difficulty) {
      case "easy": return { color: "#16A34A", bg: "#F0FDF4", icon: "🟢" };
      case "medium": return { color: "#D97706", bg: "#FFFBEB", icon: "🟡" };
      case "hard": return { color: "#DC2626", bg: "#FEF2F2", icon: "🔴" };
      default: return { color: T.faint, bg: T.line, icon: "⚪" };
    }
  };

  const styles = getStyle();

  return (
    <span style={{
      color: styles.color, background: styles.bg,
      padding: "4px 8px", borderRadius: "12px",
      fontSize: "11px", fontWeight: "600",
      textTransform: "capitalize", display: "inline-flex",
      alignItems: "center", gap: "4px"
    }}>
      <span>{styles.icon}</span>
      {difficulty}
    </span>
  );
};

const SubjectBadge = ({ subjectId }) => {
  const getSubjectStyle = (id) => {
    const colors = ["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444"];
    const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const color = colors[index];
    return { color, bg: color + "15" };
  };

  const styles = getSubjectStyle(subjectId);

  return (
    <span style={{
      background: styles.bg, color: styles.color,
      padding: "4px 10px", borderRadius: "12px",
      fontSize: "11px", fontWeight: "600"
    }}>
      {subjectId.replace(/^g\d+-/, '').toUpperCase()}
    </span>
  );
};

const QuestionCard = ({ question, onStatusChange, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatusToggle = async () => {
    setUpdating(true);
    try {
      const newStatus = question.status === "active" ? "draft" : "active";
      await updateQuestionStatus(question.id, newStatus);
      onStatusChange();
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(question.id);
    } catch (err) {
      console.error("Failed to delete question:", err);
    } finally {
      setDeleting(false);
    }
  };

  const formatPayload = () => {
    switch (question.type) {
      case "multiple-choice":
        return (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", color: T.ink2, marginBottom: "8px", fontWeight: "600" }}>
              Multiple Choice Options:
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {question.payload?.options?.map((option, index) => (
                <div key={index} style={{ 
                  padding: "8px 12px", background: option === question.payload?.correctAnswer ? T.greenSoft : T.paper2,
                  border: option === question.payload?.correctAnswer ? `2px solid ${T.green}` : `1px solid ${T.line}`,
                  borderRadius: "8px", fontSize: "14px",
                  color: option === question.payload?.correctAnswer ? T.green : T.ink,
                  fontWeight: option === question.payload?.correctAnswer ? "600" : "normal"
                }}>
                  <span style={{ marginRight: "8px" }}>{String.fromCharCode(65 + index)}.</span>
                  {option}
                  {option === question.payload?.correctAnswer && (
                    <span style={{ float: "right", color: T.green }}>✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      case "true-false":
        return (
          <div style={{ marginTop: "12px", padding: "12px", background: T.greenSoft, borderRadius: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: "600", color: T.green }}>
              Correct Answer: {question.payload?.correctAnswer ? "True" : "False"}
            </span>
          </div>
        );
      case "fill-blank":
      case "short-answer":
        const answers = question.type === "fill-blank" 
          ? [question.payload?.correctAnswer] 
          : question.payload?.acceptedAnswers || [];
        return (
          <div style={{ marginTop: "12px" }}>
            <div style={{ fontSize: "12px", color: T.ink2, marginBottom: "8px", fontWeight: "600" }}>
              {question.type === "fill-blank" ? "Correct Answer:" : "Accepted Answers:"}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {answers.filter(Boolean).map((answer, index) => (
                <span key={index} style={{
                  background: T.greenSoft, color: T.green,
                  padding: "4px 10px", borderRadius: "12px",
                  fontSize: "13px", fontWeight: "600"
                }}>
                  {answer}
                </span>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card style={{ 
      marginBottom: "16px", 
      transition: "all 0.2s ease",
      position: "relative"
    }}>
      <div style={{ padding: "24px" }}>
        {/* Header with badges and actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <StatusBadge status={question.status} />
            <SubjectBadge subjectId={question.subject_id} />
            <DifficultyBadge difficulty={question.difficulty} />
            <span style={{
              background: T.blueSoft, color: T.blue,
              padding: "4px 10px", borderRadius: "12px",
              fontSize: "11px", fontWeight: "600"
            }}>
              {question.type.replace("-", " ").toUpperCase()}
            </span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Btn
              onClick={handleStatusToggle}
              disabled={updating}
              loading={updating}
              variant={question.status === "active" ? "outline" : "primary"}
              size="sm"
              icon={question.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
            >
              {question.status === "active" ? "Hide" : "Publish"}
            </Btn>
            
            <div style={{ position: "relative" }}>
              <Btn
                onClick={() => setMenuOpen(!menuOpen)}
                size="sm"
                icon={<MoreVertical size={14} />}
                style={{ padding: "8px" }}
              />
              
              {menuOpen && (
                <div style={{
                  position: "absolute", top: "100%", right: "0", zIndex: 10,
                  background: "white", border: `1px solid ${T.line}`, borderRadius: "8px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)", minWidth: "120px",
                  marginTop: "4px"
                }}>
                  <button
                    onClick={() => { onEdit(question); setMenuOpen(false); }}
                    style={{
                      width: "100%", padding: "8px 12px", border: "none",
                      background: "transparent", color: T.ink, fontSize: "14px",
                      textAlign: "left", cursor: "pointer", display: "flex",
                      alignItems: "center", gap: "8px"
                    }}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      width: "100%", padding: "8px 12px", border: "none",
                      background: "transparent", color: T.red, fontSize: "14px",
                      textAlign: "left", cursor: "pointer", display: "flex",
                      alignItems: "center", gap: "8px", opacity: deleting ? 0.6 : 1
                    }}
                  >
                    <Trash2 size={14} />
                    {deleting ? "Deleting..." : "Delete"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Question prompt */}
        <div style={{
          fontSize: "18px", fontWeight: "600", color: T.ink,
          lineHeight: "1.5", marginBottom: "12px",
          fontFamily: "Fraunces, serif"
        }}>
          {question.prompt}
        </div>

        {/* Answer options/content */}
        {formatPayload()}

        {/* Explanation */}
        {question.explanation && (
          <div style={{ 
            marginTop: "16px", padding: "16px", 
            background: "linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)",
            borderRadius: "12px", border: `1px solid #BAE6FD`
          }}>
            <div style={{ fontSize: "13px", color: T.blue, fontWeight: "600", marginBottom: "8px" }}>
              💡 Explanation
            </div>
            <div style={{ fontSize: "14px", color: T.ink, lineHeight: "1.5" }}>
              {question.explanation}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div style={{ 
          marginTop: "16px", paddingTop: "16px", 
          borderTop: `1px solid ${T.line}`, display: "flex",
          justifyContent: "space-between", alignItems: "center"
        }}>
          <div style={{ fontSize: "12px", color: T.faint }}>
            {question.created_by ? (
              <>👤 Created by you • {new Date(question.created_at).toLocaleDateString()}</>
            ) : (
              <>📚 From curriculum • {question.lesson_id || 'No lesson'}</>
            )}
          </div>
          <div style={{ fontSize: "11px", color: T.faint, fontFamily: "mono" }}>
            ID: {question.id.slice(-8)}
          </div>
        </div>
      </div>
    </Card>
  );
};

const CreateQuestionModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: "multiple-choice",
    prompt: "",
    explanation: "",
    difficulty: "medium",
    gradeId: "g5",
    subjectId: "g5-aqaaid",
    payload: {}
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createQuestion(formData);
      onSuccess();
      onClose();
      setFormData({ type: "multiple-choice", prompt: "", explanation: "", difficulty: "medium", gradeId: "g5", subjectId: "g5-aqaaid", payload: {} });
    } catch (err) {
      console.error("Failed to create question:", err);
      alert("Failed to create question: " + (err.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.5)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <Card style={{ width: "100%", maxWidth: "600px", maxHeight: "90vh", overflow: "auto" }}>
        <div style={{ padding: "24px" }}>
          <h2 style={{ margin: "0 0 20px 0", fontSize: "24px", fontFamily: "Fraunces, serif", color: T.ink }}>
            Create New Question
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
                  Question Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  style={{ width: "100%", padding: "10px", border: `1px solid ${T.line}`, borderRadius: "8px", fontSize: "14px" }}
                  required
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-blank">Fill in the Blank</option>
                  <option value="short-answer">Short Answer</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
                  Question Prompt *
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${T.line}`, borderRadius: "8px", fontSize: "14px", minHeight: "100px", resize: "vertical" }}
                  placeholder="Enter your question here..."
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
                    Difficulty *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                    style={{ width: "100%", padding: "10px", border: `1px solid ${T.line}`, borderRadius: "8px", fontSize: "14px" }}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
                    Subject *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                    style={{ width: "100%", padding: "10px", border: `1px solid ${T.line}`, borderRadius: "8px", fontSize: "14px" }}
                  >
                    <option value="g5-aqaaid">Aqaaid (Beliefs)</option>
                    <option value="g5-fiqh">Fiqh (Islamic Law)</option>
                    <option value="g5-hadeeth">Hadeeth</option>
                    <option value="g5-tareekh">Tareekh (History)</option>
                    <option value="g5-akhlaaq">Akhlaaq (Character)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "6px", color: T.ink }}>
                  Explanation (Optional)
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                  style={{ width: "100%", padding: "12px", border: `1px solid ${T.line}`, borderRadius: "8px", fontSize: "14px", minHeight: "80px", resize: "vertical" }}
                  placeholder="Provide an explanation for the answer..."
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px", paddingTop: "16px", borderTop: `1px solid ${T.line}` }}>
              <Btn onClick={onClose} type="button">
                Cancel
              </Btn>
              <Btn variant="primary" type="submit" loading={saving}>
                Create Question
              </Btn>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default function QuestionManager({ refreshTrigger, isAdmin = false }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [refreshTrigger]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const response = await getQuestions();
      setQuestions(Array.isArray(response) ? response : response.questions || []);
      setError("");
    } catch (err) {
      console.error("Failed to load questions:", err);
      setError(err.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = () => {
    loadQuestions();
  };

  const handleEdit = (question) => {
    // TODO: Implement edit modal
    console.log("Edit question:", question);
  };

  const handleDelete = async (questionId) => {
    try {
      await deleteQuestion(questionId);
      await loadQuestions(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete question:", error);
      alert("Failed to delete question: " + (error.message || "Unknown error"));
      throw error; // Re-throw so the component can handle loading state
    }
  };

  // Filter questions based on all criteria
  const filteredQuestions = questions.filter(q => {
    const matchesStatus = filter === "all" || 
                         (filter === "active" && q.status === "active") ||
                         (filter === "draft" && q.status === "draft") ||
                         (filter === "mine" && q.created_by !== null);
    
    const matchesSearch = !searchTerm || 
                         q.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         q.explanation?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === "all" || q.subject_id === selectedSubject;
    const matchesDifficulty = selectedDifficulty === "all" || q.difficulty === selectedDifficulty;
    
    return matchesStatus && matchesSearch && matchesSubject && matchesDifficulty;
  });

  // Group questions by subject
  const groupedQuestions = filteredQuestions.reduce((acc, q) => {
    if (!acc[q.subject_id]) acc[q.subject_id] = [];
    acc[q.subject_id].push(q);
    return acc;
  }, {});

  // Get unique subjects from all questions
  const availableSubjects = [...new Set(questions.map(q => q.subject_id))].sort();

  // Statistics
  const stats = {
    total: questions.length,
    active: questions.filter(q => q.status === "active").length,
    draft: questions.filter(q => q.status === "draft").length,
    mine: questions.filter(q => q.created_by !== null).length
  };

  if (loading) {
    return <LoadingCard message="Loading questions..." />;
  }

  if (error) {
    return (
      <Card style={{ padding: "24px", textAlign: "center" }}>
        <div style={{ color: T.red, marginBottom: "16px", fontSize: "16px", fontWeight: "600" }}>
          ❌ {error}
        </div>
        <Btn onClick={loadQuestions} variant="primary">
          Retry Loading
        </Btn>
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header with stats */}
      <Card style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "28px", fontFamily: "Fraunces, serif", color: T.ink }}>
              📝 Question Bank
            </h2>
            <p style={{ margin: "8px 0 0 0", color: T.ink2, fontSize: "14px" }}>
              Manage and organize your Islamic studies questions
            </p>
          </div>
          <Btn 
            onClick={() => setShowCreateModal(true)} 
            variant="primary"
            icon={<Plus size={16} />}
          >
            Create Question
          </Btn>
        </div>

        {/* Quick stats */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "16px"
        }}>
          <div style={{ textAlign: "center", padding: "16px", background: T.paper2, borderRadius: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: T.ink }}>{stats.total}</div>
            <div style={{ fontSize: "12px", color: T.faint }}>Total Questions</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#DCFCE7", borderRadius: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#16A34A" }}>{stats.active}</div>
            <div style={{ fontSize: "12px", color: "#15803D" }}>Published</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: "#FEF3C7", borderRadius: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: "#92400E" }}>{stats.draft}</div>
            <div style={{ fontSize: "12px", color: "#92400E" }}>Draft</div>
          </div>
          <div style={{ textAlign: "center", padding: "16px", background: T.blueSoft, borderRadius: "12px" }}>
            <div style={{ fontSize: "24px", fontWeight: "700", color: T.blue }}>{stats.mine}</div>
            <div style={{ fontSize: "12px", color: T.blue }}>Mine</div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card style={{ padding: "24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ 
              position: "absolute", left: "12px", top: "50%", 
              transform: "translateY(-50%)", color: T.faint 
            }} />
            <input
              type="text"
              placeholder="Search questions by text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%", padding: "12px 12px 12px 40px",
                border: `1px solid ${T.line}`, borderRadius: "12px",
                fontSize: "14px", background: T.paper2
              }}
            />
          </div>

          {/* Filter dropdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "10px 12px", border: `1px solid ${T.line}`,
                borderRadius: "8px", fontSize: "14px", background: "white"
              }}
            >
              <option value="all">All Status ({stats.total})</option>
              <option value="active">Published ({stats.active})</option>
              <option value="draft">Draft ({stats.draft})</option>
              <option value="mine">My Questions ({stats.mine})</option>
            </select>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              style={{
                padding: "10px 12px", border: `1px solid ${T.line}`,
                borderRadius: "8px", fontSize: "14px", background: "white"
              }}
            >
              <option value="all">All Subjects</option>
              {availableSubjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject.replace(/^g\d+-/, '').toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: "10px 12px", border: `1px solid ${T.line}`,
                borderRadius: "8px", fontSize: "14px", background: "white"
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <Btn onClick={loadQuestions} icon={<Search size={14} />} size="md">
              Refresh
            </Btn>
          </div>
        </div>
      </Card>

      {/* Questions list */}
      {filteredQuestions.length === 0 ? (
        <EmptyState
          icon={<HelpCircle size={48} color={T.faint} />}
          title="No Questions Found"
          description={
            searchTerm || selectedSubject !== "all" || selectedDifficulty !== "all"
              ? "No questions match your current filters. Try adjusting your search criteria."
              : filter === "mine" 
                ? "You haven't created any questions yet. Click 'Create Question' to get started."
                : "No questions available. Import questions from the curriculum or create new ones."
          }
        />
      ) : (
        <div>
          <div style={{ marginBottom: "16px", padding: "0 4px" }}>
            <h3 style={{ 
              fontSize: "18px", fontWeight: "600", color: T.ink, margin: 0,
              display: "flex", alignItems: "center", gap: "8px"
            }}>
              <List size={18} />
              Questions ({filteredQuestions.length})
            </h3>
          </div>

          {Object.entries(groupedQuestions).map(([subjectId, subjectQuestions]) => (
            <div key={subjectId} style={{ marginBottom: "32px" }}>
              <div style={{
                fontSize: "16px", fontWeight: "700", color: T.ink,
                marginBottom: "16px", padding: "12px 16px",
                background: `linear-gradient(135deg, ${T.greenSoft} 0%, ${T.blueSoft} 100%)`,
                border: `1px solid ${T.line}`, borderRadius: "12px",
                display: "flex", alignItems: "center", gap: "8px"
              }}>
                <BookOpen size={16} />
                {subjectId.replace(/^g\d+-/, '').toUpperCase()} ({subjectQuestions.length} questions)
              </div>
              {subjectQuestions.map(question => (
                <QuestionCard
                  key={question.id}
                  question={question}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      <CreateQuestionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={loadQuestions}
      />

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}