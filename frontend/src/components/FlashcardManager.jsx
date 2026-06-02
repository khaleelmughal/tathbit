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
} from 'lucide-react';

const FlashcardPreview = ({ flashcard, onEdit, onDelete, isStudent, onReview }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showingAnswer, setShowingAnswer] = useState(false);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-faint';
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
    <div className={`bg-white border border-line rounded-xl p-6 mb-4 min-h-[200px] relative transition-colors ${isFlipped ? 'bg-brandSoft' : ''}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-brand" />
          <span className={`${getDifficultyColor(flashcard.difficulty)} text-white text-xs px-2 py-1 rounded-full font-medium capitalize`}>
            {flashcard.difficulty || 'medium'}
          </span>
          {isStudent && (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              flashcard.next_review_date && new Date(flashcard.next_review_date) <= new Date() 
                ? 'bg-red-50 text-red-600' : 'bg-paper2 text-ink2'
            }`}>
              {getNextReviewText(flashcard)}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          {isStudent ? (
            <button 
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex items-center gap-1 px-3 py-1 text-xs border border-line rounded-lg hover:bg-paper2 transition-colors"
            >
              {isFlipped ? <EyeOff size={14} /> : <Eye size={14} />}
              {isFlipped ? 'Hide' : 'Flip'}
            </button>
          ) : (
            <>
              <button 
                onClick={() => onEdit(flashcard)}
                className="flex items-center gap-1 px-3 py-1 text-xs border border-line rounded-lg hover:bg-paper2 transition-colors"
              >
                <Edit size={14} />
                Edit
              </button>
              <button 
                onClick={() => onDelete(flashcard.id)}
                className="flex items-center gap-1 px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="text-center py-5">
        <div className="text-lg font-semibold text-ink mb-4 min-h-[50px] flex items-center justify-center">
          {isFlipped ? flashcard.back : flashcard.front}
        </div>
        
        {isStudent && isFlipped && !showingAnswer && (
          <div>
            <button 
              onClick={() => setShowingAnswer(true)}
              className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors"
            >
              Show Quality Options
            </button>
          </div>
        )}

        {isStudent && showingAnswer && (
          <div className="mt-5">
            <p className="text-sm text-ink2 mb-4">
              Rate your recall quality:
            </p>
            <div className="flex justify-center gap-2 flex-wrap">
              {[
                { value: 0, label: "Complete blackout", color: "bg-red-600 hover:bg-red-700" },
                { value: 1, label: "Incorrect", color: "bg-red-500 hover:bg-red-600" },
                { value: 2, label: "Difficult", color: "bg-orange-500 hover:bg-orange-600" },
                { value: 3, label: "Hesitant", color: "bg-yellow-500 hover:bg-yellow-600" },
                { value: 4, label: "Easy", color: "bg-green-500 hover:bg-green-600" },
                { value: 5, label: "Perfect", color: "bg-emerald-500 hover:bg-emerald-600" }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => handleReview(option.value)}
                  className={`${option.color} text-white border-none px-3 py-2 rounded-lg text-xs font-medium cursor-pointer min-w-[60px] transition-colors`}
                >
                  {option.value}
                  <br />
                  <span className="text-[10px]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Student Stats */}
      {isStudent && flashcard.review_count > 0 && (
        <div className="mt-4 p-3 bg-paper2 rounded-lg text-xs text-ink2">
          <div className="flex justify-between">
            <span>Reviews: {flashcard.review_count}</span>
            <span>Ease: {flashcard.ease_factor?.toFixed(2) || '2.50'}</span>
            <span>Interval: {flashcard.interval_days || 0} days</span>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateFlashcardModal = ({ onClose, onFlashcardCreated, editingFlashcard }) => {
  const [formData, setFormData] = useState({
    lessonId: 'aqaaid-001',
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
      <div className="bg-white rounded-xl2 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-line">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif font-medium text-ink">
              {editingFlashcard ? 'Edit Flashcard' : 'Create New Flashcard'}
            </h2>
            <button
              onClick={onClose}
              className="text-faint hover:text-ink text-2xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Lesson</label>
            <select
              value={formData.lessonId}
              onChange={(e) => setFormData({ ...formData, lessonId: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
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
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Front (Question)</label>
            <textarea
              required
              value={formData.front}
              onChange={(e) => setFormData({ ...formData, front: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
              rows="3"
              placeholder="Enter the question or prompt..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Back (Answer)</label>
            <textarea
              required
              value={formData.back}
              onChange={(e) => setFormData({ ...formData, back: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
              rows="3"
              placeholder="Enter the answer or explanation..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
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
              className="flex-1 px-4 py-2 bg-faint text-white rounded-lg hover:bg-ink2 transition-colors font-sans font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 font-sans font-medium"
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
      loadFlashcards();
    } catch (error) {
      console.error('Failed to review flashcard:', error);
      alert('Failed to review flashcard: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-ink2 font-sans">Loading flashcards...</p>
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
              onClick={loadFlashcards}
              className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif text-ink mb-1">
            {isStudent ? 'Study Flashcards' : 'Flashcard Manager'}
          </h1>
          <p className="text-ink2 font-sans">
            {isStudent 
              ? 'Review flashcards using spaced repetition for optimal learning' 
              : 'Create and manage flashcards for students'
            }
          </p>
        </div>
        {!isStudent && (
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Add Flashcard
          </button>
        )}
      </div>

      {/* Statistics for Teachers/Admins */}
      {!isStudent && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-line rounded-xl p-5 text-center">
            <Brain size={24} className="text-brand mx-auto mb-3" />
            <div className="text-2xl font-bold text-ink font-sans">
              {stats.stats.total_flashcards || 0}
            </div>
            <div className="text-sm text-ink2 font-sans">Total Flashcards</div>
          </div>
          <div className="bg-white border border-line rounded-xl p-5 text-center">
            <Target size={24} className="text-blue-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-ink font-sans">
              {stats.stats.total_reviews || 0}
            </div>
            <div className="text-sm text-ink2 font-sans">Total Reviews</div>
          </div>
          <div className="bg-white border border-line rounded-xl p-5 text-center">
            <TrendingUp size={24} className="text-emerald-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-ink font-sans">
              {Math.round((stats.stats.avg_success_rate || 0) * 100)}%
            </div>
            <div className="text-sm text-ink2 font-sans">Success Rate</div>
          </div>
          <div className="bg-white border border-line rounded-xl p-5 text-center">
            <Clock size={24} className="text-amber-500 mx-auto mb-3" />
            <div className="text-2xl font-bold text-ink font-sans">
              {stats.stats.cards_due_now || 0}
            </div>
            <div className="text-sm text-ink2 font-sans">Due Now</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-line rounded-xl p-6">
        <div className="flex gap-4 items-center flex-wrap">
          <div>
            <label className="text-sm font-medium text-ink mr-2 font-sans">
              Difficulty:
            </label>
            <select
              value={filters.difficulty}
              onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
              className="px-3 py-1.5 border border-line rounded-lg text-sm font-sans"
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-ink mr-2 font-sans">
              Lesson:
            </label>
            <select
              value={filters.lessonId}
              onChange={(e) => setFilters({ ...filters, lessonId: e.target.value })}
              className="px-3 py-1.5 border border-line rounded-lg text-sm font-sans"
            >
              <option value="">All Lessons</option>
              <option value="aqaaid-001">Aqaaid - Lesson 1</option>
              <option value="hadeeth-001">Hadeeth - Lesson 1</option>
              <option value="akhlaaq-001">Akhlaaq - Lesson 1</option>
            </select>
          </div>

          <button 
            onClick={loadFlashcards} 
            className="ml-auto px-4 py-2 border border-line rounded-lg hover:bg-paper2 transition-colors font-sans font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Flashcards */}
      <div className="bg-white border border-line rounded-xl p-6">
        <h2 className="text-xl font-serif text-ink mb-5">
          {isStudent ? `Flashcards Due for Review (${flashcards.length})` : `All Flashcards (${flashcards.length})`}
        </h2>

        {flashcards.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-faint mb-4" />
            <p className="text-faint font-sans">
              {isStudent 
                ? 'No flashcards are due for review right now. Great job!' 
                : 'No flashcards found. Create your first flashcard to get started.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
      </div>

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