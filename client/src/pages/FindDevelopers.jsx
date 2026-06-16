import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Users, CheckCircle2, Sparkles,
  RotateCcw, Clock, ChevronRight, History, Brain, Trash2, Download, Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { timeAgo, vacancyTitle } from '../components/recruiter/developerUtils';
import DeveloperCard from '../components/recruiter/DeveloperCard';
import JDPaymentModal from '../components/recruiter/JDPaymentModal';
import * as XLSX from 'xlsx';

/* ── Loading step labels ─────────────────────────────────── */
const STEPS = [
  'Reading job description',
  'Extracting skills & roles',
  'Matching developers',
  'Ranking results',
];

/* ── Loading animation ───────────────────────────────────── */
function LoadingAnimation({ step }) {
  return (
    <div className="bg-white border border-border rounded-2xl px-6 py-4">
      <p className="text-sm font-semibold text-muted mb-4">AI is finding your best matches</p>

      {/* Segmented progress track */}
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((_, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#E5E7EB]">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDone
                    ? 'w-full bg-accent'
                    : isActive
                    ? 'w-full bg-linear-to-r from-accent to-accent/40 animate-pulse'
                    : 'w-0'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Step labels */}
      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
        {STEPS.map((label, i) => {
          const isDone = i < step;
          const isActive = i === step;
          return (
            <div
              key={i}
              className={`flex items-center gap-2 flex-1 min-w-0 px-3 py-2 rounded-xl transition-all duration-300 ${
                isActive ? 'bg-accent/8' : ''
              }`}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isDone ? (
                  <CheckCircle2 size={18} className="text-accent" />
                ) : isActive ? (
                  <div className="w-4 h-4 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-[#E5E7EB] text-[10px] font-bold text-[#9CA3AF] flex items-center justify-center">
                    {i + 1}
                  </span>
                )}
              </div>
              <span
                className={`text-xs font-semibold leading-tight transition-colors duration-300 truncate ${
                  isDone ? 'text-accent' : isActive ? 'text-accent' : 'text-[#9CA3AF]'
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PAGE_SIZE = 20;

/* ── Quota status bar ────────────────────────────────────── */
function QuotaBar({ quota, onBuyClick, onBuyLabel }) {
  if (!quota) return null;
  if (quota.featureEnabled === false) return null;

  const { freeUsed, freeLimit, paidRemaining } = quota;
  const freeLeft = Math.max(freeLimit - freeUsed, 0);
  const exhausted = freeLeft === 0 && paidRemaining === 0;
  const usingPaid = freeLeft === 0 && paidRemaining > 0;

  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-medium mb-3 border ${
      exhausted
        ? 'bg-red-50 border-red-200 text-red-700'
        : usingPaid
        ? 'bg-violet-50 border-violet-200 text-violet-700'
        : 'bg-bg border-border text-muted'
    }`}>
      <Zap size={13} className={exhausted ? 'text-red-500' : usingPaid ? 'text-violet-500' : 'text-accent'} />

      {exhausted ? (
        <>
          <span className="flex-1">You've used all 5 free analyses this month.</span>
          <button
            onClick={onBuyClick}
            className="flex items-center gap-1 bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg font-semibold transition-colors text-[11px]"
          >
            <Zap size={10} /> {onBuyLabel || `Buy ${quota.paidPackSize ?? 5} for ₹${((quota.packPricePaise ?? 49900) / 100).toLocaleString('en-IN')}`}
          </button>
        </>
      ) : usingPaid ? (
        <span className="flex-1">{paidRemaining} paid {paidRemaining === 1 ? 'analysis' : 'analyses'} remaining</span>
      ) : (
        <>
          <span className="flex-1">
            {freeLeft} free {freeLeft === 1 ? 'analysis' : 'analyses'} left this month
          </span>
          <div className="flex gap-0.5">
            {Array.from({ length: freeLimit }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-1.5 rounded-full ${i < freeUsed ? 'bg-accent/30' : 'bg-accent'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Export helpers ──────────────────────────────────────── */
function exportToExcel(developers) {
  const rows = developers.map((dev, i) => {
    const skills = [
      ...(Array.isArray(dev.mentorshipTech) ? dev.mentorshipTech : []),
      ...(Array.isArray(dev.resumeData?.skills) ? dev.resumeData.skills : []),
    ].filter((v, idx, a) => v && a.indexOf(v) === idx);

    const role = dev.designations?.[0] || dev.resumeData?.experience?.[0]?.role || '';
    const location = [dev.place, dev.district, dev.state].filter(Boolean).join(', ') || dev.country || '';

    return {
      '#': i + 1,
      Name: dev.name || '',
      Role: role,
      Email: dev.email || '',
      Phone: dev.phone || '',
      Skills: skills.join(', '),
      'Experience (yrs)': dev.yearsOfExperience || '',
      'Expected Salary (LPA)': dev.expectedSalary
        ? (Number(dev.expectedSalary) / 100000).toFixed(1)
        : '',
      'Joining Availability': dev.joiningAvailability || '',
      Location: location,
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = [
    { wch: 4 }, { wch: 22 }, { wch: 24 }, { wch: 28 }, { wch: 14 },
    { wch: 40 }, { wch: 16 }, { wch: 20 }, { wch: 20 },
    { wch: 24 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Shortlisted Developers');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `shortlisted-developers-${date}.xlsx`);
}

/* ── Results section ─────────────────────────────────────── */
function ResultsSection({ developers, ready, jd, onSearchAgain }) {
  const [showAll, setShowAll] = useState(false);

  const cardBaseDelay = 80;
  const visible = showAll ? developers : developers.slice(0, PAGE_SIZE);

  return (
    <div>
      {/* Compact search bar ─ always visible */}
      <div className="flex items-center gap-4 bg-white border border-border rounded-2xl px-5 py-3.5 mb-6">
        <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Sparkles size={15} className="text-accent" />
        </div>
        <p className="text-sm flex-1 truncate min-w-0 text-muted">
          <span className="font-medium text-text">
            {jd.trim().slice(0, 100)}
          </span>
          {jd.trim().length > 100 ? '…' : ''}
        </p>
        <button
          onClick={() => exportToExcel(developers)}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 border border-emerald-300 hover:border-emerald-500 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <Download size={12} /> Export Excel
        </button>
        <button
          onClick={onSearchAgain}
          className="flex items-center gap-1.5 text-xs font-semibold text-accent border border-accent/30 hover:border-accent bg-accent/5 hover:bg-accent/10 px-3.5 py-2 rounded-xl transition-colors shrink-0"
        >
          <RotateCcw size={12} /> New Search
        </button>
      </div>

      {/* Developer card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((dev, idx) => (
          <DeveloperCard
            key={dev._id}
            dev={dev}
stagger={{ ready, delay: cardBaseDelay + idx * 70 }}
          />
        ))}
      </div>

      {/* More button */}
      {!showAll && developers.length > PAGE_SIZE && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setShowAll(true)}
            className="flex items-center gap-2 text-sm font-semibold text-accent border border-accent/30 hover:border-accent bg-accent/5 hover:bg-accent/10 px-6 py-2.5 rounded-xl transition-colors"
          >
            More <span className="text-xs text-muted font-normal">({developers.length - PAGE_SIZE} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Recent searches ─────────────────────────────────────── */
function RecentSearches({ searches, loading, onCardClick, onDelete, onClearAll }) {
  if (loading) {
    return (
      <div className="mt-8 space-y-3">
        <div className="h-3.5 w-28 bg-border rounded-full animate-pulse" />
        {[0, 1, 2].map(i => (
          <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!searches.length) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <History size={11} /> Recent Searches
        </p>
        <button
          onClick={onClearAll}
          className="flex items-center gap-1 text-[11px] font-medium text-muted hover:text-red-500 transition-colors"
        >
          <Trash2 size={10} /> Clear All
        </button>
      </div>
      <div className="space-y-2.5">
        {searches.map((h, i) => (
          <div
            key={h._id}
            className="relative bg-white border border-border hover:border-accent/50 rounded-2xl transition-all group hover:shadow-sm animate-fade-slide-up"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <button
              onClick={() => onCardClick(h)}
              className="w-full text-left p-4 pr-10"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-bg border border-border flex items-center justify-center shrink-0 group-hover:bg-accent/10 group-hover:border-accent/20 transition-colors">
                  <Search size={14} className="text-muted group-hover:text-accent transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-text truncate">{vacancyTitle(h)}</p>
                    <span className="text-[11px] text-muted flex items-center gap-1 shrink-0">
                      <Clock size={9} /> {timeAgo(h.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-muted">
                      <span className="font-semibold text-text">{h.resultCount}</span> candidates
                    </span>
                    {h.extracted?.skills?.slice(0, 5).map(s => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight size={15} className="text-muted group-hover:text-accent transition-colors shrink-0" />
              </div>
            </button>

            {/* Delete button */}
            <button
              onClick={e => { e.stopPropagation(); onDelete(h._id); }}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function FindDevelopers() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState('idle'); // 'idle' | 'loading' | 'results'
  const [jd, setJd] = useState('');
  const [loadingStep, setLoadingStep] = useState(0);
  const [developers, setDevelopers] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [resultsReady, setResultsReady] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [quota, setQuota] = useState(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'recruiter' && user.userType !== 'client') {
      navigate('/portfolios', { replace: true });
      return;
    }
    Promise.all([
      api.get('/jd/history').then(r => setRecentSearches(r.data.slice(0, 3))).catch(() => {}),
      api.get('/jd/quota').then(r => setQuota(r.data)).catch(() => {}),
    ]).finally(() => setHistoryLoading(false));
  }, [user, navigate]);

  const refreshQuota = () => {
    api.get('/jd/quota').then(r => setQuota(r.data)).catch(() => {});
  };

  const refreshRecent = () => {
    api.get('/jd/history')
      .then(r => setRecentSearches(r.data.slice(0, 3)))
      .catch(() => {});
  };

  const handleDeleteHistory = (id) => {
    api.delete(`/jd/history/${id}`).catch(() => {});
    setRecentSearches(prev => prev.filter(h => h._id !== id));
  };

  const handleClearAll = () => {
    api.delete('/jd/history').catch(() => {});
    setRecentSearches([]);
  };

  /* Search ─────────────────────────────────────────────── */
  const handleSearch = async () => {
    if (!jd.trim()) return toast.error('Paste a job description first.');
    if (jd.trim().length < 30) return toast.error('Job description is too short.');

    setPageState('loading');
    setLoadingStep(0);
    setResultsReady(false);

    // Tick steps 0 → 1 → 2 every 700ms; hold at 2 until API responds
    let step = 0;
    intervalRef.current = setInterval(() => {
      step += 1;
      if (step <= 2) setLoadingStep(step);
      else clearInterval(intervalRef.current);
    }, 700);

    try {
      const { data } = await api.post('/users/find-developers', { jd: jd.trim() });

      clearInterval(intervalRef.current);
      setLoadingStep(3); // "Ranking results" — brief pause for visual satisfaction

      await api.post('/jd/history', {
        jd: jd.trim(),
        extracted: data.extracted,
        resultCount: data.developers.length,
        developers: data.developers,
      }).catch(() => {}); // don't block results if history save fails

      refreshRecent();
      refreshQuota();

      setTimeout(() => {
        setDevelopers(data.developers);
        setExtracted(data.extracted);
        setPageState('results');
        setTimeout(() => setResultsReady(true), 0); // mount-then-animate
      }, 400);

    } catch (err) {
      clearInterval(intervalRef.current);
      if (err.response?.data?.code === 'QUOTA_EXCEEDED') {
        setShowPayModal(true);
        setPageState('idle');
        setLoadingStep(0);
        return;
      }
      toast.error(err.response?.data?.message || 'Search failed. Try again.');
      setPageState('idle');
      setLoadingStep(0);
    }
  };

  /* Restore from recent card ─────────────────────────── */
  const handleRecentClick = (h) => {
    setJd(h.jd || h.jdSnippet || '');
    setDevelopers(h.developers);
    setExtracted(h.extracted);
    setResultsReady(false);
    setPageState('results');
    setTimeout(() => setResultsReady(true), 0);
  };

  /* Reset to input ────────────────────────────────────── */
  const handleSearchAgain = () => {
    setResultsReady(false);
    setDevelopers(null);
    setExtracted(null);
    setPageState('idle');
  };

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div className="max-w-6xl mx-auto px-4 py-5">

      {/* Header ─ always visible */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Users size={18} className="text-accent" />
        </div>
        <p className="text-base font-medium text-text hidden sm:block">
          <span className="text-xl font-bold">Find Developers</span>
          <span className="text-muted font-normal"> · Paste your job description, AI matches the best developers instantly.</span>
        </p>
        <p className="text-xl font-bold text-text sm:hidden">Find Developers</p>
        <span className="ml-auto hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-linear-to-r from-violet-50 to-accent/10 text-violet-600 border border-violet-200/60">
          <Sparkles size={11} /> AI Powered
        </span>
      </div>

      {/* ── Payment modal ───────────────────────────────── */}
      {showPayModal && quota?.featureEnabled !== false && (
        <JDPaymentModal
          onClose={() => setShowPayModal(false)}
          onSuccess={(paidRemaining) => {
            setShowPayModal(false);
            setQuota(prev => prev ? { ...prev, paidRemaining } : prev);
          }}
          packSize={quota?.paidPackSize ?? 5}
          pricePaise={quota?.packPricePaise ?? 49900}
        />
      )}

      {/* ── Idle state ─────────────────────────────────── */}
      {pageState === 'idle' && (
        <>
          <QuotaBar quota={quota} onBuyClick={() => setShowPayModal(true)} />

          <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-[0_4px_24px_-4px_rgba(0,166,147,0.10),0_2px_8px_-2px_rgba(0,0,0,0.06)]">
            <div className="flex min-h-65">
              {/* Left panel — guidance */}
              <div className="w-56 shrink-0 bg-bg border-r border-border px-2.5 py-3 sm:flex flex-col gap-4 hidden">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Brain size={13} className="text-accent" />
                    <p className="text-sm font-bold text-text">Job Description</p>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    Paste or type the full role. Include title, skills, location, and experience.
                  </p>
                </div>
                <ul className="space-y-2">
                  {['Role & title', 'Required skills', 'Location', 'Experience level'].map(item => (
                    <li key={item} className="flex items-center gap-2 text-xs text-muted">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right panel — textarea */}
              <div className="flex-1 flex flex-col">
                <textarea
                  rows={10}
                  value={jd}
                  onChange={e => setJd(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSearch();
                  }}
                  placeholder="Paste the full job description here — role, responsibilities, required skills, experience level..."
                  className="flex-1 w-full text-sm text-text placeholder-muted bg-white px-2.5 py-2.5 resize-none focus:outline-none"
                />
                <div className="flex items-center justify-between px-2.5 py-3 border-t border-border">
                  <span className="text-xs text-muted">{jd.length} chars</span>
                  <button
                    onClick={handleSearch}
                    disabled={!jd.trim()}
                    className="flex items-center gap-2 text-sm bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    <Sparkles size={14} /> Find Developers
                  </button>
                </div>
              </div>
            </div>
          </div>

          <RecentSearches
            searches={recentSearches}
            loading={historyLoading}
            onCardClick={handleRecentClick}
            onDelete={handleDeleteHistory}
            onClearAll={handleClearAll}
          />
        </>
      )}

      {/* ── Loading state ───────────────────────────────── */}
      {pageState === 'loading' && <LoadingAnimation step={loadingStep} />}

      {/* ── Results state ───────────────────────────────── */}
      {pageState === 'results' && developers && (
        <ResultsSection
          developers={developers}
          extracted={extracted}
          ready={resultsReady}
          jd={jd}
          onSearchAgain={handleSearchAgain}
        />
      )}
    </div>
  );
}
