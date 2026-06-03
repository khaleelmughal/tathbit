import React from "react";
import { Link } from "react-router-dom";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

// On mobile, pass onClick so navigating to a section closes the drawer automatically.
const SidebarItem = ({ icon, label, isActive, to, badge, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      background: isActive ? T.greenSoft : "transparent",
      color: isActive ? T.green : T.ink2,
      borderRadius: "8px",
      cursor: "pointer",
      fontSize: "14px",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      fontWeight: isActive ? "600" : "500",
      transition: "background 0.2s ease, color 0.2s ease",
      textDecoration: "none",
      boxSizing: "border-box",
    }}
  >
    <span style={{ fontSize: "18px", lineHeight: 1, flexShrink: 0 }}>{icon}</span>
    {label && <span style={{ flex: 1 }}>{label}</span>}
    {badge && (
      <span style={{
        background: T.green, color: "white",
        fontSize: "11px", fontWeight: "600",
        padding: "2px 7px", borderRadius: "10px",
        minWidth: "20px", textAlign: "center",
      }}>{badge}</span>
    )}
  </Link>
);

export default function Sidebar({
  activeSection,
  onSectionChange,
  userRole,
  isCollapsed,   // desktop only
  onToggle,      // desktop: collapse/expand; unused on mobile
  isMobile,
  mobileOpen,    // mobile only
  onNavigate,    // mobile: close drawer after nav item tap
}) {
  const urlPrefix = userRole === "admin" ? "/admin" : "/teacher";

  const adminMenuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard",  to: `${urlPrefix}/dashboard` },
    { id: "users",     icon: "👥", label: "Users",       to: `${urlPrefix}/users`     },
    { id: "classes",   icon: "🏫", label: "Classes",     to: `${urlPrefix}/classes`   },
    { id: "questions", icon: "❓", label: "Questions",   to: `${urlPrefix}/questions` },
    { id: "content",   icon: "📚", label: "Content",     to: `${urlPrefix}/content`   },
    { id: "analytics", icon: "📈", label: "Analytics",   to: `${urlPrefix}/analytics` },
  ];

  const teacherMenuItems = [
    { id: "dashboard", icon: "📊", label: "Dashboard",  to: `${urlPrefix}/dashboard` },
    { id: "class",     icon: "🏫", label: "My Class",   to: `${urlPrefix}/class`     },
    { id: "questions", icon: "❓", label: "Questions",  to: `${urlPrefix}/questions` },
    { id: "content",   icon: "📚", label: "Syllabus",   to: `${urlPrefix}/content`   },
    { id: "progress",  icon: "📈", label: "Progress",   to: `${urlPrefix}/progress`  },
  ];

  const menuItems = userRole === "admin" ? adminMenuItems : teacherMenuItems;
  // Always show labels in mobile drawer (full width); on desktop, hide when collapsed.
  const showLabels = isMobile ? true : !isCollapsed;

  // ─── Mobile: off-canvas drawer that slides in over the content ────────────
  // ─── Desktop: fixed sidebar that collapses to icon-only strip ─────────────
  const containerStyle = isMobile
    ? {
        position: "fixed",
        top: 0,
        left: 0,
        width: "260px",
        height: "100vh",
        background: T.card,
        borderRight: `1px solid ${T.line}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1100,
        transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: mobileOpen ? "6px 0 32px rgba(43,58,51,0.2)" : "none",
        overflowY: "auto",
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        width: isCollapsed ? "60px" : "250px",
        height: "100vh",
        background: T.card,
        borderRight: `1px solid ${T.line}`,
        display: "flex",
        flexDirection: "column",
        zIndex: 1000,
        transition: "width 0.3s ease",
        overflow: "hidden",
      };

  return (
    <div style={containerStyle}>
      {/* Brand */}
      <div style={{
        padding: "20px 16px",
        borderBottom: `1px solid ${T.line}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        flexShrink: 0,
      }}>
        <div style={{
          width: "28px", height: "28px",
          background: T.green, borderRadius: "6px",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "14px", fontWeight: "bold", flexShrink: 0,
        }}>M</div>
        {showLabels && (
          <div>
            <div style={{ fontSize: "16px", fontWeight: "600", fontFamily: "Fraunces, serif", color: T.ink }}>
              Tathbīt
            </div>
            <div style={{ fontSize: "12px", color: T.faint }}>
              {userRole === "admin" ? "Admin Panel" : "Teacher Panel"}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: "16px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        overflowY: "auto",
      }}>
        {menuItems.map((item) => (
          <SidebarItem
            key={item.id}
            icon={item.icon}
            label={showLabels ? item.label : ""}
            isActive={activeSection === item.id}
            to={item.to}
            badge={item.badge}
            // Close the mobile drawer after the user taps a nav item
            onClick={isMobile ? onNavigate : undefined}
          />
        ))}
      </nav>

      {/* Collapse toggle — desktop only; hidden on mobile since the drawer has a backdrop */}
      {!isMobile && (
        <div style={{ padding: "16px", borderTop: `1px solid ${T.line}`, flexShrink: 0 }}>
          <button
            onClick={onToggle}
            style={{
              width: "100%", padding: "8px",
              background: "transparent", border: `1px solid ${T.line}`,
              borderRadius: "6px", color: T.ink2, cursor: "pointer",
              fontSize: "14px", fontFamily: "Plus Jakarta Sans, sans-serif",
            }}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>
      )}
    </div>
  );
}