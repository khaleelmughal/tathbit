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

// Teacher API helpers
export const getStudentProgress = (studentId: number) => api(`/progress/student/${studentId}`);
export const createQuestion = (data: any) => api("/questions", { method: "POST", body: JSON.stringify(data) });
export const getQuestions = () => api<{ questions: any[] }>("/questions");
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
