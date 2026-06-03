import { useState, useEffect } from 'react';
import { getClassDetails, updateClass, deleteClass, getUsers } from '../lib/api';

const ClassProfileModal = ({ classId, onClose, onClassUpdated, onClassDeleted }) => {
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    if (classId) {
      loadClassDetails();
      loadTeachers();
    }
  }, [classId]);

  const loadClassDetails = async () => {
    try {
      setLoading(true);
      const data = await getClassDetails(classId);
      setClassData(data.class);
      setStudents(data.students || []);
      setEditForm({
        name: data.class.name || '',
        teacher_id: data.class.teacher_id || ''
      });
    } catch (error) {
      console.error('Failed to load class details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const data = await getUsers();
      setTeachers((data.users || []).filter(user => user.role === 'teacher'));
    } catch (error) {
      console.error('Failed to load teachers:', error);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedClass = await updateClass(classId, editForm);
      setClassData(updatedClass.class);
      setEditing(false);
      onClassUpdated?.(updatedClass.class);
    } catch (error) {
      console.error('Failed to update class:', error);
      alert('Failed to update class: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete !== classData.name) {
      alert('Please type the class name exactly to confirm deletion');
      return;
    }

    try {
      setDeleting(true);
      await deleteClass(classId);
      onClassDeleted?.(classId);
      onClose();
    } catch (error) {
      console.error('Failed to delete class:', error);
      alert('Failed to delete class: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!classId) return null;

  const classStats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.total_attempts > 0).length,
    averageSuccessRate: students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + (s.success_rate || 0), 0) / students.length)
      : 0
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" style={{boxShadow: "0 20px 25px -5px rgba(43, 58, 51, 0.1), 0 10px 10px -5px rgba(43, 58, 51, 0.04)"}}>
        <div className="p-6 border-b border-line">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-medium text-ink">
              Class Profile
            </h2>
            <button
              onClick={onClose}
              className="text-faint hover:text-ink text-2xl transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand mx-auto mb-4"></div>
                <p className="text-ink2 font-sans">Loading class details...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Class Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-line p-6 text-center">
                  <div className="text-3xl font-bold text-brand font-sans">{classStats.totalStudents}</div>
                  <div className="text-sm text-ink2 font-sans">Total Students</div>
                </div>
                <div className="bg-white rounded-xl border border-line p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 font-sans">{classStats.activeStudents}</div>
                  <div className="text-sm text-ink2 font-sans">Active Students</div>
                </div>
                <div className="bg-white rounded-xl border border-line p-6 text-center">
                  <div className="text-3xl font-bold text-emerald-600 font-sans">{classStats.averageSuccessRate}%</div>
                  <div className="text-sm text-ink2 font-sans">Average Success Rate</div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-line p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-serif font-medium text-ink">
                    Class Information
                  </h3>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-sans font-medium hover:bg-brand/90 transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditForm({
                            name: classData.name || '',
                            teacher_id: classData.teacher_id || ''
                          });
                        }}
                        className="px-4 py-2 bg-faint text-white rounded-lg text-sm font-sans font-medium hover:bg-ink2 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-sans font-medium hover:bg-brand/90 transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Class Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
                      />
                    ) : (
                      <p className="py-2 text-ink font-sans">{classData.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Teacher</label>
                    {editing ? (
                      <select
                        value={editForm.teacher_id}
                        onChange={(e) => setEditForm({ ...editForm, teacher_id: e.target.value })}
                        className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
                      >
                        <option value="">No teacher assigned</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name} ({teacher.email})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="py-2 text-ink font-sans">
                        {classData.teacher_name ? `${classData.teacher_name} (${classData.teacher_email})` : 'No teacher assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Grade</label>
                    <p className="py-2 text-ink font-sans">{classData.grade_id || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Created</label>
                    <p className="py-2 text-ink font-sans">
                      {classData.created_at ? new Date(classData.created_at).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Students List */}
              {students.length > 0 && (
                <div className="bg-white rounded-xl border border-line p-6">
                  <h3 className="text-lg font-serif font-medium text-ink mb-4">
                    Students ({students.length})
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                        <div>
                          <div className="font-medium font-sans text-ink">{student.name}</div>
                          <div className="text-sm text-ink2 font-sans">Username: {student.username}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-brand font-sans">
                            {student.success_rate || 0}% Success
                          </div>
                          <div className="text-sm text-ink2 font-sans">
                            {student.total_attempts || 0} attempts
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {students.length === 0 && (
                <div className="bg-white rounded-xl border border-line p-6">
                  <h3 className="text-lg font-serif font-medium text-ink mb-4">
                    Students
                  </h3>
                  <div className="text-center py-8 text-faint">
                    <div className="text-faint mb-2">
                      <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                    <span className="font-sans">No students assigned to this class</span>
                  </div>
                </div>
              )}

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-serif font-medium text-red-800 mb-4">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-red-700 font-sans">
                    Deleting a class will permanently remove the class and unassign all students. This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-red-800 font-sans">
                      Type "{classData.name}" to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
                      placeholder={classData.name}
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || confirmDelete !== classData.name}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-sans font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete Class'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassProfileModal;