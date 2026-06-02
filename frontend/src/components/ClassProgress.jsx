import React, { useState, useEffect } from "react";
import { getUsers, getStudentProgress } from "../lib/api";
import { Users, TrendingUp, BookOpen, Target, UserPlus } from "lucide-react";
import { LoadingCard } from "./Loading";
import EmptyState from "./EmptyState";

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

const Btn = ({ children, onClick, disabled, variant = "outline", type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? T.green : "transparent",
      color: variant === "primary" ? "white" : T.ink,
      border: variant === "primary" ? "none" : `1px solid ${T.line}`,
      padding: "8px 12px", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "12px", fontWeight: "500", opacity: disabled ? 0.6 : 1,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      ...style
    }}
  >
    {children}
  </button>
);

const ProgressBar = ({ value, max, color = T.green }) => {
  const percentage = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{
      background: T.line,
      height: "8px",
      borderRadius: "4px",
      overflow: "hidden",
      width: "100%"
    }}>
      <div style={{
        background: color,
        height: "100%",
        width: `${percentage}%`,
        transition: "width 0.3s ease"
      }} />
    </div>
  );
};

const StudentCard = ({ student, progress, onViewProgress }) => {
  const totalLessons = progress ? Object.values(progress.subjects || {}).reduce((sum, subj) => sum + (subj.totalLessons || 0), 0) : 0;
  const completedLessons = progress ? Object.values(progress.subjects || {}).reduce((sum, subj) => sum + (subj.completedLessons || 0), 0) : 0;
  const totalAttempts = progress ? (progress.attempts || []).length : 0;
  const accuracy = progress ? (progress.overallAccuracy || 0) : 0;

  return (
    <Card style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "600", color: T.ink }}>
            {student.name}
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: T.faint }}>
            @{student.username}
          </p>
        </div>
        <Btn onClick={() => onViewProgress(student)}>
          View Details
        </Btn>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
        gap: "16px",
        marginBottom: "12px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
            <BookOpen size={14} color={T.green} />
            <span style={{ fontSize: "12px", color: T.ink2 }}>Lessons</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: T.ink }}>
            {completedLessons}/{totalLessons}
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
            <Target size={14} color={T.green} />
            <span style={{ fontSize: "12px", color: T.ink2 }}>Accuracy</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: accuracy >= 70 ? T.green : "#C0563B" }}>
            {Math.round(accuracy)}%
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
            <TrendingUp size={14} color={T.green} />
            <span style={{ fontSize: "12px", color: T.ink2 }}>Attempts</span>
          </div>
          <div style={{ fontSize: "18px", fontWeight: "600", color: T.ink }}>
            {totalAttempts}
          </div>
        </div>
      </div>

      {totalLessons > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "12px", color: T.ink2 }}>Progress</span>
            <span style={{ fontSize: "12px", color: T.ink2 }}>
              {Math.round((completedLessons / totalLessons) * 100)}%
            </span>
          </div>
          <ProgressBar value={completedLessons} max={totalLessons} />
        </div>
      )}
    </Card>
  );
};

export default function ClassProgress({ user }) {
  const [students, setStudents] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    loadClassData();
  }, []);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const response = await getUsers();
      const users = response.users || [];
      const classStudents = users.filter(u => u.role === "student" && u.classId === user.classId);
      setStudents(classStudents);

      const progressData = {};
      for (const student of classStudents) {
        try {
          const studentProgress = await getStudentProgress(student.id);
          progressData[student.id] = studentProgress;
        } catch (err) {
          console.warn(`Failed to load progress for ${student.name}:`, err);
          progressData[student.id] = null;
        }
      }
      setProgress(progressData);
    } catch (err) {
      setError(err.message || "Failed to load class data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewProgress = (student) => {
    setSelectedStudent(student);
  };

  if (loading) {
    return <LoadingCard message="Loading class progress..." />;
  }

  if (error) {
    return (
      <Card>
        <div style={{ color: "#DC2626", marginBottom: "16px" }}>
          Error: {error}
        </div>
        <Btn onClick={loadClassData}>Retry</Btn>
      </Card>
    );
  }

  if (selectedStudent) {
    const studentProgress = progress[selectedStudent.id];
    return (
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "Fraunces, serif", color: T.ink }}>
            {selectedStudent.name} - Detailed Progress
          </h2>
          <Btn onClick={() => setSelectedStudent(null)}>Back to Class</Btn>
        </div>

        {studentProgress ? (
          <div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "20px"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "600", color: T.green }}>
                  {Math.round(studentProgress.overallAccuracy || 0)}%
                </div>
                <div style={{ fontSize: "12px", color: T.ink2 }}>Overall Accuracy</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "24px", fontWeight: "600", color: T.ink }}>
                  {(studentProgress.attempts || []).length}
                </div>
                <div style={{ fontSize: "12px", color: T.ink2 }}>Total Attempts</div>
              </div>
            </div>

            {studentProgress.subjects && Object.entries(studentProgress.subjects).map(([subjectId, subjectData]) => (
              <div key={subjectId} style={{ marginBottom: "16px" }}>
                <h3 style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  color: T.ink,
                  marginBottom: "8px",
                  textTransform: "capitalize"
                }}>
                  {subjectId}
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "12px",
                  fontSize: "14px"
                }}>
                  <div>
                    <span style={{ color: T.ink2 }}>Lessons: </span>
                    <span style={{ color: T.ink, fontWeight: "500" }}>
                      {subjectData.completedLessons || 0}/{subjectData.totalLessons || 0}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: T.ink2 }}>Accuracy: </span>
                    <span style={{ color: subjectData.accuracy >= 70 ? T.green : "#C0563B", fontWeight: "500" }}>
                      {Math.round(subjectData.accuracy || 0)}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: T.ink2 }}>Attempts: </span>
                    <span style={{ color: T.ink, fontWeight: "500" }}>
                      {subjectData.attempts || 0}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: T.faint, padding: "20px" }}>
            No progress data available for this student.
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ margin: 0, fontSize: "20px", fontFamily: "Fraunces, serif", color: T.ink }}>
          <Users size={20} style={{ verticalAlign: "middle", marginRight: "8px" }} />
          Class Progress ({students.length} students)
        </h2>
        <Btn onClick={loadClassData}>Refresh</Btn>
      </div>

      {students.length === 0 ? (
        <EmptyState
          icon={<UserPlus />}
          title="No Students Yet"
          description="Your class doesn't have any students assigned yet. Ask your admin to assign students to your class."
        />
      ) : (
        students.map(student => (
          <StudentCard
            key={student.id}
            student={student}
            progress={progress[student.id]}
            onViewProgress={handleViewProgress}
          />
        ))
      )}
    </Card>
  );
}