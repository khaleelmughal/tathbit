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
    if (!user || confirmDelete !== user.name) {
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
      <div className="bg-white rounded-xl2 shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-line">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-serif font-medium text-ink">
              User Profile
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
                <p className="text-ink2 font-sans">Loading user details...</p>
              </div>
            </div>
          ) : !user ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <p className="text-red-600 font-sans mb-4">Failed to load user details</p>
                <button
                  onClick={loadUserDetails}
                  className="px-4 py-2 bg-brand text-white rounded-lg text-sm font-sans font-medium hover:bg-brand/90 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-xl border border-line p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-serif font-medium text-ink">
                    Basic Information
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
                            name: user.name || '',
                            email: user.email || '',
                            username: user.username || ''
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
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
                      />
                    ) : (
                      <p className="py-2 text-ink font-sans">{user.name || 'N/A'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Role</label>
                    <p className="py-2 text-ink font-sans capitalize">{user.role}</p>
                  </div>

                  {user.email && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1 font-sans">Email</label>
                      {editing ? (
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
                        />
                      ) : (
                        <p className="py-2 text-ink font-sans">{user.email}</p>
                      )}
                    </div>
                  )}

                  {user.username && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1 font-sans">Username</label>
                      {editing ? (
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                          className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent font-sans"
                        />
                      ) : (
                        <p className="py-2 text-ink font-sans">{user.username}</p>
                      )}
                    </div>
                  )}

                  {user.className && (
                    <div>
                      <label className="block text-sm font-medium text-ink mb-1 font-sans">Class</label>
                      <p className="py-2 text-ink font-sans">{user.className}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-ink mb-1 font-sans">Created</label>
                    <p className="py-2 text-ink font-sans">
                      {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Analytics */}
              {analytics && user.role === 'student' && (
                <>
                  {/* Question Statistics */}
                  <div className="bg-white rounded-xl border border-line p-6">
                    <h3 className="text-lg font-serif font-medium text-ink mb-4">
                      Question Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-brand font-sans">
                          {analytics.questionStats.total_attempts || 0}
                        </div>
                        <div className="text-sm text-ink2 font-sans">Total Attempts</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-emerald-600 font-sans">
                          {analytics.questionStats.correct_answers || 0}
                        </div>
                        <div className="text-sm text-ink2 font-sans">Correct Answers</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 font-sans">
                          {analytics.questionStats.success_rate || 0}%
                        </div>
                        <div className="text-sm text-ink2 font-sans">Success Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Subject Performance */}
                  {analytics.subjectStats && analytics.subjectStats.length > 0 && (
                    <div className="bg-white rounded-xl border border-line p-6">
                      <h3 className="text-lg font-serif font-medium text-ink mb-4">
                        Subject Performance
                      </h3>
                      <div className="space-y-3">
                        {analytics.subjectStats.map((subject, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                            <div>
                              <div className="font-medium font-sans text-ink">{subject.subject_id}</div>
                              <div className="text-sm text-ink2 font-sans">
                                {subject.attempts} attempts
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium text-brand font-sans">
                                {subject.success_rate}%
                              </div>
                              <div className="text-sm text-ink2 font-sans">
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
                    <div className="bg-white rounded-xl border border-line p-6">
                      <h3 className="text-lg font-serif font-medium text-ink mb-4">
                        Recent Activity
                      </h3>
                      <div className="space-y-3 max-h-64 overflow-y-auto">
                        {analytics.recentActivity.map((activity, index) => (
                          <div key={index} className="flex items-start space-x-3 p-3 bg-paper rounded-lg">
                            <div className={`w-3 h-3 rounded-full mt-1 ${activity.is_correct ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-ink font-sans truncate">{activity.prompt}</div>
                              <div className="text-xs text-faint font-sans">
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
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-serif font-medium text-red-800 mb-4">
                  Danger Zone
                </h3>
                <div className="space-y-4">
                  <p className="text-sm text-red-700 font-sans">
                    Deleting a user will permanently remove all their data including progress, attempts, and any questions they created. This action cannot be undone.
                  </p>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-red-800 font-sans">
                      Type "{user?.name || 'user name'}" to confirm deletion:
                    </label>
                    <input
                      type="text"
                      value={confirmDelete}
                      onChange={(e) => setConfirmDelete(e.target.value)}
                      className="w-full max-w-sm px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-sans"
                      placeholder={user?.name || 'user name'}
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || !user || confirmDelete !== user.name}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-sans font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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