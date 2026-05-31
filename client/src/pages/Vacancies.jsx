import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, CreditCard, Users, CheckCircle, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const SKILL_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-violet-50 text-violet-700 border-violet-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-pink-50 text-pink-700 border-pink-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-rose-50 text-rose-700 border-rose-200',
];

const TYPE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
const TYPE_DOT = {
  remote:  'bg-green-500',
  onsite:  'bg-blue-500',
  hybrid:  'bg-purple-500',
};
const TYPE_STYLE = {
  remote:  'bg-green-50 text-green-700 border-green-200',
  onsite:  'bg-[#E6F7F5] text-accent border-accent/20',
  hybrid:  'bg-purple-50 text-purple-700 border-purple-200',
};

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-border animate-pulse space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-[#F3F0EB] rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#F3F0EB] rounded w-3/4" />
          <div className="h-3 bg-[#F3F0EB] rounded w-1/2" />
        </div>
        <div className="h-7 w-20 bg-[#F3F0EB] rounded-full" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-24 bg-[#F3F0EB] rounded-full" />
        <div className="h-8 w-24 bg-[#F3F0EB] rounded-full" />
        <div className="h-8 w-24 bg-[#F3F0EB] rounded-full" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#F3F0EB] rounded" />
        <div className="h-3 bg-[#F3F0EB] rounded w-5/6" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 w-16 bg-[#F3F0EB] rounded-xl" />
        <div className="h-8 w-20 bg-[#F3F0EB] rounded-xl" />
        <div className="h-8 w-18 bg-[#F3F0EB] rounded-xl" />
      </div>
      <div className="border-t border-border pt-4 flex justify-between">
        <div className="h-4 w-24 bg-[#F3F0EB] rounded" />
        <div className="h-10 w-36 bg-[#F3F0EB] rounded-xl" />
      </div>
    </div>
  );
}

export default function Vacancies() {
  const { user } = useAuth();
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    api.get('/vacancies')
      .then(res => setVacancies(res.data))
      .catch(() => toast.error('Failed to load vacancies'))
      .finally(() => setLoading(false));
  }, []);

  const handleInterest = async (vacancy) => {
    if (!user) {
      toast.error('Please sign in to show interest');
      return;
    }
    setBusy(vacancy._id);
    try {
      const method = vacancy.interested ? 'delete' : 'post';
      const res = await api[method](`/vacancies/${vacancy._id}/interest`);
      setVacancies(prev =>
        prev.map(v => v._id === vacancy._id
          ? { ...v, interested: res.data.interested, interestCount: res.data.interestCount }
          : v
        )
      );
      toast.success(res.data.interested ? 'Interest recorded!' : 'Interest withdrawn');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : vacancies.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-16 text-center">
          <Briefcase size={32} className="text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-sm font-medium text-muted">No vacancies available right now</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Check back soon — new positions are posted regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {vacancies.map(v => {
            const initial = (v.company || v.title || '?')[0].toUpperCase();
            return (
              <div key={v._id} className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] border border-border/60 p-5 flex flex-col gap-4 transition-shadow">

                {/* Header: avatar + title + type badge */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center shrink-0 text-accent font-bold text-lg">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-text leading-snug">{v.title}</h2>
                    {v.industry && (
                      <p className="text-sm text-muted mt-0.5">{v.industry}</p>
                    )}
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${TYPE_STYLE[v.type]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[v.type]}`} />
                    {TYPE_LABEL[v.type]}
                  </span>
                </div>

                {/* Pills: location, job type, salary */}
                {(v.location || v.jobType || v.salaryRange) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {v.location && (
                      <span className="flex items-center gap-1.5 text-sm text-muted bg-[#F3F0EB] border border-border px-3 py-1.5 rounded-full">
                        <MapPin size={13} className="shrink-0" /> {v.location}
                      </span>
                    )}
                    {v.jobType && (
                      <span className="flex items-center gap-1.5 text-sm text-muted bg-[#F3F0EB] border border-border px-3 py-1.5 rounded-full">
                        <Briefcase size={13} className="shrink-0" /> {v.jobType}
                      </span>
                    )}
                    {v.salaryRange && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent-light border border-accent/20 px-3 py-1.5 rounded-full">
                        <CreditCard size={13} className="shrink-0" /> {v.salaryRange}
                      </span>
                    )}
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className={`text-sm text-muted leading-relaxed ${expanded[v._id] ? '' : 'line-clamp-2'}`}>
                    {v.description}
                  </p>
                  {v.description?.length > 120 && (
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [v._id]: !e[v._id] }))}
                      className="text-xs font-medium text-accent hover:text-accent-hover mt-1 transition-colors"
                    >
                      {expanded[v._id] ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Skills */}
                {v.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {v.skills.map((s, i) => (
                      <span key={s} className={`text-sm font-medium px-3 py-1.5 rounded-xl border ${SKILL_COLORS[i % SKILL_COLORS.length]}`}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div className="border-t border-border pt-4 flex items-center justify-between gap-3 mt-auto">
                  <div className="flex items-center gap-1.5 text-sm text-muted">
                    <Users size={14} />
                    <span>{v.interestCount} interested</span>
                  </div>

                  {!user ? (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 text-sm font-semibold bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Sign in to apply <ArrowRight size={15} />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleInterest(v)}
                      disabled={busy === v._id}
                      className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        v.interested
                          ? 'bg-accent-light text-accent border border-accent/30 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                          : 'bg-accent hover:bg-accent-hover text-white'
                      }`}
                    >
                      {busy === v._id ? (
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : v.interested ? (
                        <><CheckCircle size={15} /> Interested</>
                      ) : (
                        <>Show Interest <ArrowRight size={15} /></>
                      )}
                    </button>
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
