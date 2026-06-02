import React, { useState, useEffect } from "react";
import { createStudent, getClasses } from "../lib/api";

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

export default function CreateStudentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    pin: "",
    classId: ""
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await getClasses();
      const allClasses = response.classes || [];
      setClasses(allClasses.map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error("Failed to load classes:", err);
    }
  };

  const handleChange = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.username.trim() || !formData.pin.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = {
        ...formData,
        classId: formData.classId || undefined
      };
      await createStudent(data);
      setSuccess(true);
      setFormData({ name: "", username: "", pin: "", classId: "" });
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to create student");
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
        Create Student
      </h2>

      <form onSubmit={handleSubmit}>
        <Input
          label="Name"
          type="text"
          value={formData.name}
          onChange={handleChange("name")}
          placeholder="Enter student's full name"
          disabled={loading}
        />

        <Input
          label="Username"
          type="text"
          value={formData.username}
          onChange={handleChange("username")}
          placeholder="Choose a unique username"
          disabled={loading}
        />

        <Input
          label="PIN"
          type="password"
          value={formData.pin}
          onChange={handleChange("pin")}
          placeholder="Create a PIN (numbers/letters)"
          disabled={loading}
        />

        <Select
          label="Class (Optional)"
          value={formData.classId}
          onChange={handleChange("classId")}
          disabled={loading}
        >
          <option value="">No class assigned</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </Select>

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
            Student created successfully!
          </div>
        )}

        <Btn
          type="submit"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? "Creating..." : "Create Student"}
        </Btn>
      </form>
    </Card>
  );
}