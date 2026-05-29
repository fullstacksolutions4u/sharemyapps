import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ExternalLink, Check, X, Clock, LayoutDashboard,
  Users, FolderOpen, RefreshCw, ShieldCheck,
  CheckCircle, AlertCircle, ChevronRight, Menu,
  Eye, Mail, Phone, Tag, Link as LinkIcon, LogOut,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';

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

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Projects', value: stats.total,    icon: FolderOpen,  iconCls: 'text-[#6B7280]',  bg: 'bg-[#F3F0EB]' },
          { label: 'Pending',        value: stats.pending,  icon: Clock,        iconCls: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved',       value: stats.approved, icon: CheckCircle,  iconCls: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Total Users',    value: stats.users,    icon: Users,        iconCls: 'text-[#00A693]',  bg: 'bg-[#E6F7F5]' },
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

// ─── Project Detail Slide-over ────────────────────────────────────────────────
function ProjectDetailPanel({ project, onClose, onApprove, onReject, updating }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTitle, setRejectTitle] = useState('');
  const [rejectBody, setRejectBody] = useState('');

  if (!project) return null;

  const handleReject = () => {
    const note = rejectTitle.trim()
      ? `${rejectTitle.trim()}\n\n${rejectBody.trim()}`
      : rejectBody.trim();
    onReject(project._id, note);
    setRejectOpen(false);
    setRejectTitle('');
    setRejectBody('');
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA] shrink-0">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusStyle[project.status]}`}>
              {project.status}
            </span>
            <h2 className="font-semibold text-[#1A1A1A] text-sm truncate">{project.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] transition-colors rounded-lg hover:bg-[#F3F0EB]">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Banner */}
          {project.bannerImage && (
            <img src={project.bannerImage} alt="Banner" className="w-full h-44 object-cover rounded-xl" onError={e => { e.target.src = PLACEHOLDER; }} />
          )}

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-[#1A1A1A] leading-relaxed">{project.description}</p>
          </div>

          {/* Live URL */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">Live URL</p>
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-[#00A693] hover:underline">
              <ExternalLink size={13} /> {project.liveUrl}
            </a>
          </div>

          {/* Tech Stack */}
          {project.techTags?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1.5">
                {project.techTags.map(t => (
                  <span key={t} className="flex items-center gap-1 text-xs bg-[#F3F0EB] text-[#6B7280] px-2.5 py-1 rounded-full">
                    <Tag size={10} /> {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact info */}
          <div>
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Contact Information</p>
            <div className="space-y-2">
              {project.contactEmail && (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <Mail size={13} className="text-[#6B7280] shrink-0" />
                  <span>{project.contactEmail}</span>
                </div>
              )}
              {project.contactPhone && (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <Phone size={13} className="text-[#6B7280] shrink-0" />
                  <span>{project.contactPhone}</span>
                </div>
              )}
              {project.linkedinUrl && (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <LinkIcon size={13} className="text-[#6B7280] shrink-0" />
                  <span className="text-[#00A693]">LinkedIn: {project.linkedinUrl}</span>
                </div>
              )}
              {project.githubUrl && (
                <div className="flex items-center gap-2 text-sm text-[#1A1A1A]">
                  <LinkIcon size={13} className="text-[#6B7280] shrink-0" />
                  <span>GitHub: {project.githubUrl}
                    {!project.githubVisible && <span className="ml-1 text-xs text-[#9CA3AF]">(hidden from public)</span>}
                  </span>
                </div>
              )}
              {!project.contactEmail && !project.contactPhone && !project.linkedinUrl && (
                <p className="text-xs text-[#9CA3AF]">No contact info provided</p>
              )}
            </div>
          </div>

          {/* Screenshots */}
          {project.screenshots?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Screenshots</p>
              <div className="grid grid-cols-3 gap-2">
                {project.screenshots.map((s, i) => (
                  <img key={i} src={s} alt={`ss ${i}`} className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {/* Submitted by */}
          <div className="bg-[#FAF9F6] rounded-xl p-4">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Submitted by</p>
            <div className="flex items-center gap-3">
              {project.owner?.avatar
                ? <img src={project.owner.avatar} className="w-9 h-9 rounded-full object-cover" alt={project.owner.name} />
                : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-medium">{project.owner?.name?.[0]?.toUpperCase()}</span>
              }
              <div>
                <p className="text-sm font-medium text-[#1A1A1A]">{project.owner?.name}</p>
                <p className="text-xs text-[#6B7280]">{project.owner?.email}</p>
              </div>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-2">Submitted on {new Date(project.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Previous admin note */}
          {project.adminNote && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-red-700 mb-1">Previous admin feedback</p>
              <p className="text-sm text-red-700 whitespace-pre-line">{project.adminNote}</p>
            </div>
          )}

          {/* Rejection feedback form */}
          {rejectOpen && (
            <div className="border border-red-200 rounded-xl overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                <p className="text-sm font-semibold text-red-700">Rejection Feedback</p>
                <p className="text-xs text-red-600 mt-0.5">This message will be sent to the user as a notification.</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Title</label>
                  <input
                    type="text"
                    value={rejectTitle}
                    onChange={e => setRejectTitle(e.target.value)}
                    placeholder="e.g. Changes required before approval"
                    className="w-full px-3 py-2 text-sm border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-red-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">Message</label>
                  <textarea
                    rows={4}
                    value={rejectBody}
                    onChange={e => setRejectBody(e.target.value)}
                    placeholder="Explain what needs to be changed or added before resubmitting..."
                    className="w-full px-3 py-2 text-sm border border-[#E5E1DA] rounded-xl focus:outline-none focus:border-red-400 resize-none transition"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#E5E1DA] px-5 py-4 shrink-0 space-y-2">
          {!rejectOpen ? (
            <div className="flex gap-2">
              {project.status !== 'approved' && (
                <button onClick={() => onApprove(project._id)} disabled={updating === project._id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                  <Check size={15} /> Approve
                </button>
              )}
              {project.status !== 'rejected' && (
                <button onClick={() => setRejectOpen(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-xl font-medium text-sm transition-colors">
                  <X size={15} /> Reject with Feedback
                </button>
              )}
              {project.status === 'rejected' && (
                <button onClick={() => onApprove(project._id, 'pending')} disabled={updating === project._id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                  <Clock size={15} /> Move to Pending
                </button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setRejectOpen(false)}
                className="flex-1 py-2.5 border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1A1A] rounded-xl text-sm font-medium transition-colors">
                Back
              </button>
              <button onClick={handleReject} disabled={updating === project._id}
                className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
                <X size={14} /> {updating === project._id ? 'Rejecting...' : 'Confirm & Send Feedback'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Projects ─────────────────────────────────────────────────────────────────
function ProjectsSection({ stats }) {
  const [tab, setTab] = useState('pending');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(null);

  const fetchProjects = async (status) => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/projects?status=${status}`);
      setProjects(res.data);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(tab); }, [tab]); // eslint-disable-line react-hooks/set-state-in-effect

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

  return (
    <>
      {selected && (
        <ProjectDetailPanel
          project={selected}
          onClose={() => setSelected(null)}
          onApprove={(id) => updateStatus(id, 'approved')}
          onReject={(id, note) => updateStatus(id, 'rejected', note)}
          updating={updating}
        />
      )}

      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Projects</h2>
          <button onClick={() => fetchProjects(tab)}
            className="flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

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
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project._id} className="bg-white border border-[#E5E1DA] rounded-xl p-4 flex items-center gap-4 hover:border-[#00A693]/40 transition-colors">
                <img src={project.bannerImage || PLACEHOLDER} alt={project.title}
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                  onError={e => { e.target.src = PLACEHOLDER; }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-[#1A1A1A]">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${statusStyle[project.status]}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-xs text-[#6B7280] truncate mb-1">{project.description}</p>
                  <div className="flex items-center gap-3 text-xs text-[#9CA3AF]">
                    <span>By <span className="text-[#1A1A1A] font-medium">{project.owner?.name}</span></span>
                    <span className="hidden sm:inline">{project.owner?.email}</span>
                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setSelected(project)}
                    className="flex items-center gap-1.5 text-xs bg-[#F3F0EB] hover:bg-[#E6F7F5] text-[#1A1A1A] hover:text-[#00A693] px-3 py-1.5 rounded-lg transition-colors font-medium">
                    <Eye size={13} /> View Details
                  </button>
                  {tab !== 'approved' && (
                    <button onClick={() => updateStatus(project._id, 'approved')} disabled={updating === project._id}
                      className="flex items-center gap-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <Check size={12} /> Approve
                    </button>
                  )}
                  {tab === 'rejected' && (
                    <button onClick={() => updateStatus(project._id, 'pending')} disabled={updating === project._id}
                      className="flex items-center gap-1 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      <Clock size={12} /> Re-review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Users ────────────────────────────────────────────────────────────────────
function UsersSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Users</h2>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.avatar
                        ? <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{u.name[0].toUpperCase()}</span>
                      }
                      <div className="min-w-0">
                        <p className="font-medium text-[#1A1A1A] truncate">{u.name}</p>
                        <p className="text-xs text-[#6B7280] sm:hidden truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#6B7280] hidden sm:table-cell text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                      u.role === 'admin'
                        ? 'bg-[#E6F7F5] text-[#00A693] border-[#00A693]/20'
                        : 'bg-[#F3F0EB] text-[#6B7280] border-[#E5E1DA]'
                    }`}>
                      {u.role}
                    </span>
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
    </div>
  );
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────
const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
  { key: 'users',    label: 'Users',    icon: Users },
];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
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
          {section === 'overview' && <Overview stats={stats} onNavigate={navigate} />}
          {section === 'projects' && <ProjectsSection stats={stats} />}
          {section === 'users'    && <UsersSection />}
        </div>
      </div>
    </div>
  );
}
