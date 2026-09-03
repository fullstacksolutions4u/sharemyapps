import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, Menu, LogOut,
  Users, Briefcase, MessageSquare, Camera, IndianRupee, Crown, BookOpen, Unlock, Building2, Link as LinkIcon
} from 'lucide-react';
import api from '../api/axios';
import AdminOverview from './admin/AdminOverview';
import AdminProjectsSection from './admin/AdminProjectsSection';
import AdminUsersSection from './admin/AdminUsersSection';
import AdminCommunicationsWrapperSection from './admin/AdminCommunicationsWrapperSection';
import AdminOpportunitiesSection from './admin/AdminOpportunitiesSection';
import AdminResumesSection from './admin/AdminResumesSection';
import AdminVacanciesSection from './admin/AdminVacanciesSection';
import AdminLearningSection from './admin/AdminLearningSection';
import AdminPlansSection from './admin/AdminPlansSection';
import AdminApplicantsWrapperSection from './admin/AdminApplicantsWrapperSection';
import AdminServicesWrapperSection from './admin/AdminServicesWrapperSection';
import AdminAdvancedUsersFilterSection from './admin/AdminAdvancedUsersFilterSection';
import AdminJobLinksSection from './admin/AdminJobLinksSection';
import AdminCurationSection from './admin/AdminCurationSection';
import AdminCommunitySection from './admin/AdminCommunitySection';
import AdminPaymentsSection from './admin/AdminPaymentsSection';
import { optimizeImage } from '../utils/image';

const NAV = [
  { key: 'overview',       label: 'Overview',        icon: LayoutDashboard },
  { key: 'projects',       label: 'Projects',         icon: FolderOpen },
  { key: 'users',          label: 'Users',            icon: Users },
  { key: 'companies',      label: 'Companies',        icon: Building2 },
  { key: 'job_links',      label: 'Job Links',        icon: LinkIcon },
  { key: 'opportunities',  label: 'Opportunities',    icon: Briefcase },
  { key: 'curation',       label: 'Interview Screening', icon: Briefcase },
  { key: 'applicants',      label: 'Applicants',        icon: Crown },
  { key: 'service_access', label: 'Services',           icon: Unlock },
  { key: 'plans_payments',  label: 'Plans & Payments',  icon: IndianRupee },
  { key: 'payments',       label: 'Received Payments', icon: IndianRupee },
  { key: 'communications', label: 'Communications',   icon: MessageSquare },
  { key: 'learning',       label: 'Quiz Zone',        icon: BookOpen },
  { key: 'community',      label: 'Community Feed',   icon: MessageSquare },
];

export default function AdminPanel() {
  const [section, setSection] = useState('job_links');
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.put('/auth/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(res.data.user);
    } catch { /* ignore */ }
    setAvatarUploading(false);
    e.target.value = '';
  };

  useEffect(() => {
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    api.get('/messages').then(res => setUnreadMessages(res.data.unreadCount)).catch(() => {});

    const handleDecrement = () => {
      setStats(prev => prev ? { ...prev, pendingVacancies: Math.max(0, prev.pendingVacancies - 1) } : null);
    };
    const handleDecrementApplicants = () => {
      setStats(prev => prev ? { ...prev, pendingApplicants: Math.max(0, prev.pendingApplicants - 1) } : null);
    };
    const handleIncrementApplicants = () => {
      setStats(prev => prev ? { ...prev, pendingApplicants: (prev.pendingApplicants || 0) + 1 } : null);
    };

    window.addEventListener('decrementPendingVacancies', handleDecrement);
    window.addEventListener('decrementPendingApplicants', handleDecrementApplicants);
    window.addEventListener('incrementPendingApplicants', handleIncrementApplicants);

    return () => {
      window.removeEventListener('decrementPendingVacancies', handleDecrement);
      window.removeEventListener('decrementPendingApplicants', handleDecrementApplicants);
      window.removeEventListener('incrementPendingApplicants', handleIncrementApplicants);
    };
  }, []);

  const navigate = (key) => { setSection(key); setMobileOpen(false); };

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-bg">

      {/* ── Sidebar ── */}
      <aside className={`
        w-56 shrink-0 bg-white border-r border-border flex flex-col
        absolute inset-y-0 left-0 z-30 transition-transform duration-200
        lg:static lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => navigate(key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${section === key ? 'bg-accent-light text-accent' : 'text-muted hover:bg-[#F3F0EB] hover:text-text'}`}
            >
              <Icon size={15} />
              {label}
              {key === 'projects' && stats?.pending > 0 && (
                <span className="ml-auto bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{stats.pending}</span>
              )}
              {key === 'communications' && unreadMessages > 0 && (
                <span className="ml-auto bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
              )}
              {key === 'opportunities' && stats?.pendingVacancies > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{stats.pendingVacancies}</span>
              )}
              {key === 'applicants' && stats?.pendingApplicants > 0 && (
                <span className="ml-auto bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{stats.pendingApplicants}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-border shrink-0">
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <div className="relative shrink-0">
                {user?.avatar
                  ? <img src={optimizeImage(user.avatar, 150)} alt="Admin" className="w-7 h-7 rounded-full object-cover" />
                  : <span className="w-7 h-7 rounded-full bg-accent text-white text-xs flex items-center justify-center font-bold">{user?.name?.[0]?.toUpperCase() || 'A'}</span>
                }
                {avatarUploading
                  ? <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /></span>
                  : <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center border border-border"><Camera size={8} className="text-muted" /></span>
                }
              </div>
              <span className="truncate text-sm font-medium text-muted">{avatarUploading ? 'Uploading…' : (user?.name || 'Admin')}</span>
            </button>
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

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden h-12 flex items-center gap-3 px-4 bg-white border-b border-border shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-muted hover:text-text transition-colors">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-text">{NAV.find(n => n.key === section)?.label || section}</span>
        </div>

        <div className={`flex-1 overflow-y-auto px-6 py-8 ${section === 'ai' ? 'flex flex-col' : ''}`}>
          {section === 'overview'         && <AdminOverview stats={stats} onNavigate={navigate} />}
          {section === 'projects'         && <AdminProjectsSection stats={stats} />}
          {section === 'users'            && <AdminUsersSection initialTab="developers" />}
          {section === 'companies'        && <AdminAdvancedUsersFilterSection />}
          {section === 'vacancies'        && <AdminVacanciesSection />}
          {section === 'opportunities'    && <AdminOpportunitiesSection stats={stats} />}
          {section === 'resumes'          && <AdminResumesSection />}
          {section === 'communications'   && <AdminCommunicationsWrapperSection onUnreadChange={setUnreadMessages} />}
          {section === 'plans_payments'    && <AdminPlansSection />}
          {section === 'payments'         && <AdminPaymentsSection />}
          {section === 'applicants'       && <AdminApplicantsWrapperSection />}
          { section === 'service_access'   && <AdminServicesWrapperSection /> }
          { section === 'job_links'        && <AdminJobLinksSection /> }
          {section === 'learning'         && <AdminLearningSection />}
          {section === 'curation'         && <AdminCurationSection />}
          {section === 'community'        && <AdminCommunitySection />}
        </div>
      </div>
    </div>
  );
}
