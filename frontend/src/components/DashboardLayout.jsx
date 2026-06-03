import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { logout } from "../lib/api";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

// Tracks whether the viewport is narrower than the given breakpoint.
// Re-evaluates on resize so mobile ↔ desktop switches work on rotation.
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return isMobile;
}

const TopBar = ({ user, onLogout, onMenuToggle, sidebarOffset, isMobile }) => (
  <header style={{
    height: "64px",
    background: T.card,
    borderBottom: `1px solid ${T.line}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: isMobile ? "0 12px" : "0 24px",
    position: "fixed",
    top: 0,
    left: sidebarOffset,
    right: 0,
    zIndex: 999,
    transition: "left 0.3s ease",
    boxSizing: "border-box",
  }}>
    {/* Left: hamburger + title */}
    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
      <button
        onClick={onMenuToggle}
        aria-label="Toggle menu"
        style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "22px", color: T.ink2, padding: "8px",
          lineHeight: 1, flexShrink: 0,
        }}
      >☰</button>
      <h1 style={{
        fontSize: isMobile ? "15px" : "18px",
        fontWeight: "600", color: T.ink, margin: 0,
        fontFamily: "Plus Jakarta Sans, sans-serif",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>
        {user?.role === "admin" ? "Admin Dashboard" : "Teacher Dashboard"}
      </h1>
    </div>

    {/* Right: avatar + logout */}
    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: isMobile ? "6px 8px" : "8px 12px",
        background: T.paper, borderRadius: "8px",
      }}>
        <div style={{
          width: "32px", height: "32px", background: T.green, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: "14px", fontWeight: "600", flexShrink: 0,
        }}>
          {user?.name?.charAt(0)?.toUpperCase()}
        </div>
        {/* Hide name/role text on mobile to prevent overflow */}
        {!isMobile && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: "14px", fontWeight: "500", color: T.ink, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {user?.name}
            </span>
            <span style={{ fontSize: "12px", color: T.faint, fontFamily: "Plus Jakarta Sans, sans-serif" }}>
              {user?.role}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={onLogout}
        style={{
          background: T.line, border: "none",
          padding: isMobile ? "8px 10px" : "8px 16px",
          borderRadius: "6px", color: T.ink2, cursor: "pointer",
          fontSize: isMobile ? "13px" : "14px",
          fontFamily: "Plus Jakarta Sans, sans-serif", fontWeight: "500",
        }}
      >Logout</button>
    </div>
  </header>
);

export default function DashboardLayout({ user, onLogout, children, activeSection, onSectionChange }) {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = useState(false); // desktop: narrow icon-only mode
  const [mobileOpen, setMobileOpen] = useState(false);   // mobile: drawer open/closed

  const handleLogout = () => { logout(); onLogout(); };

  // On mobile the hamburger toggles the drawer; on desktop it collapses/expands the sidebar.
  const handleMenuToggle = () => {
    if (isMobile) setMobileOpen((o) => !o);
    else setIsCollapsed((c) => !c);
  };

  const closeMobileDrawer = () => setMobileOpen(false);

  // Desktop: sidebar pushes content. Mobile: sidebar overlays content (marginLeft = 0).
  const sidebarOffset = isMobile ? 0 : (isCollapsed ? "60px" : "250px");

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${T.paper} 0%, ${T.paper2} 100%)`,
      fontFamily: "Plus Jakarta Sans, sans-serif",
    }}>
      {/* Semi-transparent backdrop — visible behind the mobile drawer; tap to close */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobileDrawer}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(43,58,51,0.45)",
            zIndex: 1099,
          }}
        />
      )}

      <Sidebar
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        userRole={user?.role}
        isCollapsed={isCollapsed}
        onToggle={handleMenuToggle}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onNavigate={closeMobileDrawer}
      />

      <TopBar
        user={user}
        onLogout={handleLogout}
        onMenuToggle={handleMenuToggle}
        sidebarOffset={sidebarOffset}
        isMobile={isMobile}
      />

      <main style={{
        marginLeft: sidebarOffset,
        marginTop: "64px",
        padding: isMobile ? "16px" : "24px",
        transition: "margin-left 0.3s ease",
        minHeight: "calc(100vh - 64px)",
        boxSizing: "border-box",
        maxWidth: "100%",
        overflowX: "hidden",
      }}>
        {children}
      </main>
    </div>
  );
}