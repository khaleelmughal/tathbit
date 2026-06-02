import { useState, useEffect } from 'react';
import { 
  getFlashcards, 
  createFlashcard, 
  updateFlashcard, 
  deleteFlashcard, 
  getFlashcardStats,
  reviewFlashcard,
  getDueFlashcards
} from '../lib/api';
import { 
  Brain, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Clock,
  Target,
  TrendingUp,
  BarChart3,
  Zap
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

const Btn = ({ children, onClick, disabled, variant = "outline", type = "button", style = {} }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    style={{
      background: variant === "primary" ? T.green : variant === "danger" ? "#dc2626" : "transparent",
      color: variant === "primary" || variant === "danger" ? "white" : T.ink,
      border: variant === "primary" || variant === "danger" ? "none" : `1px solid ${T.line}`,
      padding: "8px 16px", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px", fontWeight: "500", opacity: disabled ? 0.6 : 1,
      fontFamily: "Plus Jakarta Sans, sans-serif",
      display: "flex", alignItems: "center", gap: "6px",
      ...style
    }}
  >
    {children}
  </button>
);

const FlashcardPreview = ({ flashcard, onEdit, onDelete, isStudent, onReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showingAnswer, setShowingAnswer] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return T.faint;
    }
  };

  const getNextReviewText = (flashcard) => {
    if (!flashcard.next_review_date) return 'New card';
    const nextDate = new Date(flashcard.next_review_date);
    const now = new Date();
    const diffDays = Math.ceil((nextDate - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 'Due now';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
  };

  const handleReview = (quality) => {
    onReview(flashcard.id, quality);
    setShowingAnswer(false);
    setIsFlipped(false);
  };

  return (
    <Card style={{ 
      marginBottom: "16px",
      minHeight: "200px",
      position: "relative",
      background: isFlipped ? T.greenSoft : T.card
    }}>
      {/* Header */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "16px" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Brain size={16} color={T.green} />
          <span style={{
            background: getDifficultyColor(flashcard.difficulty),
            color: "white",
            padding: "2px 8px",
            borderRadius: "12px",
            fontSize: "12px",
            fontWeight: "500",
            textTransform: "capitalize"
          }}>
            {flashcard.difficulty || 'medium'}
          </span>
          {isStudent && (
            <span style={{
              background: flashcard.next_review_date && new Date(flashcard.next_review_date) <= new Date() 
                ? "#fef2f2" : T.paper2,
              color: flashcard.next_review_date && new Date(flashcard.next_review_date) <= new Date()
                ? "#dc2626" : T.ink2,
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "500"
            }}>
              {getNextReviewText(flashcard)}
            </span>
          )}
        </div>
        
        <div style={{ display: "flex", gap: "8px" }}>
          {isStudent ? (
            <Btn 
              onClick={() => setIsFlipped(!isFlipped)}
              variant="outline"
              style={{ padding: "4px 8px", fontSize: "12px" }}
            >
              {isFlipped ? <EyeOff size={14} /> : <Eye size={14} />}
              {isFlipped ? 'Hide' : 'Flip'}
            </Btn>
          ) : (
            <>
              <Btn 
                onClick={() => onEdit(flashcard)}
                variant="outline"
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                <Edit size={14} />
                Edit
              </Btn>
              <Btn 
                onClick={() => onDelete(flashcard.id)}
                variant="danger"
                style={{ padding: "4px 8px", fontSize: "12px" }}
              >
                <Trash2 size={14} />
                Delete
              </Btn>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{
          fontSize: "18px",
          fontWeight: "600",
          color: T.ink,
          marginBottom: "16px",
          minHeight: "50px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {isFlipped ? flashcard.back : flashcard.front}
        </div>
        
        {isStudent && isFlipped && !showingAnswer && (
          <div>
            <Btn 
              onClick={() => setShowingAnswer(true)}
              variant="primary"
              style={{ margin: "0 auto" }}
            >
              Show Quality Options
            </Btn>
          </div>
        )}

        {isStudent && showingAnswer && (
          <div style={{ marginTop: "20px" }}>
            <p style={{ 
              fontSize: "14px", 
              color: T.ink2, 
              marginBottom: "16px" 
            }}>
              Rate your recall quality:
            </p>
            <div style={{ 
              display: "flex", 
              justifyContent: "center", 
              gap: "8px",
              flexWrap: "wrap" 
            }}>
              {[
                { value: 0, label: "Complete blackout", color: "#dc2626" },
                { value: 1, label: "Incorrect", color: "#ea580c" },
                { value: 2, label: "Difficult", color: "#d97706" },
                { value: 3, label: "Hesitant", color: "#ca8a04" },
                { value: 4, label: "Easy", color: "#16a34a" },
                { value: 5, label: "Perfect", color: "#059669" }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleReview(option.value)}
                  style={{
                    background: option.color,
                    color: "white",
                    border: "none",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                    cursor: "pointer",
                    minWidth: "60px"
                  }}
                >
                  {option.value}
                  <br />
                  <span style={{ fontSize: "10px" }}>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Stats */}
      {isStudent && flashcard.review_count > 0 && (
        <div style={{ 
          marginTop: "16px", 
          padding: "12px", 
          background: T.paper2, 
          borderRadius: "6px",
          fontSize: "12px",
          color: T.ink2
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Reviews: {flashcard.review_count}</span>
            <span>Ease: {flashcard.ease_factor?.toFixed(2) || '2.50'}</span>
            <span>Interval: {flashcard.interval_days || 0} days</span>
          </div>
        </div>
      )}
    </Card>
  );
};

const CreateFlashcardModal = ({ onClose, onFlashcardCreated, editingFlashcard }) => {
  const [formData, setFormData] = useState({
    lessonId: 'aqaaid-001', // Default lesson
    front: '',
    back: '',
    difficulty: 'medium',
    tags: []
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingFlashcard) {
      setFormData({
        lessonId: editingFlashcard.lesson_id || 'aqaaid-001',
        front: editingFlashcard.front || '',
        back: editingFlashcard.back || '',
        difficulty: editingFlashcard.difficulty || 'medium',
        tags: editingFlashcard.tags || []
      });
    }
  }, [editingFlashcard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      if (editingFlashcard) {
        await updateFlashcard(editingFlashcard.id, {
          front: formData.front,
          back: formData.back,
          difficulty: formData.difficulty,
          tags: formData.tags
        });
      } else {
        await createFlashcard(formData);
      }
      
      onFlashcardCreated();
    } catch (error) {
      console.error('Failed to save flashcard:', error);
      alert('Failed to save flashcard: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fefdfb] rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-[#f5f5f0]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-[#2c5530]" style={{ fontFamily: 'Fraunces' }}>
              {editingFlashcard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lesson</label>
            <select
              value={formData.lessonId}
              onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              disabled={!!editingFlashcard}
            >
              <option value="aqaaid-001">Aqaaid - Lesson 1</option>
              <option value="aqaaid-002">Aqaaid - Lesson 2</option>
              <option value="hadeeth-001">Hadeeth - Lesson 1</option>
              <option value="akhlaaq-001">Akhlaaq - Lesson 1</option>
              <option value="fiqh-001">Fiqh - Lesson 1</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Front (Question)</label>
            <textarea
              required
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              rows="3"
              placeholder="Enter the question or prompt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Back (Answer)</label>
            <textarea
              required
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              rows="3"
              placeholder="Enter the answer or explanation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-[#2c5530] text-white rounded-lg hover:bg-[#1e3a21] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : (editingFlashcard ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FlashcardManager = ({ userRole }) => {
  const [flashcards, setFlashcards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState(null);
  const [filters, setFilters] = useState({
    difficulty: '',
    lessonId: ''
  });

  const isStudent = userRole === 'student';

  useEffect(() => {
    loadFlashcards();
    if (!isStudent) {
      loadStats();
    }
  }, [filters]);

  const loadFlashcards = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.lessonId) params.lessonId = filters.lessonId;
      
      const response = isStudent ? await getDueFlashcards(50) : await getFlashcards(params);
      setFlashcards(response.flashcards || []);
    } catch (err) {
      setError(err.message || "Failed to load flashcards");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await getFlashcardStats();
      setStats(response);
    } catch (err) {
      console.error('Failed to load flashcard stats:', err);
    }
  };

  const handleFlashcardCreated = () => {
    setShowCreateModal(false);
    setEditingFlashcard(null);
    loadFlashcards();
    if (!isStudent) loadStats();
  };

  const handleEdit = (flashcard) => {
    setEditingFlashcard(flashcard);
    setShowCreateModal(true);
  };

  const handleDelete = async (flashcardId) => {
    if (!confirm('Are you sure you want to delete this flashcard?')) return;
    
    try {
      await deleteFlashcard(flashcardId);
      loadFlashcards();
      if (!isStudent) loadStats();
    } catch (error) {
      console.error('Failed to delete flashcard:', error);
      alert('Failed to delete flashcard: ' + error.message);
    }
  };

  const handleReview = async (flashcardId, quality) => {
    try {
      await reviewFlashcard(flashcardId, quality);
      loadFlashcards(); // Refresh to update review status
    } catch (error) {
      console.error('Failed to review flashcard:', error);
      alert('Failed to review flashcard: ' + error.message);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5530] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading flashcards...</p>
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
            <Btn onClick={loadFlashcards}>Retry</Btn>
          </div>
        </div>
      </Card>
    );
  }

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
            {isStudent ? 'Study Flashcards' : 'Flashcard Manager'}
          </h1>
          <p style={{
            fontSize: "16px",
            color: T.ink2,
            margin: 0
          }}>
            {isStudent 
              ? 'Review flashcards using spaced repetition for optimal learning' 
              : 'Create and manage flashcards for students'
            }
          </p>
        </div>
        {!isStudent && (
          <Btn 
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            <Plus size={16} />
            Add Flashcard
          </Btn>
        )}
      </div>

      {/* Statistics for Teachers/Admins */}
      {!isStudent && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card style={{ textAlign: "center", padding: "20px" }}>
            <Brain size={24} color={T.green} style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "bold", color: T.ink }}>
              {stats.stats.total_flashcards || 0}
            </div>
            <div style={{ fontSize: "14px", color: T.ink2 }}>Total Flashcards</div>
          </Card>
          <Card style={{ textAlign: "center", padding: "20px" }}>
            <Target size={24} color="#3b82f6" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "bold", color: T.ink }}>
              {stats.stats.total_reviews || 0}
            </div>
            <div style={{ fontSize: "14px", color: T.ink2 }}>Total Reviews</div>
          </Card>
          <Card style={{ textAlign: "center", padding: "20px" }}>
            <TrendingUp size={24} color="#10b981" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "bold", color: T.ink }}>
              {Math.round((stats.stats.avg_success_rate || 0) * 100)}%
            </div>
            <div style={{ fontSize: "14px", color: T.ink2 }}>Success Rate</div>
          </Card>
          <Card style={{ textAlign: "center", padding: "20px" }}>
            <Clock size={24} color="#f59e0b" style={{ margin: "0 auto 12px" }} />
            <div style={{ fontSize: "32px", fontWeight: "bold", color: T.ink }}>
              {stats.stats.cards_due_now || 0}
            </div>
            <div style={{ fontSize: "14px", color: T.ink2 }}>Due Now</div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: "500", 
              color: T.ink,
              marginRight: "8px" 
            }}>
              Difficulty:
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              style={{
                padding: "6px 12px",
                border: `1px solid ${T.line}`,
                borderRadius: "6px",
                fontSize: "14px"
              }}
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label style={{ 
              fontSize: "14px", 
              fontWeight: "500", 
              color: T.ink,
              marginRight: "8px" 
            }}>
              Lesson:
            </label>
            <select
              value={filters.lessonId}
              onChange={(e) => setFilters({ ...filters, lessonId: e.target.value })}
              style={{
                padding: "6px 12px",
                border: `1px solid ${T.line}`,
                borderRadius: "6px",
                fontSize: "14px"
              }}
            >
              <option value="">All Lessons</option>
              <option value="aqaaid-001">Aqaaid - Lesson 1</option>
              <option value="hadeeth-001">Hadeeth - Lesson 1</option>
              <option value="akhlaaq-001">Akhlaaq - Lesson 1</option>
            </select>
          </div>

          <Btn onClick={loadFlashcards} style={{ marginLeft: "auto" }}>
            Refresh
          </Btn>
        </div>
      </Card>

      {/* Flashcards */}
      <Card>
        <h2 style={{
          fontSize: "20px",
          fontFamily: "Fraunces, serif",
          color: T.ink,
          margin: "0 0 20px 0"
        }}>
          {isStudent ? `Flashcards Due for Review (${flashcards.length})` : `All Flashcards (${flashcards.length})`}
        </h2>

        {flashcards.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">
              {isStudent 
                ? 'No flashcards are due for review right now. Great job!' 
                : 'No flashcards found. Create your first flashcard to get started.'
              }
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {flashcards.map(flashcard => (
              <FlashcardPreview
                key={flashcard.id}
                flashcard={flashcard}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isStudent={isStudent}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateFlashcardModal
          onClose={() => {
            setShowCreateModal(false);
            setEditingFlashcard(null);
          }}
          onFlashcardCreated={handleFlashcardCreated}
          editingFlashcard={editingFlashcard}
        />
      )}
    </div>
  );
};

export default FlashcardManager;