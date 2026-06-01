// Thin client for the Express API. Token kept in localStorage.
const TOKEN_KEY = "madrasah:token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

// Auth helpers
export const staffLogin = (email: string, password: string) =>
  api<{ token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const studentLogin = (username: string, pin: string) =>
  api<{ token: string; user: any }>("/auth/student-login", { method: "POST", body: JSON.stringify({ username, pin }) });
