import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ExternalLink, CheckCheck } from 'lucide-react';
import api from '../api/axios';

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');

  const fetchInbox = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data.messages);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchSent = async () => {
    try {
      const res = await api.get('/messages/sent');
      setMessages(res.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'inbox') fetchInbox();
    else fetchSent();
  }, [tab]);

  const markRead = async (id) => {
    try {
      await api.patch(`/messages/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/messages/read-all');
      setMessages(prev => prev.map(m => ({ ...m, read: true })));
    } catch { /* ignore */ }
  };

  const unread = messages.filter(m => !m.read).length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#1A1A1A]">Messages</h1>
          {tab === 'inbox' && unread > 0 && (
            <p className="text-xs text-[#6B7280] mt-0.5">{unread} unread message{unread !== 1 ? 's' : ''}</p>
          )}
        </div>
        {tab === 'inbox' && unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-[#00A693] hover:text-[#007D6F] font-medium transition-colors"
          >
            <CheckCheck size={13} /> Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#F3F0EB] p-1 rounded-xl w-fit">
        {['inbox', 'sent'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              tab === t ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            {t}
            {t === 'inbox' && unread > 0 && (
              <span className="ml-1.5 bg-[#00A693] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#E5E1DA] rounded-xl p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-[#F3F0EB] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#F3F0EB] rounded w-1/3" />
                  <div className="h-3 bg-[#F3F0EB] rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare size={32} className="mx-auto text-[#D1D5DB] mb-3" />
          <p className="text-sm text-[#6B7280]">
            {tab === 'inbox' ? 'No messages yet' : 'You haven\'t sent any messages yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => {
            const person = tab === 'inbox' ? msg.sender : msg.recipient;
            return (
              <div
                key={msg._id}
                onClick={() => tab === 'inbox' && !msg.read && markRead(msg._id)}
                className={`bg-white border rounded-xl p-4 transition-all cursor-default ${
                  tab === 'inbox' && !msg.read
                    ? 'border-[#00A693]/30 bg-[#F0FBF9] hover:border-[#00A693]/50'
                    : 'border-[#E5E1DA] hover:border-[#D1D5DB]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {person?.avatar
                    ? <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-medium shrink-0">
                        {person?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                  }

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm ${tab === 'inbox' && !msg.read ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#1A1A1A]'}`}>
                        {person?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#9CA3AF] shrink-0">{timeAgo(msg.createdAt)}</span>
                    </div>

                    {msg.project && (
                      <Link
                        to={`/project/${msg.project._id}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-[#00A693] hover:underline mb-1.5 font-medium"
                      >
                        <ExternalLink size={10} /> {msg.project.title}
                      </Link>
                    )}

                    <p className={`text-sm leading-relaxed break-words ${tab === 'inbox' && !msg.read ? 'text-[#374151]' : 'text-[#6B7280]'}`}>
                      {msg.text}
                    </p>
                  </div>

                  {tab === 'inbox' && !msg.read && (
                    <span className="w-2 h-2 bg-[#00A693] rounded-full mt-1.5 shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
