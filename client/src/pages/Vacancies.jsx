import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Briefcase, CreditCard, CheckCircle, XCircle, ArrowRight, Laptop, Clock, Crown, Home, Bookmark, IndianRupee } from 'lucide-react';
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

const getStatusConfig = (status) => {
  const s = (status || '').toLowerCase();
  
  if (s === 'rejected') {
    return {
      classes: 'bg-red-50 text-red-600 border border-red-200 cursor-default opacity-100',
      icon: <XCircle size={15} />,
      canWithdraw: false
    };
  }
  if (s === 'selected') {
    return {
      classes: 'bg-green-50 text-green-600 border border-green-200 cursor-default opacity-100',
      icon: <CheckCircle size={15} />,
      canWithdraw: false
    };
  }
  if (s === 'reviewing') {
    return {
      classes: 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200',
      icon: <CheckCircle size={15} className="group-hover:hidden" />,
      canWithdraw: true
    };
  }
  if (s.startsWith('interview')) {
    return {
      classes: 'bg-violet-50 text-violet-600 border border-violet-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200',
      icon: <CheckCircle size={15} className="group-hover:hidden" />,
      canWithdraw: true
    };
  }
  
  // Default to applied (blue)
  return {
    classes: 'bg-blue-50 text-blue-600 border border-blue-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200',
    icon: <CheckCircle size={15} className="group-hover:hidden" />,
    canWithdraw: true
  };
};

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
      const isWithdraw = item.interested;
      const res = isWithdraw
        ? await api.delete(`${route}/${item._id}/interest`)
        : await api.post(`${route}/${item._id}/interest`);
      queryClient.setQueryData([queryKey], prev =>
        prev.map(v => v._id === item._id
          ? { ...v, interested: res.data.interested ?? !isWithdraw, interestCount: res.data.interestCount ?? (v.interestCount + (isWithdraw ? -1 : 1)) }
          : v
        )
      );
      toast.success(isWithdraw ? 'Application withdrawn.' : "Application forwarded to client successfully. Client will directly contact you if your profile is shortlisted.", { duration: 7000 });
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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <div className="flex gap-1 flex-1 justify-center">
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
          <a href="/career-services" className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-600 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 mb-1">
            <Crown size={12} /> Job Assistance Services
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-16">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
          {TAB_CONFIG[activeTab].data.map(v => {
            const initial = (v.company || v.title || '?')[0].toUpperCase();
            const subLabel = activeTab === 'freelance' ? null : (v.industry || v.company);
            return (
              <div key={v._id} className={`bg-white rounded-2xl shadow-sm border border-border p-6 flex flex-col gap-4 transition-all duration-200 hover:shadow-md ${v.status === 'closed' ? 'opacity-70' : ''}`}>
                {/* Header: Title, Company */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-[17px] font-semibold text-gray-900">{v.title}</h2>
                    <p className="text-[14px] text-[#4f6e87] mt-0.5">{subLabel || v.company || 'Company Name'}</p>
                  </div>
                </div>

                {/* Info Row: Experience, Salary, Location */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-gray-600 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Briefcase size={15} className="text-gray-400" />
                    {v.experience || '0-5 Yrs'}
                  </div>
                  <div className="w-[1px] h-3.5 bg-gray-300"></div>
                  <div className="flex items-center gap-1.5">
                    <IndianRupee size={14} className="text-gray-400" />
                    {v.salaryRange || v.budget || 'Not specified'}
                  </div>
                  <div className="w-[1px] h-3.5 bg-gray-300"></div>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={15} className="text-gray-400" />
                    {v.location || 'Remote'}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <p className={`text-[13.5px] text-gray-600 leading-relaxed ${expanded[v._id] ? '' : 'line-clamp-2'}`}>
                    {v.description}
                  </p>
                  {v.description?.length > 100 && (
                    <button
                      onClick={() => setExpanded(e => ({ ...e, [v._id]: !e[v._id] }))}
                      className="text-[12.5px] font-medium text-accent hover:text-accent-hover mt-1 transition-colors"
                    >
                      {expanded[v._id] ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>

                {/* Skills / Tags */}
                <div className="text-[13.5px] text-gray-500">
                  {v.skills && v.skills.length > 0 ? v.skills.join(' · ') : v.topics && v.topics.length > 0 ? v.topics.join(' · ') : 'Skills not specified'}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-2 border-t border-transparent">
                  <div className="text-[12px] text-gray-400">
                    {v.createdAt ? (() => {
                      const days = Math.floor((new Date() - new Date(v.createdAt)) / (1000 * 60 * 60 * 24));
                      return days === 0 ? 'Today' : days === 1 ? '1 Day Ago' : `${days} Days Ago`;
                    })() : 'Recently'}
                  </div>
                  
                  {v.status === 'closed' ? (
                    <span className="text-sm text-gray-400 font-medium px-5 py-2.5">Applications closed</span>
                  ) : !user ? (
                    <Link
                      to="/login"
                      className="flex items-center gap-2 text-[13.5px] font-semibold bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Sign in to apply <ArrowRight size={15} />
                    </Link>
                  ) : (() => {
                    const config = getStatusConfig(v.applicationStatus);
                    return (
                      <button
                        onClick={() => handleInterest(v)}
                        disabled={busy === v._id || !config.canWithdraw}
                        className={`group flex items-center gap-2 text-[13.5px] font-semibold px-5 py-2.5 rounded-xl transition-colors ${
                          !config.canWithdraw ? 'disabled:opacity-100 disabled:cursor-default cursor-default' : 'disabled:opacity-60 disabled:cursor-not-allowed'
                        } ${
                          v.interested
                            ? config.classes
                            : 'bg-white text-accent border border-accent hover:bg-accent hover:text-white'
                        }`}
                      >
                        {busy === v._id ? (
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : v.interested ? (
                          <>
                            {config.icon}
                            <span className={!config.canWithdraw ? '' : 'group-hover:hidden'}>
                              {v.applicationStatus ? v.applicationStatus.charAt(0).toUpperCase() + v.applicationStatus.slice(1) : 'Applied'}
                            </span>
                            {config.canWithdraw && <span className="hidden group-hover:inline">Withdraw</span>}
                          </>
                        ) : (
                          <>Show Interest <ArrowRight size={15} /></>
                        )}
                      </button>
                    );
                  })()}
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

