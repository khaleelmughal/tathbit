import { useState, useEffect } from 'react';
import { getClasses, createClass, getUsers } from '../lib/api';
import { School, Users, GraduationCap, Plus, Edit } from 'lucide-react';
import ClassProfileModal from './ClassProfileModal';

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
      background: variant === "primary" ? T.green : "transparent",
      color: variant === "primary" ? "white" : T.ink,
      border: variant === "primary" ? "none" : `1px solid ${T.line}`,
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

const ClassCard = ({ classItem, onEditClick }) => {
  return (
    <Card style={{ 
      marginBottom: "12px", 
      cursor: "pointer",
      transition: "all 0.2s ease",
      border: `1px solid ${T.line}`,
    }}>
      <div 
        style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
        onClick={() => onEditClick(classItem.id)}
        onMouseEnter={(e) => {
          e.currentTarget.parentElement.style.transform = "translateY(-1px)";
          e.currentTarget.parentElement.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.parentElement.style.transform = "translateY(0)";
          e.currentTarget.parentElement.style.boxShadow = "none";
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <School size={16} color={T.green} />
            <h3 style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "600",
              color: T.ink
            }}>
              {classItem.name}
            </h3>
            <span style={{
              background: T.greenSoft,
              color: T.green,
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "11px",
              fontWeight: "500",
            }}>
              {classItem.grade_id || 'Grade 5'}
            </span>
          </div>
          
          <div style={{ fontSize: "14px", color: T.ink2, marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
              <GraduationCap size={14} color={T.ink2} />
              {classItem.teacher_name ? (
                <span>Teacher: {classItem.teacher_name}</span>
              ) : (
                <span style={{ color: T.faint }}>No teacher assigned</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Users size={14} color={T.ink2} />
              <span>{classItem.student_count || 0} students</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Btn 
            onClick={(e) => {
              e.stopPropagation();
              onEditClick(classItem.id);
            }}
            variant="outline"
            style={{ 
              padding: "4px 8px",
              fontSize: "12px"
            }}
          >
            <Edit size={14} />
            Edit
          </Btn>
          <div style={{ 
            fontSize: "12px", 
            color: T.faint,
            textAlign: "center" 
          }}>
            <div>Created</div>
            <div>{classItem.created_at ? new Date(classItem.created_at).toLocaleDateString() : 'N/A'}</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const CreateClassModal = ({ onClose, onClassCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    gradeId: 'tasheel-g5'
  });
  const [saving, setSaving] = useState(false);

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
      <div className="bg-[#fefdfb] rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-[#f5f5f0]">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-[#2c5530]" style={{ fontFamily: 'Fraunces' }}>
              Create New Class
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
              placeholder="e.g., Grade 5 Alpha"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              value={formData.gradeId}
              onChange={(e) => setFormData({ ...formData, gradeId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
            >
              <option value="tasheel-g5">Grade 5 (Tasheel)</option>
              <option value="tasheel-g1">Grade 1 (Tasheel)</option>
              <option value="tasheel-g2">Grade 2 (Tasheel)</option>
              <option value="tasheel-g3">Grade 3 (Tasheel)</option>
              <option value="tasheel-g4">Grade 4 (Tasheel)</option>
              <option value="tasheel-g6">Grade 6 (Tasheel)</option>
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
      <Card>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5530] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading classes...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <div style={{ color: "#DC2626", padding: "20px" }}>
          Error: {error}
        </div>
        <Btn onClick={loadClasses}>Retry</Btn>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-[#f5f5f0] p-6 text-center">
          <div className="text-3xl font-bold text-[#2c5530]">{classStats.total}</div>
          <div className="text-sm text-gray-600">Total Classes</div>
        </div>
        <div className="bg-white rounded-lg border border-[#f5f5f0] p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{classStats.withTeachers}</div>
          <div className="text-sm text-gray-600">With Teachers</div>
        </div>
        <div className="bg-white rounded-lg border border-[#f5f5f0] p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{classStats.totalStudents}</div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
      </div>

      {/* Main Class List */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{
              fontSize: "20px",
              fontFamily: "Fraunces, serif",
              color: T.ink,
              margin: 0,
              marginBottom: "4px"
            }}>
              Class Management ({classes.length})
            </h2>
            <p style={{
              fontSize: "14px",
              color: T.ink2,
              margin: 0
            }}>
              Manage classes, assign teachers, and view student progress
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <Btn onClick={loadClasses}>Refresh</Btn>
            <Btn 
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              <Plus size={16} />
              Add Class
            </Btn>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: "20px" }}>
          <input
            type="text"
            placeholder="Search by class name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              border: `1px solid ${T.line}`,
              borderRadius: "8px",
              fontSize: "14px",
              fontFamily: "Plus Jakarta Sans, sans-serif"
            }}
          />
        </div>

        {filteredClasses.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <School className="mx-auto h-12 w-12" />
            </div>
            <p className="text-gray-500">
              {searchTerm ? 'No classes found matching your search' : 'No classes found. Create your first class to get started.'}
            </p>
          </div>
        ) : (
          <div style={{ marginTop: "20px" }}>
            {filteredClasses.map(classItem => (
              <ClassCard 
                key={classItem.id} 
                classItem={classItem} 
                onEditClick={setSelectedClassId} 
              />
            ))}
          </div>
        )}
      </Card>

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