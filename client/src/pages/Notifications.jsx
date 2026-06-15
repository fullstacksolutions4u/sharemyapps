import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Bell, CheckCheck, Heart, Star, MessageCircle, AlertTriangle, FileText, Briefcase, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const typeIcon = {
  approved:  <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />,
  rejected:  <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />,
  resubmit:  <Clock size={18} className="text-yellow-500 shrink-0 mt-0.5" />,
  like:      <Heart size={18} className="text-pink-500 shrink-0 mt-0.5" />,
  rated:     <Star size={18} className="text-amber-400 shrink-0 mt-0.5" />,
  commented:     <MessageCircle size={18} className="text-blue-400 shrink-0 mt-0.5" />,
  vacancy_reply:       <Briefcase size={18} className="text-accent shrink-0 mt-0.5" />,
  collaborator_added:  <Users size={18} className="text-violet-500 shrink-0 mt-0.5" />,
  recruiter_visit:     <Bell size={18} className="text-indigo-500 shrink-0 mt-0.5" />,
};

const typeBadge = {
  approved:  'bg-green-50 text-green-700 border-green-200',
  rejected:  'bg-red-50 text-red-700 border-red-200',
  resubmit:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  like:      'bg-pink-50 text-pink-700 border-pink-200',
  rated:     'bg-amber-50 text-amber-700 border-amber-200',
  commented:     'bg-blue-50 text-blue-700 border-blue-200',
  vacancy_reply:       'bg-accent-light text-accent border-accent/20',
  collaborator_added:  'bg-violet-50 text-violet-700 border-violet-200',
  recruiter_visit:     'bg-indigo-50 text-indigo-700 border-indigo-200',
};

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, read: true })));
    } catch { /* ignore */ }
  };

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-[#6B7280] mt-0.5">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-sm text-[#00A693] hover:text-[#007D6F] font-medium transition-colors"
          >
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {user?.userType !== 'client' && !user?.cvUrl && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">Your CV / Resume is missing</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Upload your CV as a PDF to Google Drive and add the link to your profile so recruiters and clients can view it.
            </p>
          </div>
          <Link
            to="/profile"
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            <FileText size={12} /> Add CV
          </Link>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E1DA] rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-[#F3F0EB] rounded w-1/3 mb-3" />
              <div className="h-3 bg-[#F3F0EB] rounded w-full mb-2" />
              <div className="h-3 bg-[#F3F0EB] rounded w-4/5" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <div
              key={n._id}
              onClick={() => !n.read && markRead(n._id)}
              className={`bg-white border rounded-2xl p-5 transition-all cursor-default ${
                !n.read ? 'border-[#00A693]/30 bg-[#F0FBF9]' : 'border-[#E5E1DA]'
              }`}
            >
              <div className="flex items-start gap-3">
                {typeIcon[n.type] || <Bell size={18} className="text-[#6B7280] shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-sm font-semibold ${!n.read ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'}`}>
                      {n.title}
                    </span>
                    {n.type && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${typeBadge[n.type] || ''}`}>
                        {n.type === 'vacancy_reply' ? 'vacancy' : n.type === 'collaborator_added' ? 'collaborator' : n.type === 'recruiter_visit' ? 'recruiter' : n.type}
                      </span>
                    )}
                    {!n.read && <span className="w-2 h-2 bg-[#00A693] rounded-full shrink-0" />}
                  </div>
                  <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap">{n.message}</p>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    {n.type === 'recruiter_visit'
                      ? new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                      : timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
