import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// Add global responsive styles
const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Geeza Pro', 'Noto Naskh Arabic', 'Arial Unicode MS', sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  @media (max-width: 768px) {
    .responsive-grid {
      grid-template-columns: 1fr !important;
    }
    
    .responsive-padding {
      padding: 12px 16px !important;
    }
    
    .responsive-text {
      font-size: 14px !important;
    }
    
    .mobile-stack {
      flex-direction: column !important;
      gap: 12px !important;
    }
  }
  
  @media (max-width: 480px) {
    .mobile-hide {
      display: none !important;
    }
  }
`;

const styleElement = document.createElement('style');
styleElement.textContent = globalStyles;
document.head.appendChild(styleElement);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
