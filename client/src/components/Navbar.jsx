import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, Plus, ShieldCheck, Bell, CheckCircle, XCircle, Clock, MessageSquare, UserCircle, AlertCircle, Heart, Star, MessageCircle, Headphones, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const typeIcon = {
  approved:  <CheckCircle size={14} className="text-green-500 shrink-0" />,
  rejected:  <XCircle size={14} className="text-red-500 shrink-0" />,
  resubmit:  <Clock size={14} className="text-yellow-500 shrink-0" />,
  like:      <Heart size={14} className="text-pink-500 shrink-0" />,
  rated:     <Star size={14} className="text-amber-400 shrink-0" />,
  commented:     <MessageCircle size={14} className="text-blue-400 shrink-0" />,
  vacancy_reply: <Briefcase size={14} className="text-accent shrink-0" />,
};

function MessagesBadge() {
  const { data } = useQuery({
    queryKey: ['messages'],
    queryFn: async () => { const res = await api.get('/messages'); return res.data; },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
  });
  const unread = data?.unreadCount || 0;

  return (
    <Link to="/messages" className="relative p-1.5 text-muted hover:text-text transition-colors">
      <MessageSquare size={18} />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent text-white text-[10px] font-bold flex items-center justify-center rounded-full">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  const devLinks = [user?.linkedinUrl, user?.githubUrl, user?.leetcodeUrl, user?.portfolioUrl];
  const showProfileWarning = user?.userType === 'developer' && devLinks.filter(Boolean).length < 2;

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => { const res = await api.get('/notifications'); return res.data; },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 30,
    refetchIntervalInBackground: false,
  });

  const notifications = data?.notifications || [];
  const unread = data?.unreadCount || 0;

  const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
  if (open) document.addEventListener('mousedown', handleClickOutside, { once: true });

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

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-1.5 text-muted hover:text-text transition-colors"
      >
        <Bell size={18} />
        {(unread + (showProfileWarning ? 1 : 0)) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {(unread + (showProfileWarning ? 1 : 0)) > 9 ? '9+' : (unread + (showProfileWarning ? 1 : 0))}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-semibold text-text">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#F3F0EB]">
            {showProfileWarning && (
              <Link
                to="/profile"
                onClick={() => setOpen(false)}
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
                  onClick={() => { if (!n.read) markRead(n._id); }}
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
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-accent hover:text-accent-hover font-medium transition-colors"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  const isDeveloper = user?.userType === 'developer';
  const isRecruiter = user?.userType === 'recruiter';
  const isClient = user?.userType === 'client';
  const isMentee = user?.userType === 'mentee';
  const profileLink = (isRecruiter || isClient) ? '/client-profile' : '/profile';

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setDropOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="w-full pl-7.5 pr-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="ShareMyApps" className="h-8 w-auto" />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-bold text-lg leading-none">
              <span className="text-blue-500">Share</span>
              <span className="text-accent">My</span>
              <span className="text-violet-600">Apps</span>
            </span>
            <span style={{ fontFamily: "'Caveat', cursive" }} className="text-sm leading-none text-orange-500">project based hiring platform</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 mr-48">
          <Link to="/explore" className="text-base text-muted hover:text-text transition-colors">Web & Mobile Applications</Link>
          <Link to="/developers" className="text-base text-muted hover:text-text transition-colors">
            {isRecruiter ? 'Our Developers' : 'Developers'}
          </Link>
          {isClient && (
            <Link to="/freelance-developers" className="text-base text-muted hover:text-text transition-colors">Freelance Developers</Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers" className="text-base text-muted hover:text-text transition-colors">Find Developers</Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers/history" className="text-base text-muted hover:text-text transition-colors">Shortlisted Candidates</Link>
          )}
          {isMentee && (
            <Link to="/mentors" className="text-base text-muted hover:text-text transition-colors">Mentors</Link>
          )}
          {!isRecruiter && !isClient && !isMentee && (
            <Link to="/vacancies" className="text-base text-muted hover:text-text transition-colors">Vacancies</Link>
          )}
          {isDeveloper && (
            <Link to="/dashboard" className="text-base text-muted hover:text-text transition-colors">My Projects</Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              {isDeveloper && (
                <Link
                  to="/dashboard/add"
                  className="flex items-center gap-1.5 text-sm bg-accent hover:bg-accent-hover text-white px-3.5 py-2 rounded-lg font-medium transition-colors"
                >
                  <Plus size={14} /> Add Projects
                </Link>
              )}

              <MessagesBadge />
              <NotificationBell />

              <div className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 text-sm text-text hover:text-accent transition-colors"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    : <span className="w-7 h-7 rounded-full bg-accent text-white text-xs flex items-center justify-center font-medium">{user.name[0].toUpperCase()}</span>
                  }
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-border rounded-xl shadow-lg py-1 z-50">
                    <Link
                      to={profileLink}
                      onClick={() => setDropOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-bg"
                    >
                      <UserCircle size={14} /> Profile
                    </Link>
                    {user.role !== 'admin' && (
                      <Link
                        to="/chat-admin"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-text hover:bg-bg"
                      >
                        <Headphones size={14} /> Message Admin
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-accent hover:bg-bg">
                        <ShieldCheck size={14} /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-[#F3F0EB] my-1" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-bg">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-muted hover:text-text transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg transition-colors font-medium">
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell />}
          <button className="text-muted" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-border px-4 py-4 space-y-3">
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Web & Mobile Applications</Link>
          <Link to="/developers" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">
            {isRecruiter ? 'Our Developers' : 'Developers'}
          </Link>
          {isClient && (
            <Link to="/freelance-developers" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Freelance Developers</Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Find Developers</Link>
          )}
          {isRecruiter && (
            <Link to="/find-developers/history" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Shortlisted Candidates</Link>
          )}
          {isMentee && (
            <Link to="/mentors" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Mentors</Link>
          )}
          {!isRecruiter && !isClient && !isMentee && (
            <Link to="/vacancies" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Vacancies</Link>
          )}
          {user ? (
            <>
              {isDeveloper && (
                <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">My Projects</Link>
              )}
              <Link to="/messages" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Messages</Link>
              {isDeveloper && (
                <Link to="/dashboard/add" onClick={() => setMenuOpen(false)} className="block text-sm text-text">Add Projects</Link>
              )}
              {user.role !== 'admin' && (
                <Link to="/chat-admin" onClick={() => setMenuOpen(false)} className="block text-sm text-muted hover:text-text">Message Admin</Link>
              )}
              <button onClick={handleLogout} className="block text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-muted">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-sm bg-accent text-white px-4 py-2 rounded-lg text-center">Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
