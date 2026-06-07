import { useState, useEffect } from 'react';
import {
  ExternalLink, Check, X, Plus, Save, ArrowLeft, Tag, Link as LinkIcon,
  Mail, Phone, ChevronRight, RefreshCw, Search, Sparkles, EyeOff, Eye, Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
const getBanner = (bannerImage, liveUrl) => bannerImage || (liveUrl ? `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=400` : PLACEHOLDER);
const statusStyle = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};
const CATEGORIES = [
  'E-Commerce','Project Management','Customer Relationship Management (CRM)',
  'Finance & Accounting','Productivity Tools','Social Networking & Community',
  'Healthcare & Fitness','Education & Learning Platforms','HR & Recruitment',
  'Marketing & SEO','Real Estate','Travel & Booking','Food Delivery & Restaurant',
  'Gaming','Blockchain & Web3','Automation Tools','Analytics & Reporting',
  'Communication & Chat Apps','Inventory Management','Event Management','Open Source Project','Others',
];

const DEFAULT_APPROVE_NOTE = `Complete your profile with your contact details and social links (LinkedIn, GitHub, portfolio, etc.), and showcase your best live projects. Clients often prefer reviewing real projects over resumes, so highlight projects with unique features and ensure they work flawlessly in production.

Stay active on the platform by testing other developers' project features, exploring projects, liking projects, and sharing constructive feedback in the comments. Active developers and engaging projects gain better visibility and are more likely to be noticed by clients.

Best wishes for your job search, and we look forward to reviewing your projects.`;

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
  const [approveNote, setApproveNote] = useState('');

  const input = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/projects/${initial._id}`, { ...form, githubUrls, githubVisible });
      toast.success('Changes saved');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleReject = () => {
    const note = rejectTitle.trim() ? `${rejectTitle.trim()}\n\n${rejectBody.trim()}` : rejectBody.trim();
    onReject(initial._id, note);
  };

  const bannerSrc = initial.bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(initial.liveUrl)}?w=600`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
          <ArrowLeft size={14} /> Back to Projects
        </button>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium capitalize ${statusStyle[initial.status]}`}>{initial.status}</span>
          <span className="text-sm font-semibold text-[#1A1A1A]">{initial.title}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
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
              <textarea rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={`${input} resize-none`} />
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
                    Move to Pending
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
                <button onClick={() => onApprove(initial._id, approveNote.trim())} disabled={updating === initial._id}
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

        <div className="space-y-4">
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

export default function AdminProjectsSection({ stats }) {
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
    } catch { toast.error('Failed to load projects'); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { fetchProjects(tab, 1, search); }, [tab]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); fetchProjects(tab, 1, searchInput); };
  const handleClearSearch = () => { setSearchInput(''); setSearch(''); fetchProjects(tab, 1, ''); };

  const updateStatus = async (id, status, adminNote = '') => {
    setUpdating(id);
    try {
      await api.patch(`/admin/projects/${id}/status`, { status, adminNote });
      setProjects(p => p.filter(x => x._id !== id));
      setSelected(null);
      toast.success(`Project ${status}`);
    } catch { toast.error('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const toggleFeatured = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/projects/${id}/featured`);
      setProjects(p => p.map(x => x._id === id ? { ...x, featured: res.data.featured } : x));
      toast.success(res.data.featured ? 'Project featured!' : 'Removed from featured');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update featured status'); }
  };

  const toggleHidden = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/projects/${id}/hide`);
      setProjects(p => p.map(x => x._id === id ? { ...x, hidden: res.data.hidden } : x));
      toast.success(res.data.hidden ? 'Project hidden from listing' : 'Project visible again');
    } catch { toast.error('Failed to update visibility'); }
  };

  const deleteProject = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project permanently? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      toast.success('Project deleted');
    } catch { toast.error('Failed to delete project'); }
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

      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit">
          {['pending', 'approved', 'rejected'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${tab === t ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
              {t}
              {stats && t === 'pending' && stats.pending > 0 && (
                <span className="ml-1.5 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">{stats.pending}</span>
              )}
            </button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search by title, description, or owner…"
              className="pl-9 pr-8 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition w-72" />
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
      </div>

      {search && (
        <p className="text-xs text-[#6B7280]">
          Showing results for <span className="font-medium text-[#1A1A1A]">"{search}"</span> · {total} found
          <button onClick={handleClearSearch} className="ml-2 text-[#00A693] hover:underline">Clear</button>
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <p className="text-[#6B7280] text-sm">No {tab} projects</p>
        </div>
      ) : (
        <>
          <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#E5E1DA] bg-gradient-to-r from-[#00A693]/10 via-indigo-50 to-amber-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#00A693] uppercase tracking-wider">Project</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-indigo-500 uppercase tracking-wider">Developer</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-emerald-600 uppercase tracking-wider">Sale Price</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-violet-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-amber-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0EB]">
                {projects.map((project, idx) => (
                  <tr key={project._id} className={`transition-colors hover:bg-[#f0fdfb] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelected(project)}>
                        <img src={getBanner(project.bannerImage, project.liveUrl)} alt={project.title}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 ring-2 ring-[#00A693]/20"
                          onError={e => { e.target.src = PLACEHOLDER; }} />
                        <p className="font-semibold text-[#1A1A1A] truncate max-w-[200px] hover:text-[#00A693] transition-colors">{project.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                        {project.owner?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {project.salePrice
                        ? <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">₹{project.salePrice.toLocaleString('en-IN')}</span>
                        : <span className="text-xs text-[#9CA3AF]">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`w-fit text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${statusStyle[project.status]}`}>{project.status}</span>
                        {project.featured && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 font-medium w-fit">
                            <Sparkles size={10} /> Featured
                          </span>
                        )}
                        {project.hidden && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium w-fit">
                            <EyeOff size={10} /> Hidden
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {tab === 'approved' && (
                          <button onClick={e => toggleFeatured(e, project._id)}
                            title={project.featured ? 'Remove from featured' : 'Feature this project'}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${project.featured ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' : 'bg-amber-50/50 text-amber-500 border-amber-200 hover:bg-amber-100'}`}>
                            <Sparkles size={11} /> {project.featured ? 'Unfeature' : 'Feature'}
                          </button>
                        )}
                        <button onClick={e => toggleHidden(e, project._id)}
                          title={project.hidden ? 'Show in listing' : 'Hide from listing'}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${project.hidden ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                          {project.hidden ? <Eye size={11} /> : <EyeOff size={11} />}
                          {project.hidden ? 'Show' : 'Hide'}
                        </button>
                        <button onClick={() => setSelected(project)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border bg-[#00A693]/10 text-[#00A693] border-[#00A693]/30 hover:bg-[#00A693] hover:text-white font-medium transition-colors">
                          <ChevronRight size={11} /> Review
                        </button>
                        <button onClick={e => deleteProject(e, project._id)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border bg-red-50 text-red-500 border-red-200 hover:bg-red-500 hover:text-white font-medium transition-colors">
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className="flex items-center gap-1 flex-wrap justify-center">
                <button onClick={() => fetchProjects(tab, page - 1)} disabled={page === 1}
                  className="px-3 h-8 text-xs border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => fetchProjects(tab, p)}
                    className={`w-8 h-8 text-xs rounded-lg border transition ${p === page ? 'bg-accent text-white border-accent font-medium' : 'border-border text-muted hover:border-accent hover:text-accent'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => fetchProjects(tab, page + 1)} disabled={page === pages}
                  className="px-3 h-8 text-xs border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
              </div>
              <span className="text-xs text-[#9CA3AF]">Showing page {page} of {pages} · {total} project{total !== 1 ? 's' : ''}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
