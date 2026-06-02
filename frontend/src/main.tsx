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
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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

// App.jsx talks to `window.storage` (get/set returning {value}) and falls back
// to in-memory if absent. We give it a localStorage-backed implementation so
// progress persists across reloads in the browser, no edits to App.jsx needed.
(function installLocalStorage() {
  (window as any).storage = {
    async get(key: string) {
      const v = localStorage.getItem(key);
      return v == null ? null : { value: v };
    },
    async set(key: string, value: string) {
      localStorage.setItem(key, value);
    },
  };
})();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
