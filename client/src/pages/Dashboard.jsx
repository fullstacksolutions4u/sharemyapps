import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FolderOpen,
  Crown, UserCircle, LogOut, Menu, X, Plus, Share2,
  Pencil, Trash2, ExternalLink, Clock, CheckCircle, XCircle,
  AlertCircle, Copy, Check, Eye, EyeOff, Heart, Star, ChevronRight,
  Lock, Briefcase, GraduationCap, Inbox, FileText
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useConfirm } from '../context/ConfirmContext';

const NAV = [
  { key: 'profile',            label: 'Profile',               icon: UserCircle },
  { key: 'projects',           label: 'My Projects',           icon: FolderOpen },
  { key: 'inbox',              label: 'Inbox',                 icon: Inbox },
  { key: 'applications',       label: 'My Applications',       icon: FileText },
  { key: 'premium',            label: 'Job Assistance Services', icon: Crown, isGolden: true },
  { key: 'mentorship',         label: 'Mentorship Program', icon: GraduationCap, isGolden: true },
  { key: 'services',           label: 'Services',         icon: Lock, isPremiumService: true, isGolden: true },
  { key: 'job-alerts',         label: 'Job Alerts',      icon: Briefcase, isJobAlertEligible: true, isGolden: true },
];

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
const getbanner = (bannerImage) => bannerImage || PLACEHOLDER;

const statusBadge = {
  pending:  { label: 'Pending review', icon: Clock,        cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved',       icon: CheckCircle,  cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected',       icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-200' },
};

function ShareModal({ userId, onClose }) {
  const link = `${window.location.origin}/portfolio/${userId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text">Share your portfolio</h2>
            <p className="text-xs text-muted mt-0.5">Anyone with this link can view all your approved projects.</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors p-1 -mr-1 -mt-1">
            <X size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2 bg-bg border border-border rounded-xl px-3 py-2.5">
          <span className="flex-1 text-xs text-text truncate font-mono select-all">{link}</span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              copied ? 'bg-green-100 text-green-700' : 'bg-accent hover:bg-accent-hover text-white'
            }`}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-muted mt-3">
          Great for sharing with recruiters — they'll see your live projects without needing an account.
        </p>
      </div>
    </div>
  );
}

function isProfileIncomplete(user) {
  if (!user || user.userType === 'client') return false;
  const hasPhone = !!user.phone;
  const hasSocialLink = !!(user.linkedinUrl || user.githubUrl || user.portfolioUrl || user.leetcodeUrl);
  const hasOpportunityPref = !!(user.freelanceAvailable || user.mentorshipAvailable);
  return !hasPhone || !hasSocialLink || !hasOpportunityPref;
}

function getMissingItems(user) {
  const items = [];
  if (!user?.phone) items.push('phone number');
  if (!(user?.linkedinUrl || user?.githubUrl || user?.portfolioUrl || user?.leetcodeUrl)) items.push('at least one social link');
  if (!(user?.freelanceAvailable || user?.mentorshipAvailable)) items.push('freelance / mentorship preferences');
  return items;
}

function ProjectsSection({ user, confirm, queryClient, setShowShare }) {
  const [bannerDismissed, setBannerDismissed] = useState(
    () => sessionStorage.getItem('profile_banner_dismissed') === '1'
  );
  const showProfileBanner = !bannerDismissed && isProfileIncomplete(user);

  const { data: projects = [], isLoading: loading } = useQuery({
    queryKey: ['myProjects'],
    queryFn: async () => { const res = await api.get('/projects/my'); return res.data; },
    staleTime: 1000 * 60 * 2,
  });

  const handleToggleHidden = async (id) => {
    try {
      const res = await api.patch(`/projects/${id}/hide`);
      queryClient.setQueryData(['myProjects'], prev =>
        prev.map(x => x._id === id ? { ...x, hidden: res.data.hidden } : x)
      );
      toast.success(res.data.hidden ? 'Project hidden from listing' : 'Project visible again');
    } catch {
      toast.error('Failed to update visibility');
    }
  };

  const handleDelete = async (id, title) => {
    const ok = await confirm({ title: `Delete "${title}"?`, message: 'This action cannot be undone. The project will be permanently removed.' });
    if (!ok) return;
    try {
      await api.delete(`/projects/${id}`);
      queryClient.setQueryData(['myProjects'], prev => prev.filter(x => x._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text tracking-tight">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} listed</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            disabled={projects.length === 0}
            title={projects.length === 0 ? 'Add a project first' : ''}
            className="flex items-center gap-2 border border-border px-4 py-2.5 rounded-xl font-medium text-sm transition-colors bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:enabled:border-accent/50 text-muted hover:enabled:text-accent"
          >
            <Share2 size={15} /> Share all
          </button>
          <Link
            to="/dashboard/add"
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={15} /> Add project
          </Link>
        </div>
      </div>

      {showProfileBanner && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
            <UserCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Complete your profile</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Still missing: {getMissingItems(user).join(', ')}. A complete profile helps clients and recruiters find you.
            </p>
            <button
              onClick={() => setShowShare(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 mt-2 underline underline-offset-2 transition-colors"
            >
              Go to Profile <ChevronRight size={12} />
            </button>
          </div>
          <button
            onClick={() => { sessionStorage.setItem('profile_banner_dismissed', '1'); setBannerDismissed(true); }}
            className="text-amber-400 hover:text-amber-600 transition-colors shrink-0 mt-0.5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-16 text-center">
          <div className="w-12 h-12 bg-accent-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={22} className="text-accent" />
          </div>
          <h3 className="font-semibold text-text mb-1">No projects yet</h3>
          <p className="text-sm text-muted mb-5">List your first side project and share it with the world.</p>
          <Link
            to="/dashboard/add"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={14} /> Add your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project._id} className="bg-white border border-border rounded-xl p-4 flex items-center gap-4 hover:border-accent/30 transition-colors">
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-bg shrink-0">
                <img
                  src={getbanner(project.bannerImage, project.liveUrl)}
                  alt={project.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-text truncate">{project.title}</h3>
                  {(() => {
                    const s = statusBadge[project.status] || statusBadge.pending;
                    const Icon = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>
                        <Icon size={10} /> {s.label}
                      </span>
                    );
                  })()}
                  {project.hidden && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium bg-gray-100 text-gray-500 border-gray-200">
                      <EyeOff size={10} /> Hidden
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted truncate mt-0.5">{project.description}</p>
                {project.collaborators?.length > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] text-muted">with</span>
                    <div className="flex -space-x-1">
                      {project.collaborators.slice(0, 4).map(c => (
                        c.avatar
                          ? <img key={c._id} src={c.avatar} alt={c.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-white" title={c.name} />
                          : <span key={c._id} className="w-4 h-4 rounded-full bg-accent text-white text-[7px] flex items-center justify-center font-semibold ring-1 ring-white" title={c.name}>{c.name?.[0]?.toUpperCase()}</span>
                      ))}
                    </div>
                    <span className="text-[10px] text-muted">{project.collaborators.map(c => c.name).join(', ')}</span>
                  </div>
                )}
                {project.techTags?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {project.techTags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-bg text-muted px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                {project.status === 'approved' && (
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted"><Eye size={11} /> {(project.viewCount || 0).toLocaleString()} views</span>
                    <span className="flex items-center gap-1 text-xs text-red-400"><Heart size={11} /> {project.likes?.length || 0} likes</span>
                    {project.ratings?.length > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-500">
                        <Star size={11} /> {(project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length).toFixed(1)}
                      </span>
                    )}
                  </div>
                )}
                {project.adminNote && project.status === 'rejected' && (
                  <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700"><span className="font-medium">Admin note:</span> {project.adminNote}</p>
                  </div>
                )}
                {project.adminNote && project.status === 'approved' && (
                  <div className="flex items-start gap-1.5 mt-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700"><span className="font-medium">Admin tip:</span> {project.adminNote}</p>
                  </div>
                )}
                {project.status === 'rejected' && (
                  <Link
                    to={`/dashboard/edit/${project._id}`}
                    className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium mt-1.5 transition-colors"
                  >
                    <Pencil size={10} /> Edit and resubmit
                  </Link>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-light text-accent hover:bg-accent hover:text-white transition-colors"
                  title="Visit live"
                >
                  <ExternalLink size={13} />
                </a>
                <Link
                  to={`/dashboard/edit/${project._id}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                  title="Edit"
                >
                  <Pencil size={13} />
                </Link>
                <button
                  onClick={() => handleToggleHidden(project._id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                    project.hidden
                      ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}
                  title={project.hidden ? 'Show in listing' : 'Hide from listing'}
                >
                  {project.hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                  onClick={() => handleDelete(project._id, project.title)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const confirm = useConfirm();
  const queryClient = useQueryClient();
  const nav = useNavigate();
  const outlet = useOutlet();
  const location = useLocation();
  const activeSection = location.pathname.split('/').filter(Boolean)[1] || 'projects';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [offerApproved, setOfferApproved] = useState(false);
  const [jobAlertsEligible, setJobAlertsEligible] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get('/offers/my-offer')
      .then(r => setOfferApproved(r.data?.status === 'approved'))
      .catch(() => {});
    api.get('/premium-services/job-alerts/eligibility')
      .then(r => setJobAlertsEligible(!!r.data?.eligible))
      .catch(() => {});
  }, [user]);

  const [showShare, setShowShare] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    nav('/');
  };

  const handleNav = (key) => {
    nav(key === 'projects' ? '/dashboard' : `/dashboard/${key}`);
    setMobileOpen(false);
  };

  return (
    <div className="flex overflow-hidden bg-bg" style={{ height: 'calc(100vh - 4rem)' }}>
      {showShare && <ShareModal userId={user?._id} onClose={() => setShowShare(false)} />}

      {/* Sidebar */}
      <aside className={`
        w-56 shrink-0 bg-white border-r border-border flex flex-col
        absolute inset-y-0 left-0 z-30 transition-transform duration-200
        lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border shrink-0">
          <div className="w-7 h-7 bg-accent-light rounded-lg flex items-center justify-center">
            <LayoutDashboard size={14} className="text-accent" />
          </div>
          <span className="font-semibold text-sm text-text">Dashboard</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV.filter(item => (!item.isPremiumService || offerApproved) && (!item.isJobAlertEligible || jobAlertsEligible)).map(({ key, label, icon: Icon, isGolden }) => (
            <button
              key={key}
              onClick={() => handleNav(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === key
                  ? 'bg-accent-light text-accent'
                  : 'text-muted hover:bg-[#F3F0EB] hover:text-text'
              }`}
            >
              <Icon size={15} className={
                isGolden ? (activeSection === key ? '' : 'text-amber-500') : ''
              } />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border shrink-0">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {user?.avatar
                ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                : <span className="w-7 h-7 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold shrink-0">{user?.name?.[0]?.toUpperCase()}</span>
              }
              <span className="truncate text-sm font-medium text-muted">{user?.name || 'User'}</span>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden h-12 flex items-center gap-3 px-4 bg-white border-b border-border shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-muted hover:text-text transition-colors">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-text">{NAV.find(n => n.key === activeSection)?.label || activeSection}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {outlet || <ProjectsSection user={user} confirm={confirm} queryClient={queryClient} setShowShare={setShowShare} />}
        </div>
      </div>
    </div>
  );
}
