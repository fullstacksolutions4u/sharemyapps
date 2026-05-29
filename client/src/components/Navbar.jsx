import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, LayoutDashboard, Plus, ShieldCheck, Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const typeIcon = {
  approved: <CheckCircle size={14} className="text-green-500 shrink-0" />,
  rejected: <XCircle size={14} className="text-red-500 shrink-0" />,
  resubmit: <Clock size={14} className="text-yellow-500 shrink-0" />,
};

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnread(res.data.unreadCount);
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(v => !v); if (!open) fetchNotifications(); }}
        className="relative p-1.5 text-[#6B7280] hover:text-[#1A1A1A] transition-colors"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E1DA] rounded-2xl shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E1DA]">
            <span className="text-sm font-semibold text-[#1A1A1A]">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-[#00A693] hover:text-[#007D6F] font-medium transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F3F0EB]">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-[#6B7280]">No notifications yet</div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  onClick={() => { if (!n.read) markRead(n._id); }}
                  className={`px-4 py-3 flex items-start gap-3 cursor-pointer hover:bg-[#FAF9F6] transition-colors ${!n.read ? 'bg-[#F0FBF9]' : ''}`}
                >
                  <div className="mt-0.5">{typeIcon[n.type] || <Bell size={14} className="text-[#6B7280] shrink-0" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!n.read ? 'font-semibold text-[#1A1A1A]' : 'text-[#1A1A1A]'}`}>{n.title}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5 leading-snug">{n.message}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-[#00A693] rounded-full mt-1.5 shrink-0" />}
                </div>
              ))
            )}
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

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/');
    setDropOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E1DA]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="FindMyApp" className="h-8 w-auto" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/explore" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">All Apps</Link>
          <Link to="/explore?category=web" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Web Applications</Link>
          <Link to="/explore?category=mobile" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Mobile Applications</Link>
          {user && (
            <Link to="/dashboard" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">My Projects</Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* User dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropOpen(v => !v)}
                  className="flex items-center gap-2 text-sm text-[#1A1A1A] hover:text-[#00A693] transition-colors"
                >
                  {user.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    : <span className="w-7 h-7 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium">{user.name[0].toUpperCase()}</span>
                  }
                  <span>{user.name.split(' ')[0]}</span>
                  <ChevronDown size={14} />
                </button>
                {dropOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#E5E1DA] rounded-xl shadow-lg py-1 z-50">
                    <Link to="/dashboard" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FAF9F6]">
                      <LayoutDashboard size={14} /> Dashboard
                    </Link>
                    <Link to="/dashboard/add" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A1A] hover:bg-[#FAF9F6]">
                      <Plus size={14} /> Add Project
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" onClick={() => setDropOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-[#00A693] hover:bg-[#FAF9F6]">
                        <ShieldCheck size={14} /> Admin Panel
                      </Link>
                    )}
                    <hr className="my-1 border-[#E5E1DA]" />
                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-[#FAF9F6]">
                      <LogOut size={14} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm text-[#6B7280] hover:text-[#1A1A1A] transition-colors">Sign in</Link>
              <Link to="/register" className="text-sm bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-lg transition-colors font-medium">
                Get started
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile toggle */}
        <div className="md:hidden flex items-center gap-2">
          {user && <NotificationBell />}
          <button className="text-[#6B7280]" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E1DA] px-4 py-4 space-y-3">
          <Link to="/explore" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280] hover:text-[#1A1A1A]">All Apps</Link>
          <Link to="/explore?category=web" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280] hover:text-[#1A1A1A]">Web Applications</Link>
          <Link to="/explore?category=mobile" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280] hover:text-[#1A1A1A]">Mobile Applications</Link>
          {user ? (
            <>
              <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280] hover:text-[#1A1A1A]">My Projects</Link>
              <Link to="/dashboard/add" onClick={() => setMenuOpen(false)} className="block text-sm text-[#1A1A1A]">Add Project</Link>
              <button onClick={handleLogout} className="block text-sm text-red-500">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-sm text-[#6B7280]">Sign in</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="block text-sm bg-[#00A693] text-white px-4 py-2 rounded-lg text-center">Get started</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
