import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Briefcase, CheckCircle, XCircle, ArrowRight, Laptop, Crown, Banknote, IndianRupee, ExternalLink, Building, Clock, Calendar } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { normalizeJobDesignation } from '../utils/jobDesignation';

const JOB_LINK_APPLY_INSTRUCTION =
  'Get 2 free applies weekly. Upgrade to Premium for ₹399/- for unlimited lifetime applies.';

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
  const year = createdAt ? new Date(createdAt).getFullYear() : new Date().getFullYear();
  const dateWithYear = dateStr.match(/^[A-Za-z]+\s+\d+$/) ? `${dateStr} ${year}` : dateStr;
  const d = new Date(dateWithYear);
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
          active && (value === 'Out of India' || value === 'Remote Jobs')
            ? 'border-[#5a788b] bg-[#5a788b]/10 text-[#5a788b] shadow-sm'
            : active
            ? 'border-accent bg-accent/5 text-accent shadow-sm'
            : 'border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:shadow-sm'
        }`}
      >
        <Icon size={13} className={active ? (value === 'Out of India' || value === 'Remote Jobs' ? 'text-[#5a788b]' : 'text-accent') : 'text-gray-400'} />
        <span className="whitespace-nowrap">{label}</span>
        <svg
          width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
          className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} ${
            active ? (value === 'Out of India' || value === 'Remote Jobs' ? 'text-[#5a788b]' : 'text-accent') : 'text-gray-400'
          }`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
        {active && <span className={`w-1.5 h-1.5 rounded-full absolute -top-0.5 -right-0.5 animate-pulse ${
          value === 'Out of India' || value === 'Remote Jobs' ? 'bg-[#5a788b]' : 'bg-accent'
        }`} />}
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
            {options.map(opt => {
              const isSpecial = opt === 'Out of India' || opt === 'Remote Jobs';
              const isSelected = value === opt;
              
              let btnClass = 'text-gray-700 hover:bg-gray-50';
              if (isSelected && isSpecial) {
                btnClass = 'bg-[#5a788b]/10 text-[#5a788b] font-semibold';
              } else if (isSelected) {
                btnClass = 'bg-accent/5 text-accent font-semibold';
              } else if (isSpecial) {
                btnClass = 'text-[#5a788b] font-medium hover:bg-gray-50';
              }

              return (
                <button
                  key={opt}
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-[13px] flex items-center gap-2 transition-colors ${btnClass}`}
                >
                  {isSelected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
                  <span className={isSelected ? '' : 'ml-[20px]'}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const INDIA_STATES = ['Kerala', 'Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry', 'Out of India', 'Remote Jobs'];

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

const getTwoSentences = (text) => {
  if (!text) return { text: '', hasMore: false };
  let sentences = text.match(/[^.!?\n]+[.!?]+(\s|$)|[^.!?\n]+$/g);
  if (sentences && sentences.length > 2) {
    let truncated = sentences.slice(0, 2).join(' ').trim();
    if (truncated.length > 180) {
      return { text: truncated.slice(0, 180) + '...', hasMore: true };
    }
    return { text: truncated + '...', hasMore: true };
  }
  if (text.length > 180) {
    return { text: text.slice(0, 180) + '...', hasMore: true };
  }
  return { text, hasMore: false };
};

function filterOpportunityItems(data, activeTab, filterDesignation, filterLocation, filterExperience) {
  return data.filter((d) => {
    if (activeTab === 'job-links') {
      const postedTime = parsePostedDate(d.postedDate, d.createdAt);
      const fiveDaysAgoTime = new Date().getTime() - 5 * 24 * 60 * 60 * 1000;
      if (postedTime < fiveDaysAgoTime) return false;
    }
    if (filterDesignation && normalizeJobDesignation(d.title) !== filterDesignation) return false;

    if (filterLocation) {
      const loc = (d.location || '').toLowerCase();
      if (filterLocation === 'Out of India') {
        const states = INDIA_STATES.filter((s) => s !== 'Out of India' && s !== 'Remote Jobs').map((s) => s.toLowerCase());
        const cities = ['kochi', 'mohali', 'bengaluru', 'bangalore', 'chennai', 'gurugram', 'gurgaon', 'indore', 'coimbatore', 'pune', 'trivandrum', 'thiruvananthapuram', 'mumbai', 'ahmedabad', 'noida', 'delhi', 'new delhi', 'hyderabad', 'kolkata', 'chandigarh', 'kozhikode', 'calicut', 'madurai', 'mysore', 'bhubaneswar', 'nagpur', 'lucknow', 'jaipur', 'surat', 'kanpur', 'patna', 'bhopal', 'vadodara', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'allahabad', 'ranchi', 'howrah', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'raipur', 'kota', 'guwahati', 'solapur', 'hubli', 'dharwad', 'bareilly', 'moradabad', 'mysuru', 'tiruchirappalli', 'jalandhar', 'salem', 'warangal', 'guntur', 'bhiwandi', 'saharanpur', 'gorakhpur', 'bikaner', 'amravati', 'jamshedpur', 'bhilai', 'cuttack', 'firozabad', 'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'rourkela', 'nanded', 'kolhapur', 'ajmer', 'gulbarga', 'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi', 'ulhasnagar', 'jammu', 'sangli', 'mangalore', 'erode', 'belgaum', 'kurnool', 'tirunelveli', 'malegaon', 'gaya', 'udaipur', 'kakinada', 'davangere', 'akola', 'tumkur', 'bhagalpur', 'bellary', 'latur', 'dhule', 'rohtak', 'korba', 'bhilwara', 'brahmapur', 'muzaffarpur', 'ahmednagar', 'mathura', 'kollam', 'kadapa', 'bilaspur', 'shahjahanpur', 'satara', 'bijapur', 'rampur', 'shivamogga', 'chandrapur', 'junagadh', 'thrissur', 'alwar', 'bardhaman', 'nizamabad', 'parbhani', 'tumakuru', 'khammam', 'panipat', 'darbhanga', 'aizawl', 'dewas', 'ichalkaranji', 'karnal', 'bathinda', 'jalna', 'eluru', 'barasat', 'purnia', 'satna', 'mau', 'sonipat', 'farrukhabad', 'sagar', 'durg', 'imphal', 'ratlam', 'hapur', 'anantapur', 'arrah', 'karimnagar', 'etawah', 'bharatpur', 'begusarai', 'gandhidham', 'puducherry', 'sikar', 'thoothukudi', 'rewa', 'mirzapur', 'raichur', 'pali', 'ramagundam', 'silchar', 'haridwar', 'vijayanagaram', 'tenali', 'nagercoil', 'sri ganganagar', 'thanjavur', 'bulandshahr', 'katni', 'sambhal', 'singrauli', 'nadiad', 'secunderabad', 'yamunanagar', 'bidar', 'munger', 'panchkula', 'burhanpur', 'kharagpur', 'dindigul', 'gandhinagar', 'hosapete', 'malda', 'ongole', 'deoghar', 'chapra', 'haldia', 'khandwa', 'nandyal', 'morena', 'amroha', 'anand', 'bhind', 'bhiwani', 'berhampore', 'ambala', 'morbi', 'fatehpur', 'raebareli', 'chittoor', 'bhusawal', 'orai', 'bahraich', 'phagwara', 'machilipatnam', 'midnapore', 'bhadrak', 'navsari', 'guntakal', 'hindupur', 'krishnanagar', 'dibrugarh', 'hazaribagh', 'palakkad', 'kannur', 'alappuzha', 'kottayam', 'kasaragod', 'pathanamthitta', 'malappuram', 'wayanad', 'idukki', 'ernakulam'];
        const isInIndia = loc.includes('india') || states.some((state) => loc.includes(state)) || cities.some((city) => loc.includes(city));
        const isRemote = (d.workMode && d.workMode.toLowerCase() === 'remote') || loc.includes('remote');
        if (isInIndia || isRemote) return false;
      } else if (filterLocation === 'Remote Jobs') {
        const isRemote = (d.workMode && d.workMode.toLowerCase() === 'remote') || loc.includes('remote');
        if (!isRemote) return false;
      } else if (!d.location || !loc.includes(filterLocation.toLowerCase())) {
        return false;
      }
    }

    if (filterExperience && !matchExperience(d.experience, filterExperience)) return false;

    return true;
  });
}

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
  const initialTab = queryParams.get('tab') || 'job-links';
  const [activeTab, setActiveTab] = useState(initialTab);

  const [filterDesignation, setFilterDesignation] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);

  const [localClickedLinks, setLocalClickedLinks] = useState(() => {
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

  const { data: applyEligibility, refetch: refetchEligibility } = useQuery({
    queryKey: ['job-link-apply-eligibility', user?._id],
    queryFn: () => api.get('/job-links/apply-eligibility').then(r => r.data?.data),
    enabled: !!user,
    staleTime: 30000,
  });

  const serverClickedIds = applyEligibility?.clickedIds || [];
  const clickedLinks = Array.from(new Set([...localClickedLinks, ...serverClickedIds]));

  useEffect(() => {
    try {
      localStorage.setItem('clicked_job_links', JSON.stringify(clickedLinks));
    } catch (e) {
      console.error(e);
    }
  }, [clickedLinks]);

  const canApplyMore = !user || applyEligibility?.canApplyMore !== false;
  const isPremium = !!(applyEligibility?.isPremium);

  const persistClicked = (id) => {
    if (localClickedLinks.includes(id) || serverClickedIds.includes(id)) return;
    setLocalClickedLinks(prev => [...prev, id]);
  };

  const handleLinkClick = async (e, id, url) => {
    const alreadyVisited = clickedLinks.includes(id);

    if (alreadyVisited) {
      if (user) api.post(`/job-links/${id}/click`).catch(console.error);
      return;
    }

    if (!user) return;

    e.preventDefault();

    if (!canApplyMore) {
      toast.error(
        applyEligibility?.message
          || JOB_LINK_APPLY_INSTRUCTION,
        { duration: 6000 }
      );
      return;
    }

    const tab = window.open('about:blank', '_blank');
    try {
      const res = await api.post(`/job-links/${id}/click`);
      persistClicked(id);
      if (res.data?.data) {
        queryClient.setQueryData(['job-link-apply-eligibility', user._id], res.data.data);
      } else {
        refetchEligibility();
      }
      if (tab) tab.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (tab) tab.close();
      const msg = err.response?.data?.message || 'Unable to apply to this job post right now.';
      toast.error(msg, { duration: 6000 });
      if (err.response?.data?.data) {
        queryClient.setQueryData(['job-link-apply-eligibility', user._id], err.response.data.data);
      } else {
        refetchEligibility();
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
    { key: 'job-links',  label: 'Job Post Links',      icon: ExternalLink },
    { key: 'vacancies',  label: 'Our Client Vacancies',          icon: Briefcase },
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

  const TAB_CONFIG = useMemo(() => ({
    vacancies:  { data: vacancies,       loading: loadingV, queryKey: 'vacancies',  route: '/vacancies'  },
    freelance:  { data: freelanceItems,  loading: loadingF, queryKey: 'freelance',  route: '/freelance'  },
    'job-links': { data: jobLinks,       loading: loadingJL, queryKey: 'job-links', route: '/job-links'  },
  }), [vacancies, freelanceItems, jobLinks, loadingV, loadingF, loadingJL]);

  const activeTabData = useMemo(() => {
    if (activeTab === 'vacancies') return vacancies;
    if (activeTab === 'freelance') return freelanceItems;
    return jobLinks;
  }, [activeTab, vacancies, freelanceItems, jobLinks]);

  const filteredTabData = useMemo(
    () => filterOpportunityItems(
      activeTabData,
      activeTab,
      filterDesignation,
      filterLocation,
      filterExperience,
    ),
    [activeTabData, activeTab, filterDesignation, filterLocation, filterExperience],
  );

  const JOB_LINKS_PER_PAGE = 15;
  const jobLinksTotal = activeTab === 'job-links' ? filteredTabData.length : 0;
  const jobLinksRangeStart = jobLinksTotal === 0 ? 0 : (currentPage - 1) * JOB_LINKS_PER_PAGE + 1;
  const jobLinksRangeEnd = Math.min(currentPage * JOB_LINKS_PER_PAGE, jobLinksTotal);

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
      toast.success(isWithdraw ? 'Application withdrawn.' : 'Successfully submitted. An executive will contact you if your resume is shortlisted.', { duration: 5000 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy(null);
    }
  };



  const getBackgroundStyles = () => {
    switch (activeTab) {
      case 'job-links':
        return {
          wrapper: 'from-[#5a788b]/20 via-white to-[#5a788b]/10',
          pattern: 'radial-gradient(circle, #5a788b 1px, transparent 1px)',
        };
      case 'vacancies':
        return {
          wrapper: 'from-emerald-100/50 via-white to-emerald-50/50',
          pattern: 'radial-gradient(circle, #10b981 1px, transparent 1px)', // emerald-500
        };
      case 'freelance':
        return {
          wrapper: 'from-violet-100/50 via-white to-violet-50/50',
          pattern: 'radial-gradient(circle, #8b5cf6 1px, transparent 1px)', // violet-500
        };
      default:
        return {
          wrapper: 'from-accent/10 via-white to-violet-50',
          pattern: 'radial-gradient(circle, #00A693 1px, transparent 1px)',
        };
    }
  };

  const bgStyles = getBackgroundStyles();

  return (
    <div className={`min-h-screen bg-linear-to-br ${bgStyles.wrapper} relative transition-colors duration-500`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-500" style={{ backgroundImage: bgStyles.pattern, backgroundSize: '28px 28px' }} />
      {/* Tabs header */}
      <div className="relative border-b border-white/20 shadow-sm overflow-hidden bg-white/30 backdrop-blur-md">
        <div className="relative max-w-[1550px] mx-auto px-2 sm:px-3 flex items-center justify-between py-2">
          <div className="flex gap-1.5 flex-1 justify-center">
            {TABS.map(({ key, label, icon: Icon }) => {
              const tabColors = {
                'job-links': {
                  active: 'bg-[#5a788b] text-white shadow-md scale-105',
                  inactive: 'text-gray-600 hover:bg-white/60 hover:text-[#5a788b]'
                },
                'vacancies': {
                  active: 'bg-emerald-600 text-white shadow-md scale-105',
                  inactive: 'text-gray-600 hover:bg-white/60 hover:text-emerald-700'
                },
                'freelance': {
                  active: 'bg-violet-600 text-white shadow-md scale-105',
                  inactive: 'text-gray-600 hover:bg-white/60 hover:text-violet-700'
                }
              };
              const colors = tabColors[key] || { active: '', inactive: '' };
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveTab(key);
                    setFilterDesignation('');
                    setFilterLocation('');
                    setFilterExperience('');
                    setCurrentPage(1);
                    navigate(`?tab=${key}`, { replace: true });
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 text-[14px] font-bold rounded-xl transition-all duration-300 ${
                    activeTab === key ? colors.active : colors.inactive
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
          {activeTab === 'job-links' ? (
            <Link
              to="/job-post-links-premium"
              className="flex items-center gap-1.5 bg-white border border-amber-300 hover:border-amber-400 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 mb-1"
            >
              <Crown size={12} className="text-amber-500 shrink-0" />
              <span>Unlimited Job Post Applies with Premium</span>
              <span className="inline-flex items-center gap-0.5">
                <IndianRupee size={11} className="text-gray-700" />
                399/-
              </span>
            </Link>
          ) : (
            <Link
              to="/placement-services"
              className="flex items-center gap-1.5 bg-white border border-amber-300 hover:border-amber-400 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors shrink-0 mb-1"
            >
              <Crown size={12} className="text-amber-500" /> Job Assistance Services
            </Link>
          )}
        </div>
      </div>
      
      {/* Advanced Filters */}
      {!TAB_CONFIG[activeTab].loading && (TAB_CONFIG[activeTab].data.length > 0 || activeTab === 'job-links') && (
        <div className="border-b border-border/40">
          <div className="max-w-[1550px] mx-auto px-2 sm:px-3 py-3">
            <div className="flex flex-wrap gap-3 items-center justify-center">
              
              <FilterDropdown
                icon={Briefcase}
                placeholder="Designation"
                value={filterDesignation}
                onChange={(val) => { setFilterDesignation(val); setCurrentPage(1); }}
                options={Array.from(new Set(
                  TAB_CONFIG[activeTab].data.map(d => normalizeJobDesignation(d.title)).filter(Boolean)
                )).sort()}
              />

              <FilterDropdown
                icon={MapPin}
                placeholder="All States"
                value={filterLocation}
                onChange={(val) => { setFilterLocation(val); setCurrentPage(1); }}
                options={INDIA_STATES}
              />

              <FilterDropdown
                icon={Clock}
                placeholder="Experience"
                value={filterExperience}
                onChange={(val) => { setFilterExperience(val); setCurrentPage(1); }}
                options={EXPERIENCE_OPTIONS}
              />

              {(filterDesignation || filterLocation || filterExperience) && (
                <button
                  onClick={() => { setFilterDesignation(''); setFilterLocation(''); setFilterExperience(''); setCurrentPage(1); }}
                  className="flex items-center gap-1.5 text-[12px] font-semibold text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 hover:border-red-200 px-3 py-2 rounded-xl transition-all"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  Clear all
                </button>
              )}

              {activeTab === 'job-links' && !isPremium && (
                <p className="text-[11px] sm:text-[12px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 leading-snug shrink-0 whitespace-nowrap">
                  {JOB_LINK_APPLY_INSTRUCTION}
                </p>
              )}

              
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1550px] mx-auto px-2 sm:px-3 pt-4 pb-16">
      {activeTab === 'job-links' && !TAB_CONFIG[activeTab].loading && (
        <div className="flex justify-end mb-3 pr-6 sm:pr-10">
          <p className="text-[13px] text-gray-500">
            <span className="font-semibold text-gray-800">{jobLinksRangeStart}–{jobLinksRangeEnd}</span> of{' '}
            <span className="font-semibold text-gray-800">{jobLinksTotal}</span> active job posts
          </p>
        </div>
      )}
      {(() => {
        const filteredData = filteredTabData;
        const ITEMS_PER_PAGE = activeTab === 'job-links' ? JOB_LINKS_PER_PAGE : 12;
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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

        return (
          <div className="space-y-8">
            {activeTab === 'job-links' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedData.map(link => {
                  const isApplied = clickedLinks.includes(link._id);
                  const colorObj = { bg: '#dfeafd', fold: '#b8cde8' };
                  const rotClass = 'rotate-0';
                  return (
                    <div
                      key={link._id}
                      className={`sticky-curly ${rotClass} p-5 flex flex-col justify-between gap-4`}
                      style={{ '--sticky-bg': colorObj.bg, '--sticky-fold': colorObj.fold }}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                          <h2 className="text-[16px] font-semibold text-gray-900 line-clamp-2">
                            {normalizeJobDesignation(link.title) || 'Job Opportunity'}
                          </h2>
                        </div>

                        {link.location && (
                          <div className="flex items-center gap-1.5 text-[13px] text-gray-600">
                            <MapPin size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{link.location}</span>
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
                        {!user ? (
                          <Link
                            to="/login"
                            className="py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 bg-[#006994] hover:bg-[#005578] text-white border-b-[3px] border-[#004f70] active:border-b-0 active:translate-y-[3px] transition-all"
                          >
                            <span>Sign in to apply</span>
                            <ArrowRight size={12} />
                          </Link>
                        ) : !isApplied && !canApplyMore && !isPremium ? (
                          <div className="relative group/unlock z-10">
                            <button
                              type="button"
                              onClick={(e) => { e.preventDefault(); navigate('/job-post-links-premium'); }}
                              className="py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 bg-amber-100 text-amber-700 hover:bg-amber-200 border-b-[3px] border-amber-300 transition-all"
                              aria-describedby={`unlock-tip-${link._id}`}
                            >
                              <span>Upgrade to unlimited job post applies</span>
                              <Crown size={12} />
                            </button>
                            <div
                              id={`unlock-tip-${link._id}`}
                              role="tooltip"
                              className="absolute bottom-full right-0 mb-2 w-[260px] p-3.5 bg-white text-left rounded-xl shadow-[0_8px_28px_-6px_rgba(0,0,0,0.18)] border border-[#E5E1DA] opacity-0 invisible translate-y-1 group-hover/unlock:opacity-100 group-hover/unlock:visible group-hover/unlock:translate-y-0 group-focus-within/unlock:opacity-100 group-focus-within/unlock:visible group-focus-within/unlock:translate-y-0 transition-all duration-200 pointer-events-none z-[100]"
                            >
                              <p className="text-[11px] font-semibold text-[#1A1A1A] mb-2">
                                Weekly limit reached
                              </p>
                              <ul className="space-y-1.5 text-[11px] text-[#4A4A4A] leading-relaxed">
                                <li className="flex gap-1.5">
                                  <span className="text-amber-600 shrink-0">•</span>
                                  <span>You get <strong className="font-semibold text-[#1A1A1A]">2 free</strong> job applies each week.</span>
                                </li>
                                <li className="flex gap-1.5">
                                  <span className="text-amber-600 shrink-0">•</span>
                                  <span>Upgrade to Premium for <strong className="font-semibold text-[#1A1A1A]">₹399/-</strong>.</span>
                                </li>
                                <li className="flex gap-1.5">
                                  <span className="text-amber-600 shrink-0">•</span>
                                  <span>Unlock <strong className="font-semibold text-[#1A1A1A]">unlimited lifetime</strong> applies instantly.</span>
                                </li>
                              </ul>
                              <span className="absolute top-full right-5 border-[6px] border-transparent border-t-[#E5E1DA]" />
                              <span className="absolute top-full right-5 mt-[-1px] border-[5px] border-transparent border-t-white" />
                            </div>
                          </div>
                        ) : (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => handleLinkClick(e, link._id, link.url)}
                            className={`py-1.5 px-3 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-all ${
                              isApplied
                                ? 'bg-white text-[#006994] border border-[#006994] border-b-[3px] border-b-[#005578] active:border-b-0 active:translate-y-[3px]'
                                : 'bg-[#006994] hover:bg-[#005578] text-white border-b-[3px] border-[#004f70] active:border-b-0 active:translate-y-[3px]'
                            }`}
                          >
                            <span>{isApplied ? 'Visited' : 'Apply Now'}</span>
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedData.map(v => {
                  const subLabel = activeTab === 'freelance' ? null : (v.industry || v.company);
                  const colorObj = { bg: '#dfeafd', fold: '#b8cde8' };
                  const rotClass = 'rotate-0';
                  return (
                    <div
                      key={v._id}
                      className={`sticky-curly ${rotClass} p-6 flex flex-col gap-4 ${v.status === 'closed' ? 'opacity-70' : ''}`}
                      style={{ '--sticky-bg': colorObj.bg, '--sticky-fold': colorObj.fold }}
                    >
                      <div className="flex flex-col gap-4 flex-1">
                        {/* Header: Title, Company */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h2 className="text-[17px] font-semibold text-gray-900">{v.title}</h2>
                          <p className="text-[14px] text-[#4f6e87] mt-0.5">{subLabel || v.company || 'Company Name'}</p>
                        </div>
                      </div>

                      {/* Info Row: Experience, Salary, Type, Location */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          <Briefcase size={15} className="text-indigo-500" />
                          {v.experience || '0-5 Yrs'}
                        </div>
                        <div className="w-[1px] h-3.5 bg-gray-300"></div>
                        <div className="flex items-center gap-1.5">
                          <Banknote size={15} className="text-emerald-500" />
                          {v.salaryRange || v.budget || 'Not specified'}
                        </div>
                        {v.type && (
                          <>
                            <div className="w-[1px] h-3.5 bg-gray-300"></div>
                            <div className="flex items-center gap-1.5 capitalize">
                              {v.type === 'onsite' ? <Building size={15} className="text-amber-500" /> : <Laptop size={15} className="text-amber-500" />}
                              {v.type}
                            </div>
                          </>
                        )}
                        <div className="flex items-center gap-1.5">
                          <MapPin size={15} className="text-rose-500" />
                          {v.location || 'Remote'}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <p className={`text-[13.5px] text-gray-600 leading-relaxed ${expanded[v._id] ? 'whitespace-pre-wrap' : ''}`}>
                          {expanded[v._id] ? v.description : getTwoSentences(v.description).text}
                        </p>
                        {(getTwoSentences(v.description).hasMore || v.description?.length > 100) && (
                          <button
                            onClick={() => setExpanded(e => ({ ...e, [v._id]: !e[v._id] }))}
                            className="text-[12.5px] font-medium text-accent hover:text-accent-hover mt-1 transition-colors"
                          >
                            {expanded[v._id] ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>

                      {/* Skills / Tags */}
                      <div>
                        <div className={`text-[13.5px] text-gray-500 ${expanded[`${v._id}_skills`] ? '' : 'line-clamp-2'}`}>
                          {v.skills && v.skills.length > 0 ? v.skills.join(' · ') : v.topics && v.topics.length > 0 ? v.topics.join(' · ') : 'Skills not specified'}
                        </div>
                        {((v.skills?.join(' · ') || v.topics?.join(' · ') || '').length > 70) && (
                          <button
                            onClick={() => setExpanded(e => ({ ...e, [`${v._id}_skills`]: !e[`${v._id}_skills`] }))}
                            className="text-[12.5px] font-medium text-accent hover:text-accent-hover mt-0.5 transition-colors"
                          >
                            {expanded[`${v._id}_skills`] ? 'less' : '+ more'}
                          </button>
                        )}
                      </div>

                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
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
                            className="flex items-center gap-2 text-[13.5px] font-semibold bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-xl border-b-[3px] border-[#008273] active:border-b-0 active:translate-y-[3px] transition-all"
                          >
                            Sign in to apply <ArrowRight size={15} />
                          </Link>
                        ) : (() => {
                          const config = getStatusConfig(v.applicationStatus);
                          return (
                            <button
                              onClick={() => handleInterest(v)}
                              disabled={busy === v._id || !config.canWithdraw}
                              className={`group flex items-center gap-2 text-[13.5px] font-semibold px-5 py-2.5 rounded-xl transition-all ${
                                !config.canWithdraw ? 'disabled:opacity-100 disabled:cursor-default cursor-default' : 'disabled:opacity-60 disabled:cursor-not-allowed'
                              } ${
                                v.interested
                                  ? config.classes
                                  : 'bg-accent hover:bg-accent-hover text-white border-b-[3px] border-[#008273] active:border-b-0 active:translate-y-[3px]'
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="px-3.5 py-2 rounded-xl border border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium border-b-[3px] border-b-gray-300 active:border-b-0 active:translate-y-[3px] disabled:border-b disabled:translate-y-0"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        currentPage === p
                          ? 'bg-accent text-white border-b-[3px] border-b-[#008273] active:border-b-0 active:translate-y-[3px]'
                          : 'border border-border bg-white text-gray-700 hover:border-gray-300 border-b-[3px] border-b-gray-300 active:border-b-0 active:translate-y-[3px]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-2 rounded-xl border border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium border-b-[3px] border-b-gray-300 active:border-b-0 active:translate-y-[3px] disabled:border-b disabled:translate-y-0"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        );
      })()}
      </div>
    </div>
  );
}

