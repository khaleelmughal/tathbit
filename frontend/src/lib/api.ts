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
export const getCurrentUser = () => api<{ user: any }>("/auth/me");
export const logout = () => setToken(null);

// Admin API helpers
export const getUsers = () => api<{ users: any[] }>("/users");
export const getUserDetails = (userId: string) => api<{ user: any; analytics?: any }>(`/users/${userId}`);
export const updateUser = (userId: string, data: { name?: string; email?: string; username?: string }) =>
  api<{ user: any }>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteUser = (userId: string) => api<{ success: boolean; message: string }>(`/users/${userId}`, { method: "DELETE" });
export const getAdminStats = () => api<{ stats: any }>("/users/stats");
export const getAnalytics = () => api<{ analytics: any }>("/users/analytics");
// Flashcard catalogue (lesson-content cards + real review counts) for the admin manager.
export const getFlashcardCatalogue = (params: { gradeId?: string; subjectId?: string; lessonId?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.gradeId) qs.set("gradeId", params.gradeId);
  if (params.subjectId) qs.set("subjectId", params.subjectId);
  if (params.lessonId) qs.set("lessonId", params.lessonId);
  const s = qs.toString();
  return api<{ cards: any[]; stats: { totalCards: number; totalReviews: number; successRate: number } }>(`/flashcards/catalogue${s ? "?" + s : ""}`);
};
export const createTeacher = (data: { name: string; email: string; password: string; className: string; gradeId: string }) =>
  api<{ user: any }>("/users/teachers", { method: "POST", body: JSON.stringify(data) });
export const createStudent = (data: { name: string; username: string; pin: string; classId?: string }) =>
  api<{ user: any }>("/users/students", { method: "POST", body: JSON.stringify(data) });
export const assignStudent = (data: { studentId: string; classId: string }) =>
  api("/users/assign", { method: "POST", body: JSON.stringify(data) });
export const getClasses = () => api<{ classes: any[] }>("/users/classes");
export const getClassDetails = (classId: string) => api<{ class: any; students: any[] }>(`/users/classes/${classId}`);
export const updateClass = (classId: string, data: { name?: string; teacher_id?: string }) =>
  api<{ class: any }>(`/users/classes/${classId}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteClass = (classId: string) => api<{ success: boolean; message: string }>(`/users/classes/${classId}`, { method: "DELETE" });
export const createClass = (data: { name: string; gradeId: string }) =>
  api<{ class: any }>("/users/classes", { method: "POST", body: JSON.stringify(data) });

// Student progress API helpers (replaces localStorage).
// GET /progress/me returns the saved state blob (or null for a new student).
export const getProgress = () => api<any>("/progress/me");
// PUT /progress/me persists the whole state blob (last-write-wins).
export const saveProgress = (state: any) =>
  api("/progress/me", { method: "PUT", body: JSON.stringify(state) });
// POST /progress/attempt logs a finished quiz so it feeds teacher analytics.
export const logAttempt = (attempt: {
  subjectId?: string | null; lessonId?: string | null;
  mode?: string | null; score: number; total: number;
}) => api("/progress/attempt", { method: "POST", body: JSON.stringify(attempt) });

// POST /progress/quiz logs a finished quiz as a session + one row per question
// (correct/incorrect, timing) — this is what drives the analytics dashboards.
export const logQuizSession = (payload: {
  mode?: string | null; subjectId?: string | null; lessonId?: string | null;
  gradeId?: string | null; score: number; total: number;
  durationMs?: number | null; startedAt?: string | null;
  answers: Array<{ questionId?: string; subjectId?: string; lessonId?: string;
    type?: string; isCorrect: boolean; timeMs?: number | null }>;
}) => api("/progress/quiz", { method: "POST", body: JSON.stringify(payload) });

// POST /progress/flashcards logs which cards a student knew / is learning / forgot.
export const logFlashcardReviews = (reviews: Array<{
  cardId: string; subjectId?: string | null; lessonId?: string | null;
  gradeId?: string | null; front?: string | null; result: "known" | "learning" | "forgot";
}>) => api("/progress/flashcards", { method: "POST", body: JSON.stringify({ reviews }) });

// POST /progress/activity logs login / logout / lesson_view events.
export const logActivity = (
  type: string,
  extra?: { subjectId?: string | null; lessonId?: string | null; meta?: any }
) => api("/progress/activity", { method: "POST", body: JSON.stringify({ type, ...(extra || {}) }) });

// Teacher API helpers
export const getStudentProgress = (studentId: number) => api(`/progress/student/${studentId}`);
export const createQuestion = (data: any) => api("/questions", { method: "POST", body: JSON.stringify(data) });

export interface QuestionQuery {
  page?: number; pageSize?: number; search?: string; status?: string;
  gradeId?: string; subjectId?: string; lessonId?: string; type?: string;
  difficulty?: string; mine?: boolean;
}
export interface PagedQuestions {
  questions: any[]; total: number; page: number; pageSize: number; totalPages: number;
}
export const getQuestions = (params: QuestionQuery = {}) => {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") qs.set("status", params.status);
  if (params.gradeId && params.gradeId !== "all") qs.set("gradeId", params.gradeId);
  if (params.subjectId && params.subjectId !== "all") qs.set("subjectId", params.subjectId);
  if (params.lessonId && params.lessonId !== "all") qs.set("lessonId", params.lessonId);
  if (params.type && params.type !== "all") qs.set("type", params.type);
  if (params.difficulty && params.difficulty !== "all") qs.set("difficulty", params.difficulty);
  if (params.mine) qs.set("mine", "1");
  const s = qs.toString();
  return api<PagedQuestions>(`/questions${s ? `?${s}` : ""}`);
};
export const getQuestion = (id: string) => api<any>(`/questions/${id}`);
export const getQuestionFacets = () => api<{ facets: any[] }>("/questions/facets");
export const updateQuestion = (id: string, data: any) =>
  api(`/questions/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const updateQuestionStatus = (id: number, status: string) =>
  api(`/questions/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
export const deleteQuestion = (id: string) =>
  api(`/questions/${id}`, { method: "DELETE" });

// Flashcard API helpers
export const getFlashcards = (params?: { lessonId?: string; difficulty?: string; limit?: number }) => {
  const queryParams = new URLSearchParams();
  if (params?.lessonId) queryParams.append('lessonId', params.lessonId);
  if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  const queryString = queryParams.toString();
  return api<{ flashcards: any[] }>(`/flashcards${queryString ? `?${queryString}` : ''}`);
};
export const getDueFlashcards = (limit?: number) =>
  api<{ flashcards: any[] }>(`/flashcards/due${limit ? `?limit=${limit}` : ''}`);
export const createFlashcard = (data: { lessonId: string; front: string; back: string; difficulty?: string; tags?: string[] }) =>
  api<{ flashcard: any }>("/flashcards", { method: "POST", body: JSON.stringify(data) });
export const updateFlashcard = (id: string, data: { front?: string; back?: string; difficulty?: string; tags?: string[] }) =>
  api<{ flashcard: any }>(`/flashcards/${id}`, { method: "PATCH", body: JSON.stringify(data) });
export const deleteFlashcard = (id: string) =>
  api<{ success: boolean; message: string }>(`/flashcards/${id}`, { method: "DELETE" });
export const reviewFlashcard = (id: string, quality: number) =>
  api<{ success: boolean; nextReviewDate: string; interval: number; easeFactor: number }>(`/flashcards/${id}/review`, 
    { method: "POST", body: JSON.stringify({ quality }) });
export const getFlashcardStats = () =>
  api<{ stats: any; subjectStats: any[]; recentActivity: any[] }>("/flashcards/stats");

// Syllabus API helpers
export const getSyllabus = () =>
  api<{ grades: any[]; subjects: any[]; lessons: any[] }>("/syllabus");
export const getSyllabusTree = (gradeId: string) =>
  api<{ grade: any; subjects: any[] }>(`/syllabus/tree/${gradeId}`);
export const getLesson = (lessonId: string) =>
  api<{ lesson: any }>(`/syllabus/lesson/${lessonId}`);
export const updateLesson = (
  lessonId: string,
  data: { title?: string; pages?: string; summary?: string; keyTerms?: any[]; points?: string[]; story?: any; flashcards?: any[]; arabic?: any[] }
) => api<{ lesson: any }>(`/syllabus/lesson/${lessonId}`, { method: "PATCH", body: JSON.stringify(data) });
