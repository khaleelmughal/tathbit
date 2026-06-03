import React from "react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendValue, 
  color = T.green,
  onClick,
  loading = false 
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: T.card,
        border: `1px solid ${T.line}`,
        borderRadius: "12px",
        padding: "24px",
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)",
        position: "relative",
        overflow: "hidden",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 4px 12px rgba(43, 58, 51, 0.1), 0 2px 4px rgba(43, 58, 51, 0.06)";
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)";
        }
      }}
    >
      {/* Loading State */}
      {loading && (
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(255,255,255,0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "12px",
        }}>
          <div style={{
            width: "24px",
            height: "24px",
            border: `2px solid ${T.line}`,
            borderTop: `2px solid ${color}`,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }} />
        </div>
      )}

      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}>
        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: "14px",
            fontWeight: "500",
            color: T.ink2,
            margin: 0,
            marginBottom: "8px",
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
            {title}
          </h3>
          <div style={{
            fontSize: "32px",
            fontWeight: "700",
            color: T.ink,
            margin: 0,
            fontFamily: "Plus Jakarta Sans, sans-serif",
            lineHeight: 1,
          }}>
            {value}
          </div>
        </div>
        
        {icon && (
          <div style={{
            width: "48px",
            height: "48px",
            background: `${color}15`,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            color: color,
          }}>
            {icon}
          </div>
        )}
      </div>

      {subtitle && (
        <p style={{
          fontSize: "14px",
          color: T.faint,
          margin: 0,
          fontFamily: "Plus Jakarta Sans, sans-serif",
        }}>
          {subtitle}
        </p>
      )}

      {trend && trendValue && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          marginTop: "8px",
        }}>
          <span style={{
            fontSize: "12px",
            fontWeight: "600",
            color: trend === "up" ? T.green : trend === "down" ? "#DC2626" : T.faint,
          }}>
            {trend === "up" ? "↗" : trend === "down" ? "↘" : "→"} {trendValue}
          </span>
          <span style={{
            fontSize: "12px",
            color: T.faint,
            fontFamily: "Plus Jakarta Sans, sans-serif",
          }}>
            vs last period
          </span>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}