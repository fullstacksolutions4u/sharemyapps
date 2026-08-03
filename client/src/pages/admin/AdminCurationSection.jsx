import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Trash2, Send, Check,
  ClipboardList,
  X, Edit3, RefreshCw,
  Video, BookMarked, Users, ChevronDown, Layers
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';
import AdminInterviewModulesSection from './AdminInterviewModulesSection';

const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const SECTIONS = ['Frontend', 'Backend'];
const DEFAULT_SECTIONS = SECTIONS.map(title => ({ title, rating: 3, notes: '' }));

const ratingColor = (r) => r >= 8 ? 'text-emerald-600' : r >= 6 ? 'text-amber-500' : 'text-red-500';

const getLocalDatetimeString = (date = new Date()) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

// ─── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i + 1)}
          className={`text-lg transition ${i < value ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// ─── Chip Input ───────────────────────────────────────────────────────────────
function ChipInput({ label, chips, setChips, placeholder, colorClass = 'bg-blue-50 text-blue-700 border-blue-200' }) {
  const [input, setInput] = useState('');

  const addChip = () => {
    const val = input.trim();
    if (val && !chips.includes(val)) {
      setChips([...chips, val]);
      setInput('');
    }
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-[#6B7280] mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {chips.map((c, i) => (
          <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
            {c}
            <button onClick={() => setChips(chips.filter((_, j) => j !== i))} className="hover:opacity-70">
              <X size={10} />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } }}
          placeholder={placeholder}
          className={inp}
        />
        <button
          type="button"
          onClick={addChip}
          className="px-3 py-2 bg-[#00A693] text-white rounded-xl text-sm hover:bg-[#008f7e] transition"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Evaluation Drawer ────────────────────────────────────────────────────────
function EvaluationDrawer({ user, onClose, onSaved }) {
  const [sessions, setSessions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = new session

  const emptyForm = () => ({
    overallRating: 7,
    googleMeetLink: '',
    status: 'completed',
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
    pros: [],
    cons: [],
    improvementTips: [],
    interviewedAt: getLocalDatetimeString(),
    headline: '',
    summary: '',
    mcqAssessments: [],
  });

  const [form, setForm] = useState(emptyForm());
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [newTabName, setNewTabName] = useState('');

  const [interviewModules, setInterviewModules] = useState([]);
  const [selectedModId, setSelectedModId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [loadingAiSummary, setLoadingAiSummary] = useState(false);
  const [currentQuizzes, setCurrentQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  useEffect(() => {
    const fetchInterviewModules = async () => {
      try {
        const res = await api.get('/interview-modules');
        setInterviewModules(res.data.data || []);
      } catch {
        toast.error('Failed to load interview modules');
      }
    };
    fetchInterviewModules();
  }, []);

  useEffect(() => {
    if (!selectedModId || !selectedTopicId) return;
    const fetchQuizzes = async () => {
      setLoadingQuizzes(true);
      try {
        const res = await api.get(`/interview-modules/${selectedModId}/topics/${selectedTopicId}/quizzes`);
        setCurrentQuizzes(res.data.data || []);
      } catch {
        toast.error('Failed to load quizzes');
        setCurrentQuizzes([]);
      } finally {
        setLoadingQuizzes(false);
      }
    };
    fetchQuizzes();
  }, [selectedModId, selectedTopicId]);

  const handleMcqChange = (quiz, field, value) => {
    setForm(f => {
      const assessments = [...(f.mcqAssessments || [])];
      const idx = assessments.findIndex(a => a.question === quiz.question);
      
      const mod = interviewModules.find(m => m._id === selectedModId);
      const top = mod?.topics?.find(t => t._id === selectedTopicId);

      if (idx > -1) {
        assessments[idx] = {
          ...assessments[idx],
          [field]: value
        };
      } else {
        assessments.push({
          question: quiz.question,
          options: quiz.options,
          correctAnswerIndex: quiz.correctAnswer,
          isCorrect: field === 'isCorrect' ? value : false,
          comment: field === 'comment' ? value : '',
          moduleTitle: mod?.title || '',
          topicName: top?.name || ''
        });
      }
      return { ...f, mcqAssessments: assessments };
    });
  };

  const generateAiSummary = async () => {
    if (!form.mcqAssessments || form.mcqAssessments.length === 0) {
      toast.error('Add at least one evaluated MCQ question.');
      return;
    }
    setLoadingAiSummary(true);
    try {
      const res = await api.post('/admin/interviews/summarize', {
        mcqAssessments: form.mcqAssessments,
        candidateName: user.name
      });
      
      const { headline, summary, overallRating, pros, cons, improvementTips } = res.data;
      
      setForm(f => ({
        ...f,
        headline: headline || f.headline,
        overallRating: overallRating !== undefined ? overallRating : f.overallRating,
        pros: pros && pros.length ? pros : f.pros,
        cons: cons && cons.length ? cons : f.cons,
        improvementTips: improvementTips && improvementTips.length ? improvementTips : f.improvementTips,
        summary: summary || f.summary
      }));

      toast.success('AI evaluation summary generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI summary.');
    } finally {
      setLoadingAiSummary(false);
    }
  };

  const addTab = () => {
    const name = newTabName.trim();
    if (name) {
      if (form.sections.some(s => s.title.toLowerCase() === name.toLowerCase())) {
        toast.error('Section already exists');
        return;
      }
      const newSecs = [...form.sections, { title: name, rating: 3, notes: '' }];
      setForm(f => ({ ...f, sections: newSecs }));
      setActiveTabIdx(newSecs.length - 1);
      setNewTabName('');
    }
  };

  const removeTab = (idx) => {
    if (form.sections.length <= 1) {
      toast.error('You must keep at least one section');
      return;
    }
    const newSecs = form.sections.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, sections: newSecs }));
    setActiveTabIdx(prev => Math.max(0, Math.min(prev, newSecs.length - 1)));
  };

  useEffect(() => {
    let ignore = false;
    const fetchSessions = async () => {
      try {
        const res = await api.get(`/admin/interviews/user/${user._id}`);
        if (!ignore) setSessions(res.data.sessions || []);
      } catch { toast.error('Failed to load sessions'); }
    };
    fetchSessions();
    return () => { ignore = true; };
  }, [user._id]);

  const updateSection = (i, field, value) => {
    const secs = [...form.sections];
    secs[i] = { ...secs[i], [field]: value };
    setForm(f => ({ ...f, sections: secs }));
  };

  const addTip = () => {
    setForm(f => ({ ...f, improvementTips: [...f.improvementTips, { area: '', tip: '', resourceUrl: '' }] }));
  };

  const updateTip = (i, field, value) => {
    const tips = [...form.improvementTips];
    tips[i] = { ...tips[i], [field]: value };
    setForm(f => ({ ...f, improvementTips: tips }));
  };

  const removeTip = (i) => {
    setForm(f => ({ ...f, improvementTips: f.improvementTips.filter((_, j) => j !== i) }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        interviewedAt: form.interviewedAt ? new Date(form.interviewedAt).toISOString() : new Date().toISOString()
      };
      let res;
      if (editingId) {
        res = await api.put(`/admin/interviews/${editingId}`, payload);
        setSessions(prev => prev.map(s => s._id === editingId ? res.data.session : s));
        toast.success('Session updated');
      } else {
        res = await api.post(`/admin/interviews/user/${user._id}`, payload);
        setSessions(prev => [res.data.session, ...prev]);
        toast.success('Interview session saved');
      }
      setEditingId(null);
      setForm(emptyForm());
      setActiveTabIdx(0);
      onSaved?.(res.data.session);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleShare = async (sessionId) => {
    setSharing(true);
    try {
      await api.patch(`/admin/interviews/${sessionId}/share`);
      setSessions(prev => prev.map(s => s._id === sessionId ? { ...s, sharedWithCandidate: true } : s));
      toast.success('Feedback shared with candidate via in-app + email!');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to share'); }
    finally { setSharing(false); }
  };

  const handleEdit = (session) => {
    setEditingId(session._id);
    setActiveTabIdx(0);
    setForm({
      overallRating: session.overallRating,
      googleMeetLink: session.googleMeetLink || '',
      status: session.status || 'completed',
      sections: session.sections?.length ? session.sections : DEFAULT_SECTIONS.map(s => ({ ...s })),
      pros: session.pros || [],
      cons: session.cons || [],
      improvementTips: session.improvementTips || [],
      interviewedAt: session.interviewedAt ? getLocalDatetimeString(new Date(session.interviewedAt)) : getLocalDatetimeString(),
      headline: session.headline || '',
      summary: session.summary || '',
      mcqAssessments: session.mcqAssessments || [],
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/admin/interviews/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Deleted');
      onSaved?.();
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E1DA] px-6 py-4 flex items-center gap-3 z-10">
          <img
            src={optimizeImage(user.avatar, 48) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=00A693&color=fff`}
            alt={user.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-[#00A693]"
          />
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-[#1A1A1A] text-base truncate">{user.name}</h2>
            <p className="text-xs text-[#6B7280] flex items-center flex-wrap gap-1.5">
              <span>#{user.regNumber} • {(user.designations || []).join(', ') || 'Developer'}</span>
              {sessions.length > 0 && (
                <span className={`px-2 py-0.5 rounded-full font-bold bg-[#FAF7F2] border border-[#E5E1DA] ${ratingColor(sessions[0].overallRating)}`}>
                  Rating: {sessions[0].overallRating}/10
                </span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* New / Edit Form */}
        <div className="px-6 py-4 flex-1">
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
            {editingId ? <><Edit3 size={14} /> Edit Session</> : <><Plus size={14} /> New Interview Session</>}
          </h3>

          {/* Date & Rating */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview Date & Time</label>
              <input type="datetime-local" value={form.interviewedAt} onChange={e => setForm(f => ({ ...f, interviewedAt: e.target.value }))} className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Overall Rating (1–10)</label>
              <div className="flex items-center gap-3">
                <input type="range" min="1" max="10" step="0.5" value={form.overallRating}
                  onChange={e => setForm(f => ({ ...f, overallRating: Number(e.target.value) }))}
                  className="flex-1 accent-[#00A693]"
                />
                <span className={`font-bold text-lg w-12 text-right ${ratingColor(form.overallRating)}`}>{form.overallRating}</span>
              </div>
            </div>
          </div>

          {/* Google Meet Link & Status */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Google Meet Link</label>
              <input value={form.googleMeetLink} onChange={e => setForm(f => ({ ...f, googleMeetLink: e.target.value }))}
                placeholder="https://meet.google.com/..." className={inp} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Session Status</label>
              <select value={form.status || 'completed'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={inp}>
                <option value="scheduled">Scheduled</option>
                <option value="postponed">Postponed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* MCQ Assessment Section */}
          <div className="mb-4 bg-[#FAF7F2] border border-[#E5E1DA] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList size={15} className="text-[#00A693]" />
              <h4 className="text-xs font-bold text-[#1A1A1A]">Question Assessment Tool</h4>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#6B7280] mb-1">Module</label>
                <select 
                  value={selectedModId} 
                  onChange={e => { setSelectedModId(e.target.value); setSelectedTopicId(''); setCurrentQuizzes([]); }}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E1DA] rounded-lg bg-white outline-none"
                >
                  <option value="">-- Choose Module --</option>
                  {interviewModules.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#6B7280] mb-1">Topic</label>
                <select 
                  value={selectedTopicId} 
                  onChange={e => { setSelectedTopicId(e.target.value); if (!e.target.value) setCurrentQuizzes([]); }}
                  disabled={!selectedModId}
                  className="w-full text-xs px-2.5 py-1.5 border border-[#E5E1DA] rounded-lg bg-white outline-none disabled:bg-gray-50"
                >
                  <option value="">-- Choose Topic --</option>
                  {(interviewModules.find(m => m._id === selectedModId)?.topics || []).map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingQuizzes && (
              <div className="text-center py-2 text-xs text-[#6B7280]">Loading topic questions...</div>
            )}

            {currentQuizzes.length > 0 && (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 border border-[#E5E1DA] rounded-lg p-2.5 bg-white mb-3">
                {currentQuizzes.map((quiz, qIdx) => {
                  const assessment = (form.mcqAssessments || []).find(a => a.question === quiz.question);
                  const isTicked = assessment?.isCorrect || false;
                  const currentComment = assessment?.comment || '';

                  return (
                    <div key={qIdx} className="p-2.5 bg-[#FAF7F2] border border-[#E5E1DA] rounded-lg text-xs space-y-2">
                      <p className="font-semibold text-[#1A1A1A]">{qIdx + 1}. {quiz.question}</p>
                      {quiz.questionCode && (
                        <pre className="bg-gray-900 text-white p-2 rounded text-[10px] overflow-x-auto font-mono">{quiz.questionCode}</pre>
                      )}
                      
                      {(quiz.answer || quiz.explanation) && (
                        <div className="bg-white p-2.5 border border-[#E5E1DA] rounded text-[11px] text-[#4B5563] whitespace-pre-line leading-relaxed">
                          <strong className="text-[#00A693]">Expected Answer:</strong>
                          <div className="mt-1">{quiz.answer || quiz.explanation}</div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 pt-1.5 border-t border-[#E5E1DA]/60">
                        <label className="flex items-center gap-1.5 cursor-pointer font-bold text-[#00A693]">
                          <input 
                            type="checkbox" 
                            checked={isTicked} 
                            onChange={e => handleMcqChange(quiz, 'isCorrect', e.target.checked)}
                            className="rounded border-[#E5E1DA] text-[#00A693] focus:ring-0 cursor-pointer"
                          />
                          Right Answer
                        </label>
                        <input 
                          type="text" 
                          value={currentComment}
                          onChange={e => handleMcqChange(quiz, 'comment', e.target.value)}
                          placeholder="Add evaluation comments..."
                          className="flex-1 text-[11px] px-2 py-1 border border-[#E5E1DA] rounded bg-white outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {form.mcqAssessments?.length > 0 && (
              <div className="space-y-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-800">Evaluated Questions in this Session ({form.mcqAssessments.length}):</span>
                  <button 
                    onClick={generateAiSummary} 
                    disabled={loadingAiSummary}
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold hover:bg-emerald-700 transition disabled:opacity-60"
                  >
                    {loadingAiSummary ? <RefreshCw size={10} className="animate-spin" /> : '✨'}
                    {loadingAiSummary ? 'Generating...' : 'Generate AI Summary'}
                  </button>
                </div>

                <div className="max-h-[120px] overflow-y-auto space-y-1 text-[10px]">
                  {form.mcqAssessments.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 bg-white p-2 border border-emerald-200/60 rounded">
                      <span className={`shrink-0 font-bold ${a.isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                        {a.isCorrect ? '✓' : '✗'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1A1A1A] truncate">{a.question}</p>
                        <p className="text-[#6B7280] text-[9px] truncate">
                          {a.moduleTitle} &middot; {a.topicName} 
                          {a.comment && <span className="text-emerald-700 italic ml-1">({a.comment})</span>}
                        </p>
                      </div>
                      <button 
                        onClick={() => setForm(f => ({ ...f, mcqAssessments: f.mcqAssessments.filter((_, j) => j !== i) }))}
                        className="text-red-400 hover:text-red-600 font-medium px-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Headline & Overall Summary Section */}
          <div className="grid grid-cols-1 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Session Headline</label>
              <input 
                value={form.headline || ''} 
                onChange={e => setForm(f => ({ ...f, headline: e.target.value }))}
                placeholder="e.g. Strong core JS knowledge, but needs focus on CSS/Flexbox" 
                className={inp} 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Overall Summary Notes</label>
              <textarea 
                value={form.summary || ''} 
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                placeholder="Provide a comprehensive summary of the candidate's performance, strengths, weaknesses, and interview discussion details..." 
                rows={3} 
                className={`${inp} resize-none`} 
              />
            </div>
          </div>

          {/* Technical Skills Sections (Tabs) */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#6B7280] mb-2">Technical Skills</label>
            
            {/* Tab Headers */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-[#E5E1DA] pb-2 mb-3">
              {form.sections.map((sec, i) => (
                <div key={i} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTabIdx(i)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition flex items-center gap-1.5 ${
                      activeTabIdx === i 
                        ? 'bg-[#00A693] text-white font-bold' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {sec.title}
                    {form.sections.length > 1 && (
                      <span 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          removeTab(i); 
                        }} 
                        className="hover:text-red-200 text-white/70 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </span>
                    )}
                  </button>
                </div>
              ))}
              
              {/* Add New Section Inline Input */}
              <div className="flex items-center gap-1 ml-2">
                <input
                  type="text"
                  value={newTabName}
                  onChange={e => setNewTabName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTab(); } }}
                  placeholder="New section..."
                  className="px-2 py-1 text-xs border border-[#E5E1DA] rounded-lg focus:outline-none focus:border-[#00A693]"
                  style={{ width: '100px' }}
                />
                <button
                  type="button"
                  onClick={addTab}
                  className="p-1 bg-[#00A693] text-white rounded-lg hover:bg-[#008f7e] transition"
                  title="Add technical skill section"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* Active Tab Panel */}
            {form.sections[activeTabIdx] && (
              <div className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E5E1DA]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#1A1A1A]">{form.sections[activeTabIdx].title} Rating</span>
                  <StarRating value={form.sections[activeTabIdx].rating} onChange={v => updateSection(activeTabIdx, 'rating', v)} />
                </div>
                <label className="block text-[11px] font-semibold text-[#6B7280] mb-1">Notes for {form.sections[activeTabIdx].title}</label>
                <textarea
                  value={form.sections[activeTabIdx].notes || ''} 
                  onChange={e => updateSection(activeTabIdx, 'notes', e.target.value)}
                  placeholder={`Write technical evaluation notes for ${form.sections[activeTabIdx].title}...`}
                  rows={3}
                  className="w-full text-xs border border-[#E5E1DA] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#00A693] transition resize-none"
                />
              </div>
            )}
          </div>

          {/* Pros */}
          <div className="mb-3">
            <ChipInput label="✅ Strengths (Pros)" chips={form.pros} setChips={v => setForm(f => ({ ...f, pros: v }))}
              placeholder="Add a strength..." colorClass="bg-emerald-50 text-emerald-700 border-emerald-200" />
          </div>

          {/* Cons */}
          <div className="mb-4">
            <ChipInput label="⚠️ Areas to Improve (Cons)" chips={form.cons} setChips={v => setForm(f => ({ ...f, cons: v }))}
              placeholder="Add an area to improve..." colorClass="bg-amber-50 text-amber-700 border-amber-200" />
          </div>

          {/* Improvement Tips */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#1A1A1A]">🎯 Improvement Tips <span className="text-[#00A693]">(Shared with Developer)</span></label>
              <button onClick={addTip} className="text-xs flex items-center gap-1 text-[#00A693] hover:underline">
                <Plus size={12} /> Add Tip
              </button>
            </div>
            <div className="space-y-2">
              {form.improvementTips.map((t, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex gap-2 mb-2">
                    <input value={t.area} onChange={e => updateTip(i, 'area', e.target.value)}
                      placeholder="Area (e.g. DSA, Communication)" className={`${inp} flex-1 text-xs py-1.5`} />
                    <button onClick={() => removeTip(i)} className="text-red-400 hover:text-red-600">
                      <X size={14} />
                    </button>
                  </div>
                  <textarea value={t.tip} onChange={e => updateTip(i, 'tip', e.target.value)}
                    placeholder="Write the improvement tip..." rows={2}
                    className={`${inp} resize-none text-xs py-1.5 mb-2`} />
                  <input value={t.resourceUrl} onChange={e => updateTip(i, 'resourceUrl', e.target.value)}
                    placeholder="Resource URL (optional)" className={`${inp} text-xs py-1.5`} />
                </div>
              ))}
              {form.improvementTips.length === 0 && (
                <p className="text-xs text-[#9CA3AF] text-center py-2">No tips added yet. Click "Add Tip" to add personalized guidance.</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {editingId && (
              <button onClick={() => { setEditingId(null); setForm(emptyForm()); }}
                className="flex-1 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#6B7280] hover:bg-gray-50 transition">
                Cancel
              </button>
            )}
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 bg-[#00A693] text-white rounded-xl text-sm font-semibold hover:bg-[#008f7e] transition flex items-center justify-center gap-2 disabled:opacity-60">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              {saving ? 'Saving...' : (editingId ? 'Update Session' : 'Save Session')}
            </button>
          </div>
        </div>

        {/* Past Sessions */}
        {sessions.length > 0 && (
          <div className="px-6 pb-6 space-y-3 border-t border-[#E5E1DA] pt-4">
            <h3 className="text-sm font-semibold text-[#374151] flex items-center gap-2">
              <ClipboardList size={15} /> Past Sessions ({sessions.length})
            </h3>
            {sessions.map(s => (
              <div key={s._id} className={`rounded-xl border p-4 ${s.sharedWithCandidate ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FAF7F2] border-[#E5E1DA]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#00A693]">Session #{s.sessionNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      s.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      s.status === 'postponed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      s.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {s.status || 'completed'}
                    </span>
                    {s.googleMeetLink && (
                      <a
                        href={s.googleMeetLink.startsWith('http') ? s.googleMeetLink : `https://${s.googleMeetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-lg text-[10px] font-bold uppercase transition"
                        title="Join Meet"
                      >
                        <Video size={10} className="shrink-0" />
                        Join Meet
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${ratingColor(s.overallRating)}`}>{s.overallRating}/10</span>
                    {s.sharedWithCandidate
                      ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Shared</span>
                      : (
                        <button
                          onClick={() => handleShare(s._id)}
                          disabled={sharing}
                          className="text-xs bg-[#00A693] text-white px-2.5 py-1 rounded-full hover:bg-[#008f7e] transition flex items-center gap-1"
                        >
                          <Send size={10} /> Share
                        </button>
                      )
                    }
                    <button onClick={() => handleEdit(s)} className="p-1.5 hover:bg-white rounded-lg transition"><Edit3 size={13} /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-1.5 hover:bg-red-50 text-red-400 rounded-lg transition"><Trash2 size={13} /></button>
                  </div>
                </div>
                {s.headline && <p className="text-xs font-bold text-[#1A1A1A] mb-1">"{s.headline}"</p>}
                {s.summary && <p className="text-xs text-muted mb-2 whitespace-pre-line leading-relaxed bg-[#FAF7F2] border border-[#E5E1DA] p-2 rounded-lg">{s.summary}</p>}
                {s.mcqAssessments?.length > 0 && (
                  <div className="text-[10px] text-[#00A693] font-bold mb-2">
                    🎯 MCQ Score: {s.mcqAssessments.filter(a => a.isCorrect).length}/{s.mcqAssessments.length} Right Answers
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {(s.pros || []).map((p, i) => <span key={i} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{p}</span>)}
                  {(s.cons || []).map((c, i) => <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{c}</span>)}
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1.5">{new Date(s.interviewedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── All Sessions Tab ─────────────────────────────────────────────────────────
function AllSessionsTab({ onEditSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/interviews', { params: { limit: 500 } });
      setSessions(res.data.sessions || []);
    } catch {
      toast.error('Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    if (!q) return true;
    const u = s.user;
    const job = s.vacancy;
    return u?.name?.toLowerCase().includes(q) ||
      String(u?.regNumber || '').includes(q) ||
      u?.email?.toLowerCase().includes(q) ||
      job?.title?.toLowerCase().includes(q) ||
      job?.company?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by applicant, job, or email..."
            className={`${inp} pl-9`}
          />
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB] transition shrink-0"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <p className="text-xs text-[#9CA3AF] mb-3">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="text-center py-16 text-[#9CA3AF]">Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] bg-white border border-[#E5E1DA] rounded-2xl">
          <BookMarked size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-[#6B7280]">No interview sessions yet</p>
          <p className="text-sm mt-1">Select a job and applicant in the Interview Session tab, then save a session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const u = s.user;
            const correct = (s.mcqAssessments || []).filter(a => a.isCorrect).length;
            const total = (s.mcqAssessments || []).length;
            return (
              <div key={s._id} className="bg-white border border-[#E5E1DA] rounded-2xl p-4 hover:border-[#00A693]/40 transition">
                <div className="flex items-start gap-4">
                  <img
                    src={optimizeImage(u?.avatar, 48) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || '?')}&background=00A693&color=fff`}
                    alt={u?.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E1DA] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-[#1A1A1A]">{u?.name ?? 'Unknown'}</span>
                      {u?.regNumber && <span className="text-[10px] text-[#9CA3AF]">#{u.regNumber}</span>}
                      <span className="text-[10px] font-bold text-[#00A693]">Session #{s.sessionNumber}</span>
                      {s.vacancy && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F3F0EB] text-[#6B7280]">
                          {s.vacancy.title}{s.vacancy.company ? ` · ${s.vacancy.company}` : ''}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        s.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                        s.status === 'postponed' ? 'bg-amber-50 text-amber-700' :
                        s.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{s.status || 'completed'}</span>
                      {s.sharedWithCandidate && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Shared</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mb-2">{u?.email}</p>
                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#6B7280]">
                      <span>{new Date(s.interviewedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`font-bold ${ratingColor(s.overallRating)}`}>{s.overallRating}/10</span>
                      {total > 0 && <span>{correct}/{total} MCQ correct</span>}
                      {s.evaluatedBy && <span>by {s.evaluatedBy.name}</span>}
                    </div>
                    {s.headline && <p className="text-xs font-semibold text-[#1A1A1A] mt-2">"{s.headline}"</p>}
                    {s.mcqAssessments?.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {s.mcqAssessments.slice(0, 3).map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] bg-[#FAF7F2] rounded-lg px-2 py-1">
                            <span className={`shrink-0 font-bold ${a.isCorrect ? 'text-emerald-600' : 'text-red-400'}`}>{a.isCorrect ? '✓' : '✗'}</span>
                            <span className="truncate text-[#4B5563]">{a.question}</span>
                          </div>
                        ))}
                        {s.mcqAssessments.length > 3 && (
                          <p className="text-[10px] text-[#9CA3AF]">+{s.mcqAssessments.length - 3} more questions</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u && (
                      <button
                        onClick={() => onEditSession(u, s.vacancy)}
                        className="p-2 hover:bg-[#F3F0EB] rounded-xl transition text-[#00A693]"
                        title="Open session"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {s.googleMeetLink && (
                      <a
                        href={s.googleMeetLink.startsWith('http') ? s.googleMeetLink : `https://${s.googleMeetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-red-50 rounded-xl transition text-red-500"
                        title="Join Meet"
                      >
                        <Video size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCurationSection() {
  const [tab, setTab] = useState('session');
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [modulesApplicant, setModulesApplicant] = useState(null);
  const [modulesVacancy, setModulesVacancy] = useState(null);
  const [drawerUser, setDrawerUser] = useState(null);
  const [allSessionsCount, setAllSessionsCount] = useState(0);

  const SCREENING_STATUSES = useMemo(
    () => new Set(['contacted', '1 round interview', '2nd round interview', '3rd round interview']),
    []
  );

  const fetchData = async (ignore = false) => {
    try {
      const [vacRes, sessionRes] = await Promise.all([
        api.get('/admin/vacancies'),
        api.get('/admin/interviews?limit=500'),
      ]);
      if (ignore) return;
      const list = Array.isArray(vacRes.data) ? vacRes.data : [];
      // Active + non-active (closed); skip pending reports
      setVacancies(list.filter(v => v.status === 'active' || v.status === 'closed'));
      setAllSessionsCount((sessionRes.data.sessions || []).length);
    } catch { toast.error('Failed to load jobs'); }
    finally { if (!ignore) setLoading(false); }
  };

  useEffect(() => {
    let ignore = false;
    fetchData(ignore); // eslint-disable-line react-hooks/set-state-in-effect
    return () => { ignore = true; };
  }, []);

  const jobs = useMemo(
    () => [...vacancies].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return (a.title || '').localeCompare(b.title || '');
    }),
    [vacancies]
  );

  const selectedJob = jobs.find(j => j._id === selectedJobId) || null;

  const jobApplicants = useMemo(() => {
    if (!selectedJob) return [];
    const statusMap = selectedJob.applicantStatus || {};
    return (selectedJob.interests || [])
      .filter(u => {
        if (!u || u.isDeleted) return false;
        const st = statusMap[u._id] || statusMap[u._id?.toString()] || 'applied';
        return SCREENING_STATUSES.has(st);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [selectedJob, SCREENING_STATUSES]);

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    setSelectedApplicantId('');
    setModulesApplicant(null);
    setModulesVacancy(jobId ? (jobs.find(j => j._id === jobId) || null) : null);
    if (tab === 'modules') setTab('session');
  };

  const handleApplicantSelect = (userId) => {
    setSelectedApplicantId(userId);
    if (!userId || !selectedJob) {
      setModulesApplicant(null);
      if (tab === 'modules') setTab('session');
      return;
    }
    const user = jobApplicants.find(u => u._id === userId);
    if (user) {
      setModulesApplicant(user);
      setModulesVacancy(selectedJob);
      setTab('modules');
    }
  };

  const canOpenModules = Boolean(modulesApplicant);

  const handleTabChange = (key) => {
    if (key === 'modules' && !canOpenModules) {
      toast.error('Select a job and applicant from Interview Session first');
      return;
    }
    setTab(key);
  };

  return (
    <div className={tab === 'modules' ? 'max-w-6xl mx-auto' : 'max-w-5xl mx-auto'}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#F3F0EB] rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: 'session', label: 'Interview Session', icon: ClipboardList },
          { key: 'modules', label: 'Interview Modules', icon: Layers, locked: !canOpenModules },
          { key: 'sessions', label: 'Interview Sessions', icon: BookMarked, count: allSessionsCount },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            disabled={!!t.locked}
            title={t.locked ? 'Select a job and applicant from Interview Session first' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white shadow text-[#1A1A1A]'
                : t.locked
                  ? 'text-[#9CA3AF] opacity-60 cursor-not-allowed'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <t.icon size={14} /> {t.label}
            {t.count > 0 && (
              <span className="bg-[#00A693]/10 text-[#00A693] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'modules' && canOpenModules ? (
        <AdminInterviewModulesSection
          key={modulesApplicant?._id || 'none'}
          initialApplicant={modulesApplicant}
          initialVacancy={modulesVacancy}
        />
      ) : tab === 'sessions' ? (
        <AllSessionsTab
          onEditSession={(user, vacancy) => {
            setModulesApplicant(user);
            setModulesVacancy(vacancy || null);
            setSelectedApplicantId(user._id);
            if (vacancy?._id) setSelectedJobId(vacancy._id);
            setTab('modules');
          }}
        />
      ) : (
        <>
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 mb-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users size={15} className="text-[#00A693]" />
              <h3 className="text-sm font-bold text-[#1A1A1A]">Start interview by job</h3>
            </div>

            {/* Job dropdown */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Job / Vacancy</label>
              <div className="relative">
                <select
                  value={selectedJobId}
                  onChange={e => handleJobSelect(e.target.value)}
                  disabled={loading}
                  className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
                >
                  <option value="">— Choose a job —</option>
                  {jobs.map(j => (
                    <option key={j._id} value={j._id}>
                      {j.title}{j.company ? ` — ${j.company}` : ''} ({j.status})
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
              </div>
            </div>

            {/* Applicants for selected job */}
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview Screening Applicant</label>
              <div className="relative">
                <select
                  value={selectedApplicantId}
                  onChange={e => handleApplicantSelect(e.target.value)}
                  disabled={loading || !selectedJobId}
                  className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
                >
                  <option value="">
                    {!selectedJobId
                      ? '— Select a job first —'
                      : jobApplicants.length === 0
                        ? '— No screening applicants for this job —'
                        : '— Choose an applicant —'}
                  </option>
                  {jobApplicants.map(u => (
                    <option key={u._id} value={u._id}>{u.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
              </div>
              {selectedJobId && !loading && (
                <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                  Showing contacted / interview-round applicants for this job ({jobApplicants.length}).
                </p>
              )}
            </div>

            {loading && <p className="text-xs text-[#9CA3AF]">Loading jobs...</p>}
            {!loading && jobs.length === 0 && (
              <p className="text-xs text-[#9CA3AF]">No jobs found. Add vacancies under Opportunities first.</p>
            )}
          </div>

          {!loading && jobs.length > 0 && (
            <div className="text-center py-16 text-[#9CA3AF] bg-white border border-[#E5E1DA] border-dashed rounded-2xl">
              <Users size={36} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium text-[#6B7280]">Select a job, then an applicant</p>
              <p className="text-sm mt-1">Choosing an applicant opens Interview Modules for that job application.</p>
            </div>
          )}
        </>
      )}

      {drawerUser && (
        <EvaluationDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onSaved={() => { fetchData(); }}
        />
      )}
    </div>
  );
}
