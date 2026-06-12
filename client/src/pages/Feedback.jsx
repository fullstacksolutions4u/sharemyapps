import { useState } from 'react';
import { Lightbulb, Send, CheckCircle, Star, Mail } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Bug Report', 'Feature Request', 'Service Request', 'Other'];

export default function Feedback() {
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.post('/messages/admin', {
        text: `[Feedback & Suggestions${category ? ` — ${category}` : ''}${rating ? ` | Rating: ${rating}/5` : ''}]\n\n${text}`,
      });
      toast.success('Submitted — thank you!');
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-accent-light border border-accent/20 rounded-2xl p-8 text-center">
          <CheckCircle size={36} className="mx-auto text-accent mb-4" />
          <p className="text-base font-semibold text-text mb-1">Thank you for your submission!</p>
          <p className="text-sm text-muted mb-6">We read every feedback and suggestion and use them to improve ShareMyApps.</p>
          <button
            onClick={() => { setSent(false); setCategory(''); setRating(0); setText(''); }}
            className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center shrink-0">
          <Lightbulb size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Feedback & Suggestions</h1>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-accent-light border border-accent/20 rounded-xl px-4 py-3 mb-2">
        <Mail size={16} className="text-accent shrink-0" />
        <p className="text-sm text-text">
          You can also email us directly at{' '}
          <a href="mailto:hello@sharemyapps.in" className="text-accent hover:underline font-medium">
            hello@sharemyapps.in
          </a>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Category</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(prev => prev === c ? '' : c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  category === c
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg border-border text-muted hover:border-accent hover:text-accent'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Star rating */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Overall experience</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={24}
                  className={`transition-colors ${n <= (hovered || rating) ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Your message</label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Share feedback, report a bug, suggest a feature, or request a service…"
            rows={5}
            className="w-full px-4 py-3 bg-bg border border-border rounded-xl text-sm text-text placeholder-muted resize-none focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={14} />
            {sending ? 'Sending…' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
