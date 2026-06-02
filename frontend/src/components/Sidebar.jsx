import React from "react";
import { Link, useLocation } from "react-router-dom";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const SidebarItem = ({ icon, label, isActive, to, badge }) => (
  <Link
    to={to}
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      background: isActive ? T.greenSoft : "transparent",
      color: isActive ? T.green : T.ink2,
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      fontWeight: isActive ? "600" : "500",
      transition: "all 0.2s ease",
      textDecoration: "none",
    }}
    onMouseEnter={(e) => {
      if (!isActive) {
        e.target.style.background = T.line;
      }
    }}
    onMouseLeave={(e) => {
      if (!isActive) {
        e.target.style.background = "transparent";
      }
    }}
  >
    <span style={{ fontSize: "16px" }}>{icon}</span>
    <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
    {badge && (
      <span style={{
        background: T.green,
        color: "white",
        fontSize: "12px",
        fontWeight: "600",
        padding: "2px 8px",
        borderRadius: "12px",
        minWidth: "20px",
        textAlign: "center"
      }}>
        {badge}
      </span>
    )}
  </Link>
);

export default function Sidebar({ activeSection, onSectionChange, userRole, isCollapsed, onToggle }) {
  const urlPrefix = userRole === "admin" ? "/admin" : "/teacher";
  
  const adminMenuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard", to: `${urlPrefix}/dashboard` },
    { id: "users", icon: "👥", label: "Users", to: `${urlPrefix}/users` },
    { id: "classes", icon: "🏫", label: "Classes", to: `${urlPrefix}/classes` },
    { id: "questions", icon: "❓", label: "Questions", to: `${urlPrefix}/questions` },
    { id: "content", icon: "📚", label: "Content", to: `${urlPrefix}/content` },
    { id: "analytics", icon: "📈", label: "Analytics", to: `${urlPrefix}/analytics` },
  ];

  const teacherMenuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard", to: `${urlPrefix}/dashboard` },
    { id: "class", icon: "🏫", label: "My Class", to: `${urlPrefix}/class` },
    { id: "questions", icon: "❓", label: "Questions", to: `${urlPrefix}/questions` },
    { id: "content", icon: "📚", label: "Syllabus", to: `${urlPrefix}/content` },
    { id: "progress", icon: "📈", label: "Progress", to: `${urlPrefix}/progress` },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : teacherMenuItems;

  return (
    <div style={{
      width: isCollapsed ? "60px" : "250px",
      minHeight: "100vh",
      background: T.card,
      borderRight: `1px solid ${T.line}`,
      transition: "width 0.3s ease",
      display: "flex",
      flexDirection: "column",
      position: "fixed",
      left: 0,
      top: 0,
      zIndex: 1000,
    }}>
      {/* Logo/Brand */}
      <div style={{
        padding: "20px 16px",
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          background: T.green,
          borderRadius: "6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "14px",
          fontWeight: "bold",
        }}>
          M
        </div>
        {!isCollapsed && (
          <div>
            <div style={{
              fontSize: "16px",
              fontWeight: "600",
              fontFamily: "Fraunces, serif",
              color: T.ink,
            }}>Tathbīt</div>
            <div style={{
              fontSize: "12px",
              color: T.faint,
            }}>
              {userRole === "admin" ? "Admin Panel" : "Teacher Panel"}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={isCollapsed ? "" : item.label}
            isActive={activeSection === item.id}
            to={item.to}
            badge={item.badge}
          />
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div style={{
        padding: "16px",
        borderTop: `1px solid ${T.line}`,
      }}>
        <button
          onClick={onToggle}
          style={{
            width: "100%",
            padding: "8px",
            background: "transparent",
            border: `1px solid ${T.line}`,
            borderRadius: "6px",
            color: T.ink2,
            cursor: "pointer",
            fontSize: "14px",
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  );
}