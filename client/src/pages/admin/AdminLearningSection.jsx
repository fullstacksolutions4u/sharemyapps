import { useState, useEffect } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  ExternalLink, X, Check, ArrowUp, ArrowDown,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import TopicQuizForm from '../../components/admin/TopicQuizForm';

const inputCls = 'w-full px-3 py-2 border border-border rounded-xl focus:ring-0 focus:border-accent bg-white text-text text-sm outline-none transition-colors';
const labelCls = 'block text-xs font-medium text-muted mb-1';

const emptyTopic = () => ({ name: '', isPracticalProblem: false, problemUrl: '', quizzes: [] });
const emptyModule = () => ({ title: '' });

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-text transition-colors rounded-lg hover:bg-bg">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminLearningSection() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const [showCreateModule, setShowCreateModule] = useState(false);
  const [showEditModule, setShowEditModule] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);

  const [moduleForm, setModuleForm] = useState(emptyModule());
  const [topicForm, setTopicForm] = useState(emptyTopic());
  const [bulkTopics, setBulkTopics] = useState('');
  const [topicMode, setTopicMode] = useState('bulk'); // 'bulk' | 'single' | 'practical'

  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchModules = async () => {
    try {
      const res = await api.get('/learning-modules');
      setModules(res.data.data || []);
    } catch {
      toast.error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchModules(); }, []);

  /* ── Module CRUD ── */
  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) return toast.error('Module title is required');
    setSaving(true);
    try {
      await api.post('/learning-modules', { title: moduleForm.title.trim(), order: modules.length });
      toast.success('Module created');
      setShowCreateModule(false);
      setModuleForm(emptyModule());
      fetchModules();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create module');
    } finally { setSaving(false); }
  };

  const handleUpdateModule = async () => {
    if (!moduleForm.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await api.put(`/learning-modules/${selectedModule._id}`, { title: moduleForm.title.trim() });
      toast.success('Module updated');
      setShowEditModule(false);
      setSelectedModule(null);
      setModuleForm(emptyModule());
      fetchModules();
    } catch {
      toast.error('Failed to update module');
    } finally { setSaving(false); }
  };

  const handleDeleteModule = async (mod) => {
    if (!window.confirm(`Delete "${mod.title}" and all its topics?`)) return;
    try {
      await api.delete(`/learning-modules/${mod._id}`);
      toast.success('Module deleted');
      fetchModules();
    } catch {
      toast.error('Failed to delete module');
    }
  };

  const handleReorder = async (index, direction) => {
    const next = [...modules];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= next.length) return;
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
    setModules(next);
    try {
      await api.put('/learning-modules/reorder', {
        modules: next.map((m, i) => ({ _id: m._id, order: i })),
      });
    } catch {
      toast.error('Failed to reorder');
      fetchModules();
    }
  };

  /* ── Topic CRUD ── */
  const handleAddTopic = async () => {
    if (!selectedModule) return;

    if (topicMode === 'practical') {
      if (!topicForm.name.trim()) return toast.error('Problem title is required');
      if (!topicForm.problemUrl.trim()) return toast.error('Problem URL is required');
      setSaving(true);
      try {
        await api.post(`/learning-modules/${selectedModule._id}/topics`, {
          name: topicForm.name.trim(),
          order: selectedModule.topics?.length || 0,
          isPracticalProblem: true,
          problemUrl: topicForm.problemUrl.trim(),
          quizzes: topicForm.quizzes,
        });
        toast.success('Topic added');
        setShowAddTopic(false);
        resetTopicForm();
        fetchModules();
      } catch { toast.error('Failed to add topic'); }
      finally { setSaving(false); }
      return;
    }

    if (topicMode === 'single') {
      if (!topicForm.name.trim()) return toast.error('Topic name is required');
      setSaving(true);
      try {
        await api.post(`/learning-modules/${selectedModule._id}/topics`, {
          name: topicForm.name.trim(),
          order: selectedModule.topics?.length || 0,
          isPracticalProblem: false,
          quizzes: topicForm.quizzes,
        });
        toast.success('Topic added');
        setShowAddTopic(false);
        resetTopicForm();
        fetchModules();
      } catch { toast.error('Failed to add topic'); }
      finally { setSaving(false); }
      return;
    }

    // bulk
    const lines = bulkTopics.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return toast.error('Enter at least one topic name');
    setSaving(true);
    try {
      let order = selectedModule.topics?.length || 0;
      for (const name of lines) {
        await api.post(`/learning-modules/${selectedModule._id}/topics`, {
          name, order, isPracticalProblem: false, quizzes: [],
        });
        order++;
      }
      toast.success(`${lines.length} topic${lines.length > 1 ? 's' : ''} added`);
      setShowAddTopic(false);
      resetTopicForm();
      fetchModules();
    } catch { toast.error('Failed to add topics'); }
    finally { setSaving(false); }
  };

  const handleUpdateTopic = async () => {
    if (!selectedModule || !selectedTopic) return;
    if (!topicForm.name.trim()) return toast.error('Topic name is required');
    setSaving(true);
    try {
      await api.put(`/learning-modules/${selectedModule._id}/topics/${selectedTopic._id}`, {
        name: topicForm.name.trim(),
        isPracticalProblem: topicForm.isPracticalProblem,
        problemUrl: topicForm.problemUrl,
        quizzes: topicForm.quizzes,
      });
      toast.success('Topic updated');
      setShowEditTopic(false);
      setSelectedTopic(null);
      setSelectedModule(null);
      resetTopicForm();
      fetchModules();
    } catch { toast.error('Failed to update topic'); }
    finally { setSaving(false); }
  };

  const handleDeleteTopic = async (mod, topicId, topicName) => {
    if (!window.confirm(`Delete topic "${topicName}"?`)) return;
    try {
      await api.delete(`/learning-modules/${mod._id}/topics/${topicId}`);
      toast.success('Topic deleted');
      fetchModules();
    } catch { toast.error('Failed to delete topic'); }
  };

  const resetTopicForm = () => {
    setTopicForm(emptyTopic());
    setBulkTopics('');
    setTopicMode('bulk');
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-white border border-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-accent-light rounded-xl flex items-center justify-center">
            <BookOpen size={15} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-text">Test your Knowledge</h2>
            <p className="text-xs text-muted">{modules.length} module{modules.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModule(true)}
          className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm px-4 py-2 rounded-xl font-medium transition-colors">
          <Plus size={14} /> Add Module
        </button>
      </div>

      {/* Module list */}
      {modules.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <BookOpen size={28} className="text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">No modules yet</p>
          <p className="text-xs text-muted">Create your first learning module to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {modules.map((mod, index) => (
            <div key={mod._id} className="bg-white border border-border rounded-xl overflow-hidden">
              {/* Module header row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-accent-light text-accent text-xs font-bold flex items-center justify-center shrink-0">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text truncate">{mod.title}</p>
                  <p className="text-xs text-muted">{mod.topics?.length || 0} topic{(mod.topics?.length || 0) !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleReorder(index, 'up')} disabled={index === 0}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ArrowUp size={13} />
                  </button>
                  <button onClick={() => handleReorder(index, 'down')} disabled={index === modules.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                    <ArrowDown size={13} />
                  </button>
                  <button onClick={() => { setSelectedModule(mod); setModuleForm({ title: mod.title }); setShowEditModule(true); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => handleDeleteModule(mod)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 size={13} />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === mod._id ? null : mod._id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-text transition-colors">
                    {expandedId === mod._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Topics panel */}
              {expandedId === mod._id && (
                <div className="border-t border-border bg-bg px-4 py-3">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wide">Topics</p>
                    <button
                      onClick={() => { setSelectedModule(mod); resetTopicForm(); setShowAddTopic(true); }}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 bg-accent-light text-accent rounded-lg hover:bg-accent/20 transition-colors border border-accent/20">
                      <Plus size={11} /> Add Topic
                    </button>
                  </div>

                  {(!mod.topics || mod.topics.length === 0) ? (
                    <p className="text-xs text-muted py-2 text-center">No topics yet.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {mod.topics.map((topic) => (
                        <div key={topic._id} className="flex items-center gap-2.5 bg-white border border-border rounded-lg px-3 py-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-text truncate">{topic.name}</span>
                              {topic.isPracticalProblem && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">Practical</span>
                              )}
                              {(topic.quizCount > 0 || topic.hasQuiz) && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 border border-green-100 rounded-full font-medium">
                                  {topic.quizCount} quiz{topic.quizCount !== 1 ? 'zes' : ''}
                                </span>
                              )}
                            </div>
                            {topic.isPracticalProblem && topic.problemUrl && (
                              <a href={topic.problemUrl} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-[10px] text-accent hover:underline mt-0.5">
                                <ExternalLink size={9} /> {topic.problemUrl}
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={async () => {
                                // Fetch full topic quizzes before editing
                                try {
                                  const res = await api.get(`/learning-modules/${mod._id}/topics/${topic._id}/quizzes`);
                                  setTopicForm({
                                    name: topic.name,
                                    isPracticalProblem: topic.isPracticalProblem || false,
                                    problemUrl: topic.problemUrl || '',
                                    quizzes: res.data.data || [],
                                  });
                                } catch {
                                  setTopicForm({
                                    name: topic.name,
                                    isPracticalProblem: topic.isPracticalProblem || false,
                                    problemUrl: topic.problemUrl || '',
                                    quizzes: [],
                                  });
                                }
                                setSelectedModule(mod);
                                setSelectedTopic(topic);
                                setShowEditTopic(true);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-colors">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => handleDeleteTopic(mod, topic._id, topic.name)}
                              className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Create Module Modal ── */}
      {showCreateModule && (
        <Modal title="Create Module" onClose={() => { setShowCreateModule(false); setModuleForm(emptyModule()); }}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Module Title</label>
              <input type="text" value={moduleForm.title} onChange={e => setModuleForm({ title: e.target.value })}
                className={inputCls} placeholder="e.g. JavaScript Fundamentals"
                onKeyDown={e => e.key === 'Enter' && handleCreateModule()} autoFocus />
            </div>
            <button onClick={handleCreateModule} disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              Create Module
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Module Modal ── */}
      {showEditModule && (
        <Modal title="Edit Module" onClose={() => { setShowEditModule(false); setSelectedModule(null); setModuleForm(emptyModule()); }}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Module Title</label>
              <input type="text" value={moduleForm.title} onChange={e => setModuleForm({ title: e.target.value })}
                className={inputCls} placeholder="Module title" autoFocus />
            </div>
            <button onClick={handleUpdateModule} disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── Add Topic Modal ── */}
      {showAddTopic && (
        <Modal wide title={`Add Topic — ${selectedModule?.title}`}
          onClose={() => { setShowAddTopic(false); setSelectedModule(null); resetTopicForm(); }}>
          <div className="space-y-4">
            {/* Mode tabs */}
            <div className="flex gap-2">
              {[
                { id: 'bulk', label: 'Bulk Add' },
                { id: 'single', label: 'Single + Quiz' },
                { id: 'practical', label: 'Practical Problem' },
              ].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setTopicMode(id)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${topicMode === id ? 'bg-accent text-white border-accent' : 'bg-white text-muted border-border hover:border-accent/50'}`}>
                  {label}
                </button>
              ))}
            </div>

            {topicMode === 'bulk' && (
              <div>
                <label className={labelCls}>Topic Names (one per line)</label>
                <textarea value={bulkTopics} onChange={e => setBulkTopics(e.target.value)}
                  className={`${inputCls} min-h-[140px]`}
                  placeholder={"Variables and Data Types\nFunctions\nArrays\nObjects"} autoFocus />
                <p className="text-xs text-muted mt-1">Each line becomes a separate topic.</p>
              </div>
            )}

            {(topicMode === 'single' || topicMode === 'practical') && (
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>{topicMode === 'practical' ? 'Problem Title' : 'Topic Name'}</label>
                  <input type="text" value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls} placeholder={topicMode === 'practical' ? 'e.g. Two Sum' : 'Topic name'} autoFocus />
                </div>
                {topicMode === 'practical' && (
                  <div>
                    <label className={labelCls}>Problem URL</label>
                    <input type="url" value={topicForm.problemUrl}
                      onChange={e => setTopicForm(f => ({ ...f, problemUrl: e.target.value }))}
                      className={inputCls} placeholder="https://leetcode.com/problems/..." />
                  </div>
                )}
                <TopicQuizForm quizzes={topicForm.quizzes} onChange={quizzes => setTopicForm(f => ({ ...f, quizzes }))} />
              </div>
            )}

            <button onClick={handleAddTopic} disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />}
              Add Topic{topicMode === 'bulk' ? 's' : ''}
            </button>
          </div>
        </Modal>
      )}

      {/* ── Edit Topic Modal ── */}
      {showEditTopic && (
        <Modal wide title={`Edit Topic — ${selectedModule?.title}`}
          onClose={() => { setShowEditTopic(false); setSelectedModule(null); setSelectedTopic(null); resetTopicForm(); }}>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Topic Name</label>
              <input type="text" value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))}
                className={inputCls} placeholder="Topic name" autoFocus />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPractical" checked={topicForm.isPracticalProblem}
                onChange={e => setTopicForm(f => ({ ...f, isPracticalProblem: e.target.checked, problemUrl: e.target.checked ? f.problemUrl : '' }))}
                className="rounded accent-accent cursor-pointer" />
              <label htmlFor="isPractical" className="text-sm text-text cursor-pointer">Practical Problem</label>
            </div>

            {topicForm.isPracticalProblem && (
              <div>
                <label className={labelCls}>Problem URL</label>
                <input type="url" value={topicForm.problemUrl} onChange={e => setTopicForm(f => ({ ...f, problemUrl: e.target.value }))}
                  className={inputCls} placeholder="https://leetcode.com/problems/..." />
              </div>
            )}

            <TopicQuizForm quizzes={topicForm.quizzes} onChange={quizzes => setTopicForm(f => ({ ...f, quizzes }))} />

            <button onClick={handleUpdateTopic} disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />}
              Save Topic
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
