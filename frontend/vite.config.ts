import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Dev server proxies /api to the Express backend so the frontend can call it
// without CORS headaches once you wire the API adapter.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@assets": path.resolve(dirname, "../assets"),
    },
  },
  server: { port: 5173, proxy: { "/api": "http://localhost:4000" } },
});
