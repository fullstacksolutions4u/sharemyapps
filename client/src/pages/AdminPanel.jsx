import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ExternalLink, Check, X, Clock, LayoutDashboard,
  Users, FolderOpen, RefreshCw, ShieldCheck,
  CheckCircle, AlertCircle, ChevronRight, Menu,
  Mail, Phone, Tag, Link as LinkIcon, LogOut,
  ArrowLeft, Plus, Save, Megaphone, Trash2, ToggleLeft, ToggleRight, Pencil,
  MessageSquare, Send, CornerDownRight, UserCircle2, Zap, Award, Trophy, ChevronDown as ChevronDownIcon, Heart, Star, FolderOpen as FolderOpenIcon, Sparkles, Eye, EyeOff, Search,
  Briefcase, MapPin, ChevronDown, Users as UsersIcon, FileText,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
const getBanner = (bannerImage, liveUrl) => bannerImage || (liveUrl ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=400` : PLACEHOLDER);

const statusStyle = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Overview ─────────────────────────────────────────────────────────────────
function Overview({ stats, onNavigate }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Overview</h2>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: stats.total,      icon: FolderOpen,  iconCls: 'text-[#6B7280]',  bg: 'bg-[#F3F0EB]' },
          { label: 'Pending',        value: stats.pending,    icon: Clock,        iconCls: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved',       value: stats.approved,   icon: CheckCircle,  iconCls: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Developers',     value: stats.developers, icon: Users,        iconCls: 'text-[#00A693]',  bg: 'bg-[#E6F7F5]' },
          { label: 'Clients',        value: stats.clients,    icon: Users,        iconCls: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, iconCls, bg }) => (
          <div key={label} className="bg-white border border-[#E5E1DA] rounded-2xl p-5">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={iconCls} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">
                {stats.pending} project{stats.pending !== 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">Review and approve or reject user submissions.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-900 shrink-0 transition-colors"
          >
            Review <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const CATEGORIES = [
  'E-Commerce','Project Management','Customer Relationship Management (CRM)',
  'Finance & Accounting','Productivity Tools','Social Networking & Community',
  'Healthcare & Fitness','Education & Learning Platforms','HR & Recruitment',
  'Marketing & SEO','Real Estate','Travel & Booking','Food Delivery & Restaurant',
  'Gaming','Blockchain & Web3','Automation Tools','Analytics & Reporting',
  'Communication & Chat Apps','Inventory Management','Event Management','Others',
];

// ─── Full-page Project Review & Edit ─────────────────────────────────────────
function ProjectReviewPage({ project: initial, onBack, onApprove, onReject, updating }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    liveUrl: initial.liveUrl || '',
    appType: initial.appType || 'web',
    category: initial.category || '',
    techTags: initial.techTags?.join(', ') || '',
    contactEmail: initial.contactEmail || '',
    contactPhone: initial.contactPhone || '',
    linkedinUrl: initial.linkedinUrl || '',
  });
  const [githubUrls, setGithubUrls] = useState(
    initial.githubUrls?.length ? initial.githubUrls : (initial.githubUrl ? [initial.githubUrl] : [''])
  );
  const [githubVisible, setGithubVisible] = useState(initial.githubVisible !== false);
  const [saving, setSaving] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTitle, setRejectTitle] = useState('');
  const [rejectBody, setRejectBody] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const DEFAULT_APPROVE_NOTE = `Complete your profile with your contact details and social links (LinkedIn, GitHub, portfolio, etc.), and showcase your best live projects. Clients often prefer reviewing real projects over resumes, so highlight projects with unique features and ensure they work flawlessly in production.

Stay active on the platform by testing other developers' project features, exploring projects, liking projects, and sharing constructive feedback in the comments. Active developers and engaging projects gain better visibility and are more likely to be noticed by clients.

Best wishes for your job search, and we look forward to reviewing your projects.`;
  const [approveNote, setApproveNote] = useState('');

  const input = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/projects/${initial._id}`, {
        ...form,
        githubUrls,
        githubVisible,
      });
      toast.success('Changes saved');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleReject = () => {
    const note = rejectTitle.trim()
      ? `${rejectTitle.trim()}\n\n${rejectBody.trim()}`
      : rejectBody.trim();
    onReject(initial._id, note);
  };

  const handleApproveWithNote = () => {
    onApprove(initial._id, approveNote.trim());
  };

  const bannerSrc = initial.bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(initial.liveUrl)}?w=600`;

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
          <ArrowLeft size={14} /> Back to Projects
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${statusStyle[initial.status]}`}>
            {initial.status}
          </span>
          <span className="text-sm font-semibold text-[#1A1A1A]">{initial.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left: editable form ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* App type */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Project details</h3>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">App type</label>
                <div className="flex gap-1.5 p-1 bg-[#F3F0EB] rounded-xl w-fit">
                  {[{ value: 'web', label: 'Web App' }, { value: 'mobile', label: 'Mobile App' }].map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => setForm(f => ({ ...f, appType: opt.value }))}
                      className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.appType === opt.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={input}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={input} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Description</label>
              <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className={`${input} resize-none`} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Live URL</label>
              <input type="url" value={form.liveUrl} onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))} className={input} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Tech stack <span className="font-normal text-[#9CA3AF]">(comma-separated)</span></label>
              <input type="text" value={form.techTags} onChange={e => setForm(f => ({ ...f, techTags: e.target.value }))} className={input} placeholder="React, Node.js, MongoDB" />
            </div>
          </div>

          {/* Contact info */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Contact information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><Mail size={11} className="inline mr-1" />Email</label>
                <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className={input} />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><Phone size={11} className="inline mr-1" />Phone</label>
                <input type="tel" value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><LinkIcon size={11} className="inline mr-1" />LinkedIn URL</label>
              <input type="text" value={form.linkedinUrl} onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))} className={input} />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] mb-1.5"><LinkIcon size={11} className="inline mr-1" />GitHub URLs</label>
              <div className="space-y-2">
                {githubUrls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input type="text" value={url}
                      onChange={e => setGithubUrls(urls => urls.map((u, j) => j === i ? e.target.value : u))}
                      className={`flex-1 ${input}`} placeholder="github.com/username/repo" />
                    {githubUrls.length > 1 && (
                      <button type="button" onClick={() => setGithubUrls(urls => urls.filter((_, j) => j !== i))}
                        className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setGithubUrls(u => [...u, ''])}
                  className="inline-flex items-center gap-1 text-xs text-[#00A693] hover:text-[#007D6F] font-medium transition-colors">
                  <Plus size={12} /> Add another
                </button>
              </div>
              <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none w-fit">
                <div onClick={() => setGithubVisible(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${githubVisible ? 'bg-[#00A693]' : 'bg-[#D1D5DB]'}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${githubVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-[#6B7280]">{githubVisible ? 'Visible to everyone' : 'Hidden from public'}</span>
              </label>
            </div>
          </div>

          {/* Approve with comment form */}
          {approveOpen && (
            <div className="bg-white border border-green-200 rounded-2xl overflow-hidden">
              <div className="bg-green-50 px-5 py-4 border-b border-green-100">
                <p className="text-sm font-semibold text-green-700">Approval Comment / Tips</p>
                <p className="text-xs text-green-600 mt-0.5">Optional — share tips, praise, or suggestions. This will be sent to the developer as a notification.</p>
              </div>
              <div className="p-5">
                <textarea rows={10} value={approveNote} onChange={e => setApproveNote(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-400/10 resize-y transition" />
              </div>
            </div>
          )}

          {/* Reject feedback form */}
          {rejectOpen && (
            <div className="bg-white border border-red-200 rounded-2xl overflow-hidden">
              <div className="bg-red-50 px-5 py-4 border-b border-red-100">
                <p className="text-sm font-semibold text-red-700">Rejection Feedback</p>
                <p className="text-xs text-red-600 mt-0.5">This will be sent to the user as a notification.</p>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Title</label>
                  <input type="text" value={rejectTitle} onChange={e => setRejectTitle(e.target.value)}
                    placeholder="e.g. Changes required before approval"
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-red-400 transition" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Message</label>
                  <textarea rows={4} value={rejectBody} onChange={e => setRejectBody(e.target.value)}
                    placeholder="Explain what needs to be changed..."
                    className="w-full px-3 py-2.5 text-sm border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-red-400 resize-none transition" />
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 bg-[#F3F0EB] hover:bg-[#E5E1DA] text-[#1A1A1A] px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>

            {!rejectOpen && !approveOpen && (
              <>
                {initial.status !== 'approved' && (
                  <>
                    <button onClick={() => onApprove(initial._id, '')} disabled={updating === initial._id}
                      className="flex items-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                      <Check size={14} /> {updating === initial._id ? 'Approving...' : 'Approve'}
                    </button>
                    <button onClick={() => { setApproveNote(DEFAULT_APPROVE_NOTE); setApproveOpen(true); }}
                      className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                      <Check size={14} /> Approve with Comment
                    </button>
                  </>
                )}
                {initial.status !== 'rejected' && (
                  <button onClick={() => setRejectOpen(true)}
                    className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                    <X size={14} /> Reject with Feedback
                  </button>
                )}
                {initial.status === 'rejected' && (
                  <button onClick={() => onApprove(initial._id, '')} disabled={updating === initial._id}
                    className="flex items-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-5 py-2.5 rounded-xl font-medium text-sm transition-colors">
                    <Clock size={14} /> Move to Pending
                  </button>
                )}
              </>
            )}

            {approveOpen && (
              <>
                <button onClick={() => setApproveOpen(false)}
                  className="flex items-center gap-1.5 border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1A1A] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleApproveWithNote} disabled={updating === initial._id}
                  className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                  <Check size={14} /> {updating === initial._id ? 'Approving...' : 'Approve & Send Comment'}
                </button>
              </>
            )}

            {rejectOpen && (
              <>
                <button onClick={() => setRejectOpen(false)}
                  className="flex items-center gap-1.5 border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1A1A] px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={handleReject} disabled={updating === initial._id}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                  <X size={14} /> {updating === initial._id ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Right: preview & meta ── */}
        <div className="space-y-4">
          {/* Live preview */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
            <img src={bannerSrc} alt={initial.title} className="w-full h-40 object-cover"
              onError={e => { e.target.src = PLACEHOLDER; }} />
            <div className="p-4">
              <a href={initial.liveUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#00A693] hover:underline font-medium">
                <ExternalLink size={12} /> Visit live project
              </a>
            </div>
          </div>

          {/* Submitted by */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-3">Submitted by</p>
            <div className="flex items-center gap-3">
              {initial.owner?.avatar
                ? <img src={initial.owner.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt={initial.owner.name} />
                : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-medium shrink-0">{initial.owner?.name?.[0]?.toUpperCase()}</span>
              }
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1A1A1A]">{initial.owner?.name}</p>
                <p className="text-xs text-[#6B7280] truncate">{initial.owner?.email}</p>
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-3">
              Submitted {new Date(initial.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Tech tags preview */}
          {initial.techTags?.length > 0 && (
            <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {initial.techTags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-[#F3F0EB] text-[#6B7280] px-2.5 py-1 rounded-full">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Previous admin note */}
          {initial.adminNote && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Previous admin feedback</p>
              <p className="text-sm text-red-700 whitespace-pre-line">{initial.adminNote}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function ProjectsSection({ stats }) {
  const [tab, setTab] = useState('pending');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchProjects = async (status, p = 1, q = search) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page: p, limit: 12 });
      if (q.trim()) params.set('search', q.trim());
      const res = await api.get(`/admin/projects?${params}`);
      setProjects(res.data.projects);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchProjects(tab, 1, search); }, [tab]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchProjects(tab, 1, searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    fetchProjects(tab, 1, '');
  };

  const updateStatus = async (id, status, adminNote = '') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/projects/${id}/status`, { status, adminNote });
      setProjects(p => p.filter(x => x._id !== id));
      setSelected(null);
      toast.success(`Project ${status}`);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  const toggleFeatured = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/projects/${id}/featured`);
      setProjects(p => p.map(x => x._id === id ? { ...x, featured: res.data.featured } : x));
      toast.success(res.data.featured ? 'Project featured!' : 'Removed from featured');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update featured status');
    }
  };

  const toggleHidden = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/projects/${id}/hide`);
      setProjects(p => p.map(x => x._id === id ? { ...x, hidden: res.data.hidden } : x));
      toast.success(res.data.hidden ? 'Project hidden from listing' : 'Project visible again');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  if (selected) {
    return (
      <ProjectReviewPage
        project={selected}
        onBack={() => setSelected(null)}
        onApprove={(id, note) => updateStatus(id, 'approved', note)}
        onReject={(id, note) => updateStatus(id, 'rejected', note)}
        updating={updating}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Projects</h2>
        <button onClick={() => fetchProjects(tab, page)}
          className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by title, description, or owner…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
          />
          {searchInput && (
            <button type="button" onClick={handleClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <button type="submit"
          className="flex items-center gap-1.5 text-xs font-medium bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-xl transition-colors">
          <Search size={12} /> Search
        </button>
      </form>

      {search && (
        <p className="text-xs text-[#6B7280]">
          Showing results for <span className="font-medium text-[#1A1A1A]">"{search}"</span> · {total} found
          <button onClick={handleClearSearch} className="ml-2 text-[#00A693] hover:underline">Clear</button>
        </p>
      )}

      <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit">
        {['pending', 'approved', 'rejected'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}>
            {t}
            {stats && t === 'pending' && stats.pending > 0 && (
              <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pending}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <p className="text-[#6B7280] text-sm">No {tab} projects</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project._id} onClick={() => setSelected(project)}
                className="bg-white border border-[#E5E1DA] rounded-xl p-4 flex items-center gap-4 hover:border-[#00A693]/40 hover:shadow-sm transition-all cursor-pointer">
                <img src={getBanner(project.bannerImage, project.liveUrl)} alt={project.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                  onError={e => { e.target.src = PLACEHOLDER; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-[#1A1A1A]">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusStyle[project.status]}`}>
                      {project.status}
                    </span>
                    {project.featured && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium">
                        <Sparkles size={10} /> Featured for feedback
                      </span>
                    )}
                    {project.hidden && (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">
                        <EyeOff size={10} /> Hidden
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B7280] truncate mb-1">{project.description}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                    <span>By <span className="text-[#1A1A1A] font-medium">{project.owner?.name}</span></span>
                    <span className="hidden sm:inline">{project.owner?.email}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                {tab === 'approved' && (
                  <button
                    onClick={e => toggleFeatured(e, project._id)}
                    title={project.featured ? 'Remove from featured' : 'Feature this project'}
                    className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                      project.featured
                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                        : 'text-muted border-border hover:border-amber-300 hover:text-amber-600'
                    }`}
                  >
                    <Sparkles size={12} />
                    <span className="hidden sm:inline">{project.featured ? 'Unfeature' : 'Feature'}</span>
                  </button>
                )}
                <button
                  onClick={e => toggleHidden(e, project._id)}
                  title={project.hidden ? 'Show in listing' : 'Hide from listing'}
                  className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                    project.hidden
                      ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                      : 'text-muted border-border hover:border-gray-400 hover:text-gray-600'
                  }`}
                >
                  {project.hidden ? <Eye size={12} /> : <EyeOff size={12} />}
                  <span className="hidden sm:inline">{project.hidden ? 'Show' : 'Hide'}</span>
                </button>
                <ChevronRight size={16} className="text-[#9CA3AF] shrink-0" />
              </div>
            ))}
          </div>

          {pages > 1 && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <button onClick={() => fetchProjects(tab, page - 1)} disabled={page === 1}
                  className="px-3 h-8 text-xs border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
                  ‹
                </button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => fetchProjects(tab, p)}
                    className={`w-8 h-8 text-xs rounded-lg border transition ${
                      p === page
                        ? 'bg-accent text-white border-accent font-medium'
                        : 'border-border text-muted hover:border-accent hover:text-accent'
                    }`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => fetchProjects(tab, page + 1)} disabled={page === pages}
                  className="px-3 h-8 text-xs border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
                  ›
                </button>
              </div>
              <span className="text-xs text-[#9CA3AF]">Showing page {page} of {pages} · {total} project{total !== 1 ? 's' : ''}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Badge config ─────────────────────────────────────────────────────────────
const BADGES = [
  { value: 'new_member', label: 'New Member',        icon: UserCircle2, cls: 'bg-[#F3F0EB] text-[#6B7280] border-[#E5E1DA]' },
  { value: 'active',     label: 'Active Member',     icon: Zap,         cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'top',        label: 'Top Contributor',   icon: Award,       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  { value: 'champion',   label: 'Community Champion', icon: Trophy,      cls: 'bg-purple-50 text-purple-600 border-purple-200' },
];

function BadgeChip({ badge }) {
  const cfg = BADGES.find(b => b.value === badge) || BADGES[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border ${cfg.cls}`}>
      {Icon && <Icon size={11} />} {cfg.label}
    </span>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('developers');
  const [page, setPage] = useState(1);
  const [badgeLoading, setBadgeLoading] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(null);
  const [hideLoading, setHideLoading] = useState(null);
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

  const developers = users.filter(u => u.userType !== 'client');
  const clients = users.filter(u => u.userType === 'client');
  const list = tab === 'developers' ? developers : clients;
  const totalPages = Math.ceil(list.length / PER_PAGE);
  const paged = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Avatar = ({ u }) => u.avatar
    ? <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
    : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{u.name[0].toUpperCase()}</span>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Users</h2>
        <div className="text-xs text-[#9CA3AF]">{users.length} total</div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit">
        {[
          { key: 'developers', label: `Developers (${developers.length})` },
          { key: 'clients',    label: `Clients (${clients.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <p className="text-[#6B7280] text-sm">No {tab === 'developers' ? 'developer' : 'client'} accounts yet</p>
        </div>
      ) : tab === 'developers' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-visible">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6] rounded-t-2xl">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Developer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Engagement</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Badge</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar u={u} />
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A] truncate">{u.name}</p>
                        <p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 text-xs text-[#6B7280]" title="Projects">
                        <FolderOpenIcon size={12} className="text-[#9CA3AF]" /> {u.projectCount || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-400" title="Total likes">
                        <Heart size={12} className="fill-red-400" /> {u.totalLikes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-amber-500" title="Avg rating">
                        <Star size={12} className="fill-amber-400" /> {u.avgRating > 0 ? u.avgRating : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative flex items-center gap-2" onMouseDown={e => e.stopPropagation()}>
                      <BadgeChip badge={u.badge || 'member'} />
                      <button
                        onClick={() => setPickerOpen(pickerOpen === u._id ? null : u._id)}
                        disabled={badgeLoading === u._id}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-accent hover:text-accent font-medium transition-colors disabled:opacity-50"
                      >
                        {badgeLoading === u._id ? '…' : 'Change'} <ChevronDownIcon size={11} />
                      </button>
                      {pickerOpen === u._id && (
                        <div className="absolute left-0 bottom-full mb-1.5 z-50 bg-white border border-[#E5E1DA] rounded-xl shadow-lg py-1.5 w-52">
                          <p className="px-3 pb-1.5 text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider border-b border-[#F3F0EB] mb-1">Select badge</p>
                          {BADGES.map(b => {
                            const Icon = b.icon;
                            const active = (u.badge || 'member') === b.value;
                            return (
                              <button
                                key={b.value}
                                onClick={() => handleBadge(u._id, b.value)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[#FAF9F6] ${active ? 'font-semibold' : ''}`}
                              >
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${b.cls}`}>
                                  {Icon && <Icon size={10} />} {b.label}
                                </span>
                                {active && <Check size={12} className="ml-auto text-accent" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                      <button
                        onClick={() => handleToggleHidden(u._id)}
                        disabled={hideLoading === u._id}
                        title={u.hidden ? 'Show in developers list' : 'Hide from developers list'}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
                          u.hidden
                            ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        {hideLoading === u._id ? '…' : u.hidden ? <><EyeOff size={10} /> Hidden</> : <><Eye size={10} /> Visible</>}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Industry</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar u={u} />
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A] truncate">{u.name}</p>
                        <p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.companyName
                      ? <span className="text-xs font-medium text-[#1A1A1A]">{u.companyName}</span>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.industry
                      ? <span className="text-xs px-2.5 py-1 rounded-full bg-[#F3F0EB] text-[#6B7280] border border-[#E5E1DA] font-medium">{u.industry}</span>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] text-xs hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <p className="text-xs text-[#9CA3AF]">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, list.length)} of {list.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => p - 1)}
              disabled={page === 1}
              className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 text-sm rounded-lg border transition ${
                  n === page
                    ? 'bg-accent text-white border-accent font-medium'
                    : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}
              >{n}</button>
            ))}
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page === totalPages}
              className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition"
            >›</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function AnnouncementsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/announcements/all');
        setItems(res.data);
      } catch { toast.error('Failed to load announcements'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/announcements', { text });
      setItems(prev => [res.data, ...prev]);
      setText('');
      toast.success('Announcement added');
    } catch { toast.error('Failed to add announcement'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/announcements/${id}/toggle`);
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
    } catch { toast.error('Failed to update'); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setEditText(item.text);
  };

  const handleEditSave = async (id) => {
    if (!editText.trim()) return;
    setEditSaving(true);
    try {
      const res = await api.patch(`/announcements/${id}`, { text: editText });
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
      setEditId(null);
      toast.success('Announcement updated');
    } catch { toast.error('Failed to update'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Announcements</h2>

      {/* Add new */}
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-medium text-[#1A1A1A]">New announcement</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your announcement message..."
          rows={3}
          className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> Add Announcement
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-12 text-center">
          <Megaphone size={28} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item._id} className={`bg-white border border-border rounded-2xl px-5 py-4 ${!item.active && 'opacity-60'}`}>
              {editId === item._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-text bg-bg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSave(item._id)}
                      disabled={!editText.trim() || editSaving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check size={12} /> {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-3.5 py-1.5 text-xs text-muted hover:text-text border border-border rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <Megaphone size={16} className={`mt-0.5 shrink-0 ${item.active ? 'text-accent' : 'text-[#9CA3AF]'}`} />
                  <p className="flex-1 text-sm text-text leading-relaxed">{item.text}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#F3F0EB] text-muted border-border'}`}>
                      {item.active ? 'Active' : 'Hidden'}
                    </span>
                    <button
                      onClick={() => handleToggle(item._id)}
                      title={item.active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-muted hover:text-text transition-colors"
                    >
                      {item.active ? <ToggleRight size={16} className="text-accent" /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      title="Edit"
                      className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-muted hover:text-text transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Messages ─────────────────────────────────────────────────────────────────
function MessagesSection({ onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data.messages);
      if (onUnreadChange) onUnreadChange(res.data.unreadCount);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/messages');
        setMessages(res.data.messages);
        if (onUnreadChange) onUnreadChange(res.data.unreadCount);
      } catch { toast.error('Failed to load messages'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    try {
      await api.patch(`/messages/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
      if (onUnreadChange) onUnreadChange(messages.filter(m => !m.read && m._id !== id).length);
    } catch { /* ignore */ }
  };

  const handleReply = async (msg) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${msg._id}/reply`, { text: replyText });
      toast.success('Reply sent');
      setReplyText('');
      setReplyOpen(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Messages</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted hover:text-text border border-border px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <MessageSquare size={28} className="mx-auto text-[#D1D5DB] mb-3" />
          <p className="text-sm text-[#6B7280]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div
              key={msg._id}
              className={`bg-white border rounded-2xl transition-all ${!msg.read ? 'border-accent/30 bg-[#F0FBF9]' : 'border-border'}`}
            >
              <div
                className="p-4 cursor-default"
                onClick={() => !msg.read && markRead(msg._id)}
              >
                <div className="flex items-start gap-3">
                  {msg.sender?.avatar
                    ? <img src={msg.sender.avatar} alt={msg.sender.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    : <span className="w-9 h-9 rounded-full bg-accent text-white text-sm flex items-center justify-center font-medium shrink-0">
                        {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm ${!msg.read ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                        {msg.sender?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#9CA3AF] shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{msg.sender?.email}</p>
                    <p className={`text-sm leading-relaxed wrap-break-word ${!msg.read ? 'text-[#374151]' : 'text-muted'}`}>
                      {msg.text}
                    </p>
                  </div>
                  {!msg.read && <span className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
                </div>

                <div className="mt-3 ml-12">
                  <button
                    onClick={e => { e.stopPropagation(); setReplyOpen(replyOpen === msg._id ? null : msg._id); setReplyText(''); }}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${replyOpen === msg._id ? 'text-accent' : 'text-[#9CA3AF] hover:text-accent'}`}
                  >
                    <CornerDownRight size={12} /> Reply
                  </button>
                </div>
              </div>

              {replyOpen === msg._id && (
                <div className="px-4 pb-4 ml-12 border-t border-[#F3F0EB] pt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReply(msg)}
                      placeholder={`Reply to ${msg.sender?.name}…`}
                      autoFocus
                      className="flex-1 px-3.5 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button
                      onClick={() => handleReply(msg)}
                      disabled={!replyText.trim() || sending}
                      className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vacancies ────────────────────────────────────────────────────────────────
const TYPE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
const TYPE_STYLE = {
  remote:  'bg-green-50 text-green-700 border-green-200',
  onsite:  'bg-blue-50 text-blue-700 border-blue-200',
  hybrid:  'bg-purple-50 text-purple-700 border-purple-200',
};

const EMPTY_FORM = { title: '', company: '', description: '', skills: '', location: '', type: 'remote', industry: '', jobType: '', salaryRange: '', status: 'active' };

const vacancyInput = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

function VacancyFormFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Title *</label>
        <input name="title" value={form.title} onChange={onChange} placeholder="e.g. Full-Stack Developer" className={vacancyInput} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Company</label>
        <input name="company" value={form.company} onChange={onChange} placeholder="Company name" className={vacancyInput} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Location</label>
        <input name="location" value={form.location} onChange={onChange} placeholder="e.g. Bangalore, India" className={vacancyInput} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Type</label>
        <select name="type" value={form.type} onChange={onChange} className={vacancyInput}>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Status</label>
        <select name="status" value={form.status} onChange={onChange} className={vacancyInput}>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Industry</label>
        <input name="industry" value={form.industry} onChange={onChange} placeholder="e.g. Technology, Healthcare, Finance…" className={vacancyInput} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Job Type</label>
        <select name="jobType" value={form.jobType} onChange={onChange} className={vacancyInput}>
          <option value="">Select job type</option>
          {['Full-time', 'Part-time', 'Freelance', 'Contract', 'Internship'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Salary Range</label>
        <input name="salaryRange" value={form.salaryRange} onChange={onChange} placeholder="e.g. ₹8L–12L / $60k–80k" className={vacancyInput} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Required Skills <span className="font-normal text-[#9CA3AF]">(comma-separated)</span></label>
        <input name="skills" value={form.skills} onChange={onChange} placeholder="React, Node.js, MongoDB" className={vacancyInput} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Description *</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={4}
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          className={`${vacancyInput} resize-none`} />
      </div>
    </div>
  );
}

function VacanciesSection() {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedInterests, setExpandedInterests] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null); // { vacancyId, userId }
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    api.get('/admin/vacancies')
      .then(res => setVacancies(res.data))
      .catch(() => toast.error('Failed to load vacancies'))
      .finally(() => setLoading(false));
  }, []);

  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/vacancies', form);
      setVacancies(prev => [res.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success('Vacancy posted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEditSave = async (id) => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/admin/vacancies/${id}`, form);
      setVacancies(prev => prev.map(v => v._id === id ? res.data : v));
      setEditId(null);
      toast.success('Vacancy updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/vacancies/${id}`);
      setVacancies(prev => prev.filter(v => v._id !== id));
      toast.success('Vacancy deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const startEdit = (v) => {
    setEditId(v._id);
    setForm({
      title: v.title,
      company: v.company || '',
      description: v.description,
      skills: v.skills?.join(', ') || '',
      location: v.location || '',
      type: v.type || 'remote',
      industry: v.industry || '',
      jobType: v.jobType || '',
      salaryRange: v.salaryRange || '',
      status: v.status || 'active',
    });
    setShowAdd(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !replyOpen) return;
    setReplySending(true);
    try {
      await api.post(`/admin/vacancies/${replyOpen.vacancyId}/reply`, {
        userId: replyOpen.userId,
        message: replyText,
      });
      toast.success('Message sent to user');
      setReplyOpen(null);
      setReplyText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A]">Vacancies</h2>
        <button
          onClick={() => { setShowAdd(v => !v); setEditId(null); setForm(EMPTY_FORM); }}
          className="flex items-center gap-1.5 text-sm font-medium bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> {showAdd ? 'Cancel' : 'Add Vacancy'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-[#1A1A1A]">New Vacancy</p>
          <VacancyFormFields form={form} onChange={handleField} />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Post Vacancy'}
            </button>
            <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <Briefcase size={28} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No vacancies yet. Post the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vacancies.map(v => (
            <div key={v._id} className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
              {editId === v._id ? (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Edit Vacancy</p>
                  <VacancyFormFields form={form} onChange={handleField} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditSave(v._id)} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                      <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded-xl transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] flex items-center justify-center shrink-0">
                      <Briefcase size={15} className="text-[#00A693]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-[#1A1A1A]">{v.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TYPE_STYLE[v.type]}`}>
                          {TYPE_LABEL[v.type]}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                          v.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      {(v.company || v.location || v.industry || v.jobType || v.salaryRange) && (
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1 flex-wrap">
                          {v.company && <span className="font-medium text-[#1A1A1A]">{v.company}</span>}
                          {v.jobType && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{v.jobType}</span>}
                          {v.industry && <span className="px-2 py-0.5 rounded-full bg-[#F3F0EB] border border-[#E5E1DA]">{v.industry}</span>}
                          {v.salaryRange && <span className="font-medium text-green-700">{v.salaryRange}</span>}
                          {v.location && <span className="flex items-center gap-1"><MapPin size={10} />{v.location}</span>}
                        </div>
                      )}
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">{v.description}</p>
                      {v.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {v.skills.map(s => (
                            <span key={s} className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setExpandedInterests(expandedInterests === v._id ? null : v._id)}
                        className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1A1A1A] px-2.5 py-1.5 rounded-lg hover:bg-[#F3F0EB] transition-colors"
                        title="Show interested users"
                      >
                        <UsersIcon size={13} />
                        <span>{v.interests?.length || 0}</span>
                        <ChevronDown size={11} className={`transition-transform ${expandedInterests === v._id ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Interested users panel */}
                  {expandedInterests === v._id && (
                    <div className="border-t border-[#F3F0EB] px-4 py-3">
                      {v.interests?.length === 0 ? (
                        <p className="text-xs text-[#9CA3AF] py-2">No one has shown interest yet.</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                            {v.interests.length} Interested Developer{v.interests.length !== 1 ? 's' : ''}
                          </p>
                          {v.interests.map(u => (
                            <div key={u._id} className="space-y-2">
                              <div className="flex items-center gap-3">
                                {u.avatar
                                  ? <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                  : <span className="w-7 h-7 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">
                                      {u.name?.[0]?.toUpperCase()}
                                    </span>
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                                    {u.name}
                                    {u.regNumber && (
                                      <span className="ml-1.5 text-xs font-medium text-accent">
                                        {u.userType === 'client' ? 'C' : 'D'}{u.regNumber}
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const key = `${v._id}-${u._id}`;
                                    if (replyOpen?.key === key) { setReplyOpen(null); setReplyText(''); }
                                    else { setReplyOpen({ key, vacancyId: v._id, userId: u._id }); setReplyText(''); }
                                  }}
                                  className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                                    replyOpen?.key === `${v._id}-${u._id}`
                                      ? 'bg-accent text-white border-transparent'
                                      : 'text-muted border-border hover:border-accent hover:text-accent'
                                  }`}
                                >
                                  <Send size={11} /> Reply
                                </button>
                              </div>
                              {replyOpen?.key === `${v._id}-${u._id}` && (
                                <div className="ml-10 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                                    placeholder={`Message to ${u.name}…`}
                                    autoFocus
                                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                                  />
                                  <button
                                    onClick={handleReply}
                                    disabled={!replyText.trim() || replySending}
                                    className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                  >
                                    {replySending ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
// ─── Resumes ──────────────────────────────────────────────────────────────────
function ResumesSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/resumes')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-[#1A1A1A]">User Resumes</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-8 pr-4 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white focus:outline-none focus:border-[#00A693] w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E1DA] p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3F0EB] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#F3F0EB] rounded w-40" />
                <div className="h-3 bg-[#F3F0EB] rounded w-56" />
              </div>
              <div className="h-8 w-28 bg-[#F3F0EB] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <FileText size={32} className="text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-sm font-medium text-muted">
            {search ? 'No matching users found' : 'No resumes uploaded yet'}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">Users upload their CV link from the Profile page.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E1DA] bg-[#FAF9F6]">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {filtered.length} resume{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-[#F3F0EB]">
            {filtered.map(u => (
              <div key={u._id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAF9F6] transition-colors">
                {/* Avatar */}
                {u.avatar
                  ? <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  : <span className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold text-sm flex items-center justify-center shrink-0">
                      {u.name[0].toUpperCase()}
                    </span>
                }

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1A1A1A]">{u.name}</span>
                    {u.regNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent border border-accent/20 font-medium">
                        D{u.regNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
                </div>

                {/* Action */}
                <a
                  href={u.cvUrl.startsWith('http') ? u.cvUrl : `https://${u.cvUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover bg-accent-light hover:bg-[#C7EDE9] border border-accent/20 px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  <FileText size={14} /> View Resume
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const NAV = [
  { key: 'overview',      label: 'Overview',      icon: LayoutDashboard },
  { key: 'projects',      label: 'Projects',       icon: FolderOpen },
  { key: 'users',         label: 'Users',          icon: Users },
  { key: 'vacancies',     label: 'Vacancies',      icon: Briefcase },
  { key: 'resumes',       label: 'Resumes',        icon: FileText },
  { key: 'announcements', label: 'Announcements',  icon: Megaphone },
  { key: 'messages',      label: 'Messages',       icon: MessageSquare },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    api.get('/messages').then(res => setUnreadMessages(res.data.unreadCount)).catch(() => {});
  }, []);

  const navigate = (key) => { setSection(key); setMobileOpen(false); };

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#FAF9F6]">

      {/* ── Sidebar ── */}
      <aside className={`
        w-56 shrink-0 bg-white border-r border-[#E5E1DA] flex flex-col
        absolute inset-y-0 left-0 z-30 transition-transform duration-200
        lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#E5E1DA] shrink-0">
          <div className="w-7 h-7 bg-[#E6F7F5] rounded-lg flex items-center justify-center">
            <ShieldCheck size={14} className="text-[#00A693]" />
          </div>
          <span className="font-semibold text-sm text-[#1A1A1A]">Admin Panel</span>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                section === key
                  ? 'bg-[#E6F7F5] text-[#00A693]'
                  : 'text-[#6B7280] hover:bg-[#F3F0EB] hover:text-[#1A1A1A]'
              }`}
            >
              <Icon size={15} />
              {label}
              {key === 'projects' && stats?.pending > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">
                  {stats.pending}
                </span>
              )}
              {key === 'messages' && unreadMessages > 0 && (
                <span className="ml-auto bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-[#E5E1DA] shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden h-12 flex items-center gap-3 px-4 bg-white border-b border-[#E5E1DA] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-[#1A1A1A] capitalize">{section}</span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {section === 'overview'      && <Overview stats={stats} onNavigate={navigate} />}
          {section === 'projects'      && <ProjectsSection stats={stats} />}
          {section === 'users'         && <UsersSection />}
          {section === 'vacancies'     && <VacanciesSection />}
          {section === 'resumes'       && <ResumesSection />}
          {section === 'announcements' && <AnnouncementsSection />}
          {section === 'messages'      && <MessagesSection onUnreadChange={setUnreadMessages} />}
        </div>
      </div>
    </div>
  );
}
