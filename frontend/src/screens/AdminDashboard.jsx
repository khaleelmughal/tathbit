import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import StatCard from "../components/StatCard";
import CreateClassForm from "../components/CreateClassForm";
import CreateTeacherForm from "../components/CreateTeacherForm";
import CreateStudentForm from "../components/CreateStudentForm";
import AssignStudentForm from "../components/AssignStudentForm";
import UserList from "../components/UserList";
import QuestionManager from "../components/QuestionManager";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import ClassList from "../components/ClassList";
import FlashcardManager from "../components/FlashcardManager";
import { getAdminStats } from "../lib/api";

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

export default function AdminDashboard({ user, onLogout }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const response = await getAdminStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    loadStats(); // Refresh stats when data changes
  };

  const renderDashboardSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Statistics Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
        }}>
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle={`${stats?.usersByRole?.teacher || 0} teachers, ${stats?.usersByRole?.student || 0} students`}
            icon="👥"
            loading={statsLoading}
            onClick={() => navigate("/admin/users")}
          />
          <StatCard
            title="Classes"
            value={stats?.totalClasses || 0}
            subtitle="Active classes"
            icon="🏫"
            loading={statsLoading}
            onClick={() => navigate("/admin/classes")}
          />
          <StatCard
            title="Questions"
            value={stats?.totalQuestions || 0}
            subtitle="Available questions"
            icon="❓"
            loading={statsLoading}
            onClick={() => navigate("/admin/questions")}
          />
          <StatCard
            title="Recent Activity"
            value={stats?.recentActivity || 0}
            subtitle="Last 7 days"
            icon="📊"
            loading={statsLoading}
          />
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}>
            <CreateClassForm onSuccess={handleFormSuccess} />
            <AssignStudentForm onSuccess={handleFormSuccess} />
          </div>
        </Card>

        {/* Recent Users */}
        <Card title="User Management">
          <UserList refreshTrigger={refreshTrigger} />
        </Card>
      </div>
    );
  };

  const renderUsersSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="User Management">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}>
            <CreateTeacherForm onSuccess={handleFormSuccess} />
            <CreateStudentForm onSuccess={handleFormSuccess} />
            <AssignStudentForm onSuccess={handleFormSuccess} />
          </div>
          <UserList refreshTrigger={refreshTrigger} />
        </Card>
      </div>
    );
  };

  const renderClassesSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Class Management">
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}>
            <CreateClassForm onSuccess={handleFormSuccess} />
            <AssignStudentForm onSuccess={handleFormSuccess} />
          </div>
        </Card>
        <ClassList refreshTrigger={refreshTrigger} onUpdate={handleFormSuccess} />
      </div>
    );
  };

  const renderQuestionsSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <Card title="Question Management">
          <QuestionManager refreshTrigger={refreshTrigger} isAdmin={true} />
        </Card>
      </div>
    );
  };

  const renderContentSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <FlashcardManager refreshTrigger={refreshTrigger} onUpdate={handleFormSuccess} />
      </div>
    );
  };

  const renderAnalyticsSection = () => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <AnalyticsDashboard />
      </div>
    );
  };

  // Get active section from current pathname
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/users')) return 'users';
    if (path.includes('/classes')) return 'classes'; 
    if (path.includes('/questions')) return 'questions';
    if (path.includes('/content')) return 'content';
    if (path.includes('/analytics')) return 'analytics';
    return 'dashboard';
  };

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      activeSection={getActiveSection()}
      onSectionChange={null} // Will be handled by navigation in DashboardLayout
    >
      <Routes>
        <Route path="/dashboard" element={renderDashboardSection()} />
        <Route path="/users" element={renderUsersSection()} />
        <Route path="/classes" element={renderClassesSection()} />
        <Route path="/questions" element={renderQuestionsSection()} />
        <Route path="/content" element={renderContentSection()} />
        <Route path="/analytics" element={renderAnalyticsSection()} />
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
}