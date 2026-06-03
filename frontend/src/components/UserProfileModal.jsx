import { useState, useEffect } from 'react';
import { getUserDetails, updateUser, deleteUser, getStudentProgress } from '../lib/api';
import { LogIn, LogOut, BookOpen, Target, Layers, Activity, Clock } from 'lucide-react';

const ACT_META = {
  login:             { Icon: LogIn,  c: 'text-emerald-600', label: 'Logged in' },
  logout:            { Icon: LogOut, c: 'text-faint',       label: 'Logged out' },
  lesson_view:       { Icon: BookOpen, c: 'text-blue-600',  label: 'Read a lesson' },
  quiz_complete:     { Icon: Target, c: 'text-brand',       label: 'Finished a quiz' },
  flashcard_session: { Icon: Layers, c: 'text-purple-600',  label: 'Reviewed flashcards' },
};
const fmtWhen = (ts) => new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const secs = (ms) => (ms == null ? '—' : Math.round(Number(ms) / 1000) + 's');
const numv = (v) => Number(v) || 0;

const UserProfileModal = ({ userId, onClose, onUserUpdated, onUserDeleted }) => {
  const [user, setUser] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [progress, setProgress] = useState(null);
  const [tab, setTab] = useState('overview');
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
      if (data.user.role === 'student') {
        try { setProgress(await getStudentProgress(userId)); }
        catch (e) { setProgress(null); }
      }
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
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{boxShadow: "0 20px 25px -5px rgba(43, 58, 51, 0.1), 0 10px 10px -5px rgba(43, 58, 51, 0.04)"}}>
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

              {/* Student progress tabs */}
              {user.role === 'student' && (() => {
                const stats = (progress && progress.stats) || {};
                const totalAnswers = numv(stats.total_answers);
                const correct = numv(stats.correct_answers);
                const success = stats.success_rate != null ? stats.success_rate : (totalAnswers ? Math.round(correct * 100 / totalAnswers) : 0);
                const subjects = (progress && progress.subjectBreakdown) || [];
                const sessions = (progress && progress.sessions) || [];
                const activity = (progress && progress.activity) || [];
                const weak = (progress && progress.weakQuestions) || [];
                const fcards = (progress && progress.flashcards) || [];
                const known = fcards.filter(f => f.result === 'known');
                const needWork = fcards.filter(f => f.result !== 'known');
                const TABS = [['overview', 'Overview'], ['activity', 'Activity'], ['flashcards', 'Flashcards'], ['weak', 'Weak questions']];
                return (
                  <div className="bg-white rounded-xl border border-line p-6">
                    <div className="flex gap-1 border-b border-line mb-4 flex-wrap">
                      {TABS.map(([key, label]) => (
                        <button key={key} onClick={() => setTab(key)}
                          className={`px-4 py-2 text-sm font-sans -mb-px border-b-2 ${tab === key ? 'border-brand text-brand font-semibold' : 'border-transparent text-ink2 hover:text-ink'}`}>
                          {label}
                        </button>
                      ))}
                    </div>

                    {tab === 'overview' && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center"><div className="text-3xl font-bold text-brand font-sans">{totalAnswers}</div><div className="text-sm text-ink2 font-sans">Questions Answered</div></div>
                          <div className="text-center"><div className="text-3xl font-bold text-emerald-600 font-sans">{correct}</div><div className="text-sm text-ink2 font-sans">Correct</div></div>
                          <div className="text-center"><div className="text-3xl font-bold text-blue-600 font-sans">{success}%</div><div className="text-sm text-ink2 font-sans">Success Rate</div></div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink mb-2 font-sans">By subject</div>
                          {subjects.length === 0 ? <p className="text-sm text-ink2 font-sans">No quiz answers yet.</p> :
                            <div className="space-y-2">{subjects.map((s, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                                <div className="font-medium font-sans text-ink">{s.subject_id}</div>
                                <div className="text-right"><div className="font-medium text-brand font-sans">{numv(s.success_rate)}%</div><div className="text-xs text-ink2 font-sans">{numv(s.correct)}/{numv(s.answers)}</div></div>
                              </div>
                            ))}</div>}
                        </div>
                      </div>
                    )}

                    {tab === 'activity' && (
                      <div className="space-y-5">
                        <div>
                          <div className="text-sm font-semibold text-ink mb-2 font-sans">Quiz sessions</div>
                          {sessions.length === 0 ? <p className="text-sm text-ink2 font-sans">No tests taken yet.</p> :
                            <div className="space-y-2">{sessions.map(s => { const mode = s.mode === 'exam-practice' ? 'Mixed' : 'Fixed'; return (
                              <div key={s.id} className="flex justify-between items-center p-3 bg-paper rounded-lg">
                                <div><div className="text-sm font-medium text-ink font-sans">{s.subject_id || 'Mixed'} <span className="text-xs text-ink2">({mode})</span></div><div className="text-xs text-faint font-sans">{fmtWhen(s.completed_at)} · {secs(s.duration_ms)}</div></div>
                                <div className="text-sm font-bold text-brand font-sans">{numv(s.score)}/{numv(s.total)}</div>
                              </div>
                            ); })}</div>}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-ink mb-2 font-sans">Activity log</div>
                          {activity.length === 0 ? <p className="text-sm text-ink2 font-sans">No activity recorded yet.</p> :
                            <div className="space-y-1 max-h-72 overflow-y-auto">{activity.map((e, i) => { const m = ACT_META[e.type] || { Icon: Activity, c: 'text-ink2', label: e.type }; const I = m.Icon; const meta = e.meta && typeof e.meta === 'object' ? e.meta : {}; const detail = e.type === 'quiz_complete' && meta.score != null ? `${meta.score}/${meta.total}` : e.type === 'flashcard_session' && meta.reviewed != null ? `${meta.reviewed} cards` : (e.subject_id || ''); return (
                              <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-paper">
                                <I size={15} className={m.c} />
                                <div className="flex-1 min-w-0 text-sm text-ink font-sans truncate">{m.label}{detail ? <span className="text-ink2"> ({detail})</span> : null}</div>
                                <span className="text-xs text-faint font-sans whitespace-nowrap">{fmtWhen(e.created_at)}</span>
                              </div>
                            ); })}</div>}
                        </div>
                      </div>
                    )}

                    {tab === 'flashcards' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm font-semibold text-emerald-700 mb-2 font-sans">Knows ({known.length})</div>
                          {known.length === 0 ? <p className="text-sm text-ink2 font-sans">Nothing marked known yet.</p> :
                            <div className="space-y-2 max-h-72 overflow-y-auto">{known.map((f, i) => (<div key={i} className="p-2 bg-emerald-50 rounded-lg text-sm text-ink font-sans">{f.front || f.card_id}</div>))}</div>}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-red-600 mb-2 font-sans">Still learning / forgot ({needWork.length})</div>
                          {needWork.length === 0 ? <p className="text-sm text-ink2 font-sans">Nothing to revise.</p> :
                            <div className="space-y-2 max-h-72 overflow-y-auto">{needWork.map((f, i) => (<div key={i} className="p-2 bg-red-50 rounded-lg text-sm text-ink font-sans flex justify-between"><span className="min-w-0 truncate">{f.front || f.card_id}</span><span className="text-xs text-red-600 ml-2 shrink-0">{f.result}</span></div>))}</div>}
                        </div>
                      </div>
                    )}

                    {tab === 'weak' && (
                      <div>
                        {weak.length === 0 ? <p className="text-sm text-ink2 font-sans">No weak questions yet — they appear once a question is answered wrong.</p> :
                          <div className="space-y-2">{weak.map((w, i) => { const a = numv(w.attempts), c = numv(w.correct); return (
                            <div key={i} className="p-3 bg-red-50 rounded-lg border border-red-200">
                              <div className="text-sm font-medium text-ink font-sans">{w.prompt}</div>
                              <div className="flex justify-between mt-1 text-xs font-sans"><span className="text-ink2">{w.subject_id}</span><span className="text-red-600">{c}/{a} correct</span></div>
                            </div>
                          ); })}</div>}
                      </div>
                    )}
                  </div>
                );
              })()}

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