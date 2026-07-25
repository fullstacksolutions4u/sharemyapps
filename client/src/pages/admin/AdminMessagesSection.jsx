import { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, CornerDownRight, Send } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';

export default function AdminMessagesSection({ onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/messages');
      setMessages(res.data.messages);
      if (onUnreadChange) onUnreadChange(res.data.unreadCount);
    } catch { toast.error('Failed to load messages'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    api.get('/messages')
      .then(res => {
        setMessages(res.data.messages);
        if (onUnreadChange) onUnreadChange(res.data.unreadCount);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load messages');
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    try {
      await api.patch(`/messages/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, read: true } : m));
      if (onUnreadChange) onUnreadChange(messages.filter(m => !m.read && m._id !== id).length);
    } catch { /* ignore */ }
  };

  const handleReply = async (msg) => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post(`/messages/${msg._id}/reply`, { text: replyText });
      toast.success('Reply sent');
      setReplyText('');
      setReplyOpen(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-text">Messages</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-muted hover:text-text border border-border px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <MessageSquare size={28} className="mx-auto text-[#D1D5DB] mb-3" />
          <p className="text-sm text-[#6B7280]">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map(msg => (
            <div key={msg._id}
              className={`bg-white border rounded-2xl transition-all ${!msg.read ? 'border-accent/30 bg-[#F0FBF9]' : 'border-border'}`}>
              <div className="p-4 cursor-default" onClick={() => !msg.read && markRead(msg._id)}>
                <div className="flex items-start gap-3">
                  {msg.sender?.avatar
                    ? <img src={optimizeImage(msg.sender.avatar, 150)} alt={msg.sender.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                    : <span className="w-9 h-9 rounded-full bg-accent text-white text-sm flex items-center justify-center font-medium shrink-0">
                        {msg.sender?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-sm ${!msg.read ? 'font-semibold text-text' : 'font-medium text-text'}`}>
                        {msg.sender?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-[#9CA3AF] shrink-0">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{msg.sender?.email}</p>
                    <p className={`text-sm leading-relaxed wrap-break-word ${!msg.read ? 'text-[#374151]' : 'text-muted'}`}>
                      {msg.text}
                    </p>
                  </div>
                  {!msg.read && <span className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
                </div>

                <div className="mt-3 ml-12">
                  <button
                    onClick={e => { e.stopPropagation(); setReplyOpen(replyOpen === msg._id ? null : msg._id); setReplyText(''); }}
                    className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${replyOpen === msg._id ? 'text-accent' : 'text-[#9CA3AF] hover:text-accent'}`}
                  >
                    <CornerDownRight size={12} /> Reply
                  </button>
                </div>
              </div>

              {replyOpen === msg._id && (
                <div className="px-4 pb-4 ml-12 border-t border-[#F3F0EB] pt-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReply(msg)}
                      placeholder={`Reply to ${msg.sender?.name}…`}
                      autoFocus
                      className="flex-1 px-3.5 py-2 bg-bg border border-border rounded-lg text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    <button
                      onClick={() => handleReply(msg)}
                      disabled={!replyText.trim() || sending}
                      className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
