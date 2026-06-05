import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, X, Save, Check, Mail, Tag, Clock, Link as LinkIcon, Phone,
  AlertCircle, FileText, Briefcase, Pencil, Trash2, Eye, EyeOff,
  UserCircle2, Search, Zap, Award, Trophy, FolderOpen as FolderOpenIcon,
  Heart, Star,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const BADGES = [
  { value: 'new_member', label: 'New Member',         icon: UserCircle2, cls: 'bg-[#F3F0EB] text-[#6B7280] border-[#E5E1DA]' },
  { value: 'active',     label: 'Active Member',      icon: Zap,         cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'top',        label: 'Top Contributor',    icon: Award,       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'champion',   label: 'Community Champion', icon: Trophy,      cls: 'bg-purple-50 text-purple-600 border-purple-200' },
];

const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const RESUME_TEMPLATE = JSON.stringify({
  summary: 'Brief 2-3 line profile summary',
  totalExperience: '3 years',
  skills: ['React', 'Node.js', 'MongoDB'],
  techStack: ['JavaScript', 'TypeScript'],
  experience: [{ company: 'Company Name', role: 'Role Title', duration: '2022 – 2024', highlights: ['Built X', 'Improved Y'] }],
  education: [{ institution: 'University Name', degree: 'B.Tech CS', year: '2022' }],
  languages: ['English'],
  certifications: ['AWS Certified Developer'],
}, null, 2);

function UserEditPage({ user: initial, onBack, onSaved, allDesignations = [] }) {
  const [form, setForm] = useState({
    name:           initial.name           || '',
    designations:   initial.designations?.filter(Boolean) || [],
    phone:          initial.phone          || '',
    linkedinUrl:    initial.linkedinUrl    || '',
    githubUrl:      initial.githubUrl      || '',
    leetcodeUrl:    initial.leetcodeUrl    || '',
    portfolioUrl:   initial.portfolioUrl   || '',
    cvUrl:          initial.cvUrl          || '',
    companyName:    initial.companyName    || '',
    companyWebsite: initial.companyWebsite || '',
    industry:       initial.industry       || '',
    requirements:   initial.requirements   || '',
    badge:          initial.badge          || 'new_member',
    hidden:         initial.hidden         || false,
    userType:       initial.userType       || 'developer',
  });
  const [saving, setSaving] = useState(false);
  const [designationInput, setDesignationInput] = useState('');
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [resumeJson, setResumeJson] = useState(initial.resumeData ? JSON.stringify(initial.resumeData, null, 2) : '');
  const [resumeJsonError, setResumeJsonError] = useState('');
  const [savingResume, setSavingResume] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const addDesignation = () => {
    const val = designationInput.trim();
    if (val && !form.designations.includes(val)) {
      setForm(f => ({ ...f, designations: [...f.designations, val] }));
      setDesignationInput('');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await api.put(`/admin/users/${initial._id}`, form);
      onSaved(res.data);
      toast.success('User updated successfully');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleSaveResume = async () => {
    setResumeJsonError('');
    let parsed = null;
    if (resumeJson.trim()) {
      try { parsed = JSON.parse(resumeJson); }
      catch { setResumeJsonError('Invalid JSON — fix the syntax and try again.'); return; }
    }
    setSavingResume(true);
    try {
      await api.put(`/admin/users/${initial._id}/resume`, { resumeData: parsed });
      toast.success('Resume data saved');
    } catch { toast.error('Failed to save resume data'); }
    finally { setSavingResume(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
          <ArrowLeft size={14} /> Back to Users
        </button>
        <div className="flex items-center gap-3">
          {initial.avatar
            ? <img src={initial.avatar} alt={initial.name} className="w-12 h-12 rounded-2xl object-cover border-2 border-[#E5E1DA]" />
            : <span className="w-12 h-12 rounded-2xl bg-[#00A693] text-white text-lg flex items-center justify-center font-bold border-2 border-[#E5E1DA]">{initial.name[0].toUpperCase()}</span>
          }
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{initial.name}</p>
            <p className="text-xs text-[#6B7280]">{initial.email}</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${form.userType === 'client' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-[#E6F7F5] text-[#00A693] border-[#00A693]/20'}`}>
            {form.userType === 'client' ? 'Client' : 'Developer'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
              <UserCircle2 size={15} className="text-[#00A693]" /> Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Full Name <span className="text-red-400">*</span></label>
                <input type="text" value={form.name} onChange={set('name')} className={inp} placeholder="Full name" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Designations</label>
                <div className="relative flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={designationInput}
                      onChange={e => { setDesignationInput(e.target.value); setDesignationDropdownOpen(true); }}
                      onFocus={() => setDesignationDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setDesignationDropdownOpen(false), 150)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDesignation(); } if (e.key === 'Escape') setDesignationDropdownOpen(false); }}
                      className={inp}
                      placeholder="e.g. MERN Stack Developer"
                      autoComplete="off"
                    />
                    {designationDropdownOpen && (() => {
                      const q = designationInput.trim().toLowerCase();
                      const suggestions = allDesignations.filter(d => !form.designations.includes(d) && (!q || d.toLowerCase().includes(q)));
                      return suggestions.length > 0 ? (
                        <div className="absolute left-0 top-full mt-1 z-30 w-full bg-white border border-[#E5E1DA] rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
                          <p className="px-3 pt-1 pb-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#F3F0EB]">Previously used</p>
                          {suggestions.map(d => (
                            <button key={d} type="button"
                              onMouseDown={() => { setForm(f => ({ ...f, designations: [...f.designations, d] })); setDesignationInput(''); setDesignationDropdownOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#E6F7F5] hover:text-[#00A693] transition-colors">
                              {d}
                            </button>
                          ))}
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <button type="button" onClick={addDesignation}
                    className="w-10 h-10 flex items-center justify-center bg-[#00A693] hover:bg-[#007D6F] text-white rounded-xl transition-colors shrink-0">
                    <Plus size={16} />
                  </button>
                </div>
                {form.designations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {form.designations.map((d, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">
                        {d}
                        <button type="button" onClick={() => setForm(f => ({ ...f, designations: f.designations.filter((_, j) => j !== i) }))} className="hover:text-red-500 transition-colors ml-0.5">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">User Type</label>
              <div className="flex gap-1.5 p-1 bg-[#F3F0EB] rounded-xl w-fit">
                {[{ value: 'developer', label: 'Developer' }, { value: 'client', label: 'Client' }].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setForm(f => ({ ...f, userType: opt.value }))}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.userType === opt.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {form.userType !== 'client' && (
            <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <LinkIcon size={15} className="text-[#00A693]" /> Contact & Social Links
              </h3>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><Phone size={11} className="inline mr-1" />Phone</label>
                <input type="tel" value={form.phone} onChange={set('phone')} className={inp} placeholder="+91 00000 00000" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">LinkedIn URL</label>
                  <input type="text" value={form.linkedinUrl} onChange={set('linkedinUrl')} className={inp} placeholder="linkedin.com/in/username" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">GitHub URL</label>
                  <input type="text" value={form.githubUrl} onChange={set('githubUrl')} className={inp} placeholder="github.com/username" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">LeetCode URL</label>
                  <input type="text" value={form.leetcodeUrl} onChange={set('leetcodeUrl')} className={inp} placeholder="leetcode.com/username" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Portfolio URL</label>
                  <input type="text" value={form.portfolioUrl} onChange={set('portfolioUrl')} className={inp} placeholder="yourportfolio.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><FileText size={11} className="inline mr-1" />CV / Resume URL</label>
                {!form.cvUrl && (
                  <div className="flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2.5 mb-2">
                    <AlertCircle size={14} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-orange-700">No CV link yet. Upload the developer's PDF to your Google Drive and paste the shareable link below.</p>
                  </div>
                )}
                <input type="text" value={form.cvUrl} onChange={set('cvUrl')} className={inp} placeholder="drive.google.com/file/d/…" />
                {form.cvUrl && (
                  <a href={form.cvUrl.startsWith('http') ? form.cvUrl : `https://${form.cvUrl}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#00A693] hover:underline font-medium">
                    <FileText size={11} /> Preview CV
                  </a>
                )}
              </div>
            </div>
          )}

          {form.userType === 'client' && (
            <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Briefcase size={15} className="text-[#00A693]" /> Company Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Company Name</label>
                  <input type="text" value={form.companyName} onChange={set('companyName')} className={inp} placeholder="Company name" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Company Website</label>
                  <input type="text" value={form.companyWebsite} onChange={set('companyWebsite')} className={inp} placeholder="company.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Industry</label>
                <input type="text" value={form.industry} onChange={set('industry')} className={inp} placeholder="e.g. Fintech, Healthcare" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Requirements</label>
                <textarea rows={3} value={form.requirements} onChange={set('requirements')} className={`${inp} resize-none`} placeholder="Hiring needs or project requirements" />
              </div>
            </div>
          )}

          {form.userType !== 'client' && (
            <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-2">
                  <FileText size={15} className="text-[#00A693]" /> Resume Summary Data
                </h3>
                <div className="flex items-center gap-2">
                  {!resumeJson.trim() && (
                    <button type="button" onClick={() => { setResumeJson(RESUME_TEMPLATE); setResumeJsonError(''); }}
                      className="text-xs text-[#00A693] hover:underline font-medium">Load template</button>
                  )}
                  {resumeJson.trim() && (
                    <button type="button" onClick={() => { setResumeJson(''); setResumeJsonError(''); }}
                      className="text-xs text-red-400 hover:underline font-medium">Clear</button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#9CA3AF]">Paste structured JSON generated from the developer's CV. Used by AI for JD matching.</p>
              <textarea
                rows={14}
                value={resumeJson}
                onChange={e => { setResumeJson(e.target.value); setResumeJsonError(''); }}
                spellCheck={false}
                placeholder={'Paste resume JSON here…\n\nExample:\n{\n  "summary": "Full stack developer…",\n  "skills": ["React", "Node.js"],\n  …\n}'}
                className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono text-[#1A1A1A] bg-[#FAFAF9] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 resize-y transition ${resumeJsonError ? 'border-red-400 focus:ring-red-400/20' : 'border-[#E5E1DA] focus:border-[#00A693] focus:ring-[#00A693]/10'}`}
              />
              {resumeJsonError && (
                <p className="text-xs text-red-500 flex items-center gap-1.5"><X size={12} /> {resumeJsonError}</p>
              )}
              {initial.resumeData && !resumeJsonError && (() => {
                const raw = initial.resumeData.skills;
                const skills = Array.isArray(raw)
                  ? raw
                  : raw && typeof raw === 'object'
                    ? Object.values(raw).flat()
                    : [];
                return skills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {skills.slice(0, 6).map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent border border-accent/20 font-medium">{s}</span>
                    ))}
                    {skills.length > 6 && (
                      <span className="text-xs text-[#9CA3AF]">+{skills.length - 6} more</span>
                    )}
                  </div>
                ) : null;
              })()}
              <button onClick={handleSaveResume} disabled={savingResume}
                className="flex items-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] disabled:opacity-50 text-white px-5 py-2 rounded-xl font-medium text-sm transition-colors">
                <Save size={13} /> {savingResume ? 'Saving…' : 'Save Resume Data'}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={onBack}
              className="flex items-center gap-1.5 border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1A1A] px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Badge</p>
            <div className="space-y-1.5">
              {BADGES.map(b => {
                const Icon = b.icon;
                const active = form.badge === b.value;
                return (
                  <button key={b.value} type="button"
                    onClick={() => setForm(f => ({ ...f, badge: b.value }))}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-colors ${active ? 'border-[#00A693] bg-[#E6F7F5]' : 'border-[#E5E1DA] hover:border-[#00A693]/40 hover:bg-[#FAF9F6]'}`}>
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${b.cls}`}>
                      {Icon && <Icon size={11} />} {b.label}
                    </span>
                    {active && <Check size={13} className="ml-auto text-[#00A693]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Visibility</p>
            <label className="flex items-center justify-between cursor-pointer select-none">
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{form.hidden ? 'Hidden from public' : 'Visible in listings'}</p>
                <p className="text-xs text-[#9CA3AF] mt-0.5">{form.hidden ? "This user won't appear in the Developers page" : 'User appears in the Developers page'}</p>
              </div>
              <div onClick={() => setForm(f => ({ ...f, hidden: !f.hidden }))}
                className={`ml-4 w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${form.hidden ? 'bg-red-400' : 'bg-[#00A693]'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.hidden ? 'translate-x-1' : 'translate-x-5'}`} />
              </div>
            </label>
          </div>

          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-2.5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Account Info</p>
            <div className="flex items-center gap-2 text-xs text-[#6B7280]"><Mail size={12} className="shrink-0" /><span className="truncate">{initial.email}</span></div>
            {initial.regNumber && (
              <div className="flex items-center gap-2 text-xs text-[#6B7280]"><Tag size={12} className="shrink-0" /><span>Reg #{initial.regNumber}</span></div>
            )}
            <div className="flex items-center gap-2 text-xs text-[#6B7280]">
              <Clock size={12} className="shrink-0" />
              <span>Joined {new Date(initial.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersSection({ initialTab = 'developers' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [badgeLoading, setBadgeLoading] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(null);
  const [hideLoading, setHideLoading] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [pickerOpen]);

  const handleToggleHidden = async (userId) => {
    setHideLoading(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/hide`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, hidden: res.data.hidden } : u));
      toast.success(res.data.hidden ? 'Developer hidden from public list' : 'Developer visible again');
    } catch { toast.error('Failed to update visibility'); }
    finally { setHideLoading(null); }
  };

  const handleBadge = async (userId, badge) => {
    setPickerOpen(null);
    setBadgeLoading(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/badge`, { badge });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, badge: res.data.badge } : u));
      const label = BADGES.find(b => b.value === badge)?.label || badge;
      toast.success(badge === 'member' ? 'Badge removed' : `${label} badge granted`);
    } catch { toast.error('Failed to update badge'); }
    finally { setBadgeLoading(null); }
  };

  const handleUserSaved = (updated) => {
    setUsers(prev => prev.map(u => u._id === updated._id ? { ...u, ...updated } : u));
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId) => {
    setDeleteLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: true, deletedAt: new Date().toISOString() } : u));
      setConfirmDelete(null);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally { setDeleteLoading(null); }
  };

  const activeUsers = users.filter(u => !u.isDeleted);
  const developers = activeUsers.filter(u => u.userType === 'developer');
  const pendingCvCount = developers.filter(u => (u.projectCount || 0) >= 1 && (!u.cvUrl || !u.resumeData)).length;
  const recruiters = activeUsers.filter(u => u.userType === 'recruiter');
  const clients    = activeUsers.filter(u => u.userType === 'client');
  const mentees    = activeUsers.filter(u => u.userType === 'mentee');
  const deletedUsers = users.filter(u => u.isDeleted);
  const allDesignations = [...new Set(users.flatMap(u => u.designations || []).filter(Boolean))];
  const q = search.trim().toLowerCase();
  const listMap = { developers, recruiters, clients, mentees, deleted: deletedUsers };
  const list = (listMap[tab] || []).filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  const totalPages = Math.ceil(list.length / PER_PAGE);
  const paged = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Avatar = ({ u }) => u.avatar
    ? <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
    : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{u.name[0].toUpperCase()}</span>;

  if (editingUser) {
    return <UserEditPage user={editingUser} onBack={() => setEditingUser(null)} onSaved={handleUserSaved} allDesignations={allDesignations} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A] capitalize">{tab === 'deleted' ? 'Deleted Accounts' : tab}</h2>
        <div className="text-xs text-[#9CA3AF]">{list.length} {tab === 'deleted' ? 'accounts' : 'users'}</div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit flex-wrap">
          {[
            { key: 'developers', label: `Developers (${developers.length})` },
            { key: 'recruiters', label: `Recruiters (${recruiters.length})` },
            { key: 'clients',    label: `Clients (${clients.length})` },
            { key: 'mentees',    label: `Mentees (${mentees.length})` },
            { key: 'deleted',    label: `Deleted (${deletedUsers.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch(''); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? (t.key === 'deleted' ? 'bg-white text-red-600 shadow-sm' : 'bg-white text-[#1A1A1A] shadow-sm') : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition" />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        {search && <p className="text-xs text-[#6B7280]">{list.length} result{list.length !== 1 ? 's' : ''} for <span className="font-medium text-[#1A1A1A]">"{search}"</span></p>}
        {!loading && pendingCvCount > 0 && (
          <div className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 font-medium whitespace-nowrap">
            <AlertCircle size={12} className="shrink-0" />
            <span><span className="font-bold">{pendingCvCount}</span> developer{pendingCvCount !== 1 ? 's' : ''} missing CV / summary</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <p className="text-[#6B7280] text-sm">{tab === 'deleted' ? 'No deleted accounts' : `No ${tab} accounts yet`}</p>
        </div>
      ) : tab === 'developers' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Developer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Engagement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Designation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Resume</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p><p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-[#6B7280]" title="Projects"><FolderOpenIcon size={12} className="text-[#9CA3AF]" /> {u.projectCount || 0}</span>
                      <span className="flex items-center gap-1 text-xs text-red-400" title="Total likes"><Heart size={12} className="fill-red-400" /> {u.totalLikes || 0}</span>
                      <span className="flex items-center gap-1 text-xs text-amber-500" title="Avg rating"><Star size={12} className="fill-amber-400" /> {u.avgRating > 0 ? u.avgRating : '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.designations?.filter(Boolean).length
                      ? <div className="flex flex-wrap gap-1">{u.designations.filter(Boolean).map((d, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{d}</span>)}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-1">
                      {u.cvUrl
                        ? <a href={u.cvUrl.startsWith('http') ? u.cvUrl : `https://${u.cvUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#00A693] hover:underline font-medium"><FileText size={11} /> View CV</a>
                        : <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-medium w-fit"><AlertCircle size={10} /> No CV link</span>
                      }
                      {!u.resumeData && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 font-medium w-fit"><AlertCircle size={10} /> No summary</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'recruiters' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Recruiter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p><p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.companyName ? <div><p className="text-xs font-medium text-[#1A1A1A]">{u.companyName}</p>{u.industry && <p className="text-xs text-[#9CA3AF]">{u.industry}</p>}</div> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-[#9CA3AF]">{new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'clients' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Project / Budget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Skills needed</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p><p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.clientProfile?.projectName ? <div><p className="text-xs font-medium text-[#1A1A1A] truncate max-w-[160px]">{u.clientProfile.projectName}</p>{u.clientProfile.budget && <p className="text-xs text-[#9CA3AF]">₹{Number(u.clientProfile.budget).toLocaleString('en-IN')}</p>}</div> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.clientProfile?.skillsNeeded?.length > 0
                      ? <div className="flex flex-wrap gap-1">{u.clientProfile.skillsNeeded.slice(0, 3).map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{s}</span>)}{u.clientProfile.skillsNeeded.length > 3 && <span className="text-xs text-[#9CA3AF]">+{u.clientProfile.skillsNeeded.length - 3}</span>}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'mentees' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Mentee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Education</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Looking to learn</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p><p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.menteeProfile?.education ? <p className="text-xs text-[#1A1A1A] truncate max-w-[160px]">{u.menteeProfile.education}</p> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.menteeProfile?.lookingToLearn?.length > 0
                      ? <div className="flex flex-wrap gap-1">{u.menteeProfile.lookingToLearn.slice(0, 3).map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{s}</span>)}{u.menteeProfile.lookingToLearn.length > 3 && <span className="text-xs text-[#9CA3AF]">+{u.menteeProfile.lookingToLearn.length - 3}</span>}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-red-100 bg-red-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Deleted On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {paged.map(u => (
                <tr key={u._id} className="opacity-70">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0"><span className="text-xs font-medium text-red-400">{u.name?.[0]?.toUpperCase() || '?'}</span></div><div className="min-w-0"><p className="font-medium text-[#6B7280] truncate line-through decoration-red-300">{u.name}</p><p className="text-xs text-[#9CA3AF] sm:hidden truncate">{u.email}</p></div></div></td>
                  <td className="px-4 py-3 text-[#9CA3AF] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${u.userType === 'client' ? 'bg-teal-50 text-teal-400 border-teal-200' : u.userType === 'recruiter' ? 'bg-blue-50 text-blue-400 border-blue-200' : u.userType === 'mentee' ? 'bg-violet-50 text-violet-400 border-violet-200' : 'bg-[#E6F7F5] text-[#00A693]/60 border-[#00A693]/20'}`}>{u.userType || 'developer'}</span>
                  </td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-medium"><Trash2 size={10} /> Deleted</span></td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs hidden md:table-cell">{u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-[#9CA3AF]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, list.length)} of {list.length}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-sm rounded-lg border transition ${n === page ? 'bg-accent text-white border-accent font-medium' : 'border-border text-muted hover:border-accent hover:text-accent'}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
          </div>
        </div>
      )}

      {viewingUser && (() => {
        const u = users.find(x => x._id === viewingUser._id) || viewingUser;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setViewingUser(null)}>
            <div className="bg-white rounded-2xl shadow-xl border border-[#E5E1DA] w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA]">
                <div className="flex items-center gap-3">
                  {u.avatar ? <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-bold">{u.name?.[0]?.toUpperCase()}</span>}
                  <div><p className="font-semibold text-[#1A1A1A] text-sm">{u.name}</p><p className="text-xs text-[#6B7280]">{u.email}</p></div>
                </div>
                <button onClick={() => setViewingUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F0EB] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"><X size={15} /></button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Designations</p>
                  {u.designations?.filter(Boolean).length
                    ? <div className="flex flex-wrap gap-1.5">{u.designations.filter(Boolean).map((d, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{d}</span>)}</div>
                    : <p className="text-xs text-[#9CA3AF]">—</p>}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Badge</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BADGES.map(b => {
                      const Icon = b.icon;
                      const active = (u.badge || 'new_member') === b.value;
                      return (
                        <button key={b.value} onClick={() => handleBadge(u._id, b.value)} disabled={badgeLoading === u._id}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${b.cls} ${active ? 'ring-2 ring-offset-1 ring-current' : 'opacity-50 hover:opacity-100'}`}>
                          {Icon && <Icon size={10} />} {b.label}
                          {active && <Check size={10} className="ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Joined</p>
                    <p className="text-xs text-[#6B7280]">{new Date(u.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <button onClick={() => handleToggleHidden(u._id)} disabled={hideLoading === u._id}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${u.hidden ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                    {hideLoading === u._id ? '…' : u.hidden ? <><EyeOff size={11} /> Hidden</> : <><Eye size={11} /> Visible</>}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 px-5 py-4 border-t border-[#E5E1DA]">
                <button onClick={() => { setEditingUser(u); setViewingUser(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { setConfirmDelete(u); setViewingUser(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-500" /></div>
              <div><p className="font-semibold text-[#1A1A1A] text-sm">Delete User</p><p className="text-xs text-[#6B7280] mt-0.5">This action cannot be undone</p></div>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">
              Are you sure you want to delete <span className="font-semibold text-[#1A1A1A]">{confirmDelete.name}</span> ({confirmDelete.email})? Their account will be soft-deleted and removed from public listings.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl border border-[#E5E1DA] text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDeleteUser(confirmDelete._id)} disabled={deleteLoading === confirmDelete._id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                <Trash2 size={13} /> {deleteLoading === confirmDelete._id ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
