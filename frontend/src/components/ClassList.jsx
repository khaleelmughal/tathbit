import { useState, useEffect } from 'react';
import { getClasses, createClass, getUsers, getSyllabus } from '../lib/api';
import { School, Users, GraduationCap, Plus, Edit } from 'lucide-react';
import ClassProfileModal from './ClassProfileModal';

const ClassCard = ({ classItem, onEditClick }) => {
  return (
    <div className="bg-white border border-line rounded-xl p-6 mb-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div 
        className="flex justify-between items-start"
        onClick={() => onEditClick(classItem.id)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <School size={16} className="text-brand" />
            <h3 className="text-lg font-semibold text-ink">
              {classItem.name}
            </h3>
            <span className="bg-brandSoft text-brand px-2 py-1 rounded-full text-xs font-medium">
              {classItem.grade_id || 'Grade 5'}
            </span>
          </div>
          
          <div className="text-sm text-ink2 space-y-1">
            <div className="flex items-center gap-1">
              <GraduationCap size={14} className="text-ink2" />
              {classItem.teacher_name ? (
                <span>Teacher: {classItem.teacher_name}</span>
              ) : (
                <span className="text-faint">No teacher assigned</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Users size={14} className="text-ink2" />
              <span>{classItem.student_count || 0} students</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(classItem.id);
            }}
            className="flex items-center gap-1 px-3 py-1 text-xs border border-line rounded-lg hover:bg-paper2 transition-colors font-sans font-medium"
          >
            <Edit size={14} />
            Edit
          </button>
          <div className="text-xs text-faint text-center">
            <div>Created</div>
            <div>{classItem.created_at ? new Date(classItem.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CreateClassModal = ({ onClose, onClassCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    gradeId: ''
  });
  const [saving, setSaving] = useState(false);
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(true);

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      setLoadingGrades(true);
      const response = await getSyllabus();
      const sortedGrades = response.grades.sort((a, b) => a.position - b.position);
      setGrades(sortedGrades);
      if (sortedGrades.length > 0 && !formData.gradeId) {
        setFormData(prev => ({ ...prev, gradeId: sortedGrades[0].id }));
      }
    } catch (error) {
      console.error('Failed to load grades:', error);
    } finally {
      setLoadingGrades(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await createClass(formData);
      onClassCreated();
    } catch (error) {
      console.error('Failed to create class:', error);
      alert('Failed to create class: ' + error.message);
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
              Create New Class
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
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Class Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
              placeholder="e.g., Grade 5 Alpha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1 font-sans">Grade</label>
            <select
              value={formData.gradeId}
              onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
              className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
              disabled={loadingGrades}
            >
              {loadingGrades ? (
                <option value="">Loading grades...</option>
              ) : grades.length === 0 ? (
                <option value="">No grades available</option>
              ) : (
                <>
                  <option value="">Select a grade</option>
                  {grades.map((grade) => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </>
              )}
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
              {saving ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ClassList = ({ refreshTrigger }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClasses();
  }, [refreshTrigger]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await getClasses();
      setClasses(response.classes || []);
    } catch (err) {
      setError(err.message || "Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  const handleClassUpdated = (updatedClass) => {
    setClasses(classes.map(cls => cls.id === updatedClass.id ? updatedClass : cls));
  };

  const handleClassDeleted = (classId) => {
    setClasses(classes.filter(cls => cls.id !== classId));
    setSelectedClassId(null);
  };

  const handleClassCreated = () => {
    setShowCreateModal(false);
    loadClasses();
  };

  const filteredClasses = classes.filter(cls => 
    !searchTerm || 
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const classStats = {
    total: classes.length,
    withTeachers: classes.filter(cls => cls.teacher_name).length,
    totalStudents: classes.reduce((sum, cls) => sum + (cls.student_count || 0), 0)
  };

  if (loading) {
    return (
      <div className="bg-white border border-line rounded-xl p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
            <p className="text-ink2 font-sans">Loading classes...</p>
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
              onClick={loadClasses}
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-line p-6 text-center">
          <div className="text-3xl font-bold text-brand font-sans">{classStats.total}</div>
          <div className="text-sm text-ink2 font-sans">Total Classes</div>
        </div>
        <div className="bg-white rounded-xl border border-line p-6 text-center">
          <div className="text-3xl font-bold text-blue-600 font-sans">{classStats.withTeachers}</div>
          <div className="text-sm text-ink2 font-sans">With Teachers</div>
        </div>
        <div className="bg-white rounded-xl border border-line p-6 text-center">
          <div className="text-3xl font-bold text-emerald-600 font-sans">{classStats.totalStudents}</div>
          <div className="text-sm text-ink2 font-sans">Total Students</div>
        </div>
      </div>

      {/* Main Class List */}
      <div className="bg-white border border-line rounded-xl p-6">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h2 className="text-xl font-serif text-ink mb-1">
              Class Management ({classes.length})
            </h2>
            <p className="text-sm text-ink2 font-sans">
              Manage classes, assign teachers, and view student progress
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={loadClasses}
              className="px-4 py-2 border border-line rounded-lg hover:bg-paper2 transition-colors font-sans font-medium"
            >
              Refresh
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-brand text-white px-4 py-2 rounded-lg font-sans font-medium hover:bg-brand/90 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Class
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            placeholder="Search by class name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-line rounded-lg text-sm font-sans focus:ring-2 focus:ring-brand focus:border-transparent"
          />
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-faint mb-4">
              <School className="mx-auto h-12 w-12" />
            </div>
            <p className="text-faint font-sans">
              {searchTerm ? 'No classes found matching your search' : 'No classes found. Create your first class to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClasses.map(classItem => (
              <ClassCard 
                key={classItem.id} 
                classItem={classItem} 
                onEditClick={setSelectedClassId} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Class Profile Modal */}
      <ClassProfileModal
        classId={selectedClassId}
        onClose={() => setSelectedClassId(null)}
        onClassUpdated={handleClassUpdated}
        onClassDeleted={handleClassDeleted}
      />

      {/* Create Class Modal */}
      {showCreateModal && (
        <CreateClassModal
          onClose={() => setShowCreateModal(false)}
          onClassCreated={handleClassCreated}
        />
      )}
    </div>
  );
};

export default ClassList;