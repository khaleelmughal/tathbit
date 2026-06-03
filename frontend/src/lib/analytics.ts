// frontend/src/lib/analytics.js
// Anonymous GA4 tracking. Keyed by opaque DB IDs only — never names or emails.
// Pair with the gtag snippet in index.html (see config flags note below).

const GA_ID = "G-FJ41353V79";

// Call once on login (and after a page refresh that restores the session) so every
// event is tied to the same pseudonymous person across the session/devices.
export function identify(user) {
  if (!window.gtag || !user) return;
  window.gtag("config", GA_ID, { user_id: String(user.id) }); // opaque id, not PII
  window.gtag("set", "user_properties", {
    role: user.role,                          // student | teacher | admin
    class_id: user.classId ?? user.class_id ?? "none",
  });
}

export function clearIdentity() {
  if (!window.gtag) return;
  window.gtag("config", GA_ID, { user_id: undefined });
}

// Generic event sender. Never pass names/emails — IDs and enums only.
export function track(event, params = {}) {
  if (!window.gtag) return;
  window.gtag("event", event, params);
}

// Fire on every client-side route change (SPA pageviews).
export function trackPage(path) {
  if (!window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
  });
}

// ── Convenience wrappers for your app's actions ──────────────────────────────
export const Track = {
  login:            (role)                       => track("login", { role }),
  logout:           ()                           => track("logout"),

  lessonViewed:     (subjectId, lessonId)        => track("lesson_viewed", { subject_id: subjectId, lesson_id: lessonId }),

  quizStarted:      (mode, subjectId)            => track("quiz_started", { mode, subject_id: subjectId }), // mode: lesson|quick|exam|mixed
  questionAnswered: (p)                          => track("question_answered", p),  // { subject_id, lesson_id, question_type, is_correct }
  quizCompleted:    (p)                          => track("quiz_completed", p),      // { mode, subject_id, score, total }

  flashcardsOpened: (subjectId)                  => track("flashcards_opened", { subject_id: subjectId }),
  flashcardReviewed:(result, subjectId)          => track("flashcard_reviewed", { result, subject_id: subjectId }), // result: known|learning|forgot

  questionCreated:  (subjectId, by)              => track("question_created", { subject_id: subjectId, by_role: by }),
  questionEdited:   (questionId, by)             => track("question_edited", { question_id: questionId, by_role: by }),
  classCreated:     (classId)                    => track("class_created", { class_id: classId }),
  studentAssigned:  (classId)                    => track("student_assigned", { class_id: classId }),
  testCreated:      (subjectId)                  => track("test_created", { subject_id: subjectId }),
};