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
  GraduationCap
} from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'text-brand' }) => (
  <div className="bg-white border border-line rounded-xl p-6 text-center">
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
      <div className="bg-white border border-line rounded-xl p-6">
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
      <div className="bg-white border border-line rounded-xl p-6">
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
    classPerformance
  } = analytics;

  const overallSuccessRate = systemStats.total_attempts > 0 
    ? Math.round((systemStats.correct_attempts / systemStats.total_attempts) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
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

      {/* Subject Performance */}
      {subjectPerformance && subjectPerformance.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6">
          <h2 className="text-xl font-serif text-ink mb-5">
            Subject Performance Overview
          </h2>
          <div className="space-y-4">
            {subjectPerformance.map((subject, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-paper rounded-lg">
                <div className="flex-1">
                  <div className="font-semibold text-lg text-ink mb-1 font-sans">
                    {subject.subject_id}
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
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Students */}
        {studentPerformance && studentPerformance.length > 0 && (
          <div className="bg-white border border-line rounded-xl p-6">
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
          <div className="bg-white border border-line rounded-xl p-6">
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

      {/* Question Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Difficult Questions */}
        {difficultQuestions && difficultQuestions.length > 0 && (
          <div className="bg-white border border-line rounded-xl p-6">
            <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
              <Brain size={20} className="text-red-500" />
              Most Challenging Questions
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {difficultQuestions.map((question, index) => (
                <div key={question.id} className="p-3 bg-paper rounded-lg border border-line">
                  <div className="text-sm font-semibold text-ink mb-1 font-sans">
                    {question.prompt.length > 60 ? question.prompt.substring(0, 60) + '...' : question.prompt}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-ink2 font-sans">
                      {question.subject_id} • {question.attempt_count} attempts
                    </div>
                    <div className="text-sm font-bold text-red-500 font-sans">
                      {question.success_rate || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Class Performance Comparison */}
        {classPerformance && classPerformance.length > 0 && (
          <div className="bg-white border border-line rounded-xl p-6">
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
      </div>

      {/* Activity Trends */}
      {dailyActivity && dailyActivity.length > 0 && (
        <div className="bg-white border border-line rounded-xl p-6">
          <h3 className="text-lg font-serif text-ink mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-brand" />
            Daily Activity Trends (Last 30 Days)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3 max-h-48 overflow-y-auto">
            {dailyActivity.slice(0, 15).map((day) => (
              <div key={day.date} className="p-3 bg-paper rounded-lg text-center">
                <div className="text-xs text-faint mb-1 font-sans">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="text-lg font-bold text-ink font-sans">
                  {day.attempts}
                </div>
                <div className="text-xs text-brand font-sans">
                  {day.correct_attempts} correct
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;