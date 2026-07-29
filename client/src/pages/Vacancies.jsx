import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Briefcase, CheckCircle, XCircle, ArrowRight, Laptop, Crown, IndianRupee, ExternalLink, Building, Clock, Calendar, Plus, Info } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';






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

const parsePostedDate = (dateStr, createdAt) => {
  if (!dateStr) return new Date(createdAt || 0).getTime();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getTime();
  const lower = dateStr.toLowerCase();
  const now = new Date().getTime();
  if (lower.includes('today') || lower.includes('just now')) return now;
  if (lower.includes('yesterday')) return now - 86400000;
  const match = lower.match(/(\d+)\s*(day|week|month|year)s?\s*ago/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'day') return now - amount * 86400000;
    if (unit === 'week') return now - amount * 7 * 86400000;
    if (unit === 'month') return now - amount * 30 * 86400000;
    if (unit === 'year') return now - amount * 365 * 86400000;
  }
  return new Date(createdAt || 0).getTime();
};

function FilterDropdown({ icon: Icon, placeholder, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const active = !!value;
  const label = value || placeholder;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-2 pl-3.5 pr-3 py-2 rounded-xl border text-[13px] font-medium transition-all duration-200 select-none ${
          active
            ? 'border-accent bg-accent/5 text-accent shadow-sm'
            : 'border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm'
        }`}
      >
        <Icon size={13} className={active ? 'text-accent' : 'text-gray-400'} />
        <span className="whitespace-nowrap">{label}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${active ? 'text-accent' : 'text-gray-400'}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
        {active && <span className="w-1.5 h-1.5 rounded-full bg-accent absolute -top-0.5 -right-0.5 animate-pulse" />}
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-white border border-border rounded-2xl shadow-xl overflow-hidden min-w-[200px] max-h-72 flex flex-col">
          <div className="overflow-y-auto custom-scrollbar">
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 transition-colors ${
                !value ? 'bg-accent/5 text-accent font-semibold' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {!value && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
              {placeholder}
            </button>
            <div className="h-px bg-border mx-3" />
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 transition-colors ${
                  value === opt ? 'bg-accent/5 text-accent font-semibold' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {value === opt && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                <span className={value === opt ? '' : 'ml-[20px]'}>{opt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const INDIA_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry', 'Out of India'];

const ScrollingPlaceholderInput = ({ value, onChange, className }) => {
  const fullText = "Found a job opening that isn't relevant to you? Share it here to help others!          ";
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (value) return;
    const interval = setInterval(() => {
      setOffset((prev) => (prev + 1) % fullText.length);
    }, 180);
    return () => clearInterval(interval);
  }, [value]);

  const displayPlaceholder = fullText.slice(offset) + fullText.slice(0, offset);

  return (
    <input
      type="url"
      required
      placeholder={value ? "" : displayPlaceholder}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
};

const EXPERIENCE_OPTIONS = [
  'Fresher',
  'Less than 1 year',
  '1 - 2 years',
  '2 - 5 years',
  '5 - 7 years',
  '7 - 10 years',
  '10+ years'
];

const parseExperienceRange = (str) => {
  if (!str) return { min: 0, max: Infinity };
  const s = str.toLowerCase();
  
  if (s.includes('fresher') || s.includes('0 year') || s.includes('0-0') || s.includes('no experience')) {
    return { min: 0, max: 0 };
  }
  
  if (s.includes('less than 1') || s.includes('under 1') || s.includes('0-1')) {
    return { min: 0, max: 1 };
  }

  const rangeMatch = s.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
  if (rangeMatch) {
    return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  }

  const plusMatch = s.match(/(\d+)\s*\+/);
  if (plusMatch) {
    return { min: parseInt(plusMatch[1], 10), max: Infinity };
  }

  const singleMatch = s.match(/(\d+)\s*year/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return { min: val, max: val };
  }

  return { min: 0, max: Infinity };
};

const matchExperience = (jobExpStr, filterVal) => {
  if (!filterVal) return true;
  const { min: jobMin, max: jobMax } = parseExperienceRange(jobExpStr);

  switch (filterVal) {
    case 'Fresher':
      return jobMin === 0 && jobMax === 0;
    case 'Less than 1 year':
      return jobMin < 1;
    case '1 - 2 years':
      return jobMin <= 2 && jobMax >= 1;
    case '2 - 5 years':
      return jobMin <= 5 && jobMax >= 2;
    case '5 - 7 years':
      return jobMin <= 7 && jobMax >= 5;
    case '7 - 10 years':
      return jobMin <= 10 && jobMax >= 7;
    case '10+ years':
      return jobMax >= 10 || jobMin >= 10;
    default:
      return true;
  }
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
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'vacancies';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  
  const [inlineUrl, setInlineUrl] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);

  const [clickedLinks, setClickedLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('clicked_job_links');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedbackGiven, setFeedbackGiven] = useState(() => {
    try {
      const saved = localStorage.getItem('jobLinkFeedback');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleLinkClick = (id) => {
    if (!clickedLinks.includes(id)) {
      const updated = [...clickedLinks, id];
      setClickedLinks(updated);
      try {
        localStorage.setItem('clicked_job_links', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFeedback = async (id, heardBack) => {
    try {
      if (!user) {
        toast.error('Please log in to submit feedback');
        return;
      }
      await api.post(`/job-links/${id}/feedback`, { heardBack });
      const updated = { ...feedbackGiven, [id]: heardBack ? 'yes' : 'no' };
      setFeedbackGiven(updated);
      try {
        localStorage.setItem('jobLinkFeedback', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit feedback');
    }
  };

  const TABS = [
    { key: 'vacancies',  label: 'Vacancies',          icon: Briefcase },
    { key: 'job-links',  label: 'Job Post Links',      icon: ExternalLink },
    { key: 'freelance',  label: 'Freelance Projects',  icon: Laptop },
  ];

  const { data: vacancies = [], isLoading: loadingV, isError: errV } = useQuery({
    queryKey: ['vacancies'], queryFn: () => api.get('/vacancies').then(r => r.data), staleTime: 60000,
  });
  const { data: freelanceItems = [], isLoading: loadingF, isError: errF } = useQuery({
    queryKey: ['freelance'], queryFn: () => api.get('/freelance').then(r => r.data), staleTime: 60000,
  });
  const { data: jobLinksData, isLoading: loadingJL, isError: errJL } = useQuery({
    queryKey: ['job-links'], queryFn: () => api.get('/job-links').then(r => r.data), staleTime: 60000,
  });
  const jobLinks = (jobLinksData?.data || []).sort((a, b) => parsePostedDate(b.postedDate, b.createdAt) - parsePostedDate(a.postedDate, a.createdAt));
  useEffect(() => { if (errV) toast.error('Failed to load vacancies'); }, [errV]);
  useEffect(() => { if (errF) toast.error('Failed to load freelance projects'); }, [errF]);
  useEffect(() => { if (errJL) toast.error('Failed to load job links'); }, [errJL]);

  const TAB_CONFIG = {
    vacancies:  { data: vacancies,       loading: loadingV, queryKey: 'vacancies',  route: '/vacancies'  },
    freelance:  { data: freelanceItems,  loading: loadingF, queryKey: 'freelance',  route: '/freelance'  },
    'job-links': { data: jobLinks,       loading: loadingJL, queryKey: 'job-links', route: '/job-links'  },
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

  const handleInlineJobLinkSubmit = async (e) => {
    e.preventDefault();
    if (!inlineUrl) return;
    setSubmittingLink(true);
    try {
      const res = await api.post('/job-links', { url: inlineUrl, platform: 'other' });
      if (res.data.success) {
        toast.success('Job link submitted for review!');
        setInlineUrl('');
      }
    } catch (error) {
      console.error(error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to share job link.');
      }
    } finally {
      setSubmittingLink(false);
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
                onClick={() => {
                  setActiveTab(key);
                  setFilterDesignation('');
                  setFilterLocation('');
                  setFilterExperience('');
                  navigate(`?tab=${key}`, { replace: true });
                }}
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
      
      {/* Advanced Filters */}
      {!TAB_CONFIG[activeTab].loading && TAB_CONFIG[activeTab].data.length > 0 && (
        <div className="bg-white border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex flex-wrap gap-3 items-center justify-center">
              
              <FilterDropdown
                icon={Briefcase}
                placeholder="Designation"
                value={filterDesignation}
                onChange={setFilterDesignation}
                options={Array.from(new Set(TAB_CONFIG[activeTab].data.map(d => d.title).filter(Boolean))).sort()}
              />

              <FilterDropdown
                icon={MapPin}
                placeholder="All States"
                value={filterLocation}
                onChange={setFilterLocation}
                options={INDIA_STATES}
              />

              <FilterDropdown
                icon={Clock}
                placeholder="Experience"
                value={filterExperience}
                onChange={setFilterExperience}
                options={EXPERIENCE_OPTIONS}
              />

              {(filterDesignation || filterLocation || filterExperience) && (
                <button
                  onClick={() => { setFilterDesignation(''); setFilterLocation(''); setFilterExperience(''); }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 px-3 py-2 rounded-xl transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Clear all
                </button>
              )}

              {activeTab === 'job-links' && user && (
                <div className="w-full sm:w-auto min-w-[320px] sm:w-[580px] md:w-[610px] ml-0 sm:ml-2 flex items-center gap-2">
                  <form
                    onSubmit={handleInlineJobLinkSubmit}
                    className="flex-1 flex items-center gap-1 bg-white rounded-xl border border-black/20 animate-border-gemini-shine focus-within:!border-accent/50 focus-within:!shadow-[0_0_0_2px_rgba(0,166,147,0.1)] transition-all p-1 pl-1.5 overflow-hidden relative"
                  >
                    <ScrollingPlaceholderInput
                      value={inlineUrl}
                      onChange={e => setInlineUrl(e.target.value)}
                      className="flex-1 bg-transparent text-[12px] outline-none px-1 text-gray-700 min-w-0 placeholder:text-gray-400"
                    />
                    <button
                      type="submit"
                      disabled={submittingLink}
                      className="bg-accent hover:bg-accent-hover text-white p-1.5 rounded-md transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center"
                    >
                      <Plus size={14} />
                    </button>
                  </form>
                  
                  <div className="relative group flex items-center justify-center cursor-help shrink-0">
                    <div className="text-gray-400 hover:text-accent transition-colors p-1">
                      <Info size={18} />
                    </div>
                    
                    <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-gray-200 text-gray-700 text-[12px] p-3.5 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 text-left">
                      <div className="font-semibold text-[13px] mb-2 text-accent">Guidelines for sharing:</div>
                      <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                        <li>Share software job post links only.</li>
                        <li>Must be posted within the last 72 hours.</li>
                        <li>Genuine posts only (no "comment if interested" engagement traps).</li>
                        <li>Direct job post links only (no generic job portal links).</li>
                      </ul>
                      <div className="absolute -top-1.5 right-2 w-3 h-3 bg-white border-t border-l border-gray-200 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1550px] mx-auto px-4 sm:px-6 py-8 pb-16">
      {(() => {
        const currentData = TAB_CONFIG[activeTab].data;
        const filteredData = currentData.filter(d => {
          if (filterDesignation && d.title !== filterDesignation) return false;
          
          if (filterLocation) {
            const loc = (d.location || '').toLowerCase();
            if (filterLocation === 'Out of India') {
              const states = INDIA_STATES.filter(s => s !== 'Out of India').map(s => s.toLowerCase());
              const isInIndia = loc.includes('india') || states.some(state => loc.includes(state));
              if (isInIndia) return false;
            } else {
              if (!d.location || !loc.includes(filterLocation.toLowerCase())) return false;
            }
          }
          
          if (filterExperience && !matchExperience(d.experience, filterExperience)) return false;
          return true;
        });

        if (TAB_CONFIG[activeTab].loading) {
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          );
        }

        if (filteredData.length === 0) {
          return (
            <div className="bg-white border border-border rounded-2xl shadow-sm p-16 text-center">
              {activeTab === 'freelance' ? <Laptop size={32} className="text-[#D1D5DB] mx-auto mb-3" /> : activeTab === 'job-links' ? <ExternalLink size={32} className="text-[#D1D5DB] mx-auto mb-3" /> : <Briefcase size={32} className="text-[#D1D5DB] mx-auto mb-3" />}
              <p className="text-sm font-medium text-muted">No matching {activeTab === 'freelance' ? 'freelance projects' : activeTab === 'job-links' ? 'job post links' : 'vacancies'} found.</p>
              <p className="text-xs text-[#9CA3AF] mt-1">Try clearing your filters or check back later.</p>
            </div>
          );
        }

        return activeTab === 'job-links' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1550px] mx-auto">
            {filteredData.map(link => {
              const isApplied = clickedLinks.includes(link._id);
              return (
                <div
                  key={link._id}
                  className={`bg-white rounded-2xl shadow-sm border p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md ${
                    isApplied ? 'border-[#006994]/30 bg-[#006994]/5' : 'border-border hover:border-accent/30'
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <h2 className="text-[16px] font-semibold text-gray-900 line-clamp-2">
                        {link.title || 'Job Opportunity'}
                      </h2>
                    </div>

                    {(link.company || link.location) && (
                      <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                        {link.company && (
                          <>
                            <Building size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{link.company}</span>
                          </>
                        )}
                        {link.company && link.location && <span className="text-gray-300 mx-0.5 shrink-0">•</span>}
                        {link.location && (
                          <>
                            <MapPin size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{link.location}</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-gray-500 mt-1">
                      {link.experience && (
                        <div className="flex items-center gap-1">
                          <Clock size={13} />
                          <span>{link.experience}</span>
                        </div>
                      )}
                      {link.workMode && (
                        <div className="flex items-center gap-1">
                          <Laptop size={13} />
                          <span>{link.workMode}</span>
                        </div>
                      )}
                    </div>
                    {link.postedDate && (
                      <div className="flex items-center gap-1 text-[12px] text-emerald-700 font-medium mt-2">
                        <Calendar size={13} />
                        <span>Posted: {link.postedDate}</span>
                      </div>
                    )}
                  </div>

                  <div className={`pt-3 border-t border-gray-100 flex ${isApplied ? 'items-center justify-between' : 'justify-end'}`}>
                    {isApplied && (
                      <div className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>Did you hear back?</span>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { e.preventDefault(); handleFeedback(link._id, true); }} 
                            className={`px-2 py-0.5 rounded border transition-colors ${feedbackGiven[link._id] === 'yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-medium' : 'border-gray-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
                          >
                            Yes
                          </button>
                          <button 
                            onClick={(e) => { e.preventDefault(); handleFeedback(link._id, false); }} 
                            className={`px-2 py-0.5 rounded border transition-colors ${feedbackGiven[link._id] === 'no' ? 'bg-red-50 text-red-600 border-red-200 font-medium' : 'border-gray-200 hover:bg-red-50 hover:text-red-600'}`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link._id)}
                      className={`py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${
                        isApplied
                          ? 'bg-white text-[#006994] border border-[#006994]'
                          : 'bg-[#006994] hover:bg-[#005578] text-white'
                      }`}
                    >
                      <span>{isApplied ? 'Visited' : 'Apply Now'}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {filteredData.map(v => {
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
        );
      })()}
      </div>
    </div>
  );
}

