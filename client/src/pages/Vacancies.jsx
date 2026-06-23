import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, CreditCard, CheckCircle, ArrowRight, Laptop, Clock } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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

function SkillsList({ skills, colors }) {
  const [expanded, setExpanded] = useState(false);
  const VISIBLE = 3;
  const shown = expanded ? skills : skills.slice(0, VISIBLE);
  const extra = skills.length - VISIBLE;
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((s, i) => (
        <span key={s} className={`text-sm font-medium px-3 py-1.5 rounded-xl border ${colors[i % colors.length]}`}>{s}</span>
      ))}
      {!expanded && extra > 0 && (
        <button onClick={() => setExpanded(true)} className="text-sm font-medium px-3 py-1.5 rounded-xl border border-accent/40 text-accent bg-accent/5 hover:bg-accent/10 transition-colors">
          +{extra} more
        </button>
      )}
      {expanded && extra > 0 && (
        <button onClick={() => setExpanded(false)} className="text-sm font-medium px-3 py-1.5 rounded-xl border border-border text-muted hover:text-text transition-colors">
          Show less
        </button>
      )}
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [activeTab, setActiveTab] = useState('vacancies');

  const TABS = [
    { key: 'vacancies',  label: 'Vacancies',          icon: Briefcase },
    { key: 'freelance',  label: 'Freelance Projects',  icon: Laptop },
  ];

  const { data: vacancies = [], isLoading: loadingV, isError: errV } = useQuery({
    queryKey: ['vacancies'], queryFn: () => api.get('/vacancies').then(r => r.data), staleTime: 60000,
  });
  const { data: freelanceItems = [], isLoading: loadingF, isError: errF } = useQuery({
    queryKey: ['freelance'], queryFn: () => api.get('/freelance').then(r => r.data), staleTime: 60000,
  });
  useEffect(() => { if (errV) toast.error('Failed to load vacancies'); }, [errV]);
  useEffect(() => { if (errF) toast.error('Failed to load freelance projects'); }, [errF]);

  const TAB_CONFIG = {
    vacancies:  { data: vacancies,       loading: loadingV, queryKey: 'vacancies',  route: '/vacancies'  },
    freelance:  { data: freelanceItems,  loading: loadingF, queryKey: 'freelance',  route: '/freelance'  },
  };

  const isPlaceholderCv = (url) => {
    const cleaned = (url || '').trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
    return cleaned === 'drive.google.com';
  };

  const handleInterest = async (item) => {
    if (!user) { toast.error('Please sign in to show interest'); return; }

    const cv = (user.cvUrl || '').trim();
    if (!cv || isPlaceholderCv(cv)) {
      toast((t) => (
        <span className="flex flex-col gap-1 text-sm">
          <span className="font-semibold">Resume link required</span>
          <span className="text-xs text-gray-500">Add your real resume link in your profile to apply.</span>
          <button
            onClick={() => { toast.dismiss(t.id); navigate('/profile'); }}
            className="mt-1 self-start text-xs font-medium text-accent hover:underline"
          >
            Go to Profile →
          </button>
        </span>
      ), { duration: 6000, icon: '⚠️' });
      return;
    }

    if (activeTab === 'freelance') {
      const isProfileComplete = user.freelanceAvailable && user.freelanceRate;
      if (!isProfileComplete) {
        toast((t) => (
          <span className="flex flex-col gap-1 text-sm">
            <span className="font-semibold">Complete your freelance profile first</span>
            <span className="text-xs text-gray-500">Enable freelance availability and set your rate in your profile to apply.</span>
            <button
              onClick={() => { toast.dismiss(t.id); navigate('/profile'); }}
              className="mt-1 self-start text-xs font-medium text-accent hover:underline"
            >
              Go to Profile →
            </button>
          </span>
        ), { duration: 6000, icon: '⚠️' });
        return;
      }
    }


    const { queryKey, route } = TAB_CONFIG[activeTab];
    setBusy(item._id);
    try {
      const res = await api.post(`${route}/${item._id}/interest`);
      queryClient.setQueryData([queryKey], prev =>
        prev.map(v => v._id === item._id
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
    <div className="min-h-screen bg-linear-to-br from-accent/10 via-white to-violet-50 relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Tabs header */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 justify-center">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-accent text-accent bg-accent/5'
                    : 'border-transparent text-muted hover:text-text hover:bg-gray-50'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {TAB_CONFIG[activeTab].loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : TAB_CONFIG[activeTab].data.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl shadow-sm p-16 text-center">
          {activeTab === 'freelance' ? <Laptop size={32} className="text-[#D1D5DB] mx-auto mb-3" /> : <Briefcase size={32} className="text-[#D1D5DB] mx-auto mb-3" />}
          <p className="text-sm font-medium text-muted">No {activeTab === 'freelance' ? 'freelance projects' : 'vacancies'} available right now</p>
          <p className="text-xs text-[#9CA3AF] mt-1">Check back soon — new listings are posted regularly.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TAB_CONFIG[activeTab].data.map(v => {
            const initial = (v.company || v.title || '?')[0].toUpperCase();
            const subLabel = activeTab === 'freelance' ? null : (v.industry || v.company);
            return (
              <div key={v._id} className={`bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.13)] border border-border/60 hover:border-accent/60 p-5 flex flex-col gap-4 transition-all duration-200 ${v.status === 'closed' ? 'opacity-70' : ''}`}>

                {/* Header: avatar + title + type badge */}
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center shrink-0 text-accent font-bold text-lg">
                    {initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-text leading-snug">{v.title}</h2>
                      {v.status === 'closed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200 font-medium">Closed</span>
                      )}
                    </div>
                    {subLabel && (
                      <p className="text-sm text-muted mt-0.5">{subLabel}</p>
                    )}
                  </div>
                  <span className={`shrink-0 flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${TYPE_STYLE[v.type]}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${TYPE_DOT[v.type]}`} />
                    {TYPE_LABEL[v.type]}
                  </span>
                </div>

                {/* Pills: metadata */}
                {(v.location || v.jobType || v.experience || v.salaryRange || v.budget || v.duration || v.availability) && (
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
                    {v.experience && (
                      <span className="flex items-center gap-1.5 text-sm text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                        <Clock size={13} className="shrink-0" /> {v.experience}
                      </span>
                    )}
                    {v.salaryRange && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent-light border border-accent/20 px-3 py-1.5 rounded-full">
                        <CreditCard size={13} className="shrink-0" /> {v.salaryRange}
                      </span>
                    )}
                    {v.budget && (
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-accent bg-accent-light border border-accent/20 px-3 py-1.5 rounded-full">
                        <span className="shrink-0 font-bold">₹</span> {v.budget}
                      </span>
                    )}
                    {v.duration && (
                      <span className="flex items-center gap-1.5 text-sm text-muted bg-[#F3F0EB] border border-border px-3 py-1.5 rounded-full">
                        {v.duration}
                      </span>
                    )}
                    {v.availability && (
                      <span className="flex items-center gap-1.5 text-sm text-muted bg-[#F3F0EB] border border-border px-3 py-1.5 rounded-full">
                        {v.availability}
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

                {/* Skills / Topics */}
                {(v.skills?.length > 0 || v.topics?.length > 0) && (
                  <SkillsList skills={v.skills || v.topics || []} colors={SKILL_COLORS} />
                )}

                {/* Footer */}
                <div className="border-t border-border pt-4 flex items-center justify-between gap-3 mt-auto">
                  {v.status === 'closed' ? (
                    <span className="text-sm text-gray-400 font-medium px-5 py-2.5">Applications closed</span>
                  ) : !user ? (
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
    </div>
  );
}

