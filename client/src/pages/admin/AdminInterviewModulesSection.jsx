import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  ExternalLink, X, Check, Copy, AlertTriangle,
  Code2, Database, Cpu, Globe, Layers, Smartphone, BarChart2, Shield, BookOpen,
  Users, Save, Sparkles, Star,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const inputCls = 'w-full px-3 py-2 border border-border rounded-xl focus:ring-0 focus:border-accent bg-white text-text text-sm outline-none transition-colors';
const labelCls = 'block text-xs font-medium text-muted mb-1';

const emptyTopic = () => ({ name: '', isPracticalProblem: false, problemUrl: '', quizzes: [] });
const emptyModule = () => ({ title: '' });
const emptyEvalForm = () => ({
  overallRating: 5,
  headline: '',
  summary: '',
  interviewComments: '',
  sections: [
    { title: 'Communication', rating: 3, notes: '' },
    { title: 'Technical Skills', rating: 3, notes: '' },
    { title: 'Problem Solving', rating: 3, notes: '' },
    { title: 'Attitude', rating: 3, notes: '' },
    { title: 'Culture Fit', rating: 3, notes: '' },
  ],
  pros: [],
  cons: [],
  improvementTips: [],
});

const CATEGORY_DEFS = [
  { key: 'frontend', label: 'Frontend', description: 'HTML, CSS, React, UI/UX', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100/50', keywords: ['frontend', 'html', 'css', 'react', 'vue', 'angular', 'ui', 'ux', 'tailwind', 'next'] },
  { key: 'backend', label: 'Backend', description: 'Node.js, Express, APIs', icon: Layers, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50', keywords: ['backend', 'node', 'express', 'api', 'server', 'rest', 'graphql'] },
  { key: 'database', label: 'Database', description: 'MongoDB, SQL, NoSQL', icon: Database, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', headerBg: 'bg-gradient-to-r from-violet-50 to-violet-100/50', keywords: ['database', 'mongodb', 'sql', 'nosql', 'postgres', 'mysql', 'redis', 'mongo'] },
  { key: 'programming', label: 'Programming Languages', description: 'JavaScript, Python, Java', icon: Code2, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100/50', keywords: ['javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'rust', 'go', 'php', 'programming language', 'script'] },
  { key: 'dsa', label: 'DSA', description: 'Data Structures & Algorithms', icon: BarChart2, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-gradient-to-r from-rose-50 to-rose-100/50', keywords: ['dsa', 'data structure', 'algorithm', 'sorting', 'searching', 'tree', 'graph'] },
  { key: 'mobile', label: 'Mobile Development', description: 'Android, iOS, Flutter, React Native', icon: Smartphone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', headerBg: 'bg-gradient-to-r from-cyan-50 to-cyan-100/50', keywords: ['react native', 'react-native', 'mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'] },
  { key: 'system_design', label: 'System Design', description: 'Architecture, scalability', icon: Cpu, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', headerBg: 'bg-gradient-to-r from-indigo-50 to-indigo-100/50', keywords: ['system design', 'architecture', 'microservice', 'scalab', 'distributed'] },
  { key: 'ai', label: 'AI / Machine Learning', description: 'ML, NLP, deep learning', icon: BookOpen, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', headerBg: 'bg-gradient-to-r from-pink-50 to-pink-100/50', keywords: ['ai', 'artificial intelligence', 'machine learning', 'nlp', 'deep learning', 'ml'] },
  { key: 'others', label: 'Others', description: 'Security, Data Science & more', icon: Shield, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200', headerBg: 'bg-gradient-to-r from-gray-50 to-gray-100/50', keywords: [] },
];

function getModuleCategory(mod) {
  const haystack = `${mod.title} ${mod.category || ''}`.toLowerCase();
  // Longest keyword wins so "react native" beats frontend's "react"
  let bestKey = 'others';
  let bestLen = -1;
  for (const cat of CATEGORY_DEFS.slice(0, -1)) {
    for (const kw of cat.keywords) {
      if (haystack.includes(kw) && kw.length > bestLen) {
        bestKey = cat.key;
        bestLen = kw.length;
      }
    }
  }
  return bestKey;
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h3 className="text-sm font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="p-1 text-muted hover:text-text transition-colors rounded-lg hover:bg-bg"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function TopicQuestionsForm({ questions, onChange }) {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const add = () => {
    onChange([...(questions || []), { question: '', questionCode: '', answer: '', explanation: '', sampleCode: '' }]);
    setExpandedIndex(questions?.length || 0);
  };

  const remove = (i) => {
    onChange(questions.filter((_, idx) => idx !== i));
    if (expandedIndex === i) setExpandedIndex(null);
  };

  const update = (i, field, value) => {
    const next = [...questions];
    next[i] = { ...next[i], [field]: value };
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-accent">Interview Questions</p>
        <button type="button" onClick={add}
          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-accent-light text-accent rounded-lg hover:bg-accent/20 transition-colors border border-accent/20">
          <Plus size={11} /> Add Question
        </button>
      </div>

      {(!questions || questions.length === 0) && (
        <div className="text-center py-4 bg-bg rounded-lg border border-border border-dashed">
          <p className="text-xs text-muted">No interview questions yet.</p>
        </div>
      )}

      {(questions || []).map((q, i) => (
        <div key={i} className="rounded-lg border border-border overflow-hidden">
          <div className="px-3 py-2.5 flex items-center justify-between bg-white cursor-pointer hover:bg-bg transition-colors"
            onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-accent-light text-accent text-xs flex items-center justify-center font-bold">{i + 1}</span>
              <span className="text-sm text-text font-medium truncate max-w-[320px]">{q.question || 'New Question'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                <Trash2 size={13} />
              </button>
              <ChevronDown size={14} className={`text-muted transition-transform duration-200 ${expandedIndex === i ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {expandedIndex === i && (
            <div className="p-4 space-y-3 border-t border-border bg-bg">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Question</label>
                <input type="text" value={q.question || ''} onChange={e => update(i, 'question', e.target.value)}
                  className={inputCls} placeholder="Enter interview question (e.g. What is closure?)" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Question Code Snippet (optional)</label>
                <textarea value={q.questionCode || ''} onChange={e => update(i, 'questionCode', e.target.value)}
                  className={`${inputCls} font-mono min-h-[72px]`} placeholder="// optional code for the question..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Expected Answer / Explanation</label>
                <textarea value={q.answer || q.explanation || ''} onChange={e => { update(i, 'answer', e.target.value); update(i, 'explanation', e.target.value); }}
                  className={`${inputCls} min-h-[100px]`} placeholder="Enter the correct answer / expected response from the candidate..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Sample Code (optional)</label>
                <textarea value={q.sampleCode || ''} onChange={e => update(i, 'sampleCode', e.target.value)}
                  className={`${inputCls} font-mono min-h-[88px]`} placeholder="// optional sample code..." />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function AdminInterviewModulesSection({ initialApplicant = null, initialVacancy = null }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedModId, setExpandedModId] = useState(null);
  const [expandedCats, setExpandedCats] = useState({});
  const [showCreateModule, setShowCreateModule] = useState(false);
  const [showEditModule, setShowEditModule] = useState(false);
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [showEditTopic, setShowEditTopic] = useState(false);
  const [showCopyConfirm, setShowCopyConfirm] = useState(false);
  const [moduleForm, setModuleForm] = useState(emptyModule());
  const [topicForm, setTopicForm] = useState(emptyTopic());
  const [bulkTopics, setBulkTopics] = useState('');
  const [topicMode, setTopicMode] = useState('bulk');
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const [topicQuestionsCache, setTopicQuestionsCache] = useState({});  // topicId -> questions[]
  const [loadingTopicId, setLoadingTopicId] = useState(null);
  // evaluations: { [`${topicId}_${qi}`]: { result: null|'correct'|'incorrect', comment: string } }
  const [evaluations, setEvaluations] = useState({});

  const setEval = (topicId, qi, field, value) => {
    const key = `${topicId}_${qi}`;
    setEvaluations(prev => ({ ...prev, [key]: { ...(prev[key] || { result: null, comment: '' }), [field]: value } }));
  };

  const [selectedApplicant, setSelectedApplicant] = useState(initialApplicant || null);
  const [savingSession, setSavingSession] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [evalForm, setEvalForm] = useState(emptyEvalForm());
  const [evalModuleOpen, setEvalModuleOpen] = useState(true);

  // Applicant comes from Interview Session tab (no re-select here)
  useEffect(() => {
    setSelectedApplicant(initialApplicant || null);
    setEvalForm(emptyEvalForm());
    setEvaluations({});
  }, [initialApplicant]);

  const buildMcqAssessments = () => {
    const mcqAssessments = [];
    for (const [key, ev] of Object.entries(evaluations)) {
      if (ev.result !== 'correct' && ev.result !== 'incorrect') continue;
      const [topicId, qiStr] = key.split('_');
      const qi = parseInt(qiStr, 10);
      const qs = topicQuestionsCache[topicId] || [];
      const q = qs[qi];
      if (!q) continue;
      let moduleTitle = '', topicName = '';
      for (const mod of modules) {
        const t = mod.topics?.find(tp => tp._id === topicId);
        if (t) { moduleTitle = mod.title; topicName = t.name; break; }
      }
      mcqAssessments.push({
        question: q.question,
        isCorrect: ev.result === 'correct',
        comment: ev.comment || '',
        moduleTitle,
        topicName,
      });
    }
    return mcqAssessments;
  };

  const runAiEvaluation = async () => {
    if (!selectedApplicant) return toast.error('Select an applicant first');
    const mcqAssessments = buildMcqAssessments();
    if (mcqAssessments.length === 0) {
      return toast.error('Mark at least one question Correct or Incorrect before AI evaluation');
    }
    setLoadingAi(true);
    try {
      const res = await api.post('/admin/interviews/summarize', {
        mcqAssessments,
        candidateName: selectedApplicant.name,
        interviewerComments: evalForm.interviewComments || '',
      });
      const { headline, summary, overallRating, pros, cons, improvementTips } = res.data;
      setEvalForm(f => ({
        ...f,
        headline: headline || f.headline,
        summary: summary || f.summary,
        overallRating: overallRating != null ? Number(overallRating) : f.overallRating,
        pros: Array.isArray(pros) && pros.length ? pros : f.pros,
        cons: Array.isArray(cons) && cons.length ? cons : f.cons,
        improvementTips: Array.isArray(improvementTips) && improvementTips.length ? improvementTips : f.improvementTips,
      }));
      setEvalModuleOpen(true);
      toast.success('AI evaluation summary generated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI evaluation');
    } finally {
      setLoadingAi(false);
    }
  };

  const updateSection = (idx, field, value) => {
    setEvalForm(f => {
      const sections = [...f.sections];
      sections[idx] = { ...sections[idx], [field]: value };
      return { ...f, sections };
    });
  };

  const handleSaveSession = async () => {
    if (!selectedApplicant) return toast.error('Select an applicant from the Interview Session tab first');
    const mcqAssessments = buildMcqAssessments();
    if (mcqAssessments.length === 0) return toast.error('Mark at least one question Correct or Incorrect');
    setSavingSession(true);
    try {
      await api.post(`/admin/interviews/user/${selectedApplicant._id}`, {
        mcqAssessments,
        status: 'completed',
        overallRating: evalForm.overallRating,
        headline: evalForm.headline,
        summary: evalForm.summary || evalForm.interviewComments || '',
        sections: evalForm.sections,
        pros: evalForm.pros,
        cons: evalForm.cons,
        improvementTips: evalForm.improvementTips,
        vacancy: initialVacancy?._id || null,
      });
      toast.success(
        initialVacancy?.title
          ? `Session saved for ${selectedApplicant.name} · ${initialVacancy.title}`
          : `Session saved for ${selectedApplicant.name}!`
      );
      setEvaluations({});
      setEvalForm(emptyEvalForm());
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save session'); }
    finally { setSavingSession(false); }
  };

  const fetchModules = async () => {
    try {
      const res = await api.get('/interview-modules');
      setModules(res.data.data || []);
    } catch { toast.error('Failed to load interview modules'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchModules(); }, []);

  const grouped = useMemo(() => {
    const map = {};
    CATEGORY_DEFS.forEach(cat => { map[cat.key] = []; });
    modules.forEach(mod => {
      // UI Evaluation Module is separate; skip similarly named bank modules from categories
      if (/^evaluation module$/i.test(mod.title || '')) return;
      const key = getModuleCategory(mod);
      map[key].push(mod);
    });
    return map;
  }, [modules]);

  const toggleCat = (key) => setExpandedCats(prev => ({ ...prev, [key]: !prev[key] }));

  const toggleTopicAccordion = async (modId, topic) => {
    const tid = topic._id;
    if (expandedTopicId === tid) { setExpandedTopicId(null); return; }
    setExpandedTopicId(tid);
    if (topicQuestionsCache[tid]) return; // already loaded
    setLoadingTopicId(tid);
    try {
      const res = await api.get(`/interview-modules/${modId}/topics/${tid}/quizzes`);
      setTopicQuestionsCache(prev => ({ ...prev, [tid]: res.data.data || [] }));
    } catch { setTopicQuestionsCache(prev => ({ ...prev, [tid]: [] })); }
    finally { setLoadingTopicId(null); }
  };

  const handleCopyFromQuizZone = async () => {
    setCopying(true);
    try {
      const res = await api.post('/interview-modules/copy-from-quiz-zone');
      toast.success(res.data.message || 'Copied successfully');
      setShowCopyConfirm(false); fetchModules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to copy from Quiz Zone'); }
    finally { setCopying(false); }
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim()) return toast.error('Module title is required');
    setSaving(true);
    try {
      await api.post('/interview-modules', { title: moduleForm.title.trim(), order: modules.length });
      toast.success('Module created'); setShowCreateModule(false); setModuleForm(emptyModule()); fetchModules();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create module'); }
    finally { setSaving(false); }
  };

  const handleUpdateModule = async () => {
    if (!moduleForm.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      await api.put(`/interview-modules/${selectedModule._id}`, { title: moduleForm.title.trim() });
      toast.success('Module updated'); setShowEditModule(false); setSelectedModule(null); setModuleForm(emptyModule()); fetchModules();
    } catch { toast.error('Failed to update module'); }
    finally { setSaving(false); }
  };

  const handleDeleteModule = async (mod) => {
    if (!window.confirm(`Delete "${mod.title}" and all its topics?`)) return;
    try { await api.delete(`/interview-modules/${mod._id}`); toast.success('Module deleted'); fetchModules(); }
    catch { toast.error('Failed to delete module'); }
  };

  const handleAddTopic = async () => {
    if (!selectedModule) return;
    if (topicMode === 'practical') {
      if (!topicForm.name.trim()) return toast.error('Problem title is required');
      if (!topicForm.problemUrl.trim()) return toast.error('Problem URL is required');
      setSaving(true);
      try {
        await api.post(`/interview-modules/${selectedModule._id}/topics`, { name: topicForm.name.trim(), order: selectedModule.topics?.length || 0, isPracticalProblem: true, problemUrl: topicForm.problemUrl.trim(), quizzes: topicForm.quizzes });
        toast.success('Topic added'); setShowAddTopic(false); resetTopicForm(); fetchModules();
      } catch { toast.error('Failed to add topic'); } finally { setSaving(false); }
      return;
    }
    if (topicMode === 'single') {
      if (!topicForm.name.trim()) return toast.error('Topic name is required');
      setSaving(true);
      try {
        await api.post(`/interview-modules/${selectedModule._id}/topics`, { name: topicForm.name.trim(), order: selectedModule.topics?.length || 0, isPracticalProblem: false, quizzes: topicForm.quizzes });
        toast.success('Topic added'); setShowAddTopic(false); resetTopicForm(); fetchModules();
      } catch { toast.error('Failed to add topic'); } finally { setSaving(false); }
      return;
    }
    const lines = bulkTopics.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return toast.error('Enter at least one topic name');
    setSaving(true);
    try {
      let order = selectedModule.topics?.length || 0;
      for (const name of lines) { await api.post(`/interview-modules/${selectedModule._id}/topics`, { name, order, isPracticalProblem: false, quizzes: [] }); order++; }
      toast.success(`${lines.length} topic${lines.length > 1 ? 's' : ''} added`); setShowAddTopic(false); resetTopicForm(); fetchModules();
    } catch { toast.error('Failed to add topics'); } finally { setSaving(false); }
  };

  const handleUpdateTopic = async () => {
    if (!selectedModule || !selectedTopic) return;
    if (!topicForm.name.trim()) return toast.error('Topic name is required');
    setSaving(true);
    try {
      await api.put(`/interview-modules/${selectedModule._id}/topics/${selectedTopic._id}`, { name: topicForm.name.trim(), isPracticalProblem: topicForm.isPracticalProblem, problemUrl: topicForm.problemUrl, quizzes: topicForm.quizzes });
      toast.success('Topic updated'); setShowEditTopic(false); setSelectedTopic(null); setSelectedModule(null); resetTopicForm(); fetchModules();
    } catch { toast.error('Failed to update topic'); } finally { setSaving(false); }
  };

  const handleDeleteTopic = async (mod, topicId, topicName) => {
    if (!window.confirm(`Delete topic "${topicName}"?`)) return;
    try { await api.delete(`/interview-modules/${mod._id}/topics/${topicId}`); toast.success('Topic deleted'); fetchModules(); }
    catch { toast.error('Failed to delete topic'); }
  };

  const resetTopicForm = () => { setTopicForm(emptyTopic()); setBulkTopics(''); setTopicMode('bulk'); };

  if (loading) return <div className="space-y-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />)}</div>;

  return (
    <div>
      {/* Context bar — applicant chosen on Interview Session tab */}
      <div className="bg-white border border-border rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3 justify-between">
        {selectedApplicant ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent text-sm font-bold overflow-hidden shrink-0">
              {selectedApplicant.avatar
                ? <img src={selectedApplicant.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                : selectedApplicant.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-text truncate">{selectedApplicant.name}</p>
                <button
                  type="button"
                  onClick={runAiEvaluation}
                  disabled={loadingAi}
                  title="AI evaluation from correct/incorrect answers & comments"
                  className="shrink-0 w-7 h-7 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 disabled:opacity-50 flex items-center justify-center transition-colors"
                >
                  {loadingAi
                    ? <span className="w-3.5 h-3.5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    : <Sparkles size={14} />}
                </button>
              </div>
              {initialVacancy && (
                <p className="text-xs text-muted truncate">
                  {initialVacancy.title}{initialVacancy.company ? ` — ${initialVacancy.company}` : ''}
                  <span className="ml-1 uppercase text-[10px] font-bold">({initialVacancy.status})</span>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted min-w-0">
            <Users size={15} className="text-accent shrink-0" />
            <p className="text-sm">Select a job and applicant from the <span className="font-semibold text-text">Interview Session</span> tab first.</p>
          </div>
        )}
        <div className="flex items-center gap-3 shrink-0">
          {Object.values(evaluations).some(e => e.result) && (
            <p className="text-[11px] font-medium hidden sm:block">
              <span className="text-emerald-600">✓ {Object.values(evaluations).filter(e => e.result === 'correct').length} correct</span>
              <span className="text-muted"> · </span>
              <span className="text-red-500">{Object.values(evaluations).filter(e => e.result === 'incorrect').length} incorrect</span>
              <span className="text-muted"> · </span>
              <span className="text-blue-600">{Object.values(evaluations).filter(e => e.result).length} evaluated</span>
            </p>
          )}
          <button
            onClick={handleSaveSession}
            disabled={savingSession || !selectedApplicant}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {savingSession ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
            Save Session
          </button>
        </div>
      </div>

      {/* ── Module Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-text flex items-center gap-2"><ClipboardList size={20} className="text-accent" />Interview Modules</h2>
        </div>
        <div className="flex items-center gap-2">
          {modules.length === 0 && (
            <button onClick={() => setShowCopyConfirm(true)} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-medium">
              <Copy size={13} /> Copy from Quiz Zone
            </button>
          )}
          <button onClick={() => { setModuleForm(emptyModule()); setShowCreateModule(true); }} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-medium">
            <Plus size={13} /> New Module
          </button>
        </div>
      </div>

      {/* ── Evaluation Module (ratings & comments) ───────────────────────── */}
      <div className="rounded-2xl border border-amber-200 overflow-hidden mb-4">
        <button
          type="button"
          onClick={() => setEvalModuleOpen(o => !o)}
          className="w-full bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 flex items-center gap-3 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <Star size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-amber-700">Evaluation Module</span>
              <span className="text-[10px] text-amber-700/70 font-medium">Ratings & interview comments</span>
            </div>
            <p className="text-xs text-muted mt-0.5">Overall {evalForm.overallRating}/10{evalForm.headline ? ` · ${evalForm.headline}` : ''}</p>
          </div>
          {evalModuleOpen ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
        </button>

        {evalModuleOpen && (
          <div className="bg-white border-t border-amber-100 px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Overall Rating (1–10)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={evalForm.overallRating}
                    onChange={e => setEvalForm(f => ({ ...f, overallRating: Number(e.target.value) }))}
                    className="flex-1 accent-amber-600"
                  />
                  <span className="text-sm font-bold text-amber-700 w-10 text-right">{evalForm.overallRating}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Headline</label>
                <input
                  type="text"
                  value={evalForm.headline}
                  onChange={e => setEvalForm(f => ({ ...f, headline: e.target.value }))}
                  className={inputCls}
                  placeholder="Short summary headline…"
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Interviewer Comments</label>
              <textarea
                value={evalForm.interviewComments}
                onChange={e => setEvalForm(f => ({ ...f, interviewComments: e.target.value }))}
                className={`${inputCls} min-h-[72px]`}
                placeholder="Notes about the interview discussion, soft skills, communication…"
              />
            </div>

            <div>
              <label className={labelCls}>Interview Summary</label>
              <textarea
                value={evalForm.summary}
                onChange={e => setEvalForm(f => ({ ...f, summary: e.target.value }))}
                className={`${inputCls} min-h-[88px]`}
                placeholder="Full evaluation summary (can be filled by AI)…"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted mb-2">Section Ratings</p>
              <div className="space-y-3">
                {evalForm.sections.map((sec, idx) => (
                  <div key={sec.title} className="bg-amber-50/40 border border-amber-100 rounded-xl p-3">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-semibold text-text">{sec.title}</span>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => updateSection(idx, 'rating', n)}
                            className={`p-0.5 ${n <= sec.rating ? 'text-amber-500' : 'text-gray-300'}`}
                          >
                            <Star size={14} className={n <= sec.rating ? 'fill-amber-400' : ''} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={sec.notes}
                      onChange={e => updateSection(idx, 'notes', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-amber-100 rounded-lg bg-white outline-none focus:border-amber-300"
                      placeholder={`Notes for ${sec.title}…`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {(evalForm.pros.length > 0 || evalForm.cons.length > 0) && (
              <div className="flex flex-wrap gap-1.5">
                {evalForm.pros.map((p, i) => (
                  <span key={`p-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{p}</span>
                ))}
                {evalForm.cons.map((c, i) => (
                  <span key={`c-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">{c}</span>
                ))}
              </div>
            )}

            <p className="text-[11px] text-muted">
              Tip: Mark questions Correct/Incorrect, add comments, then click the <Sparkles size={10} className="inline text-violet-500" /> icon next to the name to auto-fill summary & rating.
            </p>
          </div>
        )}
      </div>

      {modules.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <ClipboardList size={28} className="text-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-text mb-1">No interview modules yet</p>
          <p className="text-xs text-muted mb-4">Copy from Quiz Zone to get started with organized interview categories.</p>
          <button onClick={() => setShowCopyConfirm(true)} className="inline-flex items-center gap-2 text-sm px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-medium">
            <Copy size={14} /> Copy from Quiz Zone
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {CATEGORY_DEFS.map(cat => {
            const catModules = grouped[cat.key] || [];
            if (catModules.length === 0) return null;
            const Icon = cat.icon;
            const isOpen = expandedCats[cat.key];
            const catTopics = catModules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
            return (
              <div key={cat.key} className={`rounded-2xl border ${cat.borderColor} overflow-hidden`}>
                <button onClick={() => toggleCat(cat.key)} className={`w-full ${cat.headerBg} px-5 py-4 flex items-center gap-3 text-left transition-all`}>
                  <div className={`w-9 h-9 rounded-xl ${cat.bgColor} flex items-center justify-center shrink-0 border ${cat.borderColor}`}><Icon size={16} className={cat.color} /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${cat.color}`}>{cat.label}</span>
                      <span className="text-[10px] text-muted font-medium">{cat.description}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted font-medium">{catModules.length} module{catModules.length !== 1 ? 's' : ''}</span>
                      <span className="text-[10px] text-muted">&middot;</span>
                      <span className="text-xs text-muted font-medium">{catTopics} topic{catTopics !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cat.bgColor} ${cat.color} border ${cat.borderColor}`}>{catModules.length}</span>
                    {isOpen ? <ChevronUp size={15} className="text-muted" /> : <ChevronDown size={15} className="text-muted" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="bg-white divide-y divide-border/50">
                    {catModules.map((mod) => (
                      <div key={mod._id}>
                        <div className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/60 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-text">{mod.title}</p>
                            <p className="text-xs text-muted">{mod.topics?.length || 0} topic{(mod.topics?.length || 0) !== 1 ? 's' : ''}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setSelectedModule(mod); setModuleForm({ title: mod.title }); setShowEditModule(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-all opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-none"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteModule(mod)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-all opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-none"><Trash2 size={12} /></button>
                            <button onClick={() => setExpandedModId(expandedModId === mod._id ? null : mod._id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:bg-gray-100 transition-colors">
                              {expandedModId === mod._id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                            </button>
                          </div>
                        </div>
                        {expandedModId === mod._id && (
                          <div className={`${cat.bgColor} border-t ${cat.borderColor} px-5 py-3`}>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-muted uppercase tracking-wide">Topics</p>
                              <button onClick={() => { setSelectedModule(mod); resetTopicForm(); setShowAddTopic(true); }} className={`flex items-center gap-1 text-xs px-2.5 py-1 bg-white ${cat.color} rounded-lg border ${cat.borderColor} hover:brightness-95 transition-colors font-medium`}>
                                <Plus size={11} /> Add Topic
                              </button>
                            </div>
                            {(!mod.topics || mod.topics.length === 0) ? (
                              <p className="text-xs text-muted py-2 text-center">No topics yet.</p>
                            ) : (
                              <div className="space-y-1.5">
                                {mod.topics.map((topic) => {
                                  const isTopicOpen = expandedTopicId === topic._id;
                                  const cachedQs = topicQuestionsCache[topic._id] || [];
                                  const isTopicLoading = loadingTopicId === topic._id;
                                  return (
                                    <div key={topic._id} className={`bg-white border rounded-lg overflow-hidden transition-all ${isTopicOpen ? `border-${cat.color.replace('text-','')}/40 shadow-sm` : 'border-border'}`}>
                                      {/* Topic Header Row */}
                                      <div className="flex items-center gap-2.5 px-3 py-2">
                                        <button
                                          onClick={() => toggleTopicAccordion(mod._id, topic)}
                                          className="flex-1 min-w-0 flex items-center gap-2 text-left group"
                                        >
                                          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${isTopicOpen ? cat.bgColor : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                            {isTopicLoading
                                              ? <span className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${cat.color} border-current`} />
                                              : isTopicOpen
                                                ? <ChevronUp size={11} className={cat.color} />
                                                : <ChevronDown size={11} className="text-muted" />
                                            }
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span className="text-sm text-text font-medium">{topic.name}</span>
                                              {topic.isPracticalProblem && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full font-medium">Practical</span>}
                                              {(topic.quizCount > 0 || topic.hasQuiz) && (
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${cat.bgColor} ${cat.color} ${cat.borderColor}`}>
                                                  {topic.quizCount} Q{topic.quizCount !== 1 ? 's' : ''}
                                                </span>
                                              )}
                                            </div>
                                            {topic.isPracticalProblem && topic.problemUrl && (
                                              <a href={topic.problemUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-accent hover:underline mt-0.5">
                                                <ExternalLink size={9} /> {topic.problemUrl}
                                              </a>
                                            )}
                                          </div>
                                        </button>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button onClick={async () => {
                                            try { const res = await api.get(`/interview-modules/${mod._id}/topics/${topic._id}/quizzes`); setTopicForm({ name: topic.name, isPracticalProblem: topic.isPracticalProblem || false, problemUrl: topic.problemUrl || '', quizzes: res.data.data || [] }); }
                                            catch { setTopicForm({ name: topic.name, isPracticalProblem: topic.isPracticalProblem || false, problemUrl: topic.problemUrl || '', quizzes: [] }); }
                                            setSelectedModule(mod); setSelectedTopic(topic); setShowEditTopic(true);
                                          }} className="w-6 h-6 flex items-center justify-center rounded-md text-blue-500 hover:bg-blue-50 transition-all opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-none"><Pencil size={12} /></button>
                                          <button onClick={() => handleDeleteTopic(mod, topic._id, topic.name)} className="w-6 h-6 flex items-center justify-center rounded-md text-red-400 hover:bg-red-50 transition-all opacity-40 blur-[0.5px] hover:opacity-100 hover:blur-none"><Trash2 size={12} /></button>
                                        </div>
                                      </div>

                                      {/* Accordion Q&A Panel */}
                                      {isTopicOpen && (
                                        <div className={`border-t ${cat.borderColor} px-3 py-3 ${cat.bgColor}`}>
                                          {isTopicLoading ? (
                                            <p className="text-xs text-muted text-center py-3">Loading questions...</p>
                                          ) : cachedQs.length === 0 ? (
                                            <p className="text-xs text-muted text-center py-3 italic">No questions added yet.</p>
                                          ) : (
                                            <div className="space-y-2">
                                              {cachedQs.map((q, qi) => {
                                                const evalKey = `${topic._id}_${qi}`;
                                                const ev = evaluations[evalKey] || { result: null, comment: '' };
                                                const cardCls = ev.result === 'correct'
                                                  ? 'bg-green-50 border-green-200'
                                                  : ev.result === 'incorrect'
                                                    ? 'bg-red-50 border-red-200'
                                                    : 'bg-white border-gray-100';
                                                return (
                                                  <div key={qi} className={`border rounded-xl p-3 shadow-sm transition-all ${cardCls}`}>
                                                    {/* Question */}
                                                    <p className="text-xs font-semibold text-text mb-1.5">
                                                      <span className={`inline-block w-5 h-5 text-center leading-5 rounded-full text-[10px] font-bold mr-1.5 ${cat.bgColor} ${cat.color}`}>{qi + 1}</span>
                                                      {q.question}
                                                    </p>

                                                    {/* Code snippet */}
                                                    {q.questionCode && (
                                                      <pre className="bg-gray-900 text-green-300 p-2 rounded text-[10px] overflow-x-auto font-mono mb-2">{q.questionCode}</pre>
                                                    )}

                                                    {/* Answer guide (no label) */}
                                                    {(q.answer || q.explanation) && (
                                                      <div className="mt-1.5 pl-3 border-l-2 border-green-300 mb-3">
                                                        <p className="text-[11px] text-[#4B5563] whitespace-pre-line leading-relaxed">{q.answer || q.explanation}</p>
                                                      </div>
                                                    )}

                                                    {/* Evaluator Controls */}
                                                    <div className={`flex items-center gap-2 pt-2 mt-2 border-t flex-wrap ${
                                                      ev.result === 'correct' ? 'border-green-200' :
                                                      ev.result === 'incorrect' ? 'border-red-200' : 'border-gray-100'
                                                    }`}>
                                                      <div className="flex items-center gap-1.5 shrink-0">
                                                        <button
                                                          type="button"
                                                          onClick={() => setEval(topic._id, qi, 'result', ev.result === 'correct' ? null : 'correct')}
                                                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                                            ev.result === 'correct'
                                                              ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                              : 'bg-white border-gray-300 text-gray-500 hover:border-green-400 hover:text-green-600'
                                                          }`}
                                                        >
                                                          ✓ Correct
                                                        </button>
                                                        <button
                                                          type="button"
                                                          onClick={() => setEval(topic._id, qi, 'result', ev.result === 'incorrect' ? null : 'incorrect')}
                                                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                                                            ev.result === 'incorrect'
                                                              ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                                              : 'bg-white border-gray-300 text-gray-500 hover:border-red-400 hover:text-red-600'
                                                          }`}
                                                        >
                                                          ✗ Incorrect
                                                        </button>
                                                      </div>

                                                      <input
                                                        type="text"
                                                        value={ev.comment}
                                                        onChange={e => setEval(topic._id, qi, 'comment', e.target.value)}
                                                        placeholder="Add evaluator comment..."
                                                        className={`flex-1 min-w-[120px] text-[11px] px-2.5 py-1.5 rounded-lg border outline-none transition-colors ${
                                                          ev.result === 'correct'
                                                            ? 'border-green-200 bg-green-50/50 focus:border-green-400 placeholder:text-green-300'
                                                            : ev.result === 'incorrect'
                                                              ? 'border-red-200 bg-red-50/50 focus:border-red-400 placeholder:text-red-300'
                                                              : 'border-gray-200 bg-gray-50 focus:border-gray-400 placeholder:text-gray-300'
                                                        }`}
                                                      />
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}

      {showCopyConfirm && (
        <Modal title="Copy from Quiz Zone" onClose={() => setShowCopyConfirm(false)}>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">This will copy <strong>all Quiz Zone modules, topics, and MCQs</strong> into Interview Modules as independent data. Modifications here will <strong>not</strong> affect Quiz Zone.</p>
            </div>
            <p className="text-sm text-text">This can only be done once (when Interview Modules is empty). Proceed?</p>
            <div className="flex gap-2">
              <button onClick={() => setShowCopyConfirm(false)} className="flex-1 text-sm py-2.5 rounded-xl font-medium border border-border text-muted hover:bg-bg transition-colors">Cancel</button>
              <button onClick={handleCopyFromQuizZone} disabled={copying} className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                {copying ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Copy size={14} />} Copy Now
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showCreateModule && (
        <Modal title="Create Interview Module" onClose={() => { setShowCreateModule(false); setModuleForm(emptyModule()); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Module Title</label><input type="text" value={moduleForm.title} onChange={e => setModuleForm({ title: e.target.value })} className={inputCls} placeholder="e.g. JavaScript Fundamentals" onKeyDown={e => e.key === 'Enter' && handleCreateModule()} autoFocus /></div>
            <button onClick={handleCreateModule} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />} Create Module
            </button>
          </div>
        </Modal>
      )}

      {showEditModule && (
        <Modal title="Edit Interview Module" onClose={() => { setShowEditModule(false); setSelectedModule(null); setModuleForm(emptyModule()); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Module Title</label><input type="text" value={moduleForm.title} onChange={e => setModuleForm({ title: e.target.value })} className={inputCls} placeholder="Module title" autoFocus /></div>
            <button onClick={handleUpdateModule} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />} Save Changes
            </button>
          </div>
        </Modal>
      )}

      {showAddTopic && (
        <Modal wide title={`Add Topic - ${selectedModule?.title}`} onClose={() => { setShowAddTopic(false); setSelectedModule(null); resetTopicForm(); }}>
          <div className="space-y-4">
            <div className="flex gap-2">
              {[{ id: 'bulk', label: 'Bulk Add' }, { id: 'single', label: 'Single + Questions' }, { id: 'practical', label: 'Practical Problem' }].map(({ id, label }) => (
                <button key={id} type="button" onClick={() => setTopicMode(id)} className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors ${topicMode === id ? 'bg-accent text-white border-accent' : 'bg-white text-muted border-border hover:border-accent/50'}`}>{label}</button>
              ))}
            </div>
            {topicMode === 'bulk' && (
              <div><label className={labelCls}>Topic Names (one per line)</label><textarea value={bulkTopics} onChange={e => setBulkTopics(e.target.value)} className={`${inputCls} min-h-[140px]`} placeholder={"Variables\nFunctions\nArrays"} autoFocus /><p className="text-xs text-muted mt-1">Each line becomes a separate topic.</p></div>
            )}
            {(topicMode === 'single' || topicMode === 'practical') && (
              <div className="space-y-3">
                <div><label className={labelCls}>{topicMode === 'practical' ? 'Problem Title' : 'Topic Name'}</label><input type="text" value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder={topicMode === 'practical' ? 'e.g. Two Sum' : 'Topic name'} autoFocus /></div>
                {topicMode === 'practical' && <div><label className={labelCls}>Problem URL</label><input type="url" value={topicForm.problemUrl} onChange={e => setTopicForm(f => ({ ...f, problemUrl: e.target.value }))} className={inputCls} placeholder="https://leetcode.com/problems/..." /></div>}
                <TopicQuestionsForm questions={topicForm.quizzes} onChange={quizzes => setTopicForm(f => ({ ...f, quizzes }))} />
              </div>
            )}
            <button onClick={handleAddTopic} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={14} />} Add Topic{topicMode === 'bulk' ? 's' : ''}
            </button>
          </div>
        </Modal>
      )}

      {showEditTopic && (
        <Modal wide title={`Edit Topic - ${selectedModule?.title}`} onClose={() => { setShowEditTopic(false); setSelectedModule(null); setSelectedTopic(null); resetTopicForm(); }}>
          <div className="space-y-4">
            <div><label className={labelCls}>Topic Name</label><input type="text" value={topicForm.name} onChange={e => setTopicForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Topic name" autoFocus /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPractical" checked={topicForm.isPracticalProblem} onChange={e => setTopicForm(f => ({ ...f, isPracticalProblem: e.target.checked, problemUrl: e.target.checked ? f.problemUrl : '' }))} className="rounded accent-accent cursor-pointer" />
              <label htmlFor="isPractical" className="text-sm text-text cursor-pointer">Practical Problem</label>
            </div>
            {topicForm.isPracticalProblem && <div><label className={labelCls}>Problem URL</label><input type="url" value={topicForm.problemUrl} onChange={e => setTopicForm(f => ({ ...f, problemUrl: e.target.value }))} className={inputCls} placeholder="https://leetcode.com/problems/..." /></div>}
            <TopicQuestionsForm questions={topicForm.quizzes} onChange={quizzes => setTopicForm(f => ({ ...f, quizzes }))} />
            <button onClick={handleUpdateTopic} disabled={saving} className="w-full bg-accent hover:bg-accent-hover disabled:opacity-60 text-white text-sm py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check size={14} />} Save Topic
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
