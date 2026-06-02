import React, { useState } from "react";
import { createQuestion } from "../lib/api";
import { Plus, Save } from "lucide-react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.line}`,
    borderRadius: "12px", padding: "24px", ...style
  }}>
    {children}
  </div>
);

const Btn = ({ children, onClick, disabled, variant = "primary", type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? T.green : "transparent",
      color: variant === "primary" ? "white" : T.ink,
      border: variant === "primary" ? "none" : `1px solid ${T.line}`,
      padding: "12px 24px", borderRadius: "8px", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px", fontWeight: "500", opacity: disabled ? 0.6 : 1,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      ...style
    }}
  >
    {children}
  </button>
);

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{
      display: "block",
      color: T.ink,
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "6px"
    }}>
      {label}
    </label>
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px",
        border: `1px solid ${T.line}`,
        borderRadius: "8px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        ...props.style
      }}
    />
  </div>
);

const Textarea = ({ label, ...props }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{
      display: "block",
      color: T.ink,
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "6px"
    }}>
      {label}
    </label>
    <textarea
      {...props}
      style={{
        width: "100%",
        padding: "12px",
        border: `1px solid ${T.line}`,
        borderRadius: "8px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        minHeight: "80px",
        resize: "vertical",
        ...props.style
      }}
    />
  </div>
);

const Select = ({ label, children, ...props }) => (
  <div style={{ marginBottom: "16px" }}>
    <label style={{
      display: "block",
      color: T.ink,
      fontSize: "14px",
      fontWeight: "500",
      marginBottom: "6px"
    }}>
      {label}
    </label>
    <select
      {...props}
      style={{
        width: "100%",
        padding: "12px",
        border: `1px solid ${T.line}`,
        borderRadius: "8px",
        fontSize: "16px",
        fontFamily: "Plus Jakarta Sans, sans-serif",
        background: "white",
        color: T.ink,
        ...props.style
      }}
    >
      {children}
    </select>
  </div>
);

export default function AddQuestionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    subjectId: "aqaaid",
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
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

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

  const handleSubmit = async (e, publishNow = false) => {
    e.preventDefault();
    
    if (!formData.prompt.trim()) {
      setError("Please enter a question prompt");
      return;
    }

    if (formData.type === "multiple-choice") {
      const validOptions = formData.options.filter(opt => opt.trim()).length;
      if (validOptions < 2) {
        setError("Please provide at least 2 options for multiple choice questions");
        return;
      }
      if (!formData.correctAnswer.trim()) {
        setError("Please specify the correct answer");
        return;
      }
    } else if (formData.type === "true-false") {
      if (!formData.correctAnswer.trim()) {
        setError("Please specify true or false as the correct answer");
        return;
      }
    } else if (formData.type === "fill-blank") {
      if (!formData.correctAnswer.trim()) {
        setError("Please specify the correct answer");
        return;
      }
    } else if (formData.type === "short-answer") {
      if (!formData.acceptedAnswers.trim()) {
        setError("Please specify accepted answers (comma separated)");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const questionData = {
        subjectId: formData.subjectId,
        type: formData.type,
        difficulty: formData.difficulty,
        prompt: formData.prompt.trim(),
        payload: buildPayload(),
        explanation: formData.explanation.trim() || null,
        status: publishNow ? "active" : "draft"
      };

      await createQuestion(questionData);
      setSuccess(true);
      
      // Reset form
      setFormData({
        subjectId: "aqaaid",
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
        <Plus size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
        Add Question
      </h2>

      <form>
        <Select
          label="Subject"
          value={formData.subjectId}
          onChange={handleChange("subjectId")}
          disabled={loading}
        >
          <option value="aqaaid">Aqaa-id</option>
          <option value="akhlaaq">Akhlaaq</option>
          <option value="fiqh">Fiqh</option>
          <option value="hadeeth">Hadeeth</option>
          <option value="tareekh">Tareekh</option>
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
        />

        {formData.type === "multiple-choice" && (
          <>
            <label style={{
              display: "block",
              color: T.ink,
              fontSize: "14px",
              fontWeight: "500",
              marginBottom: "6px"
            }}>
              Options
            </label>
            {formData.options.map((option, index) => (
              <Input
                key={index}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={handleOptionChange(index)}
                disabled={loading}
                style={{ marginBottom: "8px" }}
              />
            ))}
          </>
        )}

        {formData.type === "multiple-choice" && (
          <Input
            label="Correct Answer"
            value={formData.correctAnswer}
            onChange={handleChange("correctAnswer")}
            placeholder="Enter the exact text of the correct option"
            disabled={loading}
          />
        )}

        {formData.type === "true-false" && (
          <Select
            label="Correct Answer"
            value={formData.correctAnswer}
            onChange={handleChange("correctAnswer")}
            disabled={loading}
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
          />
        )}

        {formData.type === "short-answer" && (
          <Input
            label="Accepted Answers"
            value={formData.acceptedAnswers}
            onChange={handleChange("acceptedAnswers")}
            placeholder="Enter accepted answers separated by commas"
            disabled={loading}
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
            Question created successfully!
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <Btn
            onClick={(e) => handleSubmit(e, false)}
            disabled={loading}
            variant="outline"
            style={{ flex: 1 }}
          >
            <Save size={16} style={{ marginRight: "6px" }} />
            {loading ? "Saving..." : "Save as Draft"}
          </Btn>
          <Btn
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            style={{ flex: 1 }}
          >
            {loading ? "Publishing..." : "Publish Now"}
          </Btn>
        </div>
      </form>
    </Card>
  );
}