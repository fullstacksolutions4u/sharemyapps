import { useState, useEffect, useMemo } from 'react';
import {
  ClipboardList, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  ExternalLink, X, Check, Copy, AlertTriangle,
  Code2, Database, Cpu, Globe, Layers, Smartphone, BarChart2, Shield, BookOpen,
  Users, Save, Send, GitBranch, Link2, FileText, MapPin, Briefcase, DollarSign, Terminal, Activity, Sparkles
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
  { key: 'frontend', label: 'Frontend', description: 'HTML, CSS, React, UI/UX, State Management', icon: Globe, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200', headerBg: 'bg-gradient-to-r from-blue-50 to-blue-100/50', keywords: ['frontend', 'html', 'css', 'react', 'vue', 'angular', 'ui', 'ux', 'tailwind', 'next', 'state management', 'redux', 'zustand', 'context api', 'mobx'] },
  { key: 'backend', label: 'Backend', description: 'Node.js, Express, APIs', icon: Layers, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', headerBg: 'bg-gradient-to-r from-emerald-50 to-emerald-100/50', keywords: ['backend', 'node', 'express', 'api', 'server', 'rest', 'graphql'] },
  { key: 'database', label: 'Database', description: 'MongoDB, SQL, NoSQL', icon: Database, color: 'text-violet-600', bgColor: 'bg-violet-50', borderColor: 'border-violet-200', headerBg: 'bg-gradient-to-r from-violet-50 to-violet-100/50', keywords: ['database', 'mongodb', 'sql', 'nosql', 'postgres', 'mysql', 'redis', 'mongo'] },
  { key: 'programming', label: 'Programming Languages', description: 'JavaScript, Python, Java', icon: Code2, color: 'text-amber-600', bgColor: 'bg-amber-50', borderColor: 'border-amber-200', headerBg: 'bg-gradient-to-r from-amber-50 to-amber-100/50', keywords: ['javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'rust', 'go', 'php', 'programming language', 'script'] },
  { key: 'dsa', label: 'DSA', description: 'Data Structures & Algorithms', icon: BarChart2, color: 'text-rose-600', bgColor: 'bg-rose-50', borderColor: 'border-rose-200', headerBg: 'bg-gradient-to-r from-rose-50 to-rose-100/50', keywords: ['dsa', 'data structure', 'algorithm', 'sorting', 'searching', 'tree', 'graph'] },
  { key: 'mobile', label: 'Mobile Development', description: 'Android, iOS, Flutter, React Native', icon: Smartphone, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200', headerBg: 'bg-gradient-to-r from-cyan-50 to-cyan-100/50', keywords: ['react native', 'react-native', 'mobile', 'android', 'ios', 'flutter', 'swift', 'kotlin'] },
  { key: 'system_design', label: 'System Design', description: 'Architecture, scalability', icon: Cpu, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200', headerBg: 'bg-gradient-to-r from-indigo-50 to-indigo-100/50', keywords: ['system design', 'architecture', 'microservice', 'micro services', 'micro-services', 'scalab', 'distributed'] },
  { key: 'ai', label: 'AI / Machine Learning', description: 'ML, NLP, deep learning', icon: BookOpen, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', headerBg: 'bg-gradient-to-r from-pink-50 to-pink-100/50', keywords: ['ai', 'artificial intelligence', 'machine learning', 'nlp', 'deep learning', 'ml'] },
  { key: 'devops', label: 'DevOps', description: 'Deployment fundamentals and advanced', icon: Terminal, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200', headerBg: 'bg-gradient-to-r from-orange-50 to-orange-100/50', keywords: ['devops', 'deployment', 'fundamentals', 'advanced', 'docker', 'kubernetes', 'ci/cd', 'aws', 'jenkins', 'pipeline'] },
  { key: 'data_science', label: 'Data Science', description: 'Data analysis, statistics', icon: Activity, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200', headerBg: 'bg-gradient-to-r from-teal-50 to-teal-100/50', keywords: ['data science', 'data analysis', 'statistics', 'pandas', 'numpy', 'jupyter'] },
  { key: 'cyber_security', label: 'Cyber Security', description: 'Security, cryptography', icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200', headerBg: 'bg-gradient-to-r from-red-50 to-red-100/50', keywords: ['cyber security', 'security', 'cryptography', 'ethical hacking', 'penetration testing'] },
  { key: 'hr', label: 'HR & Soft Skills', description: 'Communication, behavioral questions', icon: Users, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200', headerBg: 'bg-gradient-to-r from-pink-50 to-pink-100/50', keywords: ['hr', 'human resources', 'communication', 'behavioral', 'soft skills', 'interview prep'] },
  { key: 'custom_modules', label: 'New Modules', description: 'Custom created modules', icon: ClipboardList, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200', headerBg: 'bg-gradient-to-r from-purple-50 to-purple-100/50', keywords: [] },
];

function getModuleCategory(mod) {
  if (mod.category === 'Custom') return 'custom_modules';
  
  const haystack = `${mod.title} ${mod.category || ''}`.toLowerCase();
  let bestKey = null;
  let bestLen = -1;
  for (const cat of CATEGORY_DEFS) {
    if (cat.key === 'custom_modules') continue;
    for (const kw of cat.keywords) {
      if (haystack.includes(kw) && kw.length > bestLen) {
        bestKey = cat.key;
        bestLen = kw.length;
      }
    }
  }
  return bestKey || 'custom_modules';
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

export default function AdminInterviewModulesSection({ initialApplicant = null, initialVacancy = null, initialSession = null }) {
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
  const [aiReport, setAiReport] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const setEval = (topicId, qi, field, value) => {
    const key = `${topicId}_${qi}`;
    setEvaluations(prev => ({ ...prev, [key]: { ...(prev[key] || { result: null, comment: '' }), [field]: value } }));
  };

  const selectedApplicant = initialApplicant || null;
  const [savingSession, setSavingSession] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedLocally, setPublishedLocally] = useState(false);
  const isPublished = publishedLocally || initialSession?.sharedWithCandidate;

  // Editable applicant meta (joining availability + salary)
  const [applicantMeta, setApplicantMeta] = useState({
    joiningAvailability: selectedApplicant?.joiningAvailability || '',
    currentSalary: selectedApplicant?.currentSalary != null ? String(selectedApplicant.currentSalary) : '',
    expectedSalary: selectedApplicant?.expectedSalary != null ? String(selectedApplicant.expectedSalary) : '',
  });
  const [savingMeta, setSavingMeta] = useState(false);
  const metaDirty =
    applicantMeta.joiningAvailability !== (selectedApplicant?.joiningAvailability || '') ||
    applicantMeta.currentSalary !== (selectedApplicant?.currentSalary != null ? String(selectedApplicant.currentSalary) : '') ||
    applicantMeta.expectedSalary !== (selectedApplicant?.expectedSalary != null ? String(selectedApplicant.expectedSalary) : '');

  // Session TODO list state (stored in summary)
  const parseTodos = (summaryText) => {
    if (!summaryText) return [];
    try {
      // Check if it's JSON array
      if (summaryText.trim().startsWith('[') && summaryText.trim().endsWith(']')) {
        return JSON.parse(summaryText);
      }
    } catch { /* ignore parsing errors */ }

    // Fallback to parsing markdown checkboxes
    const lines = summaryText.split('\n');
    const list = [];
    for (const line of lines) {
      const match = line.match(/^-\s*\[([ xX])\]\s*(.*)$/);
      if (match) {
        list.push({ completed: match[1].toLowerCase() === 'x', text: match[2] });
      } else if (line.trim()) {
        list.push({ completed: false, text: line.trim() });
      }
    }
    return list;
  };

  const [todos, setTodos] = useState(() => parseTodos(initialSession?.summary || ''));
  const [newTodoText, setNewTodoText] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTodos(parseTodos(initialSession?.summary || ''));
  }, [initialSession]);

  const updateTodos = (newTodos) => {
    setTodos(newTodos);
  };

  const toggleTodo = (index) => {
    const updated = todos.map((t, i) => i === index ? { ...t, completed: !t.completed } : t);
    updateTodos(updated);
  };

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const updated = [...todos, { text: newTodoText.trim(), completed: false }];
    updateTodos(updated);
    setNewTodoText('');
  };

  const deleteTodo = (index) => {
    const updated = todos.filter((_, i) => i !== index);
    updateTodos(updated);
  };



  const saveApplicantMeta = async () => {
    if (!selectedApplicant?._id) return;
    setSavingMeta(true);
    try {
      await api.put(`/admin/users/${selectedApplicant._id}`, {
        joiningAvailability: applicantMeta.joiningAvailability,
        currentSalary: applicantMeta.currentSalary === '' ? null : Number(applicantMeta.currentSalary),
        expectedSalary: applicantMeta.expectedSalary === '' ? null : Number(applicantMeta.expectedSalary),
      });
      toast.success('Candidate info saved');
    } catch { toast.error('Failed to save'); }
    finally { setSavingMeta(false); }
  };

  // If user enters a monthly figure (>1000) auto-convert to LPA on blur
  const convertSalaryToLpa = (field, rawValue) => {
    const raw = String(rawValue).trim();
    if (!raw) return;

    // Detect range: "25000 - 35000", "25000-35000", "25000 to 35000"
    const rangeMatch = raw.match(/^(\d+(?:[.,]\d+)?)\s*(?:-|–|to)\s*(\d+(?:[.,]\d+)?)$/i);
    if (rangeMatch) {
      const lo = parseFloat(rangeMatch[1].replace(',', ''));
      const hi = parseFloat(rangeMatch[2].replace(',', ''));
      const bothMonthly = lo > 1000 && hi > 1000;
      const eitherMonthly = lo > 1000 || hi > 1000;
      if (eitherMonthly) {
        const toLpa = n => n > 1000 ? parseFloat((n * 12 / 100000).toFixed(2)) : n;
        const loLpa = toLpa(lo);
        const hiLpa = toLpa(hi);
        const result = `${loLpa} - ${hiLpa}`;
        setApplicantMeta(p => ({ ...p, [field]: result }));
        toast(
          bothMonthly
            ? `₹${lo.toLocaleString('en-IN')}–₹${hi.toLocaleString('en-IN')}/mo → ${result} LPA`
            : `Converted range → ${result} LPA`,
          { icon: '🔄' }
        );
      }
      return;
    }

    // Single value
    const n = parseFloat(raw.replace(',', ''));
    if (!isNaN(n) && n > 1000) {
      const lpa = parseFloat((n * 12 / 100000).toFixed(2));
      setApplicantMeta(p => ({ ...p, [field]: String(lpa) }));
      toast(`₹${n.toLocaleString('en-IN')}/mo → ${lpa} LPA`, { icon: '🔄' });
    }
  };



  const buildSessionPayload = () => ({
    mcqAssessments: buildMcqAssessments(),
    status: 'completed',
    overallRating: aiReport?.overallRating || 5,
    headline: aiReport?.headline || initialSession?.headline || '',
    summary: aiReport?.summary || JSON.stringify(todos),
    sections: aiReport?.sections || emptyEvalForm().sections,
    pros: aiReport?.pros || [],
    cons: aiReport?.cons || [],
    improvementTips: aiReport?.improvementTips || [],
    vacancy: initialVacancy?._id || null,
  });

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

  const handleGenerateAIReport = async () => {
    const mcqAssessments = buildMcqAssessments();
    if (mcqAssessments.length === 0) return toast.error('No assessments to analyze');
    setGeneratingAI(true);
    try {
      const res = await api.post('/admin/interviews/analyze-report', {
        mcqAssessments,
        applicantName: selectedApplicant?.name,
        jobTitle: initialVacancy?.title
      }, {
        timeout: 60000 // 60 seconds specifically for AI generation
      });
      setAiReport(res.data.data);
      setShowAIModal(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate AI report');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSaveSession = async () => {
    if (!selectedApplicant) return toast.error('Select an applicant from the Interview Session tab first');
    if (!initialSession?._id) return toast.error('Select a session from the Interview Session tab first');
    setSavingSession(true);
    try {
      const payload = buildSessionPayload();
      await api.put(`/admin/interviews/${initialSession._id}`, payload);
      toast.success(
        initialVacancy?.title
          ? `Session saved for ${selectedApplicant.name} · ${initialVacancy.title}`
          : `Session saved for ${selectedApplicant.name}!`
      );
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save session'); }
    finally { setSavingSession(false); }
  };

  const handlePublishSession = async () => {
    if (!selectedApplicant) return toast.error('Select an applicant from the Interview Session tab first');
    if (!initialSession?._id) return toast.error('Select a session from the Interview Session tab first');
    setPublishing(true);
    try {
      const payload = buildSessionPayload();
      await api.put(`/admin/interviews/${initialSession._id}`, payload);
      await api.patch(`/admin/interviews/${initialSession._id}/share`);
      setPublishedLocally(true);
      toast.success(`Published to ${selectedApplicant.name}'s dashboard`);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to publish session'); }
    finally { setPublishing(false); }
  };

  const fetchModules = async () => {
    try {
      const res = await api.get('/interview-modules');
      setModules(res.data.data || []);
    } catch { toast.error('Failed to load interview modules'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchModules(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const grouped = useMemo(() => {
    const map = {};
    CATEGORY_DEFS.forEach(cat => { map[cat.key] = []; });
    modules.forEach(mod => {
      // UI Evaluation Module is separate; skip similarly named bank modules from categories
      if (/^evaluation module$/i.test(mod.title || '')) return;
      const key = getModuleCategory(mod);
      if (key && map[key]) {
        map[key].push(mod);
      }
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
      const res = await api.post('/interview-modules', { title: moduleForm.title.trim(), category: 'Custom', order: modules.length });
      const newModule = res.data.data;
      toast.success('Module created'); 
      setShowCreateModule(false); 
      setModuleForm(emptyModule()); 
      await fetchModules();
      
      if (newModule) {
        const catKey = getModuleCategory(newModule);
        setExpandedCats(prev => ({ ...prev, [catKey]: true }));
        setExpandedModId(newModule._id);
      }
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
      {/* Context bar — applicant + job details + social links */}
      {selectedApplicant ? (
        <div className="bg-white border border-border rounded-2xl p-5 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
 
            {/* ── COLUMN 1: Applicant & Job Details ────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Applicant row */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-accent text-base font-bold overflow-hidden shrink-0">
                  {selectedApplicant.avatar
                    ? <img src={selectedApplicant.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    : selectedApplicant.name?.[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text truncate">{selectedApplicant.name}</p>
                  {selectedApplicant.designations?.length > 0 && (
                    <p className="text-xs text-muted truncate">{selectedApplicant.designations.join(', ')}</p>
                  )}
                </div>
              </div>
 
              {/* Job details */}
              {initialVacancy && (
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <Briefcase size={13} className="text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-text leading-tight">{initialVacancy.title}</p>
                      {initialVacancy.company && <p className="text-xs text-muted">{initialVacancy.company}</p>}
                    </div>
                  </div>
 
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {initialVacancy.location && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <MapPin size={11} className="shrink-0" />{initialVacancy.location}
                      </span>
                    )}
                    {initialVacancy.type && (
                      <span className="flex items-center gap-1 text-[11px] text-muted capitalize">
                        <Globe size={11} className="shrink-0" />{initialVacancy.type}
                      </span>
                    )}
                    {initialVacancy.jobType && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <Briefcase size={11} className="shrink-0" />{initialVacancy.jobType}
                      </span>
                    )}
                    {initialVacancy.experience && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <Users size={11} className="shrink-0" />{initialVacancy.experience}
                      </span>
                    )}
                    {initialVacancy.salaryRange && (
                      <span className="flex items-center gap-1 text-[11px] text-muted">
                        <DollarSign size={11} className="shrink-0" />{initialVacancy.salaryRange}
                      </span>
                    )}
                  </div>
                </div>
              )}
 
              {/* ── Applicant Meta: Joining / Salary (editable) ───────────── */}
              <div className="mt-3 pt-3 border-t border-border/50">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-muted mb-0.5">Joining Availability</label>
                    <input
                      type="text"
                      placeholder="e.g. Immediate"
                      value={applicantMeta.joiningAvailability}
                      onChange={e => setApplicantMeta(p => ({ ...p, joiningAvailability: e.target.value }))}
                      className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg bg-bg focus:border-accent focus:outline-none text-text placeholder:text-muted/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted mb-0.5">Current Salary (LPA)</label>
                    <input
                      type="text"
                      placeholder="e.g. 4.5 or 25000"
                      value={applicantMeta.currentSalary}
                      onChange={e => setApplicantMeta(p => ({ ...p, currentSalary: e.target.value }))}
                      onBlur={e => convertSalaryToLpa('currentSalary', e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg bg-bg focus:border-accent focus:outline-none text-text placeholder:text-muted/50 transition-colors"
                    />
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1 min-w-0">
                      <label className="block text-[10px] text-muted mb-0.5">Expected Salary (LPA)</label>
                      <input
                        type="text"
                        placeholder="e.g. 6 or 30000"
                        value={applicantMeta.expectedSalary}
                        onChange={e => setApplicantMeta(p => ({ ...p, expectedSalary: e.target.value }))}
                        onBlur={e => convertSalaryToLpa('expectedSalary', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg bg-bg focus:border-accent focus:outline-none text-text placeholder:text-muted/50 transition-colors"
                      />
                    </div>
                    {metaDirty && (
                      <button
                        onClick={saveApplicantMeta}
                        disabled={savingMeta}
                        className="self-end flex items-center gap-1 text-[10px] font-bold px-2 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Save size={9} />{savingMeta ? '…' : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
 
            {/* Divider 1 */}
            <div className="hidden lg:block w-px bg-border shrink-0" />
            <div className="block lg:hidden h-px bg-border" />
 
            {/* ── COLUMN 2: Comment Section (TODO List) ───────────────── */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide">Session Todo List</p>
              
              <div className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto border border-border rounded-lg bg-bg p-2 space-y-1.5">
                {todos.length === 0 ? (
                  <p className="text-xs text-muted/60 text-center py-8">No todo items added yet.</p>
                ) : (
                  todos.map((todo, idx) => (
                    <div key={idx} className="flex items-center gap-2 group bg-white border border-border/40 rounded-md p-1.5">
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => toggleTodo(idx)}
                        className="rounded border-border text-accent focus:ring-0 cursor-pointer shrink-0"
                      />
                      <span className={`text-xs flex-1 truncate ${todo.completed ? 'line-through text-muted/50' : 'text-text'}`}>
                        {todo.text}
                      </span>
                      <button
                        onClick={() => deleteTodo(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-red-500 rounded transition-opacity"
                        title="Delete item"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
 
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  value={newTodoText}
                  onChange={e => setNewTodoText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTodo(); } }}
                  className="flex-1 text-xs px-2.5 py-1.5 border border-border rounded-lg bg-bg focus:border-accent focus:outline-none text-text placeholder:text-muted/50 transition-colors"
                />
                <button
                  onClick={addTodo}
                  className="px-3 py-1.5 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>
 
            {/* Divider 2 */}
            <div className="hidden lg:block w-px bg-border shrink-0" />
            <div className="block lg:hidden h-px bg-border" />
 
            {/* ── COLUMN 3: Social Links ───────────────────────────────────── */}
            <div className="lg:w-52 shrink-0">
              <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-3">Candidate Links</p>
              <div className="space-y-2">
                {[
                  { label: 'LinkedIn',  url: selectedApplicant.linkedinUrl,  icon: Link2,       color: 'text-blue-600' },
                  { label: 'GitHub',    url: selectedApplicant.githubUrl,    icon: GitBranch,   color: 'text-gray-700' },
                  { label: 'LeetCode',  url: selectedApplicant.leetcodeUrl,  icon: Code2,       color: 'text-amber-600' },
                  { label: 'Portfolio', url: selectedApplicant.portfolioUrl, icon: Globe,       color: 'text-emerald-600' },
                  { label: 'Resume',    url: selectedApplicant.cvUrl,        icon: FileText,    color: 'text-accent' },
                ].map(({ label, url, icon: Icon, color }) =>
                  url ? (
                    <a key={label} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2.5 text-xs font-medium text-text hover:text-accent transition-colors group">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-lg bg-bg border border-border group-hover:border-accent/30 transition-colors ${color}`}>
                        <Icon size={13} />
                      </span>
                      <span className="truncate">{label}</span>
                      <ExternalLink size={10} className="text-muted group-hover:text-accent ml-auto shrink-0" />
                    </a>
                  ) : (
                    <div key={label} className="flex items-center gap-2.5 text-xs text-muted opacity-40">
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-bg border border-border">
                        <Icon size={13} />
                      </span>
                      <span>{label}</span>
                      <span className="ml-auto text-[10px]">—</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}



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
                            <button onClick={() => { setSelectedModule(mod); setModuleForm({ title: mod.title }); setShowEditModule(true); }} className="w-7 h-7 flex items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"><Pencil size={12} /></button>
                            <button onClick={() => handleDeleteModule(mod)} className="w-7 h-7 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"><Trash2 size={12} /></button>
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

      {/* ── Sticky Bottom Action Bar ─────────────────────────────────────── */}
      <div className="sticky bottom-0 left-0 right-0 mt-6 bg-white border-t border-border rounded-b-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] z-20">
        <div className="flex items-center gap-2">
          {modules.length === 0 && (
            <button onClick={() => setShowCopyConfirm(true)} className="flex items-center gap-1.5 text-xs px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-medium">
              <Copy size={13} /> Copy from Quiz Zone
            </button>
          )}
          <button
            onClick={() => { setModuleForm(emptyModule()); setShowCreateModule(true); }}
            className="flex items-center gap-1.5 text-sm px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors font-semibold"
          >
            <Plus size={14} /> New Module
          </button>
        </div>
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
            onClick={handleGenerateAIReport}
            disabled={generatingAI}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            {generatingAI ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Sparkles size={14} />}
            Auto-Generate AI Report
          </button>
          <button
            onClick={handleSaveSession}
            disabled={savingSession || publishing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {savingSession ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
            Save Session
          </button>
          <button
            onClick={handlePublishSession}
            disabled={publishing || savingSession || isPublished}
            title={isPublished ? 'Already published to applicant dashboard' : 'Save and publish to applicant dashboard'}
            className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {publishing
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Send size={14} />}
            {isPublished ? 'Published' : 'Publish'}
          </button>
        </div>
      </div>

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

      {/* ── AI Report Modal ────────────────────────────────────────────────────── */}
      {showAIModal && aiReport && (
        <Modal title="Review AI Generated Report" onClose={() => setShowAIModal(false)} wide>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Headline</label>
              <input type="text" className={inputCls} value={aiReport.headline || ''} onChange={e => setAiReport({...aiReport, headline: e.target.value})} />
            </div>
            <div>
              <label className={labelCls}>Summary</label>
              <textarea className={inputCls} rows={4} value={aiReport.summary || ''} onChange={e => setAiReport({...aiReport, summary: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelCls}>Pros (one per line)</label>
                <textarea className={inputCls} rows={4} value={(aiReport.pros || []).join('\n')} onChange={e => setAiReport({...aiReport, pros: e.target.value.split('\n')})} />
              </div>
              <div className="flex-1">
                <label className={labelCls}>Cons (one per line)</label>
                <textarea className={inputCls} rows={4} value={(aiReport.cons || []).join('\n')} onChange={e => setAiReport({...aiReport, cons: e.target.value.split('\n')})} />
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-border">
              <p className="text-sm font-semibold mb-2">Sections Breakdown</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiReport.sections?.map((sec, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-border flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold">{sec.title}</p>
                      <p className="text-xs text-muted truncate max-w-[150px]">{sec.notes}</p>
                    </div>
                    <span className="text-sm font-black text-accent">{sec.rating}/5</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end pt-4 gap-3">
              <button onClick={() => setShowAIModal(false)} className="px-4 py-2 bg-gray-100 text-text hover:bg-gray-200 rounded-xl font-medium transition-colors">Close</button>
              <button onClick={() => { setShowAIModal(false); toast.success('Report applied! Click Save Session to finalize.'); }} className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                Apply to Session
              </button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
}
