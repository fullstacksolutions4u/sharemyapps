import { useState, useEffect } from 'react';
import {
  ExternalLink, Check, X, Save, ArrowLeft, Tag,
  ChevronRight, Search, EyeOff, Eye, Trash2,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgODAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIgLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDAsMjEwKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iLTM1IiB5PSItNDUiIHdpZHRoPSI3MCIgaGVpZ2h0PSI1MCIgcng9IjQiIC8+PGxpbmUgeDE9Ii0xNSIgeTE9IjUiIHgyPSIxNSIgeTI9IjUiIC8+PGxpbmUgeDE9Ii01IiB5MT0iNSIgeDI9Ii0xMCIgeTI9IjE1IiAvPjxsaW5lIHgxPSI1IiB5MT0iNSIgeDI9IjEwIiB5Mj0iMTUiIC8+PGxpbmUgeDE9Ii0yMCIgeTE9IjE1IiB4Mj0iMjAiIHkyPSIxNSIgLz48L2c+PHRleHQgeD0iNTAlIiB5PSIyNzUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiM2NDc0OGIiPlByZXZpZXcgR2VuZXJhdGluZy4uLjwvdGV4dD48L3N2Zz4=';
const getBanner = (bannerImage) => bannerImage || PLACEHOLDER;
const statusStyle = {
  pending:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};
const CATEGORIES = [
  'Mobile Applications', 'E-Commerce', 'Project Management', 'Customer Relationship Management (CRM)',
  'Finance & Accounting', 'Productivity Tools', 'Social Networking & Community',
  'Healthcare & Fitness', 'Education & Learning Platforms', 'HR & Recruitment',
  'Marketing & SEO', 'Real Estate', 'Travel & Booking', 'Food Delivery & Restaurant',
  'Gaming', 'Blockchain & Web3', 'Automation Tools', 'Analytics & Reporting',
  'Communication & Chat Apps', 'Inventory Management', 'Event Management',
  'AI & Machine Learning', 'DevTools & Developer Utilities', 'Cybersecurity',
  'IoT & Embedded Systems', 'AR & VR', 'Media & Entertainment',
  'Legal & Compliance', 'Logistics & Supply Chain', 'Agriculture & Farming',
  'Environment & Sustainability', 'Non-Profit & Social Impact',
  'Personal Finance & Budgeting', 'Job Board & Freelancing',
  'News & Blogging', 'Sports & Recreation', 'Fashion & Lifestyle',
  'Open Source Project', 'Portfolios', 'Company Website',
];

const DEFAULT_APPROVE_NOTE = `Complete your profile with your contact details and social links (LinkedIn, GitHub, portfolio, etc.), and showcase your best live projects. Clients often prefer reviewing real projects over resumes, so highlight projects with unique features and ensure they work flawlessly in production.

Stay active on the platform by testing other developers' project features, exploring projects, liking projects, and sharing constructive feedback in the comments. Active developers and engaging projects gain better visibility and are more likely to be noticed by clients.

Best wishes for your job search, and we look forward to reviewing your projects.`;

function ProjectReviewPage({ project: initial, onBack, onSave, onApprove, onReject, updating }) {
  const [form, setForm] = useState({
    title: initial.title || '',
    description: initial.description || '',
    liveUrl: initial.liveUrl || '',
    appType: initial.appType || 'web',
    category: initial.category || '',
    techTags: initial.techTags?.join(', ') || '',
    contactEmail: initial.contactEmail || initial.owner?.email || '',
    contactPhone: initial.contactPhone || initial.owner?.phone || '',
    linkedinUrl: initial.linkedinUrl || initial.owner?.linkedinUrl || '',
  });
  const githubUrls = initial.githubUrls?.length ? initial.githubUrls : (initial.githubUrl ? [initial.githubUrl] : (initial.owner?.githubUrl ? [initial.owner.githubUrl] : ['']));
  const githubVisible = initial.githubVisible !== false;
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
      const res = await api.put(`/admin/projects/${initial._id}`, { ...form, githubUrls, githubVisible });
      onSave(res.data);
      toast.success('Changes saved');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (note) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/projects/${initial._id}`, { ...form, githubUrls, githubVisible });
      onSave(res.data);
    } catch { toast.error('Failed to save changes before approving'); setSaving(false); return; }
    setSaving(false);
    onApprove(initial._id, note);
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
                <input 
                  type="text" 
                  list="admin-category-options"
                  value={form.category} 
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))} 
                  className={input} 
                  placeholder="e.g. Developer Tools"
                />
                <datalist id="admin-category-options">
                  {CATEGORIES.map(c => <option key={c} value={c} />)}
                </datalist>
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
                    <button onClick={() => handleApprove('')} disabled={updating === initial._id || saving}
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
                  <button onClick={() => handleApprove('')} disabled={updating === initial._id || saving}
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
                <button onClick={() => handleApprove(approveNote.trim())} disabled={updating === initial._id || saving}
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
            <img src={optimizeImage(bannerSrc, 800)} alt={initial.title} className="w-full h-40 object-cover"
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
                ? <img src={optimizeImage(initial.owner.avatar, 150)} className="w-9 h-9 rounded-full object-cover shrink-0" alt={initial.owner.name} />
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

  const handleSaved = (updatedProject) => {
    setProjects(p => p.map(x => x._id === updatedProject._id ? { ...x, ...updatedProject } : x));
    setSelected(prev => ({ ...prev, ...updatedProject }));
  };

  if (selected) {
    return (
      <ProjectReviewPage
        project={selected}
        onBack={() => setSelected(null)}
        onSave={handleSaved}
        onApprove={(id, note) => updateStatus(id, 'approved', note)}
        onReject={(id, note) => updateStatus(id, 'rejected', note)}
        updating={updating}
      />
    );
  }

  return (
    <div className="space-y-5">

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
                  <th className="text-left px-4 py-3 text-xs font-bold text-violet-500 uppercase tracking-wider">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-amber-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0EB]">
                {projects.map((project, idx) => (
                  <tr key={project._id} className={`transition-colors hover:bg-[#f0fdfb] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelected(project)}>
                        <img src={optimizeImage(getBanner(project.bannerImage, project.liveUrl), 800)} alt={project.title}
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
                      {project.category
                        ? <span className="text-xs text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100 font-medium">{project.category}</span>
                        : <span className="text-xs text-[#9CA3AF]">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={e => toggleHidden(e, project._id)}
                          title={project.hidden ? 'Show in listing' : 'Hide from listing'}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${project.hidden ? 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                          {project.hidden ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={() => setSelected(project)} title="Review"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-[#00A693]/10 text-[#00A693] border-[#00A693]/30 hover:bg-[#00A693] hover:text-white transition-colors">
                          <ChevronRight size={14} />
                        </button>
                        <button onClick={e => deleteProject(e, project._id)} title="Delete"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border bg-red-50 text-red-500 border-red-200 hover:bg-red-500 hover:text-white transition-colors">
                          <Trash2 size={14} />
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
