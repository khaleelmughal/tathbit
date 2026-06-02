import React from "react";

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Spinner = ({ size = 20, color = T.green }) => (
  <div
    style={{
      width: size,
      height: size,
      border: `2px solid ${T.line}`,
      borderTop: `2px solid ${color}`,
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block"
    }}
  />
);

// Add keyframes for spin animation
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (!document.head.querySelector('style[data-spinner]')) {
  style.setAttribute('data-spinner', 'true');
  document.head.appendChild(style);
}

export const LoadingSpinner = ({ size, color }) => <Spinner size={size} color={color} />;

export const LoadingCard = ({ message = "Loading..." }) => (
  <div style={{
    background: T.card,
    border: `1px solid ${T.line}`,
    borderRadius: "12px",
    padding: "40px",
    textAlign: "center"
  }}>
    <LoadingSpinner size={24} />
    <div style={{
      color: T.faint,
      fontSize: "14px",
      marginTop: "12px"
    }}>
      {message}
    </div>
  </div>
);

export const LoadingInline = ({ message = "Loading...", size = 16 }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: T.faint,
    fontSize: "14px"
  }}>
    <LoadingSpinner size={size} />
    {message}
  </div>
);