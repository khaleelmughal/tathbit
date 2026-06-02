import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { logout } from "../lib/api";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const TopBar = ({ user, onLogout, onMenuToggle, isMenuCollapsed }) => (
  <header style={{
    height: "64px",
    background: T.card,
    borderBottom: `1px solid ${T.line}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    position: "fixed",
    top: 0,
    left: isMenuCollapsed ? "60px" : "250px",
    right: 0,
    zIndex: 999,
    transition: "left 0.3s ease",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      <button
        onClick={onMenuToggle}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "20px",
          color: T.ink2,
          padding: "8px",
        }}
      >
        ☰
      </button>
      <div>
        <h1 style={{
          fontSize: "18px",
          fontWeight: "600",
          color: T.ink,
          margin: 0,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}>
          {user?.role === "admin" ? "Admin Dashboard" : "Teacher Dashboard"}
        </h1>
      </div>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
      {/* User Profile */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "8px 12px",
        background: T.paper,
        borderRadius: "8px",
      }}>
        <div style={{
          width: "32px",
          height: "32px",
          background: T.green,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "14px",
          fontWeight: "600",
        }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{
            fontSize: "14px",
            fontWeight: "500",
            color: T.ink,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
            {user?.name}
          </span>
          <span style={{
            fontSize: "12px",
            color: T.faint,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Logout Button */}
      <button
        onClick={onLogout}
        style={{
          background: T.line,
          border: "none",
          padding: "8px 16px",
          borderRadius: "6px",
          color: T.ink2,
          cursor: "pointer",
          fontSize: "14px",
          fontFamily: "Plus Jakarta Sans, sans-serif",
          fontWeight: "500",
        }}
      >
        Logout
      </button>
    </div>
  </header>
);

export default function DashboardLayout({ 
  user, 
  onLogout, 
  children, 
  activeSection, 
  onSectionChange 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const handleMenuToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${T.paper} 0%, ${T.paper2} 100%)`,
      fontFamily: "Plus Jakarta Sans, sans-serif",
    }}>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        userRole={user?.role}
        isCollapsed={isCollapsed}
        onToggle={handleMenuToggle}
      />
      
      <TopBar
        user={user}
        onLogout={handleLogout}
        onMenuToggle={handleMenuToggle}
        isMenuCollapsed={isCollapsed}
      />

      <main style={{
        marginLeft: isCollapsed ? "60px" : "250px",
        marginTop: "64px",
        padding: "24px",
        transition: "margin-left 0.3s ease",
        minHeight: "calc(100vh - 64px)",
      }}>
        {children}
      </main>
    </div>
  );
}