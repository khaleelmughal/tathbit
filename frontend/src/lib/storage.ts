// StorageAdapter decouples the app from where data lives.
// TODAY: LocalAdapter (browser localStorage) — works offline, no backend.
// LATER: ApiAdapter — same interface, talks to Express + PostgreSQL.
// App.jsx currently uses window.storage directly (see main.tsx). When you move
// to the API in Claude Code, route its store through one of these instead.
import { api } from "./api";

export interface StorageAdapter {
  getState(): Promise<any | null>;
  saveState(state: any): Promise<void>;
}

export const LocalAdapter: StorageAdapter = {
  async getState() {
    const v = localStorage.getItem("tasheel:v1");
    return v ? JSON.parse(v) : null;
  },
  async saveState(state) {
    localStorage.setItem("tasheel:v1", JSON.stringify(state));
  },
};

export const ApiAdapter: StorageAdapter = {
  async getState() {
    return api("/progress/me");
  },
  async saveState(state) {
    await api("/progress/me", { method: "PUT", body: JSON.stringify(state) });
  },
};

// Swap here when the backend is live:
export const storage: StorageAdapter = LocalAdapter;
