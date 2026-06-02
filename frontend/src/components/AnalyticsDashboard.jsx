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

const T = {
  paper: "#FBF7EE", paper2: "#F3ECDD", card: "#FFFFFF", ink: "#2B3A33", ink2: "#5C6B62",
  faint: "#8A968D", line: "#E8E0CF", green: "#1E7A57", greenSoft: "#E4F1E9", gold: "#C99A2E",
};

const Card = ({ children, style = {} }) => (
  <div style={{
    background: T.card, border: `1px solid ${T.line}`,
    borderRadius: "12px", padding: "24px", ...style
  }}>
    {children}
  </div>
);

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = T.green }) => (
  <Card style={{ textAlign: "center" }}>
    <div style={{ display: "flex", justifyContent: "center", marginBottom: "12px" }}>
      <Icon size={24} color={color} />
    </div>
    <div style={{ 
      fontSize: "32px", 
      fontWeight: "bold", 
      color: T.ink,
      marginBottom: "4px" 
    }}>
      {value}
    </div>
    <div style={{ 
      fontSize: "14px", 
      color: T.ink2,
      fontWeight: "600",
      marginBottom: "4px" 
    }}>
      {title}
    </div>
    {subtitle && (
      <div style={{ fontSize: "12px", color: T.faint }}>
        {subtitle}
      </div>
    )}
    {trend && (
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        gap: "4px",
        marginTop: "8px",
        fontSize: "12px",
        color: trend > 0 ? "#16a34a" : "#dc2626"
      }}>
        {trend > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {Math.abs(trend)}%
      </div>
    )}
  </Card>
);

const ProgressBar = ({ percentage, color = T.green }) => (
  <div style={{
    width: "100%",
    height: "8px",
    backgroundColor: T.line,
    borderRadius: "4px",
    overflow: "hidden"
  }}>
    <div style={{
      height: "100%",
      backgroundColor: color,
      width: `${Math.min(100, Math.max(0, percentage))}%`,
      transition: "width 0.3s ease"
    }} />
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
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5530] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ color: "#DC2626", padding: "20px", textAlign: "center" }}>
          Error: {error}
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={loadAnalytics}
              style={{
                background: T.green,
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </Card>
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
    <div className="space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{
            fontSize: "28px",
            fontFamily: "Fraunces, serif",
            color: T.ink,
            margin: 0,
            marginBottom: "4px"
          }}>
            Analytics Dashboard
          </h1>
          <p style={{
            fontSize: "16px",
            color: T.ink2,
            margin: 0
          }}>
            Comprehensive insights into student performance and learning patterns
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          style={{
            background: T.green,
            color: "white",
            border: "none",
            padding: "8px 16px",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500"
          }}
        >
          Refresh Data
        </button>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={systemStats.total_students || 0}
          subtitle="Active learners"
          icon={Users}
          color="#3b82f6"
        />
        <StatCard
          title="Total Questions"
          value={systemStats.total_questions || 0}
          subtitle="Available content"
          icon={BookOpen}
          color="#8b5cf6"
        />
        <StatCard
          title="Total Attempts"
          value={systemStats.total_attempts || 0}
          subtitle="Learning sessions"
          icon={Target}
          color="#f59e0b"
        />
        <StatCard
          title="Success Rate"
          value={`${overallSuccessRate}%`}
          subtitle="Overall performance"
          icon={TrendingUp}
          color={overallSuccessRate >= 70 ? "#10b981" : overallSuccessRate >= 50 ? "#f59e0b" : "#ef4444"}
        />
      </div>

      {/* Subject Performance */}
      {subjectPerformance && subjectPerformance.length > 0 && (
        <Card>
          <h2 style={{
            fontSize: "20px",
            fontFamily: "Fraunces, serif",
            color: T.ink,
            margin: "0 0 20px 0"
          }}>
            Subject Performance Overview
          </h2>
          <div className="space-y-4">
            {subjectPerformance.map((subject, index) => (
              <div key={index} style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center",
                padding: "16px",
                background: T.paper,
                borderRadius: "8px"
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "600", fontSize: "16px", color: T.ink, marginBottom: "4px" }}>
                    {subject.subject_id}
                  </div>
                  <div style={{ fontSize: "14px", color: T.ink2 }}>
                    {subject.question_count} questions • {subject.total_attempts} attempts
                  </div>
                  <div style={{ marginTop: "8px" }}>
                    <ProgressBar 
                      percentage={subject.success_rate || 0}
                      color={subject.success_rate >= 70 ? "#10b981" : subject.success_rate >= 50 ? "#f59e0b" : "#ef4444"}
                    />
                  </div>
                </div>
                <div style={{ 
                  fontSize: "24px", 
                  fontWeight: "bold", 
                  color: subject.success_rate >= 70 ? "#10b981" : subject.success_rate >= 50 ? "#f59e0b" : "#ef4444",
                  marginLeft: "20px",
                  minWidth: "60px",
                  textAlign: "right"
                }}>
                  {subject.success_rate || 0}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Students */}
        {studentPerformance && studentPerformance.length > 0 && (
          <Card>
            <h3 style={{
              fontSize: "18px",
              fontFamily: "Fraunces, serif",
              color: T.ink,
              margin: "0 0 16px 0"
            }}>
              Top Performing Students
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {studentPerformance.slice(0, 10).map((student, index) => (
                <div key={student.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: index < 3 ? T.greenSoft : T.paper,
                  borderRadius: "6px",
                  border: index < 3 ? `1px solid ${T.green}` : "1px solid transparent"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: T.ink }}>
                      #{index + 1} {student.name}
                    </div>
                    <div style={{ fontSize: "12px", color: T.ink2 }}>
                      {student.class_name || 'No class'} • {student.total_attempts} attempts
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "16px", 
                    fontWeight: "bold", 
                    color: T.green 
                  }}>
                    {student.success_rate || 0}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Struggling Students */}
        {strugglingStudents && strugglingStudents.length > 0 && (
          <Card>
            <h3 style={{
              fontSize: "18px",
              fontFamily: "Fraunces, serif",
              color: T.ink,
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <AlertTriangle size={20} color="#ef4444" />
              Students Needing Support
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {strugglingStudents.map((student) => (
                <div key={student.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#fef2f2",
                  borderRadius: "6px",
                  border: "1px solid #fecaca"
                }}>
                  <div>
                    <div style={{ fontWeight: "600", fontSize: "14px", color: T.ink }}>
                      {student.name}
                    </div>
                    <div style={{ fontSize: "12px", color: T.ink2 }}>
                      {student.class_name || 'No class'} • {student.total_attempts} attempts
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: "16px", 
                    fontWeight: "bold", 
                    color: "#ef4444" 
                  }}>
                    {student.success_rate || 0}%
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Question Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Difficult Questions */}
        {difficultQuestions && difficultQuestions.length > 0 && (
          <Card>
            <h3 style={{
              fontSize: "18px",
              fontFamily: "Fraunces, serif",
              color: T.ink,
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <Brain size={20} color="#ef4444" />
              Most Challenging Questions
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {difficultQuestions.map((question, index) => (
                <div key={question.id} style={{
                  padding: "12px",
                  background: T.paper,
                  borderRadius: "6px",
                  border: "1px solid " + T.line
                }}>
                  <div style={{ 
                    fontSize: "14px", 
                    fontWeight: "600", 
                    color: T.ink,
                    marginBottom: "4px"
                  }}>
                    {question.prompt.length > 60 ? question.prompt.substring(0, 60) + '...' : question.prompt}
                  </div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <div style={{ fontSize: "12px", color: T.ink2 }}>
                      {question.subject_id} • {question.attempt_count} attempts
                    </div>
                    <div style={{ 
                      fontSize: "14px", 
                      fontWeight: "bold", 
                      color: "#ef4444" 
                    }}>
                      {question.success_rate || 0}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Class Performance Comparison */}
        {classPerformance && classPerformance.length > 0 && (
          <Card>
            <h3 style={{
              fontSize: "18px",
              fontFamily: "Fraunces, serif",
              color: T.ink,
              margin: "0 0 16px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <GraduationCap size={20} color={T.green} />
              Class Performance
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {classPerformance.map((cls) => (
                <div key={cls.id} style={{
                  padding: "12px",
                  background: T.paper,
                  borderRadius: "6px",
                  border: "1px solid " + T.line
                }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "8px" 
                  }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: T.ink }}>
                        {cls.class_name}
                      </div>
                      <div style={{ fontSize: "12px", color: T.ink2 }}>
                        {cls.teacher_name || 'No teacher'} • {cls.student_count} students
                      </div>
                    </div>
                    <div style={{ 
                      fontSize: "16px", 
                      fontWeight: "bold", 
                      color: cls.class_success_rate >= 70 ? "#10b981" : cls.class_success_rate >= 50 ? "#f59e0b" : "#ef4444"
                    }}>
                      {cls.class_success_rate || 0}%
                    </div>
                  </div>
                  <ProgressBar 
                    percentage={cls.class_success_rate || 0}
                    color={cls.class_success_rate >= 70 ? "#10b981" : cls.class_success_rate >= 50 ? "#f59e0b" : "#ef4444"}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Activity Trends */}
      {dailyActivity && dailyActivity.length > 0 && (
        <Card>
          <h3 style={{
            fontSize: "18px",
            fontFamily: "Fraunces, serif",
            color: T.ink,
            margin: "0 0 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <Calendar size={20} color={T.green} />
            Daily Activity Trends (Last 30 Days)
          </h3>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", 
            gap: "8px",
            maxHeight: "200px",
            overflowY: "auto"
          }}>
            {dailyActivity.slice(0, 15).map((day) => (
              <div key={day.date} style={{
                padding: "8px",
                background: T.paper,
                borderRadius: "4px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "12px", color: T.faint, marginBottom: "4px" }}>
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div style={{ fontSize: "16px", fontWeight: "bold", color: T.ink }}>
                  {day.attempts}
                </div>
                <div style={{ fontSize: "11px", color: T.green }}>
                  {day.correct_attempts} correct
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsDashboard;