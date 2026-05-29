import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, ExternalLink, CheckCheck, CornerDownRight, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 604800) return `${Math.floor(secs / 86400)}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function MessageRow({ msg, onMarkRead, onReplySent, isInbox }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const person = isInbox ? msg.sender : msg.recipient;

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${msg._id}/reply`, { text: replyText });
      toast.success('Reply sent!');
      setReplyText('');
      setReplyOpen(false);
      if (onReplySent) onReplySent();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={`bg-white border rounded-xl transition-all ${
        isInbox && !msg.read
          ? 'border-[#00A693]/30 bg-[#F0FBF9]'
          : 'border-[#E5E1DA]'
      }`}
    >
      {/* Message row */}
      <div
        className="p-4 cursor-default"
        onClick={() => isInbox && !msg.read && onMarkRead(msg._id)}
      >
        <div className="flex items-start gap-3">
          {person?.avatar
            ? <img src={person.avatar} alt={person.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
            : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-medium shrink-0">
                {person?.name?.[0]?.toUpperCase() || '?'}
              </span>
          }

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className={`text-sm ${isInbox && !msg.read ? 'font-semibold text-[#1A1A1A]' : 'font-medium text-[#1A1A1A]'}`}>
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

            <p className={`text-sm leading-relaxed break-words ${isInbox && !msg.read ? 'text-[#374151]' : 'text-[#6B7280]'}`}>
              {msg.text}
            </p>
          </div>

          {isInbox && !msg.read && (
            <span className="w-2 h-2 bg-[#00A693] rounded-full mt-1.5 shrink-0" />
          )}
        </div>

        {/* Reply button */}
        {isInbox && (
          <div className="mt-3 ml-12">
            <button
              onClick={e => { e.stopPropagation(); setReplyOpen(v => !v); }}
              className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                replyOpen ? 'text-[#00A693]' : 'text-[#9CA3AF] hover:text-[#00A693]'
              }`}
            >
              <CornerDownRight size={12} /> Reply
            </button>
          </div>
        )}
      </div>

      {/* Inline reply form */}
      {replyOpen && (
        <div className="px-4 pb-4 ml-12 border-t border-[#F3F0EB] pt-3">
          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder={`Reply to ${person?.name}…`}
              autoFocus
              className="flex-1 px-3.5 py-2 bg-[#FAF9F6] border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || sending}
              className="w-9 h-9 bg-[#00A693] hover:bg-[#007D6F] text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('inbox');

  const fetchMessages = async (t = tab) => {
    setLoading(true);
    try {
      if (t === 'inbox') {
        const res = await api.get('/messages');
        setMessages(res.data.messages);
      } else {
        const res = await api.get('/messages/sent');
        setMessages(res.data);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMessages(tab); }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

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
            {tab === 'inbox' ? 'No messages yet' : "You haven't sent any messages yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map(msg => (
            <MessageRow
              key={msg._id}
              msg={msg}
              isInbox={tab === 'inbox'}
              onMarkRead={markRead}
              onReplySent={() => fetchMessages('sent')}
            />
          ))}
        </div>
      )}
    </div>
  );
}
