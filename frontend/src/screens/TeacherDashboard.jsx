import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import ClassProgress from "../components/ClassProgress";
import AddQuestionForm from "../components/AddQuestionForm";
import QuestionManager from "../components/QuestionManager";
import { getUsers } from "../lib/api";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, title, style = {} }) => (
  <div style={{
    background: T.card,
    border: `1px solid ${T.line}`,
    borderRadius: "12px",
    overflow: "hidden",
    ...style
  }}>
    {title && (
      <div style={{
        padding: "20px 24px 0 24px",
        borderBottom: `1px solid ${T.line}`,
        marginBottom: "20px",
      }}>
        <h2 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: T.ink,
          margin: 0,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}>
          {title}
        </h2>
      </div>
    )}
    <div style={{ padding: title ? "0 24px 24px 24px" : "24px" }}>
      {children}
    </div>
  </div>
);

export default function TeacherDashboard({ user, onLogout }) {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [classStats, setClassStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    loadClassStats();
  }, [user]);

  const loadClassStats = async () => {
    if (!user?.classId) {
      setStatsLoading(false);
      return;
    }

    try {
      setStatsLoading(true);
      const response = await getUsers();
      const students = response.users?.filter(u => u.role === "student" && u.classId === user.classId) || [];
      
      setClassStats({
        totalStudents: students.length,
        className: user.className,
        classId: user.classId
      });
    } catch (error) {
      console.error("Failed to load class stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleQuestionSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const renderDashboardSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Class Overview */}
        {user?.classId && (
          <Card title={`Class Overview: ${user.className || "Your Class"}`}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "24px",
            }}>
              <StatCard
                title="Students"
                value={classStats?.totalStudents || 0}
                subtitle="In your class"
                icon="👥"
                loading={statsLoading}
                onClick={() => setActiveSection("class")}
              />
              <StatCard
                title="Class"
                value={user.className?.split(' ')[1] || "N/A"}
                subtitle={user.className || "No class assigned"}
                icon="🏫"
                loading={statsLoading}
              />
            </div>
          </Card>
        )}

        {/* No Class Warning */}
        {!user?.classId && (
          <Card title="Getting Started">
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              color: T.faint,
            }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏫</div>
              <h3 style={{ 
                fontSize: "18px", 
                color: T.ink2, 
                marginBottom: "8px",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                No Class Assigned
              </h3>
              <p style={{ 
                fontSize: "14px", 
                margin: 0,
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                Contact your admin to assign you to a class to start managing students and content.
              </p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
          }}>
            <AddQuestionForm onSuccess={handleQuestionSuccess} />
            <div style={{
              padding: "20px",
              background: T.paper,
              borderRadius: "8px",
              textAlign: "center",
            }}>
              <h3 style={{
                fontSize: "16px",
                fontWeight: "600",
                color: T.ink,
                margin: "0 0 8px 0",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                Coming Soon
              </h3>
              <p style={{
                fontSize: "14px",
                color: T.faint,
                margin: 0,
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}>
                More teaching tools and content management features are being developed.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const renderClassSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <ClassProgress user={user} />
      </div>
    );
  };

  const renderQuestionsSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Question Management">
          <QuestionManager refreshTrigger={refreshTrigger} isAdmin={false} />
        </Card>
      </div>
    );
  };

  const renderContentSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Syllabus & Content">
          <p style={{ color: T.faint, margin: 0 }}>
            Syllabus management features coming soon...
          </p>
        </Card>
      </div>
    );
  };

  const renderProgressSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Student Progress">
          <p style={{ color: T.faint, margin: 0 }}>
            Detailed progress analytics coming soon...
          </p>
        </Card>
      </div>
    );
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboardSection();
      case "class":
        return renderClassSection();
      case "questions":
        return renderQuestionsSection();
      case "content":
        return renderContentSection();
      case "progress":
        return renderProgressSection();
      default:
        return renderDashboardSection();
    }
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {renderActiveSection()}
    </DashboardLayout>
  );
}