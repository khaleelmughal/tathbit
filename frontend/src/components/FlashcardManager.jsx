import { useState, useEffect, useMemo } from 'react';
import { getFlashcardCatalogue, getSyllabus } from '../lib/api';
import { Brain, Layers, TrendingUp, AlertTriangle, BookOpen, RefreshCw, Info } from 'lucide-react';

const num = (v) => Number(v) || 0;

const StatTile = ({ icon: Icon, value, label, color = 'text-brand' }) => (
  <div className="bg-white border border-line rounded-xl p-5 text-center">
    <div className="flex justify-center mb-2"><Icon size={22} className={color} /></div>
    <div className="text-3xl font-bold text-ink font-sans">{value}</div>
    <div className="text-sm text-ink2 font-sans">{label}</div>
  </div>
);

const Chip = ({ children, className }) => (
  <span className={`text-xs px-2 py-0.5 rounded-full font-medium font-sans ${className}`}>{children}</span>
);

const FlashcardManager = ({ refreshTrigger }) => {
  const [cards, setCards] = useState([]);
  const [stats, setStats] = useState({ totalCards: 0, totalReviews: 0, successRate: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [syllabus, setSyllabus] = useState({ grades: [], subjects: [], lessons: [] });
  const [filters, setFilters] = useState({ gradeId: "", subjectId: "", lessonId: "" });

  useEffect(() => { (async () => {
    try { setSyllabus(await getSyllabus()); } catch (e) { /* non-fatal */ }
  })(); }, []);

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filters, refreshTrigger]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await getFlashcardCatalogue({
        gradeId: filters.gradeId || undefined,
        subjectId: filters.subjectId || undefined,
        lessonId: filters.lessonId || undefined,
      });
      setCards(res.cards || []);
      setStats(res.stats || { totalCards: 0, totalReviews: 0, successRate: 0 });
    } catch (e) {
      setError("Could not load flashcards. Make sure the analytics migration has been run.");
    } finally { setLoading(false); }
  };

  const filteredSubjects = useMemo(
    () => syllabus.subjects.filter(s => !filters.gradeId || s.grade_id === filters.gradeId),
    [syllabus.subjects, filters.gradeId]
  );
  const filteredLessons = useMemo(
    () => syllabus.lessons.filter(l => !filters.subjectId || l.subject_id === filters.subjectId),
    [syllabus.lessons, filters.subjectId]
  );
  const totalForgot = useMemo(() => cards.reduce((a, c) => a + num(c.forgot), 0), [cards]);

  const setGrade = (gradeId) => setFilters({ gradeId, subjectId: "", lessonId: "" });
  const setSubject = (subjectId) => setFilters(f => ({ ...f, subjectId, lessonId: "" }));
  const setLesson = (lessonId) => setFilters(f => ({ ...f, lessonId }));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-serif text-ink">Flashcard Manager</h2>
          <p className="text-sm text-ink2 font-sans">The cards students see, sourced from each lesson's content.</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-white text-ink text-sm font-sans hover:bg-paper">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile icon={Brain} value={stats.totalCards} label="Total Flashcards" color="text-brand" />
        <StatTile icon={Layers} value={stats.totalReviews} label="Total Reviews" color="text-blue-600" />
        <StatTile icon={TrendingUp} value={`${stats.successRate}%`} label="Known Rate" color="text-emerald-600" />
        <StatTile icon={AlertTriangle} value={totalForgot} label="Forgotten" color="text-red-500" />
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200">
        <Info size={16} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-sm text-ink2 font-sans m-0">
          Flashcards are part of each lesson. To add, edit or remove a card, open the <strong>Lesson content</strong> tab and edit that lesson's flashcards — changes show here and in the student app immediately.
        </p>
      </div>

      <div className="bg-white border border-line rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-ink2 font-sans mb-1">Grade</label>
            <select value={filters.gradeId} onChange={(e) => setGrade(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white font-sans">
              <option value="">All Grades</option>
              {syllabus.grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink2 font-sans mb-1">Subject</label>
            <select value={filters.subjectId} onChange={(e) => setSubject(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white font-sans">
              <option value="">All Subjects</option>
              {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink2 font-sans mb-1">Lesson</label>
            <select value={filters.lessonId} onChange={(e) => setLesson(e.target.value)} className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-white font-sans">
              <option value="">All Lessons</option>
              {filteredLessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border border-line rounded-xl p-6">
        <h3 className="text-lg font-serif text-ink mb-4">All Flashcards ({cards.length})</h3>

        {loading ? (
          <p className="text-ink2 font-sans text-center py-8">Loading flashcards…</p>
        ) : error ? (
          <p className="text-red-500 font-sans text-center py-8">{error}</p>
        ) : cards.length === 0 ? (
          <div className="text-center py-10">
            <Brain size={34} className="mx-auto text-faint mb-3" />
            <p className="text-ink2 font-sans">No flashcards for this filter. They live in lesson content — add some under the Lesson content tab.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map(c => {
              const reviews = num(c.reviews);
              return (
                <div key={c.card_id} className="p-3 rounded-lg border border-line hover:bg-paper">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink font-sans">{c.front}</div>
                      <div className="text-sm text-ink2 font-sans mt-0.5">{c.back}</div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-faint font-sans">
                        <BookOpen size={13} /> {c.subject_name} · {c.lesson_title}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {reviews === 0 ? (
                        <Chip className="bg-line text-ink2">Not reviewed yet</Chip>
                      ) : (
                        <div className="flex flex-wrap gap-1 justify-end">
                          <Chip className="bg-emerald-50 text-emerald-700">{num(c.known)} known</Chip>
                          <Chip className="bg-amber-50 text-amber-700">{num(c.learning)} learning</Chip>
                          <Chip className="bg-red-50 text-red-600">{num(c.forgot)} forgot</Chip>
                        </div>
                      )}
                      {reviews > 0 && <span className="text-xs text-faint font-sans">{reviews} review{reviews === 1 ? '' : 's'}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardManager;
