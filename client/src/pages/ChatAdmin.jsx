import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, MessageSquare, ShieldCheck, Inbox, Mail } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ChatAdmin() {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/messages/admin', { text });
      toast.success('Message sent to admin!');
      setText('');
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
          <ShieldCheck size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Message Admin</h1>
        </div>
      </div>

      {/* Email feedback callout */}
      <div className="flex items-center gap-3 bg-accent-light border border-accent/20 rounded-xl px-4 py-3 mb-6">
        <Mail size={16} className="text-accent shrink-0" />
        <p className="text-sm text-text">
          You can also email us directly at{' '}
          <a href="mailto:hello@sharemyapps.in" className="text-accent hover:underline font-medium">
            hello@sharemyapps.in
          </a>
        </p>
      </div>

      {sent ? (
        <div className="bg-accent-light border border-accent/20 rounded-2xl p-6 text-center">
          <MessageSquare size={32} className="mx-auto text-accent mb-3" />
          <p className="text-sm font-semibold text-text mb-1">Message sent!</p>
          <p className="text-sm text-muted mb-5">The admin will reply to your inbox.</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setSent(false)}
              className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Send another
            </button>
            <span className="text-border">•</span>
            <Link
              to="/messages"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover font-medium transition-colors"
            >
              <Inbox size={14} /> View messages
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-text mb-2">Your message</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Describe your question, issue, or feedback…"
            rows={5}
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text placeholder-muted resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
          />
          <div className="flex items-center justify-between mt-4">
            <p className="text-xs text-muted">Replies arrive in your <Link to="/messages" className="text-accent hover:underline">Messages inbox</Link>.</p>
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
