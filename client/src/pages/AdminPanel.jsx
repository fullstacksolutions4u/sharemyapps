import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FolderOpen, ShieldCheck, ChevronDown, Menu, LogOut,
  Code2, Building2, Handshake, GraduationCap, Briefcase, FileText, Megaphone, MessageSquare,
} from 'lucide-react';
import api from '../api/axios';
import AdminOverview from './admin/AdminOverview';
import AdminProjectsSection from './admin/AdminProjectsSection';
import AdminUsersSection from './admin/AdminUsersSection';
import AdminAnnouncementsSection from './admin/AdminAnnouncementsSection';
import AdminMessagesSection from './admin/AdminMessagesSection';
import AdminVacanciesSection from './admin/AdminVacanciesSection';
import AdminResumesSection from './admin/AdminResumesSection';

const NAV = [
  { key: 'overview',         label: 'Overview',       icon: LayoutDashboard },
  { key: 'projects',         label: 'Projects',        icon: FolderOpen },
  { key: 'users_developers', label: 'Developers',      icon: Code2,         group: 'Users' },
  { key: 'users_recruiters', label: 'Recruiters',      icon: Building2,     group: 'Users' },
  { key: 'users_clients',    label: 'Clients',         icon: Handshake,     group: 'Users' },
  { key: 'users_mentees',    label: 'Mentees',         icon: GraduationCap, group: 'Users' },
  { key: 'vacancies',        label: 'Vacancies',       icon: Briefcase },
  { key: 'resumes',          label: 'Resumes',         icon: FileText },
  { key: 'announcements',    label: 'Announcements',   icon: Megaphone },
  { key: 'messages',         label: 'Messages',        icon: MessageSquare },
];

export default function AdminPanel() {
  const [section, setSection] = useState('overview');
  const [stats, setStats] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [usersOpen, setUsersOpen] = useState(true);
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
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#E5E1DA] shrink-0">
          <div className="w-7 h-7 bg-[#E6F7F5] rounded-lg flex items-center justify-center">
            <ShieldCheck size={14} className="text-[#00A693]" />
          </div>
          <span className="font-semibold text-sm text-[#1A1A1A]">Admin Panel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ key, label, icon: Icon, group }, i) => {
            const isFirstInGroup = group && !NAV[i - 1]?.group;
            if (group && !usersOpen && !isFirstInGroup) return null;
            return (
              <div key={key}>
                {isFirstInGroup && (
                  <button
                    onClick={() => setUsersOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 pt-3 pb-1.5 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-widest hover:text-[#6B7280] transition-colors"
                  >
                    <span>{group}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${usersOpen ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                )}
                {(!group || usersOpen) && (
                  <button
                    onClick={() => navigate(key)}
                    className={`w-full flex items-center gap-2.5 rounded-xl text-sm font-medium transition-colors text-left ${group ? 'px-3 py-2' : 'px-3 py-2.5'} ${section === key ? 'bg-[#E6F7F5] text-[#00A693]' : 'text-[#6B7280] hover:bg-[#F3F0EB] hover:text-[#1A1A1A]'}`}
                  >
                    {group && <span className="w-1 shrink-0" />}
                    <Icon size={group ? 13 : 15} />
                    {label}
                    {key === 'projects' && stats?.pending > 0 && (
                      <span className="ml-auto bg-yellow-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{stats.pending}</span>
                    )}
                    {key === 'messages' && unreadMessages > 0 && (
                      <span className="ml-auto bg-accent text-white text-xs w-5 h-5 flex items-center justify-center rounded-full leading-none shrink-0">{unreadMessages > 9 ? '9+' : unreadMessages}</span>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-[#E5E1DA] shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="lg:hidden h-12 flex items-center gap-3 px-4 bg-white border-b border-[#E5E1DA] shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-1.5 text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
            <Menu size={18} />
          </button>
          <span className="text-sm font-semibold text-[#1A1A1A]">{NAV.find(n => n.key === section)?.label || section}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-8">
          {section === 'overview'         && <AdminOverview stats={stats} onNavigate={navigate} />}
          {section === 'projects'         && <AdminProjectsSection stats={stats} />}
          {section === 'users_developers' && <AdminUsersSection initialTab="developers" />}
          {section === 'users_recruiters' && <AdminUsersSection initialTab="recruiters" />}
          {section === 'users_clients'    && <AdminUsersSection initialTab="clients" />}
          {section === 'users_mentees'    && <AdminUsersSection initialTab="mentees" />}
          {section === 'vacancies'        && <AdminVacanciesSection />}
          {section === 'resumes'          && <AdminResumesSection />}
          {section === 'announcements'    && <AdminAnnouncementsSection />}
          {section === 'messages'         && <AdminMessagesSection onUnreadChange={setUnreadMessages} />}
        </div>
      </div>
    </div>
  );
}
