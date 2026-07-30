import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Trash2, Send, Check,
  Copy, ExternalLink, ClipboardList, ToggleLeft, ToggleRight,
  X, Link as LinkIcon, Edit3, RefreshCw
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';
import { formatDistanceToNow } from 'date-fns';

const CLIENT_URL = window.location.origin;
const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const SECTIONS = ['Frontend', 'Backend'];
const DEFAULT_SECTIONS = SECTIONS.map(title => ({ title, rating: 3, notes: '' }));

const ratingColor = (r) => r >= 8 ? 'text-emerald-600' : r >= 6 ? 'text-amber-500' : 'text-red-500';

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
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
    pros: [],
    cons: [],
    improvementTips: [],
    interviewedAt: new Date().toISOString().slice(0, 10),
  });

  const [form, setForm] = useState(emptyForm());
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [newTabName, setNewTabName] = useState('');

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
      let res;
      if (editingId) {
        res = await api.put(`/admin/interviews/${editingId}`, form);
        setSessions(prev => prev.map(s => s._id === editingId ? res.data.session : s));
        toast.success('Session updated');
      } else {
        res = await api.post(`/admin/interviews/user/${user._id}`, form);
        setSessions(prev => [res.data.session, ...prev]);
        toast.success('Interview session saved');
      }
      setEditingId(null);
      setForm(emptyForm());
      onSaved?.();
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
      sections: session.sections?.length ? session.sections : DEFAULT_SECTIONS.map(s => ({ ...s })),
      pros: session.pros || [],
      cons: session.cons || [],
      improvementTips: session.improvementTips || [],
      interviewedAt: session.interviewedAt ? session.interviewedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this session?')) return;
    try {
      await api.delete(`/admin/interviews/${id}`);
      setSessions(prev => prev.filter(s => s._id !== id));
      toast.success('Deleted');
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
            <p className="text-xs text-[#6B7280]">#{user.regNumber} • {(user.designations || []).join(', ') || 'Developer'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <X size={18} />
          </button>
        </div>

        {/* Past Sessions */}
        {sessions.length > 0 && (
          <div className="px-6 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-[#374151] flex items-center gap-2">
              <ClipboardList size={15} /> Past Sessions ({sessions.length})
            </h3>
            {sessions.map(s => (
              <div key={s._id} className={`rounded-xl border p-4 ${s.sharedWithCandidate ? 'bg-emerald-50 border-emerald-200' : 'bg-[#FAF7F2] border-[#E5E1DA]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#00A693]">Session #{s.sessionNumber}</span>
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
                {s.headline && <p className="text-xs italic text-[#6B7280] mb-1">"{s.headline}"</p>}
                <div className="flex flex-wrap gap-1">
                  {(s.pros || []).map((p, i) => <span key={i} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{p}</span>)}
                  {(s.cons || []).map((c, i) => <span key={i} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{c}</span>)}
                </div>
                <p className="text-[10px] text-[#9CA3AF] mt-1.5">{new Date(s.interviewedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}

        {/* New / Edit Form */}
        <div className="px-6 py-4 flex-1">
          <h3 className="text-sm font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
            {editingId ? <><Edit3 size={14} /> Edit Session</> : <><Plus size={14} /> New Interview Session</>}
          </h3>

          {/* Date & Rating */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview Date</label>
              <input type="date" value={form.interviewedAt} onChange={e => setForm(f => ({ ...f, interviewedAt: e.target.value }))} className={inp} />
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

          {/* Google Meet Link */}
          <div className="mb-4">
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Google Meet Link</label>
            <input value={form.googleMeetLink} onChange={e => setForm(f => ({ ...f, googleMeetLink: e.target.value }))}
              placeholder="https://meet.google.com/..." className={inp} />
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
      </div>
    </div>
  );
}

// ─── Showcase Pages Tab ───────────────────────────────────────────────────────
function ShowcasePagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editPage, setEditPage] = useState(null);
  const [form, setForm] = useState({ title: '', recruiterName: '', companyName: '', jdNote: '', candidates: [], expiresAt: '' });
  const [saving, setSaving] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    api.get('/admin/showcases').then(r => setPages(r.data.pages || [])).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, []);

  const searchUsers = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults([]); return; }
    try {
      const res = await api.get(`/admin/interviews?limit=20`);
      const sessions = res.data.sessions || [];
      const seen = new Set();
      const usersList = sessions.map(s => s.user).filter(u => {
        if (!u || seen.has(u._id)) return false;
        seen.add(u._id);
        return u.name?.toLowerCase().includes(q.toLowerCase()) ||
          String(u.regNumber).includes(q) ||
          (u.familiarTech || []).some(t => t.toLowerCase().includes(q.toLowerCase()));
      });
      setSearchResults(usersList);
    } catch { setSearchResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchUsers(userSearch), 300);
    return () => clearTimeout(t);
  }, [userSearch, searchUsers]);

  const addCandidate = (user) => {
    if (!form.candidates.find(c => c._id === user._id)) {
      setForm(f => ({ ...f, candidates: [...f.candidates, user] }));
    }
    setUserSearch('');
    setSearchResults([]);
  };

  const removeCandidate = (id) => setForm(f => ({ ...f, candidates: f.candidates.filter(c => c._id !== id) }));

  const openCreate = () => {
    setEditPage(null);
    setForm({ title: '', recruiterName: '', companyName: '', jdNote: '', candidates: [], expiresAt: '' });
    setShowCreate(true);
  };

  const openEdit = (page) => {
    setEditPage(page);
    setForm({
      title:         page.title,
      recruiterName: page.recruiterName || '',
      companyName:   page.companyName   || '',
      jdNote:        page.jdNote        || '',
      candidates:    page.candidates    || [],
      expiresAt:     page.expiresAt ? page.expiresAt.slice(0, 10) : '',
    });
    setShowCreate(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, candidates: form.candidates.map(c => c._id || c) };
      let res;
      if (editPage) {
        res = await api.put(`/admin/showcases/${editPage._id}`, payload);
        setPages(prev => prev.map(p => p._id === editPage._id ? res.data.page : p));
        toast.success('Showcase updated');
      } else {
        res = await api.post('/admin/showcases', payload);
        setPages(prev => [res.data.page, ...prev]);
        toast.success('Showcase created!');
      }
      setShowCreate(false);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/showcases/${id}/toggle`);
      setPages(prev => prev.map(p => p._id === id ? { ...p, isActive: res.data.isActive } : p));
    } catch { toast.error('Failed to toggle'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this showcase page?')) return;
    try {
      await api.delete(`/admin/showcases/${id}`);
      setPages(prev => prev.filter(p => p._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const copyLink = (slug) => {
    navigator.clipboard.writeText(`${CLIENT_URL}/showcase/${slug}`);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#1A1A1A]">Showcase Pages</h3>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-[#00A693] text-white rounded-xl text-sm font-medium hover:bg-[#008f7e] transition">
          <Plus size={14} /> Create Showcase
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#9CA3AF]">Loading...</div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF]">
          <LinkIcon size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No showcase pages yet</p>
          <p className="text-sm">Create a page to share with a recruiter</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pages.map(page => (
            <div key={page._id} className={`rounded-2xl border p-4 ${page.isActive ? 'bg-white border-[#E5E1DA]' : 'bg-gray-50 border-gray-200 opacity-70'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-bold text-[#1A1A1A] truncate">{page.title}</h4>
                    {page.isActive
                      ? <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Active</span>
                      : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                    }
                  </div>
                  {page.recruiterName && <p className="text-sm text-[#6B7280]">👤 {page.recruiterName}{page.companyName ? ` — ${page.companyName}` : ''}</p>}
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {(page.candidates || []).length} candidates • {page.viewCount || 0} views • Created {formatDistanceToNow(new Date(page.createdAt), { addSuffix: true })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-[#F3F0EB] px-2 py-1 rounded-lg text-[#6B7280] font-mono truncate max-w-xs">/showcase/{page.slug}</code>
                    <button onClick={() => copyLink(page.slug)} className="p-1.5 hover:bg-[#F3F0EB] rounded-lg transition text-[#6B7280]"><Copy size={13} /></button>
                    <a href={`/showcase/${page.slug}`} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-[#F3F0EB] rounded-lg transition text-[#6B7280]">
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(page)} className="p-2 hover:bg-[#F3F0EB] rounded-xl transition"><Edit3 size={14} /></button>
                  <button onClick={() => handleToggle(page._id)} className="p-2 hover:bg-[#F3F0EB] rounded-xl transition text-[#6B7280]">
                    {page.isActive ? <ToggleRight size={16} className="text-emerald-500" /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => handleDelete(page._id)} className="p-2 hover:bg-red-50 rounded-xl transition text-red-400"><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E5E1DA] px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-[#1A1A1A]">{editPage ? 'Edit Showcase' : 'Create Showcase'}</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. React Developers – July 2026" className={inp} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Recruiter Name</label>
                  <input value={form.recruiterName} onChange={e => setForm(f => ({ ...f, recruiterName: e.target.value }))}
                    placeholder="e.g. Priya Sharma" className={inp} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Company</label>
                  <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    placeholder="e.g. TechCorp Pvt Ltd" className={inp} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">JD / Notes for Recruiter</label>
                <textarea value={form.jdNote} onChange={e => setForm(f => ({ ...f, jdNote: e.target.value }))}
                  placeholder="Paste the JD or add notes about what the recruiter is looking for..." rows={3}
                  className={`${inp} resize-none`} />
              </div>

              {/* Candidate Picker */}
              <div>
                <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">
                  Add Candidates ({form.candidates.length}/15)
                </label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-3 top-3 text-[#9CA3AF]" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name, reg number, or skill..." className={`${inp} pl-9`} />
                </div>
                {searchResults.length > 0 && (
                  <div className="border border-[#E5E1DA] rounded-xl overflow-hidden mb-2 max-h-48 overflow-y-auto">
                    {searchResults.map(u => (
                      <button key={u._id} onClick={() => addCandidate(u)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-[#F3F0EB] transition text-left border-b border-[#E5E1DA] last:border-0">
                        <img src={optimizeImage(u.avatar, 32) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=00A693&color=fff`}
                          alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{u.name}</p>
                          <p className="text-xs text-[#9CA3AF]">#{u.regNumber} • {(u.familiarTech || []).slice(0, 3).join(', ')}</p>
                        </div>
                        <Plus size={14} className="ml-auto text-[#00A693]" />
                      </button>
                    ))}
                  </div>
                )}
                {form.candidates.length > 0 && (
                  <div className="space-y-1.5">
                    {form.candidates.map((c, i) => (
                      <div key={c._id || i} className="flex items-center gap-3 bg-[#F3F0EB] rounded-xl p-2.5">
                        <span className="text-xs text-[#9CA3AF] w-4">{i + 1}</span>
                        <img src={optimizeImage(c.avatar, 28) || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=00A693&color=fff`}
                          alt={c.name} className="w-7 h-7 rounded-full object-cover" />
                        <span className="flex-1 text-sm font-medium text-[#1A1A1A]">{c.name}</span>
                        <button onClick={() => removeCandidate(c._id)} className="text-red-400 hover:text-red-600">
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 border border-[#E5E1DA] rounded-xl text-sm hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-[#00A693] text-white rounded-xl text-sm font-semibold hover:bg-[#008f7e] transition disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving...' : (editPage ? 'Update' : 'Create & Copy Link')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCurationSection() {
  const [tab, setTab] = useState('interviews');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | evaluated | pending
  const [drawerUser, setDrawerUser] = useState(null);
  const [sessionCounts, setSessionCounts] = useState({}); // userId → count

  useEffect(() => {
    let ignore = false;
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users?limit=200&userType=developer&onlyContacted=true');
        const u = (res.data.users || res.data || []).filter(uObj => !uObj.isDeleted);
        u.sort((a, b) => (a.regNumber || 99999) - (b.regNumber || 99999));
        if (ignore) return;
        setUsers(u);

        // Fetch sessions to get counts
        const sessionRes = await api.get('/admin/interviews?limit=500');
        const counts = {};
        (sessionRes.data.sessions || []).forEach(s => {
          const uid = s.user?._id?.toString();
          if (uid) counts[uid] = (counts[uid] || 0) + 1;
        });
        if (!ignore) setSessionCounts(counts);
      } catch { toast.error('Failed to load users'); }
      finally { if (!ignore) setLoading(false); }
    };
    fetchUsers();
    return () => { ignore = true; };
  }, []);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      String(u.regNumber).includes(q) ||
      (u.familiarTech || []).some(t => t.toLowerCase().includes(q));
    const count = sessionCounts[u._id] || 0;
    const matchesFilter = filter === 'all' || (filter === 'evaluated' && count > 0) || (filter === 'pending' && count === 0);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F0EB] rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: 'interviews', label: 'Interview Evaluations', icon: ClipboardList },
          { key: 'showcases', label: 'Showcase Pages', icon: LinkIcon },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t.key ? 'bg-white shadow text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'showcases' ? <ShowcasePagesTab /> : (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-3 text-[#9CA3AF]" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by name, reg number, or skill..." className={`${inp} pl-9`} />
            </div>
            <div className="flex gap-1 bg-[#F3F0EB] rounded-xl p-1">
              {[['all', 'All'], ['pending', 'Not Interviewed'], ['evaluated', 'Interviewed']].map(([k, l]) => (
                <button key={k} onClick={() => setFilter(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === k ? 'bg-white shadow text-[#1A1A1A]' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-[#9CA3AF] mb-3">{filteredUsers.length} developers</p>

          {loading ? (
            <div className="text-center py-16 text-[#9CA3AF]">Loading developers...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUsers.map(user => {
                const count = sessionCounts[user._id] || 0;
                return (
                  <button
                    key={user._id}
                    onClick={() => setDrawerUser(user)}
                    className="bg-white border border-[#E5E1DA] rounded-2xl p-4 text-left hover:border-[#00A693] hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="relative">
                        <img
                          src={optimizeImage(user.avatar, 48) || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=00A693&color=fff`}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-[#E5E1DA] group-hover:border-[#00A693] transition"
                        />
                        {count > 0 && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#00A693] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                            {count}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1A1A1A] text-sm truncate">{user.name}</p>
                        <p className="text-xs text-[#9CA3AF]">#{user.regNumber}</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#6B7280] truncate mb-2">{(user.designations || []).join(', ') || 'Developer'}</p>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(user.familiarTech || []).slice(0, 3).map((t, i) => (
                        <span key={i} className="text-[10px] bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${count > 0 ? 'text-emerald-600' : 'text-[#9CA3AF]'}`}>
                        {count > 0 ? `${count} session${count > 1 ? 's' : ''}` : 'Not yet interviewed'}
                      </span>
                      <span className="text-xs text-[#00A693] font-medium opacity-0 group-hover:opacity-100 transition">Open →</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Evaluation Drawer */}
      {drawerUser && (
        <EvaluationDrawer
          user={drawerUser}
          onClose={() => setDrawerUser(null)}
          onSaved={() => {
            setSessionCounts(prev => ({ ...prev, [drawerUser._id]: (prev[drawerUser._id] || 0) + 1 }));
          }}
        />
      )}
    </div>
  );
}
