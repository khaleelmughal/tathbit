import React, { useState, useEffect } from "react";
import { assignStudent, getUsers, getClasses } from "../lib/api";

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

export default function AssignStudentForm({ onSuccess }) {
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersResponse, classesResponse] = await Promise.all([
        getUsers(),
        getClasses()
      ]);
      
      const users = usersResponse.users || [];
      const unassignedStudents = users.filter(u => u.role === "student" && !u.classId);
      
      const allClasses = classesResponse.classes || [];
      
      setStudents(unassignedStudents);
      setClasses(allClasses.map(c => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.error("Failed to load data:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!studentId || !classId) {
      setError("Please select both a student and a class");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await assignStudent({
        studentId: studentId,
        classId: classId
      });
      setSuccess(true);
      setStudentId("");
      setClassId("");
      loadData(); // Refresh the lists
      if (onSuccess) onSuccess();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to assign student");
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
        Assign Student to Class
      </h2>

      <form onSubmit={handleSubmit}>
        <Select
          label="Student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          disabled={loading}
        >
          <option value="">Select a student</option>
          {students.map(student => (
            <option key={student.id} value={student.id}>
              {student.name} ({student.username})
            </option>
          ))}
        </Select>

        <Select
          label="Class"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={loading}
        >
          <option value="">Select a class</option>
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </Select>

        {students.length === 0 && (
          <div style={{
            background: "#FEF3C7",
            color: "#92400E",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            No unassigned students found.
          </div>
        )}

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
            Student assigned successfully!
          </div>
        )}

        <Btn
          type="submit"
          disabled={loading || students.length === 0}
          style={{ width: "100%" }}
        >
          {loading ? "Assigning..." : "Assign Student"}
        </Btn>
      </form>
    </Card>
  );
}