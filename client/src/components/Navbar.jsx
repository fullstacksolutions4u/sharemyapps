import { useRef, useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, ShieldCheck, Bell, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Heart, Star, MessageCircle, Briefcase, LayoutDashboard, GraduationCap, Crown, ChevronRight } from 'lucide-react';
import { progressAPI } from '../api/tick2test';

const GeminiIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 28C14 26.0633 13.6267 24.2433 12.88 22.54C12.1567 20.8367 11.165 19.355 9.905 18.095C8.645 16.835 7.1633 15.8433 5.46 15.12C3.7567 14.3733 1.9367 14 0 14C1.9367 14 3.7567 13.6383 5.46 12.915C7.1633 12.1683 8.645 11.165 9.905 9.905C11.165 8.645 12.1567 7.1633 12.88 5.46C13.6267 3.7567 14 1.9367 14 0C14 1.9367 14.3617 3.7567 15.085 5.46C15.8317 7.1633 16.835 8.645 18.095 9.905C19.355 11.165 20.8367 12.1683 22.54 12.915C24.2433 13.6383 26.0633 14 28 14C26.0633 14 24.2433 14.3733 22.54 15.12C20.8367 15.8433 19.355 16.835 18.095 18.095C16.835 19.355 15.8317 20.8367 15.085 22.54C14.3617 24.2433 14 26.0633 14 28Z" fill="url(#gemini-gradient)"/>
    <defs>
      <linearGradient id="gemini-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4F8EF7"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
  </svg>
);
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import { optimizeImage } from '../utils/image';

const typeIcon = {
  approved:      <CheckCircle size={14} className="text-green-500 shrink-0" />,
  rejected:      <XCircle size={14} className="text-red-500 shrink-0" />,
  resubmit:      <Clock size={14} className="text-yellow-500 shrink-0" />,
  like:          <Heart size={14} className="text-pink-500 shrink-0" />,
  rated:         <Star size={14} className="text-amber-400 shrink-0" />,
  commented:     <MessageCircle size={14} className="text-blue-400 shrink-0" />,
  vacancy_reply: <Briefcase size={14} className="text-accent shrink-0" />,
  job_alert:     <Briefcase size={14} className="text-emerald-500 shrink-0" />,
};



function ServicesMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative inline-flex items-center gap-1 text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full"
      >
        <Crown size={15} className="text-amber-500 shrink-0" />
        <span className="whitespace-nowrap">Premium Services</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
          <Link
            to="/placement-services"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
          >
            <Briefcase size={15} className="text-accent shrink-0" /> Job Assistance Services
          </Link>
          <Link
            to="/mentorship-program"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-bg transition-colors"
          >
            <GraduationCap size={15} className="text-accent shrink-0" /> Mentorship Program
          </Link>
        </div>
      )}
    </div>
  );
}

/* ── User dropdown with embedded notifications + messages ── */
function UserDropdown({ user, onLogout }) {
  const { user: authUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState(null); // null | 'notifications' | 'messages'
  const ref = useRef();

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await progressAPI.getLeaderboard();
      return res.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000,
    enabled: !!user,
  });
  const userRank = leaderboardData?.userRank;

  /* ── notifications ── */
  const devLinks = [authUser?.linkedinUrl, authUser?.githubUrl, authUser?.leetcodeUrl, authUser?.portfolioUrl];
  const showProfileWarning = authUser?.userType === 'developer' && devLinks.filter(Boolean).length < 2;

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const res = await api.get('/notifications'); return res.data; },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    enabled: !!user,
  });
  const notifications = notifData?.notifications || [];
  const unreadNotif = (notifData?.unreadCount || 0) + (showProfileWarning ? 1 : 0);

  /* ── messages ── */
  const { data: msgData } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => { const res = await api.get('/messages'); return res.data; },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
    enabled: !!user,
  });
  const unreadMsg = msgData?.unreadCount || 0;

  const totalUnread = unreadNotif + unreadMsg;

  /* ── mark helpers ── */
  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      queryClient.setQueryData(['notifications'], prev => ({
        ...prev,
        notifications: prev.notifications.map(x => ({ ...x, read: true })),
        unreadCount: 0,
      }));
    } catch { /* silently ignore */ }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      queryClient.setQueryData(['notifications'], prev => ({
        ...prev,
        notifications: prev.notifications.map(x => x._id === id ? { ...x, read: true } : x),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch { /* silently ignore */ }
  };

  /* ── close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSection(null); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const close = () => { setOpen(false); setSection(null); };

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(v => !v); if (open) setSection(null); }}
        className="relative flex items-center gap-2.5 text-sm text-text hover:text-accent transition-colors text-left font-medium"
      >
        {user.avatar
          ? <img src={optimizeImage(user.avatar, 150)} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
          : <span className="w-8 h-8 rounded-full bg-accent text-white text-xs flex items-center justify-center font-medium">{user.name[0].toUpperCase()}</span>
        }
        <div className="flex flex-col items-start leading-tight">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800 hover:text-accent">{user.name.split(' ')[0]}</span>
            <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </div>
          {userRank && (
            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
              🏆 #{userRank}
            </span>
          )}
        </div>

        {/* combined unread badge on username */}
        {totalUnread > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50">

          {/* ── Main menu ── */}
          {section === null && (
            <>
              {user.role !== 'admin' && (
                <Link
                  to="/dashboard"
                  onClick={close}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-text hover:bg-bg transition-colors"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin" onClick={close} className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-accent hover:bg-bg transition-colors">
                  <ShieldCheck size={14} /> Admin Panel
                </Link>
              )}

              <div className="border-t border-[#F3F0EB]" />

              {/* Notifications row */}
              <button
                onClick={() => setSection('notifications')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-text hover:bg-bg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Bell size={14} className="text-muted" />
                  Notifications
                  {unreadNotif > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none">
                      {unreadNotif > 9 ? '9+' : unreadNotif}
                    </span>
                  )}
                </span>
                <ChevronRight size={13} className="text-muted" />
              </button>

              {/* Messages row */}
              <button
                onClick={() => setSection('messages')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold text-text hover:bg-bg transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-muted" />
                  Messages
                  {unreadMsg > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none">
                      {unreadMsg > 9 ? '9+' : unreadMsg}
                    </span>
                  )}
                </span>
                <ChevronRight size={13} className="text-muted" />
              </button>

              <div className="border-t border-[#F3F0EB]" />
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-bg transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </>
          )}

          {/* ── Notifications panel ── */}
          {section === 'notifications' && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <button onClick={() => setSection(null)} className="text-muted hover:text-text transition-colors">
                  <ChevronDown size={15} className="rotate-90" />
                </button>
                <span className="text-sm font-semibold text-text flex-1">Notifications</span>
                {(notifData?.unreadCount || 0) > 0 && (
                  <button onClick={markAllRead} className="text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#F3F0EB]">
                {showProfileWarning && (
                  <Link
                    to="/profile"
                    onClick={close}
                    className="px-4 py-3 flex items-start gap-3 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-amber-800 leading-snug">Complete your profile</p>
                    </div>
                    <span className="w-2 h-2 bg-amber-400 rounded-full mt-1.5 shrink-0" />
                  </Link>
                )}
                {notifications.length === 0 && !showProfileWarning ? (
                  <div className="px-4 py-8 text-center text-sm text-muted">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n._id}
                      onClick={() => {
                        if (!n.read) markRead(n._id);
                        if (n.type === 'job_alert') { close(); navigate('/dashboard/job-alerts'); }
                      }}
                      className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-bg transition-colors ${!n.read ? 'bg-[#F0FBF9]' : ''}`}
                    >
                      <div className="mt-0.5">{typeIcon[n.type] || <Bell size={14} className="text-muted shrink-0" />}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-text' : 'text-text'}`}>{n.title}</p>
                        <p className="text-xs text-muted mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                        <p className="text-xs text-[#9CA3AF] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
                    </div>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-border">
                <Link
                  to="/dashboard/inbox"
                  state={{ tab: 'notifications' }}
                  onClick={close}
                  className="block text-center text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  View all notifications
                </Link>
              </div>
            </>
          )}

          {/* ── Messages panel ── */}
          {section === 'messages' && (
            <>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <button onClick={() => setSection(null)} className="text-muted hover:text-text transition-colors">
                  <ChevronDown size={15} className="rotate-90" />
                </button>
                <span className="text-sm font-semibold text-text flex-1">Messages</span>
                {unreadMsg > 0 && (
                  <span className="min-w-[18px] h-[18px] px-1 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full leading-none">
                    {unreadMsg > 9 ? '9+' : unreadMsg}
                  </span>
                )}
              </div>

              <div className="px-4 py-8 text-center text-sm text-muted">
                <MessageSquare size={28} className="mx-auto mb-2 text-[#D1D5DB]" />
                <p>Open inbox to read messages</p>
              </div>

              <div className="px-4 py-2.5 border-t border-border">
                <Link
                  to="/dashboard/inbox"
                  state={{ tab: 'messages' }}
                  onClick={close}
                  className="block text-center text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  Open inbox →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const isRecruiter = user?.userType === 'recruiter';
  const isClient    = user?.userType === 'client';
  const isMentee    = user?.userType === 'mentee';
  const isMentor    = user?.userType === 'mentor';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8 lg:gap-16">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="ShareMyApps" className="h-8 w-auto" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-lg leading-none">
              <span className="text-blue-500">Share</span>
              <span className="text-accent">My</span>
              <span className="text-violet-600">Apps</span>
            </span>
            <span style={{ fontFamily: "'Caveat', cursive" }} className="text-sm leading-none text-pink-500">where developers meet opportunity</span>
          </div>
        </Link>

        {/* Desktop Nav + Action buttons grouped together */}
        <div className="hidden md:flex items-center gap-6 lg:gap-10 flex-nowrap shrink-0">
          <nav className="flex items-center gap-5 lg:gap-8 xl:gap-10 flex-nowrap shrink-0">
            <Link to="/feed" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Timeline</Link>
            <Link to="/explore" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Projects</Link>
            <Link to="/portfolios" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">
              Portfolios
            </Link>
            {isClient && (
              <Link to="/freelance-developers" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Freelance Developers</Link>
            )}
            {isRecruiter && (
              <Link to="/find-developers" className="relative inline-flex items-center gap-1.5 text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">
                AI Talent Search
                <GeminiIcon size={14} />
              </Link>
            )}
            {isRecruiter && (
              <Link to="/find-developers/history" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Developers Directory</Link>
            )}
            {isRecruiter && (
              <Link to="/post-vacancy" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Post Vacancy</Link>
            )}
            {isMentee && (
              <Link to="/mentors" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Mentors</Link>
            )}
            {!isRecruiter && !isClient && !isMentee && !isMentor && (
              <>
                <Link to="/opportunities" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Opportunities</Link>
                <Link to="/community-blog" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Community Blog</Link>
                <Link to="/quiz-zone" className="relative text-base font-bold text-muted hover:text-text transition-colors whitespace-nowrap shrink-0 after:absolute after:left-0 after:-bottom-0.5 after:h-[1.5px] after:w-0 after:bg-accent after:transition-[width] after:duration-300 hover:after:w-full">Quiz Zone</Link>
                <ServicesMenu />
              </>
            )}
          </nav>

          {/* Action buttons / User profile area (fixed width ensures menus stay in exact same position after login) */}
          {user ? (
            <div className="flex items-center justify-start w-[232px] shrink-0">
              <UserDropdown user={user} onLogout={handleLogout} />
            </div>
          ) : (
            <div className="flex items-center justify-start w-[232px] shrink-0">
              <Link to="/login" className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors font-medium whitespace-nowrap">
                Join Now
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user && <UserDropdown user={user} onLogout={handleLogout} />}
          <button className="text-muted" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-4 space-y-3">
          <Link to="/feed" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Timeline</Link>
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Projects</Link>
          <Link to="/portfolios" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">
            Portfolios
          </Link>
          {isClient && (
            <Link to="/freelance-developers" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Freelance Developers</Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers" onClick={() => setMenuOpen(false)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text">
              AI Talent Search
              <GeminiIcon size={14} />
            </Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers/history" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Developers Directory</Link>
          )}
          {isRecruiter && (
            <Link to="/post-vacancy" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Post Vacancy</Link>
          )}
          {isMentee && (
            <Link to="/mentors" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Mentors</Link>
          )}
          {!isRecruiter && !isClient && !isMentee && !isMentor && (
            <>
              <Link to="/opportunities" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Opportunities</Link>
              <Link to="/community-blog" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Community Blog</Link>
              <Link to="/quiz-zone" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Quiz Zone</Link>
              <Link to="/placement-services" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Job Assistance Services</Link>
              <Link to="/mentorship-program" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Mentorship Program</Link>
            </>
          )}
          {user ? (
            <>
              {user.role !== 'admin' && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text font-medium">Dashboard</Link>
              )}
              <Link to="/dashboard/inbox" state={{ tab: 'messages' }} onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Inbox</Link>

              <button onClick={handleLogout} className="block text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm bg-accent text-white px-4 py-2 rounded-lg text-center font-medium">Join Now</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
