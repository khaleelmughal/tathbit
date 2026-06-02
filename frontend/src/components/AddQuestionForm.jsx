import React, { useState, useEffect } from "react";
import { createQuestion, updateQuestion, getSyllabus } from "../lib/api";
import { Plus, Save, Edit } from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.card, 
    border: `1px solid ${T.line}`,
    borderRadius: "16px", 
    padding: "32px", 
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    ...style
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "primary", type = "button", style = {}, icon }) => {
  const baseStyles = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "14px 20px",
    borderRadius: "10px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "600",
    fontFamily: "Plus Jakarta Sans, sans-serif",
    border: "none",
    transition: "all 0.2s ease",
    minHeight: "48px",
    textAlign: "center",
    opacity: disabled ? 0.6 : 1,
    boxShadow: disabled ? "none" : "0 2px 4px rgba(0,0,0,0.05)",
    ...style
  };

  const variantStyles = {
    primary: {
      background: `linear-gradient(135deg, ${T.green} 0%, #166e47 100%)`,
      color: "white",
      boxShadow: disabled ? "none" : "0 4px 12px rgba(30,122,87,0.3)"
    },
    secondary: {
      background: T.card,
      color: T.ink,
      border: `2px solid ${T.line}`,
      boxShadow: disabled ? "none" : "0 2px 8px rgba(0,0,0,0.08)"
    },
    outline: {
      background: "transparent",
      color: T.green,
      border: `2px solid ${T.green}`,
      boxShadow: "none"
    }
  };

  const finalStyles = { ...baseStyles, ...variantStyles[variant] };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={finalStyles}
      onMouseEnter={(e) => {
        if (!disabled && variant === "primary") {
          e.target.style.transform = "translateY(-1px)";
          e.target.style.boxShadow = "0 6px 20px rgba(30,122,87,0.4)";
        } else if (!disabled && variant === "secondary") {
          e.target.style.borderColor = T.green;
          e.target.style.color = T.green;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.transform = "translateY(0)";
          if (variant === "primary") {
            e.target.style.boxShadow = "0 4px 12px rgba(30,122,87,0.3)";
          } else if (variant === "secondary") {
            e.target.style.borderColor = T.line;
            e.target.style.color = T.ink;
          }
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
};

const Input = ({ label, error, ...props }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{
      display: "block",
      color: error ? "#DC2626" : T.ink,
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px"
    }}>
      {label}
      {props.required && <span style={{ color: "#DC2626", marginLeft: "4px" }}>*</span>}
    </label>
    <input
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        border: `2px solid ${error ? "#DC2626" : T.line}`,
        borderRadius: "10px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
        ...props.style
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = T.green;
          e.target.style.boxShadow = `0 0 0 3px ${T.greenSoft}`;
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = T.line;
          e.target.style.boxShadow = "none";
        }
      }}
    />
    {error && (
      <div style={{
        color: "#DC2626",
        fontSize: "12px",
        marginTop: "4px",
        fontWeight: "500"
      }}>
        {error}
      </div>
    )}
  </div>
);

const Textarea = ({ label, error, ...props }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{
      display: "block",
      color: error ? "#DC2626" : T.ink,
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px"
    }}>
      {label}
      {props.required && <span style={{ color: "#DC2626", marginLeft: "4px" }}>*</span>}
    </label>
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        border: `2px solid ${error ? "#DC2626" : T.line}`,
        borderRadius: "10px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        minHeight: "100px",
        resize: "vertical",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
        ...props.style
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = T.green;
          e.target.style.boxShadow = `0 0 0 3px ${T.greenSoft}`;
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = T.line;
          e.target.style.boxShadow = "none";
        }
      }}
    />
    {error && (
      <div style={{
        color: "#DC2626",
        fontSize: "12px",
        marginTop: "4px",
        fontWeight: "500"
      }}>
        {error}
      </div>
    )}
  </div>
);

const Select = ({ label, error, children, ...props }) => (
  <div style={{ marginBottom: "20px" }}>
    <label style={{
      display: "block",
      color: error ? "#DC2626" : T.ink,
      fontSize: "14px",
      fontWeight: "600",
      marginBottom: "8px"
    }}>
      {label}
      {props.required && <span style={{ color: "#DC2626", marginLeft: "4px" }}>*</span>}
    </label>
    <select
      {...props}
      style={{
        width: "100%",
        padding: "14px 16px",
        border: `2px solid ${error ? "#DC2626" : T.line}`,
        borderRadius: "10px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        boxSizing: "border-box",
        cursor: "pointer",
        ...props.style
      }}
      onFocus={(e) => {
        if (!error) {
          e.target.style.borderColor = T.green;
          e.target.style.boxShadow = `0 0 0 3px ${T.greenSoft}`;
        }
      }}
      onBlur={(e) => {
        if (!error) {
          e.target.style.borderColor = T.line;
          e.target.style.boxShadow = "none";
        }
      }}
    >
      {children}
    </select>
    {error && (
      <div style={{
        color: "#DC2626",
        fontSize: "12px",
        marginTop: "4px",
        fontWeight: "500"
      }}>
        {error}
      </div>
    )}
  </div>
);

export default function AddQuestionForm({ onSuccess, editingQuestion }) {
  const [formData, setFormData] = useState({
    gradeId: "",
    subjectId: "",
    lessonId: "",
    type: "multiple-choice",
    difficulty: "easy",
    prompt: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    acceptedAnswers: "",
    explanation: "",
    status: "draft"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loadingSyllabus, setLoadingSyllabus] = useState(true);

  useEffect(() => {
    loadSyllabus();
  }, []);

  useEffect(() => {
    if (editingQuestion) {
      // Pre-populate form with existing question data
      setFormData({
        gradeId: editingQuestion.grade_id || "",
        subjectId: editingQuestion.subject_id || "",
        lessonId: editingQuestion.lesson_id || "",
        type: editingQuestion.type || "multiple-choice",
        difficulty: editingQuestion.difficulty || "easy",
        prompt: editingQuestion.prompt || "",
        options: editingQuestion.payload?.options || ["", "", "", ""],
        correctAnswer: editingQuestion.payload?.correctAnswer || "",
        acceptedAnswers: editingQuestion.payload?.acceptedAnswers?.join(", ") || "",
        explanation: editingQuestion.explanation || "",
        status: editingQuestion.status || "draft"
      });
    }
  }, [editingQuestion]);

  const loadSyllabus = async () => {
    try {
      setLoadingSyllabus(true);
      const response = await getSyllabus();
      const sortedGrades = response.grades.sort((a, b) => a.position - b.position);
      setGrades(sortedGrades);
      setSubjects(response.subjects || []);
      setLessons(response.lessons || []);
    } catch (error) {
      console.error('Failed to load syllabus:', error);
    } finally {
      setLoadingSyllabus(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Cascading logic
      if (field === "gradeId") {
        updated.subjectId = "";
        updated.lessonId = "";
      } else if (field === "subjectId") {
        updated.lessonId = "";
      }
      
      return updated;
    });
    setError("");
    setFieldErrors({});
  };

  // Filter subjects and lessons based on selections
  const filteredSubjects = subjects.filter(subject => subject.grade_id === formData.gradeId);
  const filteredLessons = lessons.filter(lesson => lesson.subject_id === formData.subjectId);

  const handleOptionChange = (index) => (e) => {
    const newOptions = [...formData.options];
    newOptions[index] = e.target.value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const buildPayload = () => {
    switch (formData.type) {
      case "multiple-choice":
        return {
          options: formData.options.filter(opt => opt.trim()),
          correctAnswer: formData.correctAnswer.trim()
        };
      case "true-false":
        return {
          correctAnswer: formData.correctAnswer.toLowerCase() === "true"
        };
      case "fill-blank":
        return {
          correctAnswer: formData.correctAnswer.trim()
        };
      case "short-answer":
        return {
          acceptedAnswers: formData.acceptedAnswers.split(",").map(a => a.trim().toLowerCase()).filter(Boolean)
        };
      case "match":
        return {
          pairs: []
        };
      default:
        return {};
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.gradeId) {
      errors.gradeId = "Please select a grade";
    }
    
    if (!formData.subjectId) {
      errors.subjectId = "Please select a subject";
    }
    
    if (!formData.prompt.trim()) {
      errors.prompt = "Please enter a question prompt";
    }

    if (formData.type === "multiple-choice") {
      const validOptions = formData.options.filter(opt => opt.trim()).length;
      if (validOptions < 2) {
        errors.options = "Please provide at least 2 options for multiple choice questions";
      }
      if (!formData.correctAnswer.trim()) {
        errors.correctAnswer = "Please specify the correct answer";
      }
    } else if (formData.type === "true-false") {
      if (!formData.correctAnswer.trim()) {
        errors.correctAnswer = "Please specify true or false as the correct answer";
      }
    } else if (formData.type === "fill-blank") {
      if (!formData.correctAnswer.trim()) {
        errors.correctAnswer = "Please specify the correct answer";
      }
    } else if (formData.type === "short-answer") {
      if (!formData.acceptedAnswers.trim()) {
        errors.acceptedAnswers = "Please specify accepted answers (comma separated)";
      }
    }

    return errors;
  };

  const handleSubmit = async (e, publishNow = false) => {
    e.preventDefault();
    
    const errors = validateForm();
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError("Please fix the errors above before submitting");
      return;
    }
    
    setFieldErrors({});
    setLoading(true);
    setError("");

    try {
      const questionData = {
        gradeId: formData.gradeId,
        subjectId: formData.subjectId,
        lessonId: formData.lessonId || null,
        type: formData.type,
        difficulty: formData.difficulty,
        prompt: formData.prompt.trim(),
        payload: buildPayload(),
        explanation: formData.explanation.trim() || null,
        status: publishNow ? "active" : "draft"
      };

      if (editingQuestion) {
        await updateQuestion(editingQuestion.id, questionData);
      } else {
        await createQuestion(questionData);
      }
      setSuccess(true);
      
      // Reset form
      setFormData({
        gradeId: "",
        subjectId: "",
        lessonId: "",
        type: "multiple-choice",
        difficulty: "easy",
        prompt: "",
        options: ["", "", "", ""],
        correctAnswer: "",
        acceptedAnswers: "",
        explanation: "",
        status: "draft"
      });

      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to create question");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 style={{
        fontSize: "20px",
        fontFamily: "Fraunces, serif",
        color: T.ink,
        marginTop: 0,
        marginBottom: "20px"
      }}>
        {editingQuestion ? (
          <>
            <Edit size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Edit Question
          </>
        ) : (
          <>
            <Plus size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
            Add Question
          </>
        )}
      </h2>

      <form>
        <Select
          label="Grade"
          value={formData.gradeId}
          onChange={handleChange("gradeId")}
          disabled={loading || loadingSyllabus}
          required
          error={fieldErrors.gradeId}
        >
          {loadingSyllabus ? (
            <option value="">Loading grades...</option>
          ) : grades.length === 0 ? (
            <option value="">No grades available</option>
          ) : (
            <>
              <option value="">Select a grade</option>
              {grades.map((grade) => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </>
          )}
        </Select>

        <Select
          label="Subject"
          value={formData.subjectId}
          onChange={handleChange("subjectId")}
          disabled={loading || !formData.gradeId}
          required
          error={fieldErrors.subjectId}
        >
          {!formData.gradeId ? (
            <option value="">Select a grade first</option>
          ) : filteredSubjects.length === 0 ? (
            <option value="">No subjects available for this grade</option>
          ) : (
            <>
              <option value="">Select a subject</option>
              {filteredSubjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </>
          )}
        </Select>

        <Select
          label="Lesson (optional)"
          value={formData.lessonId}
          onChange={handleChange("lessonId")}
          disabled={loading || !formData.subjectId}
        >
          {!formData.subjectId ? (
            <option value="">Select a subject first</option>
          ) : filteredLessons.length === 0 ? (
            <option value="">No lessons available for this subject</option>
          ) : (
            <>
              <option value="">No specific lesson</option>
              {filteredLessons.map((lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.name}
                </option>
              ))}
            </>
          )}
        </Select>

        <Select
          label="Question Type"
          value={formData.type}
          onChange={handleChange("type")}
          disabled={loading}
        >
          <option value="multiple-choice">Multiple Choice</option>
          <option value="true-false">True/False</option>
          <option value="fill-blank">Fill in the Blank</option>
          <option value="short-answer">Short Answer</option>
        </Select>

        <Select
          label="Difficulty"
          value={formData.difficulty}
          onChange={handleChange("difficulty")}
          disabled={loading}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </Select>

        <Textarea
          label="Question"
          value={formData.prompt}
          onChange={handleChange("prompt")}
          placeholder="Enter your question here..."
          disabled={loading}
          required
          error={fieldErrors.prompt}
        />

        {formData.type === "multiple-choice" && (
          <>
            <label style={{
              display: "block",
              color: fieldErrors.options ? "#DC2626" : T.ink,
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "8px"
            }}>
              Options *
            </label>
            {formData.options.map((option, index) => (
              <Input
                key={index}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={handleOptionChange(index)}
                disabled={loading}
                style={{ marginBottom: "8px" }}
                error={fieldErrors.options && index < 2 ? fieldErrors.options : null}
              />
            ))}
            {fieldErrors.options && (
              <div style={{
                color: "#DC2626",
                fontSize: "12px",
                marginTop: "-12px",
                marginBottom: "20px",
                fontWeight: "500"
              }}>
                {fieldErrors.options}
              </div>
            )}
          </>
        )}

        {formData.type === "multiple-choice" && (
          <Input
            label="Correct Answer"
            value={formData.correctAnswer}
            onChange={handleChange("correctAnswer")}
            placeholder="Enter the exact text of the correct option"
            disabled={loading}
            required
            error={fieldErrors.correctAnswer}
          />
        )}

        {formData.type === "true-false" && (
          <Select
            label="Correct Answer"
            value={formData.correctAnswer}
            onChange={handleChange("correctAnswer")}
            disabled={loading}
            required
            error={fieldErrors.correctAnswer}
          >
            <option value="">Select correct answer</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </Select>
        )}

        {formData.type === "fill-blank" && (
          <Input
            label="Correct Answer"
            value={formData.correctAnswer}
            onChange={handleChange("correctAnswer")}
            placeholder="Enter the word/phrase that fills the blank"
            disabled={loading}
            required
            error={fieldErrors.correctAnswer}
          />
        )}

        {formData.type === "short-answer" && (
          <Input
            label="Accepted Answers"
            value={formData.acceptedAnswers}
            onChange={handleChange("acceptedAnswers")}
            placeholder="Enter accepted answers separated by commas"
            disabled={loading}
            required
            error={fieldErrors.acceptedAnswers}
          />
        )}

        <Textarea
          label="Explanation (optional)"
          value={formData.explanation}
          onChange={handleChange("explanation")}
          placeholder="Explain the answer (shown to students after answering)"
          disabled={loading}
        />

        {error && (
          <div style={{
            background: "#FEE2E2",
            color: "#DC2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#DCFCE7",
            color: "#16A34A",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            {editingQuestion ? "Question updated successfully!" : "Question created successfully!"}
          </div>
        )}

        <div style={{ 
          display: "flex", 
          gap: "16px",
          flexDirection: window.innerWidth < 640 ? "column" : "row",
          marginTop: "32px"
        }}>
          <Btn
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            variant="secondary"
            style={{ 
              flex: 1,
              minWidth: window.innerWidth < 640 ? "100%" : "140px"
            }}
            icon={<Save size={18} />}
          >
            {loading ? "Saving..." : editingQuestion ? "Save as Draft" : "Save as Draft"}
          </Btn>
          <Btn
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            variant="primary"
            style={{ 
              flex: 1,
              minWidth: window.innerWidth < 640 ? "100%" : "140px"
            }}
            icon={loading ? null : <Plus size={18} />}
          >
            {loading ? (editingQuestion ? "Updating..." : "Publishing...") : (editingQuestion ? "Update & Publish" : "Publish Now")}
          </Btn>
        </div>
      </form>
    </Card>
  );
}