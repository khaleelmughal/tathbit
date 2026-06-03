import { useState, useEffect } from 'react';
import { getAnalytics } from '../lib/api';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  AlertTriangle,
  Brain,
  Target,
  Calendar,
  BookOpen,
  GraduationCap,
  Clock,
  Layers,
  Zap,
  Activity,
  LogIn,
  LogOut
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'text-brand' }) => (
  <div className="bg-white border border-line rounded-xl p-6 text-center" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
    <div className="flex justify-center mb-3">
      <Icon size={24} className={color} />
    </div>
    <div className="text-3xl font-bold text-ink mb-1 font-sans">
      {value}
    </div>
    <div className="text-sm text-ink2 font-semibold mb-1 font-sans">
      {title}
    </div>
    {subtitle && (
      <div className="text-xs text-faint font-sans">
        {subtitle}
      </div>
    )}
    {trend && (
      <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${
        trend > 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

const ProgressBar = ({ percentage, colorClass = 'bg-brand' }) => (
  <div className="w-full h-2 bg-line rounded-full overflow-hidden">
    <div 
      className={`h-full ${colorClass} transition-all duration-300`}
      style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
    />
  </div>
);

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await getAnalytics();
      setAnalytics(response.analytics);
    } catch (err) {
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-ink2 font-sans">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
        <div className="text-red-600 p-5 text-center">
          Error: {error}
          <div className="mt-4">
            <button
              onClick={loadAnalytics}
              className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const { 
    systemStats, 
    questionPerformance, 
    subjectPerformance, 
    studentPerformance, 
    strugglingStudents, 
    difficultQuestions,
    dailyActivity,
    classPerformance,
    modeBreakdown = [],
    speedTrend = [],
    flashcardStats = [],
    hardestFlashcards = [],
    recentActivity = []
  } = analytics;

  const overallSuccessRate = systemStats.total_attempts > 0 
    ? Math.round((systemStats.correct_attempts / systemStats.total_attempts) * 100)
    : 0;

  // Chart colors for consistent design
  const chartColors = {
    primary: '#1E7A57',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
    purple: '#8B5CF6'
  };

  // Prepare chart data
  const subjectChartData = subjectPerformance?.map((subject, index) => ({
    subject: subject.subject_id.replace('g5-', '').replace('-', ' ').toUpperCase(),
    success_rate: subject.success_rate || 0,
    attempts: subject.total_attempts || 0,
    questions: subject.question_count || 0,
    color: subject.success_rate >= 70 ? chartColors.success : 
           subject.success_rate >= 50 ? chartColors.warning : chartColors.danger
  })) || [];

  const activityChartData = dailyActivity?.slice(0, 14).reverse().map(day => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    attempts: day.attempts || 0,
    correct: day.correct_attempts || 0,
    success_rate: day.attempts > 0 ? Math.round((day.correct_attempts / day.attempts) * 100) : 0
  })) || [];

  // ---- New panels: labels + derived numbers (counts arrive as strings) ----
  const num = (v) => Number(v) || 0;
  const MODE_LABEL = {
    'exam-practice': 'Mixed test',
    'quick-quiz': 'Quick quiz',
    'lesson-practice': 'Lesson practice'
  };
  const modeRows = (modeBreakdown || []).map(m => ({
    mode: m.mode || 'unknown',
    label: MODE_LABEL[m.mode] || (m.mode || 'Other'),
    kind: m.mode === 'exam-practice' ? 'Mixed' : 'Fixed',
    sessions: num(m.sessions),
    avgScore: num(m.avg_score_pct),
    avgSeconds: num(m.avg_seconds)
  }));
  const speedRows = (speedTrend || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    seconds: num(d.avg_seconds),
    score: num(d.avg_score_pct),
    sessions: num(d.sessions)
  }));
  const speedDelta = speedRows.length >= 2
    ? speedRows[speedRows.length - 1].seconds - speedRows[0].seconds : 0; // negative = faster
  const fcByResult = { known: 0, learning: 0, forgot: 0 };
  (flashcardStats || []).forEach(r => { if (r.result in fcByResult) fcByResult[r.result] = num(r.count); });
  const fcTotal = fcByResult.known + fcByResult.learning + fcByResult.forgot;
  const fmtAgo = (ts) => {
    const s = Math.max(1, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
    if (s < 60) return s + 's ago';
    const m = Math.round(s / 60); if (m < 60) return m + 'm ago';
    const h = Math.round(m / 60); if (h < 24) return h + 'h ago';
    return Math.round(h / 24) + 'd ago';
  };
  const ACT = {
    login:            { icon: LogIn,  color: 'text-emerald-600', label: 'Logged in' },
    logout:           { icon: LogOut, color: 'text-faint',       label: 'Logged out' },
    lesson_view:      { icon: BookOpen, color: 'text-blue-600',  label: 'Read a lesson' },
    quiz_complete:    { icon: Target, color: 'text-brand',       label: 'Finished a quiz' },
    flashcard_session:{ icon: Layers, color: 'text-purple-600',  label: 'Reviewed flashcards' }
  };

  return (
    <div className="max-w-none mx-auto space-y-6 px-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-1">
            Analytics Dashboard
          </h1>
          <p className="text-ink2 font-sans">
            Comprehensive insights into student performance and learning patterns
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={systemStats.total_students || 0}
          subtitle="Active learners"
          icon={Users}
          color="text-blue-500"
        />
        <StatCard
          title="Total Questions"
          value={systemStats.total_questions || 0}
          subtitle="Available content"
          icon={BookOpen}
          color="text-purple-500"
        />
        <StatCard
          title="Total Attempts"
          value={systemStats.total_attempts || 0}
          subtitle="Learning sessions"
          icon={Target}
          color="text-amber-500"
        />
        <StatCard
          title="Success Rate"
          value={`${overallSuccessRate}%`}
          subtitle="Overall performance"
          icon={TrendingUp}
          color={overallSuccessRate >= 70 ? 'text-emerald-500' : overallSuccessRate >= 50 ? 'text-amber-500' : 'text-red-500'}
        />
      </div>

      {/* Subject Performance Chart */}
      {subjectChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
            <h2 className="text-xl font-serif text-ink mb-5 flex items-center gap-2">
              <BarChart3 size={24} className="text-brand" />
              Subject Success Rates
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CF" />
                  <XAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 12, fill: '#5C6B62' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#5C6B62' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8E0CF',
                      borderRadius: '8px',
                      color: '#2B3A33'
                    }}
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'success_rate' ? 'Success Rate' : name
                    ]}
                  />
                  <Bar 
                    dataKey="success_rate" 
                    fill={chartColors.primary}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
            <h3 className="text-xl font-serif text-ink mb-5">
              Subject Details
            </h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {subjectPerformance.map((subject, index) => (
                <div key={index} className="flex justify-between items-center p-4 bg-paper rounded-lg">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-ink mb-1 font-sans">
                      {subject.subject_id.replace('g5-', '').replace('-', ' ').toUpperCase()}
                    </div>
                    <div className="text-sm text-ink2 font-sans">
                      {subject.question_count} questions • {subject.total_attempts} attempts
                    </div>
                    <div className="mt-2">
                      <ProgressBar 
                        percentage={subject.success_rate || 0}
                        colorClass={subject.success_rate >= 70 ? 'bg-emerald-500' : subject.success_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                      />
                    </div>
                  </div>
                  <div className={`text-2xl font-bold ml-5 min-w-[60px] text-right font-sans ${
                    subject.success_rate >= 70 ? 'text-emerald-500' : subject.success_rate >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {subject.success_rate || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Students */}
        {studentPerformance && studentPerformance.length > 0 && (
          <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
            <h3 className="text-lg font-serif text-ink mb-4">
              Top Performing Students
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {studentPerformance.slice(0, 10).map((student, index) => (
                <div key={student.id} className={`flex justify-between items-center p-3 rounded-lg border ${
                  index < 3 ? 'bg-brandSoft border-brand' : 'bg-paper border-transparent'
                }`}>
                  <div>
                    <div className="font-semibold text-sm text-ink font-sans">
                      #{index + 1} {student.name}
                    </div>
                    <div className="text-xs text-ink2 font-sans">
                      {student.class_name || 'No class'} • {student.total_attempts} attempts
                    </div>
                  </div>
                  <div className="text-lg font-bold text-brand font-sans">
                    {student.success_rate || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Struggling Students */}
        {strugglingStudents && strugglingStudents.length > 0 && (
          <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
            <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Students Needing Support
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {strugglingStudents.map((student) => (
                <div key={student.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <div className="font-semibold text-sm text-ink font-sans">
                      {student.name}
                    </div>
                    <div className="text-xs text-ink2 font-sans">
                      {student.class_name || 'No class'} • {student.total_attempts} attempts
                    </div>
                  </div>
                  <div className="text-lg font-bold text-red-500 font-sans">
                    {student.success_rate || 0}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class Performance Comparison */}
      {classPerformance && classPerformance.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <GraduationCap size={20} className="text-brand" />
            Class Performance
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {classPerformance.map((cls) => (
              <div key={cls.id} className="p-3 bg-paper rounded-lg border border-line">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <div className="font-semibold text-sm text-ink font-sans">
                      {cls.class_name}
                    </div>
                    <div className="text-xs text-ink2 font-sans">
                      {cls.teacher_name || 'No teacher'} • {cls.student_count} students
                    </div>
                  </div>
                  <div className={`text-lg font-bold font-sans ${
                    cls.class_success_rate >= 70 ? 'text-emerald-500' : cls.class_success_rate >= 50 ? 'text-amber-500' : 'text-red-500'
                  }`}>
                    {cls.class_success_rate || 0}%
                  </div>
                </div>
                <ProgressBar 
                  percentage={cls.class_success_rate || 0}
                  colorClass={cls.class_success_rate >= 70 ? 'bg-emerald-500' : cls.class_success_rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Trends Chart */}
      {activityChartData.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-brand" />
            Daily Activity Trends (Last 14 Days)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CF" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: '#5C6B62' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12, fill: '#5C6B62' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E8E0CF',
                    borderRadius: '8px',
                    color: '#2B3A33'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="attempts" 
                  stroke={chartColors.info} 
                  strokeWidth={3}
                  dot={{ fill: chartColors.info, strokeWidth: 2, r: 5 }}
                  name="Total Attempts"
                />
                <Line 
                  type="monotone" 
                  dataKey="correct" 
                  stroke={chartColors.success} 
                  strokeWidth={3}
                  dot={{ fill: chartColors.success, strokeWidth: 2, r: 5 }}
                  name="Correct Answers"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Student Failure Analysis - Critical for Teachers */}
      {difficultQuestions && difficultQuestions.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            Questions Students Struggle With Most
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={difficultQuestions.slice(0, 8).map(q => ({
                  question: q.prompt.length > 30 ? q.prompt.substring(0, 30) + '...' : q.prompt,
                  failure_rate: 100 - (q.success_rate || 0),
                  attempts: q.attempt_count || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CF" />
                  <XAxis 
                    dataKey="question" 
                    tick={{ fontSize: 10, fill: '#5C6B62' }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: '#5C6B62' }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E8E0CF',
                      borderRadius: '8px',
                      color: '#2B3A33'
                    }}
                    formatter={(value, name) => [
                      `${value}%`,
                      name === 'failure_rate' ? 'Failure Rate' : name
                    ]}
                  />
                  <Bar 
                    dataKey="failure_rate" 
                    fill={chartColors.danger}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {difficultQuestions.map((question, index) => (
                <div key={question.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-sm font-semibold text-ink mb-1 font-sans">
                    #{index + 1}: {question.prompt.length > 60 ? question.prompt.substring(0, 60) + '...' : question.prompt}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-ink2 font-sans">
                      {question.subject_id} • {question.attempt_count} attempts
                    </div>
                    <div className="text-sm font-bold text-red-500 font-sans">
                      {100 - (question.success_rate || 0)}% fail rate
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Test types: mixed (exam) vs fixed (quick/lesson), with timing */}
      {modeRows.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <Target size={20} className="text-brand" />
            Test types — mixed vs fixed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modeRows.map((m) => (
              <div key={m.mode} className="p-4 rounded-lg border border-line bg-paper">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-ink font-sans">{m.label}</span>
                  <span className={`text-xs font-semibold font-sans ${m.kind === 'Mixed' ? 'text-purple-600' : 'text-ink2'}`}>{m.kind}</span>
                </div>
                <div className="text-2xl font-bold text-ink font-sans">{m.avgScore}%</div>
                <div className="text-xs text-ink2 font-sans">avg score</div>
                <div className="mt-2 text-xs text-faint font-sans">
                  {m.sessions} test{m.sessions === 1 ? '' : 's'} • {m.avgSeconds}s avg
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Speed & accuracy trend — are students getting faster / better? */}
      {speedRows.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-1 flex items-center gap-2">
            <Zap size={20} className="text-amber-500" />
            Speed &amp; accuracy over time
          </h3>
          <p className="text-xs text-ink2 mb-4 font-sans">
            {speedRows.length < 2 ? 'Not enough sessions yet to show a trend.' :
              speedDelta < 0
                ? `Getting faster — about ${Math.abs(Math.round(speedDelta))}s quicker per test than at the start.`
                : speedDelta > 0
                  ? `Slowing down — about ${Math.round(speedDelta)}s longer per test than at the start.`
                  : 'Holding steady on time.'}
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E0CF" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5C6B62' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#5C6B62' }} label={{ value: 'seconds', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#8A968D' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11, fill: '#5C6B62' }} label={{ value: '% score', angle: 90, position: 'insideRight', fontSize: 11, fill: '#8A968D' }} />
                <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E8E0CF', borderRadius: '8px', color: '#2B3A33' }} />
                <Line yAxisId="left" type="monotone" dataKey="seconds" name="Avg time (s)" stroke={chartColors.warning} strokeWidth={2} dot={{ r: 3 }} />
                <Line yAxisId="right" type="monotone" dataKey="score" name="Avg score (%)" stroke={chartColors.primary} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Flashcard knowledge + hardest cards */}
      {(fcTotal > 0 || hardestFlashcards.length > 0) && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <Layers size={20} className="text-purple-600" />
            Flashcard knowledge
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-lg bg-emerald-50 text-center">
                  <div className="text-2xl font-bold text-emerald-600 font-sans">{fcByResult.known}</div>
                  <div className="text-xs text-ink2 font-sans">Known</div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 text-center">
                  <div className="text-2xl font-bold text-amber-600 font-sans">{fcByResult.learning}</div>
                  <div className="text-xs text-ink2 font-sans">Learning</div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 text-center">
                  <div className="text-2xl font-bold text-red-500 font-sans">{fcByResult.forgot}</div>
                  <div className="text-xs text-ink2 font-sans">Forgot</div>
                </div>
              </div>
              {fcTotal > 0 && (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: 'Known', value: fcByResult.known },
                        { name: 'Learning', value: fcByResult.learning },
                        { name: 'Forgot', value: fcByResult.forgot }
                      ].filter(d => d.value > 0)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70}>
                        <Cell fill={chartColors.success} />
                        <Cell fill={chartColors.warning} />
                        <Cell fill={chartColors.danger} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-ink mb-2 font-sans">Cards most often forgotten</div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {hardestFlashcards.length === 0 && (
                  <div className="text-sm text-ink2 font-sans">No forgotten cards yet.</div>
                )}
                {hardestFlashcards.map((c) => (
                  <div key={c.card_id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm font-semibold text-ink font-sans">
                      {c.front ? (c.front.length > 70 ? c.front.substring(0, 70) + '…' : c.front) : c.card_id}
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-ink2 font-sans">{c.subject_id || ''}</span>
                      <span className="text-sm font-bold text-red-500 font-sans">{num(c.forgot)} forgot / {num(c.reviews)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity feed */}
      {recentActivity.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6" style={{boxShadow: "0 1px 3px rgba(43, 58, 51, 0.08), 0 1px 2px rgba(43, 58, 51, 0.04)"}}>
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <Activity size={20} className="text-brand" />
            Recent activity
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {recentActivity.map((e, i) => {
              const cfg = ACT[e.type] || { icon: Activity, color: 'text-ink2', label: e.type };
              const Icon = cfg.icon;
              const meta = e.meta && typeof e.meta === 'object' ? e.meta : {};
              const detail = e.type === 'quiz_complete' && meta.score != null
                ? `${meta.score}/${meta.total}${e.subject_id ? ' · ' + e.subject_id : ''}`
                : e.type === 'flashcard_session' && meta.reviewed != null
                  ? `${meta.reviewed} cards`
                  : (e.subject_id || '');
              return (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-paper">
                  <Icon size={16} className={cfg.color} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-ink font-sans truncate">
                      <span className="font-semibold">{e.student_name}</span> — {cfg.label}
                      {detail ? <span className="text-ink2"> ({detail})</span> : null}
                    </div>
                  </div>
                  <span className="text-xs text-faint font-sans whitespace-nowrap">{fmtAgo(e.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;