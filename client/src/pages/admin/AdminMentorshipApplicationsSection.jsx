import { useEffect, useState } from 'react';
import { GraduationCap, Check, X, Phone, Mail, RotateCcw, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';

const STATUS_STYLES = {
  pending:  'bg-amber-50 text-amber-600 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  rejected: 'bg-red-50 text-red-500 border-red-200',
};

export default function AdminMentorshipApplicationsSection() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/mentorship-applications')
      .then(r => setApplications(r.data.applications || []))
      .catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (id, status) => {
    setUpdating(id);
    try {
      const oldApp = applications.find(a => a._id === id);
      const wasPending = oldApp?.status === 'pending';
      const res = await api.put(`/admin/mentorship-applications/${id}`, { status });
      setApplications(prev => prev.map(a => a._id === id ? res.data.application : a));
      
      const isPendingNow = res.data.application?.status === 'pending';
      if (wasPending && !isPendingNow) {
        window.dispatchEvent(new CustomEvent('decrementPendingApplicants'));
      } else if (!wasPending && isPendingNow) {
        window.dispatchEvent(new CustomEvent('incrementPendingApplicants'));
      }

      toast.success(status === 'approved' ? 'Application approved — payment unlocked for user.' : `Application marked ${status}.`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update application');
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    setUpdating(id);
    try {
      const oldApp = applications.find(a => a._id === id);
      const wasPending = oldApp?.status === 'pending';
      await api.delete(`/admin/mentorship-applications/${id}`);
      setApplications(prev => prev.filter(a => a._id !== id));

      if (wasPending) {
        window.dispatchEvent(new CustomEvent('decrementPendingApplicants'));
      }

      toast.success('Application deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete application');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const counts = applications.reduce((acc, a) => { acc[a.status] = (acc[a.status] || 0) + 1; return acc; }, {});

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted">Loading mentorship applications…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-end flex-wrap gap-3">
        <div className="flex gap-1.5">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors border ${
                filter === f ? 'bg-text text-white border-text' : 'bg-white text-muted border-border hover:text-text'
              }`}
            >
              {f}{f !== 'all' && counts[f] ? ` (${counts[f]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <GraduationCap size={28} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-muted">No {filter === 'all' ? '' : filter + ' '}applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => (
            <div key={a._id} className="bg-white border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4">
              {a.user?.avatar
                ? <img src={optimizeImage(a.user.avatar, 150)} alt={a.user?.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                : <span className="w-10 h-10 rounded-full bg-teal-600 text-white text-sm flex items-center justify-center font-bold shrink-0">{a.user?.name?.[0]?.toUpperCase() || '?'}</span>
              }
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text truncate">
                  {a.user?.name || 'Deleted user'}
                  {a.user?.regNumber && <span className="ml-2 text-xs font-medium text-muted">#{a.user.regNumber}</span>}
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                  <span className="flex items-center gap-1"><Mail size={11} /> {a.user?.email || '—'}</span>
                  <span className="flex items-center gap-1"><Phone size={11} /> {a.phone}</span>
                  <a
                    href={`https://wa.me/${a.phone.replace(/\D/g, '').replace(/^(\d{10})$/, '91$1')}?text=${encodeURIComponent(`Hi ${a.user?.name || ''}, this is Kevin from ShareMyApps regarding your Mentorship Program application. How are you ?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                  </a>
                </div>
                <p className="text-xs text-muted mt-1">
                  <span className="font-semibold text-text/70">Qualification:</span> {a.qualification}
                  <span className="mx-2">·</span>
                  Applied {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold capitalize border ${STATUS_STYLES[a.status] || ''}`}>
                  {a.status}
                </span>
                {a.status === 'pending' ? (
                  <>
                    <button
                      onClick={() => setStatus(a._id, 'approved')}
                      disabled={updating === a._id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => setStatus(a._id, 'rejected')}
                      disabled={updating === a._id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                    >
                      <X size={12} /> Reject
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setStatus(a._id, 'pending')}
                    disabled={updating === a._id}
                    title="Move back to pending"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-border text-muted hover:text-text transition-colors disabled:opacity-60"
                  >
                    <RotateCcw size={12} /> Reset
                  </button>
                )}
                <button
                  onClick={() => handleDelete(a._id)}
                  disabled={updating === a._id}
                  title="Delete Application"
                  className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 ml-1"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
