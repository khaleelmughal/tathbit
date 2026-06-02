import React from "react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  actionText,
  style = {}
}) {
  return (
    <div style={{
      textAlign: "center",
      padding: "60px 20px",
      color: T.faint,
      ...style
    }}>
      {icon && (
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: T.line,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          opacity: 0.6
        }}>
          {React.cloneElement(icon, { size: 28, color: T.faint })}
        </div>
      )}
      
      <h3 style={{
        fontSize: "18px",
        fontFamily: "Fraunces, serif",
        color: T.ink2,
        margin: "0 0 8px 0"
      }}>
        {title}
      </h3>
      
      <p style={{
        fontSize: "14px",
        color: T.faint,
        margin: "0 0 24px 0",
        lineHeight: 1.5,
        maxWidth: "300px",
        marginLeft: "auto",
        marginRight: "auto"
      }}>
        {description}
      </p>
      
      {action && (
        <button
          onClick={action}
          style={{
            background: T.green,
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            cursor: "pointer",
            fontFamily: "Plus Jakarta Sans, sans-serif"
          }}
        >
          {actionText || "Get Started"}
        </button>
      )}
    </div>
  );
}