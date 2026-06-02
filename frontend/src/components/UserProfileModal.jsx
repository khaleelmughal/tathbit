import { useState, useEffect } from 'react';
import { getUserDetails, updateUser, deleteUser } from '../lib/api';

const UserProfileModal = ({ userId, onClose, onUserUpdated, onUserDeleted }) => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState('');

  useEffect(() => {
    if (userId) {
      loadUserDetails();
    }
  }, [userId]);

  const loadUserDetails = async () => {
    try {
      setLoading(true);
      const data = await getUserDetails(userId);
      setUser(data.user);
      setAnalytics(data.analytics);
      setEditForm({
        name: data.user.name || '',
        email: data.user.email || '',
        username: data.user.username || ''
      });
    } catch (error) {
      console.error('Failed to load user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updatedUser = await updateUser(userId, editForm);
      setUser(updatedUser.user);
      setEditing(false);
      onUserUpdated?.(updatedUser.user);
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirmDelete !== user.name) {
      alert('Please type the user\'s name exactly to confirm deletion');
      return;
    }

    try {
      setDeleting(true);
      await deleteUser(userId);
      onUserDeleted?.(userId);
      onClose();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!userId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fefdfb] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#f5f5f0]">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-medium text-[#2c5530]" style={{ fontFamily: 'Fraunces' }}>
              User Profile
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c5530] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading user details...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg border border-[#f5f5f0] p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-[#2c5530]" style={{ fontFamily: 'Fraunces' }}>
                    Basic Information
                  </h3>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="px-4 py-2 bg-[#2c5530] text-white rounded-lg text-sm hover:bg-[#1e3a21] transition-colors"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="space-x-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          setEditForm({
                            name: user.name || '',
                            email: user.email || '',
                            username: user.username || ''
                          });
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-[#2c5530] text-white rounded-lg text-sm hover:bg-[#1e3a21] transition-colors disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
                      />
                    ) : (
                      <p className="py-2 text-gray-900">{user.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="py-2 text-gray-900 capitalize">{user.role}</p>
                  </div>

                  {user.email && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      {editing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
                        />
                      ) : (
                        <p className="py-2 text-gray-900">{user.email}</p>
                      )}
                    </div>
                  )}

                  {user.username && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c5530] focus:border-transparent"
                        />
                      ) : (
                        <p className="py-2 text-gray-900">{user.username}</p>
                      )}
                    </div>
                  )}

                  {user.className && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                      <p className="py-2 text-gray-900">{user.className}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="py-2 text-gray-900">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Analytics */}
              {analytics && user.role === 'student' && (
                <>
                  {/* Question Statistics */}
                  <div className="bg-white rounded-lg border border-[#f5f5f0] p-6">
                    <h3 className="text-lg font-medium text-[#2c5530] mb-4" style={{ fontFamily: 'Fraunces' }}>
                      Question Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-[#2c5530]">
                          {analytics.questionStats.total_attempts || 0}
                        </div>
                        <div className="text-sm text-gray-600">Total Attempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {analytics.questionStats.correct_answers || 0}
                        </div>
                        <div className="text-sm text-gray-600">Correct Answers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {analytics.questionStats.success_rate || 0}%
                        </div>
                        <div className="text-sm text-gray-600">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Performance */}
                  {analytics.subjectStats && analytics.subjectStats.length > 0 && (
                    <div className="bg-white rounded-lg border border-[#f5f5f0] p-6">
                      <h3 className="text-lg font-medium text-[#2c5530] mb-4" style={{ fontFamily: 'Fraunces' }}>
                        Subject Performance
                      </h3>
                      <div className="space-y-3">
                        {analytics.subjectStats.map((subject, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-[#fefdfb] rounded-lg">
                            <div>
                              <div className="font-medium">{subject.subject_id}</div>
                              <div className="text-sm text-gray-600">
                                {subject.attempts} attempts
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-[#2c5530]">
                                {subject.success_rate}%
                              </div>
                              <div className="text-sm text-gray-600">
                                {subject.correct}/{subject.attempts}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Activity */}
                  {analytics.recentActivity && analytics.recentActivity.length > 0 && (
                    <div className="bg-white rounded-lg border border-[#f5f5f0] p-6">
                      <h3 className="text-lg font-medium text-[#2c5530] mb-4" style={{ fontFamily: 'Fraunces' }}>
                        Recent Activity
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {analytics.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-[#fefdfb] rounded-lg">
                            <div className={`w-3 h-3 rounded-full mt-1 ${activity.is_correct ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-gray-900 truncate">{activity.prompt}</div>
                              <div className="text-xs text-gray-500">
                                {activity.subject_id} • {new Date(activity.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-medium text-red-800 mb-4" style={{ fontFamily: 'Fraunces' }}>
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-red-700">
                    Deleting a user will permanently remove all their data including progress, attempts, and any questions they created. This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-red-800">
                      Type "{user.name}" to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder={user.name}
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || confirmDelete !== user.name}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete User'}
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

export default UserProfileModal;