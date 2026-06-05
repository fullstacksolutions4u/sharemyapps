import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History, Trash2, Clock, ArrowLeft, Users, Search, ChevronUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DevelopersTable, { timeAgo, vacancyTitle } from '../components/recruiter/DevelopersTable';

function HistoryRow({ h, idx, onDelete, deletingId }) {
  const [expanded, setExpanded] = useState(false);
  const title = vacancyTitle(h);

  return (
    <div className={`border border-border rounded-xl overflow-hidden transition-all ${expanded ? 'shadow-sm' : ''}`}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3.5 bg-white hover:bg-bg transition-colors group">
        {/* Index */}
        <span className="w-6 h-6 rounded-full bg-bg border border-border text-[11px] font-bold text-muted flex items-center justify-center shrink-0">
          {idx + 1}
        </span>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text truncate">{title}</p>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <Clock size={9} />{timeAgo(h.createdAt)}
            </span>
            <span className="text-[11px] text-muted">
              <span className="font-semibold text-text">{h.resultCount}</span> candidate{h.resultCount !== 1 ? 's' : ''}
            </span>
            {h.extracted?.skills?.slice(0, 3).map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">{s}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onDelete(h._id)}
            disabled={deletingId === h._id}
            className="p-1.5 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
          <button
            onClick={() => setExpanded(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors border border-accent/20"
          >
            {expanded ? (
              <><ChevronUp size={12} /> Hide</>
            ) : (
              <><Users size={12} /> View {h.resultCount} Candidate{h.resultCount !== 1 ? 's' : ''}</>
            )}
          </button>
        </div>
      </div>

      {/* Expanded developer table */}
      {expanded && (
        <div className="border-t border-border bg-white">
          <DevelopersTable developers={h.developers} />
        </div>
      )}
    </div>
  );
}

export default function FindDevelopersHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'recruiter' && user.userType !== 'client') {
      navigate('/developers', { replace: true });
      return;
    }
    api.get('/jd/history')
      .then(r => setHistory(r.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await api.delete(`/jd/history/${id}`);
      setHistory(prev => prev.filter(h => h._id !== id));
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Delete all shortlisted history? This cannot be undone.')) return;
    try {
      await Promise.all(history.map(h => api.delete(`/jd/history/${h._id}`)));
      setHistory([]);
      toast.success('History cleared');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to="/find-developers"
              className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text transition-colors"
            >
              <ArrowLeft size={14} /> Back to Find Next Developers
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <History size={14} className="text-accent" />
              </div>
              <h1 className="text-lg font-bold text-text">Shortlisted Candidates</h1>
            </div>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-red-200"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Loading…
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-20 text-center">
          <Search size={36} className="text-muted mx-auto mb-4" />
          <p className="text-sm font-semibold text-text mb-1">No searches yet</p>
          <p className="text-xs text-muted mb-5">Run a developer search and results will be saved here automatically.</p>
          <Link
            to="/find-developers"
            className="inline-flex items-center gap-2 text-sm bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-xl font-medium transition-colors"
          >
            <Users size={14} /> Find Developers
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((h, idx) => (
            <HistoryRow
              key={h._id}
              h={h}
              idx={idx}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
          <p className="text-center text-xs text-muted pt-2">Showing last {history.length} searches</p>
        </div>
      )}
    </div>
  );
}
