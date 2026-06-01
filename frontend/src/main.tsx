import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

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
