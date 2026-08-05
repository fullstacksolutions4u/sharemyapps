import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus,
  ClipboardList,
  Edit3, RefreshCw,
  Video, BookMarked, Users, ChevronDown, Layers
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';
import AdminInterviewModulesSection from './AdminInterviewModulesSection';

const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const ratingColor = (r) => r >= 8 ? 'text-emerald-600' : r >= 6 ? 'text-amber-500' : 'text-red-500';

const getLocalDatetimeString = (date = new Date()) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const ACTIVE_UPCOMING_STATUSES = new Set(['scheduled', 'postponed']);

function filterUpcomingSessions(sessions) {
  const now = Date.now();
  return (sessions || [])
    .filter(s => {
      if (!ACTIVE_UPCOMING_STATUSES.has(s.status)) return false;
      if (s.user?._id || s.user) return false;
      return new Date(s.interviewedAt).getTime() >= now - 60_000;
    })
    .sort((a, b) => new Date(a.interviewedAt) - new Date(b.interviewedAt));
}

function formatSessionOptionLabel(session) {
  const date = new Date(session.interviewedAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const statusLabel = session.status === 'postponed' ? 'Postponed' : 'Scheduled';
  const slot = session.sessionNumber ? `#${session.sessionNumber}` : '';
  return `${slot ? `Slot ${slot} · ` : ''}${date} · ${statusLabel}`;
}

function buildScreeningApplicantOptions(jobs, screeningStatuses) {
  const options = [];
  for (const job of jobs) {
    const statusMap = job.applicantStatus || {};
    for (const u of job.interests || []) {
      if (!u || u.isDeleted) continue;
      const st = statusMap[u._id] || statusMap[u._id?.toString()] || 'applied';
      if (!screeningStatuses.has(st)) continue;
      options.push({
        key: `${u._id}|${job._id}`,
        userId: u._id,
        jobId: job._id,
        name: u.name,
        jobTitle: job.title,
        company: job.company,
      });
    }
  }
  return options.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

// ─── Job + applicant picker (screening pool) ──────────────────────────────────
function ScreeningJobApplicantPicker({
  jobs,
  loading,
  selectedJobId,
  selectedApplicantId,
  jobApplicants,
  onJobSelect,
  onApplicantSelect,
  helperText,
}) {
  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 mb-6 space-y-4">
      <div className="flex items-center gap-2">
        <Users size={15} className="text-[#00A693]" />
        <h3 className="text-sm font-bold text-[#1A1A1A]">Start an interview session</h3>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Job / Vacancy</label>
        <div className="relative">
          <select
            value={selectedJobId}
            onChange={e => onJobSelect(e.target.value)}
            disabled={loading}
            className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
          >
            <option value="">— Choose a job —</option>
            {jobs.map(j => (
              <option key={j._id} value={j._id}>
                {j.title}{j.company ? ` — ${j.company}` : ''} ({j.status})
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview Screening Applicant</label>
        <div className="relative">
          <select
            value={selectedApplicantId}
            onChange={e => onApplicantSelect(e.target.value)}
            disabled={loading || !selectedJobId}
            className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
          >
            <option value="">
              {!selectedJobId
                ? '— Select a job first —'
                : jobApplicants.length === 0
                  ? '— No screening applicants for this job —'
                  : '— Choose an applicant —'}
            </option>
            {jobApplicants.map(u => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
        </div>
        {selectedJobId && !loading && (
          <p className="text-[11px] text-[#9CA3AF] mt-1.5">
            Showing contacted / interview-round applicants for this job ({jobApplicants.length}).
          </p>
        )}
      </div>

      {loading && <p className="text-xs text-[#9CA3AF]">Loading jobs...</p>}
      {!loading && jobs.length === 0 && (
        <p className="text-xs text-[#9CA3AF]">No jobs found. Add vacancies under Opportunities first.</p>
      )}
      {helperText && <p className="text-xs text-[#6B7280]">{helperText}</p>}
    </div>
  );
}

// ─── Create interview session (general pool slot) ─────────────────────────────
function CreateInterviewSessionTab({ jobs, loading, screeningStatuses, onCreated }) {
  const [applicantKey, setApplicantKey] = useState('');
  const [interviewedAt, setInterviewedAt] = useState(() => getLocalDatetimeString());
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [saving, setSaving] = useState(false);

  const applicantOptions = useMemo(
    () => buildScreeningApplicantOptions(jobs, screeningStatuses),
    [jobs, screeningStatuses]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!interviewedAt) return toast.error('Set interview date and time');
    setSaving(true);
    try {
      const payload = {
        interviewedAt: new Date(interviewedAt).toISOString(),
        googleMeetLink: googleMeetLink.trim(),
        status,
      };
      if (applicantKey) {
        const [userId, jobId] = applicantKey.split('|');
        payload.user = userId;
        payload.vacancy = jobId;
      }
      await api.post('/admin/interviews', payload);
      toast.success('Interview session created');
      setApplicantKey('');
      setGoogleMeetLink('');
      setStatus('scheduled');
      setInterviewedAt(getLocalDatetimeString());
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview Screening Applicant</label>
          <div className="relative">
            <select
              value={applicantKey}
              onChange={e => setApplicantKey(e.target.value)}
              disabled={loading}
              className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
            >
              <option value="">
                {loading
                  ? '— Loading applicants —'
                  : applicantOptions.length === 0
                    ? '— No screening applicants —'
                    : '— Choose an applicant (optional) —'}
              </option>
              {applicantOptions.map(o => (
                <option key={o.key} value={o.key}>
                  {o.name}{o.jobTitle ? ` — ${o.jobTitle}` : ''}{o.company ? ` (${o.company})` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Interview date & time</label>
          <input
            type="datetime-local"
            value={interviewedAt}
            onChange={e => setInterviewedAt(e.target.value)}
            className={inp}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Google Meet link</label>
          <input
            type="url"
            value={googleMeetLink}
            onChange={e => setGoogleMeetLink(e.target.value)}
            placeholder="https://meet.google.com/..."
            className={inp}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Session status</label>
          <div className="relative">
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className={`${inp} appearance-none pr-10 cursor-pointer`}
            >
              <option value="scheduled">Scheduled</option>
              <option value="postponed">Postponed</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00A693] hover:bg-[#008f7e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
        >
          <Plus size={16} />
          {saving ? 'Creating...' : 'Create interview session'}
        </button>
      </div>
    </form>
  );
}

// ─── All Sessions Tab ─────────────────────────────────────────────────────────
function AllSessionsTab({ onEditSession }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/interviews', { params: { limit: 500 } });
      setSessions(res.data.sessions || []);
    } catch {
      toast.error('Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const filtered = sessions.filter(s => {
    const q = search.toLowerCase();
    if (!q) return true;
    const u = s.user;
    const job = s.vacancy;
    return u?.name?.toLowerCase().includes(q) ||
      String(u?.regNumber || '').includes(q) ||
      u?.email?.toLowerCase().includes(q) ||
      job?.title?.toLowerCase().includes(q) ||
      job?.company?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-3 text-[#9CA3AF]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by applicant, job, or email..."
            className={`${inp} pl-9`}
          />
        </div>
        <button
          onClick={fetchSessions}
          className="flex items-center gap-2 px-4 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#6B7280] hover:text-[#1A1A1A] hover:bg-[#F3F0EB] transition shrink-0"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <p className="text-xs text-[#9CA3AF] mb-3">{filtered.length} session{filtered.length !== 1 ? 's' : ''}</p>

      {loading ? (
        <div className="text-center py-16 text-[#9CA3AF]">Loading sessions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#9CA3AF] bg-white border border-[#E5E1DA] rounded-2xl">
          <BookMarked size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium text-[#6B7280]">No interview sessions yet</p>
          <p className="text-sm mt-1">Select a job and applicant in the Interview Session tab, then save a session.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => {
            const u = s.user;
            const correct = (s.mcqAssessments || []).filter(a => a.isCorrect).length;
            const total = (s.mcqAssessments || []).length;
            return (
              <div key={s._id} className="bg-white border border-[#E5E1DA] rounded-2xl p-4 hover:border-[#00A693]/40 transition">
                <div className="flex items-start gap-4">
                  <img
                    src={optimizeImage(u?.avatar, 48) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || '?')}&background=00A693&color=fff`}
                    alt={u?.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#E5E1DA] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-[#1A1A1A]">{u?.name ?? 'Unknown'}</span>
                      {u?.regNumber && <span className="text-[10px] text-[#9CA3AF]">#{u.regNumber}</span>}
                      <span className="text-[10px] font-bold text-[#00A693]">Session #{s.sessionNumber}</span>
                      {s.vacancy && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-[#F3F0EB] text-[#6B7280]">
                          {s.vacancy.title}{s.vacancy.company ? ` · ${s.vacancy.company}` : ''}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        s.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                        s.status === 'postponed' ? 'bg-amber-50 text-amber-700' :
                        s.status === 'cancelled' ? 'bg-red-50 text-red-700' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>{s.status || 'completed'}</span>
                      {s.sharedWithCandidate && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Shared</span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B7280] mb-2">{u?.email}</p>
                    <div className="flex items-center gap-4 flex-wrap text-[11px] text-[#6B7280]">
                      <span>{new Date(s.interviewedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className={`font-bold ${ratingColor(s.overallRating)}`}>{s.overallRating}/10</span>
                      {total > 0 && <span>{correct}/{total} MCQ correct</span>}
                      {s.evaluatedBy && <span>by {s.evaluatedBy.name}</span>}
                    </div>
                    {s.headline && <p className="text-xs font-semibold text-[#1A1A1A] mt-2">"{s.headline}"</p>}
                    {s.mcqAssessments?.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                        {s.mcqAssessments.slice(0, 3).map((a, i) => (
                          <div key={i} className="flex items-start gap-2 text-[10px] bg-[#FAF7F2] rounded-lg px-2 py-1">
                            <span className={`shrink-0 font-bold ${a.isCorrect ? 'text-emerald-600' : 'text-red-400'}`}>{a.isCorrect ? '✓' : '✗'}</span>
                            <span className="truncate text-[#4B5563]">{a.question}</span>
                          </div>
                        ))}
                        {s.mcqAssessments.length > 3 && (
                          <p className="text-[10px] text-[#9CA3AF]">+{s.mcqAssessments.length - 3} more questions</p>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {u && (
                      <button
                        onClick={() => onEditSession(u, s.vacancy, s)}
                        className="p-2 hover:bg-[#F3F0EB] rounded-xl transition text-[#00A693]"
                        title="Open session"
                      >
                        <Edit3 size={14} />
                      </button>
                    )}
                    {s.googleMeetLink && (
                      <a
                        href={s.googleMeetLink.startsWith('http') ? s.googleMeetLink : `https://${s.googleMeetLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-red-50 rounded-xl transition text-red-500"
                        title="Join Meet"
                      >
                        <Video size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminCurationSection() {
  const [tab, setTab] = useState('session');
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedApplicantId, setSelectedApplicantId] = useState('');
  const [modulesApplicant, setModulesApplicant] = useState(null);
  const [modulesVacancy, setModulesVacancy] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [allSessionsCount, setAllSessionsCount] = useState(0);

  const SCREENING_STATUSES = useMemo(
    () => new Set(['contacted', '1 round interview', '2nd round interview', '3rd round interview']),
    []
  );

  const fetchData = async (ignore = false) => {
    try {
      const [vacRes, sessionRes] = await Promise.all([
        api.get('/admin/vacancies'),
        api.get('/admin/interviews?limit=500'),
      ]);
      if (ignore) return;
      const list = Array.isArray(vacRes.data) ? vacRes.data : [];
      // Active + non-active (closed); skip pending reports
      setVacancies(list.filter(v => v.status === 'active' || v.status === 'closed'));
      setAllSessionsCount((sessionRes.data.sessions || []).length);
    } catch { toast.error('Failed to load jobs'); }
    finally { if (!ignore) setLoading(false); }
  };

  useEffect(() => {
    let ignore = false;
    fetchData(ignore); // eslint-disable-line react-hooks/set-state-in-effect
    return () => { ignore = true; };
  }, []);

  const jobs = useMemo(
    () => [...vacancies].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
      return (a.title || '').localeCompare(b.title || '');
    }),
    [vacancies]
  );

  const selectedJob = jobs.find(j => j._id === selectedJobId) || null;

  const jobApplicants = useMemo(() => {
    if (!selectedJob) return [];
    const statusMap = selectedJob.applicantStatus || {};
    return (selectedJob.interests || [])
      .filter(u => {
        if (!u || u.isDeleted) return false;
        const st = statusMap[u._id] || statusMap[u._id?.toString()] || 'applied';
        return SCREENING_STATUSES.has(st);
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [selectedJob, SCREENING_STATUSES]);

  const fetchUpcomingPoolSessions = async (ignore = false) => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/admin/interviews?unassigned=true&limit=200');
      if (!ignore) setUpcomingSessions(filterUpcomingSessions(res.data.sessions));
    } catch {
      if (!ignore) toast.error('Failed to load sessions');
    } finally {
      if (!ignore) setLoadingSessions(false);
    }
  };

  const handleJobSelect = (jobId) => {
    setSelectedJobId(jobId);
    setSelectedApplicantId('');
    setSelectedSessionId('');
    setSelectedSession(null);
    setUpcomingSessions([]);
    setModulesApplicant(null);
    setModulesVacancy(jobId ? (jobs.find(j => j._id === jobId) || null) : null);
    if (tab === 'modules') setTab('session');
  };

  const handleApplicantSelect = (userId) => {
    setSelectedApplicantId(userId);
    setSelectedSessionId('');
    setSelectedSession(null);
    if (!userId || !selectedJob) {
      setModulesApplicant(null);
      setUpcomingSessions([]);
      if (tab === 'modules') setTab('session');
      return;
    }
    const user = jobApplicants.find(u => u._id === userId);
    if (user) {
      setModulesApplicant(user);
      setModulesVacancy(selectedJob);
      fetchUpcomingPoolSessions();
    }
  };

  const handleSessionSelect = async (sessionId) => {
    setSelectedSessionId(sessionId);
    const session = upcomingSessions.find(s => s._id === sessionId) || null;
    setSelectedSession(session);
    if (!sessionId || !selectedApplicantId || !selectedJobId) return;
    try {
      const res = await api.put(`/admin/interviews/${sessionId}`, {
        user: selectedApplicantId,
        vacancy: selectedJobId,
      });
      setSelectedSession(res.data.session);
      setUpcomingSessions(prev => prev.filter(s => s._id !== sessionId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign session');
      setSelectedSessionId('');
      setSelectedSession(null);
    }
  };

  const canOpenModules = Boolean(modulesApplicant && selectedSessionId);

  const handleTabChange = (key) => {
    if (key === 'modules' && !canOpenModules) {
      toast.error('Select a job, applicant, and upcoming session from Interview Session first');
      return;
    }
    setTab(key);
  };

  return (
    <div className={tab === 'modules' ? 'max-w-6xl mx-auto' : 'max-w-5xl mx-auto'}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#F3F0EB] rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: 'session', label: 'Interview Session', icon: ClipboardList },
          { key: 'modules', label: 'Interview Modules', icon: Layers, locked: !canOpenModules },
          { key: 'create', label: 'Create Interview Session', icon: Plus },
          { key: 'sessions', label: 'Interview Sessions', icon: BookMarked, count: allSessionsCount },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            disabled={!!t.locked}
            title={t.locked ? 'Select job, applicant, and upcoming session from Interview Session first' : undefined}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white shadow text-[#1A1A1A]'
                : t.locked
                  ? 'text-[#9CA3AF] opacity-60 cursor-not-allowed'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
            }`}
          >
            <t.icon size={14} /> {t.label}
            {t.count > 0 && (
              <span className="bg-[#00A693]/10 text-[#00A693] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'modules' && canOpenModules ? (
        <AdminInterviewModulesSection
          key={`${modulesApplicant?._id}-${selectedSessionId}`}
          initialApplicant={modulesApplicant}
          initialVacancy={modulesVacancy}
          initialSession={selectedSession}
        />
      ) : tab === 'create' ? (
        <CreateInterviewSessionTab
          jobs={jobs}
          loading={loading}
          screeningStatuses={SCREENING_STATUSES}
          onCreated={() => {
            fetchData();
            if (selectedApplicantId && selectedJobId) fetchUpcomingPoolSessions();
          }}
        />
      ) : tab === 'sessions' ? (
        <AllSessionsTab
          onEditSession={(user, vacancy, session) => {
            setSelectedJobId(vacancy?._id || '');
            setSelectedApplicantId(user._id);
            setModulesApplicant(user);
            setModulesVacancy(vacancy || null);
            setSelectedSessionId(session?._id || '');
            setSelectedSession(session || null);
            setTab('modules');
          }}
        />
      ) : (
        <>
          <ScreeningJobApplicantPicker
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            selectedApplicantId={selectedApplicantId}
            jobApplicants={jobApplicants}
            onJobSelect={handleJobSelect}
            onApplicantSelect={handleApplicantSelect}
          />

          {selectedApplicantId && selectedJobId && (
            <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 mb-6">
              <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Upcoming interview session</label>
              <div className="relative">
                <select
                  value={selectedSessionId}
                  onChange={e => handleSessionSelect(e.target.value)}
                  disabled={loadingSessions}
                  className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
                >
                  <option value="">
                    {loadingSessions
                      ? '— Loading sessions —'
                      : upcomingSessions.length === 0
                        ? '— No upcoming sessions —'
                        : '— Select an upcoming session —'}
                  </option>
                  {upcomingSessions.map(s => (
                    <option key={s._id} value={s._id}>{formatSessionOptionLabel(s)}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#9CA3AF] mt-1.5">
                All unassigned upcoming sessions (scheduled or postponed, future date).
              </p>
              {!loadingSessions && upcomingSessions.length === 0 && (
                <p className="text-xs text-[#6B7280] mt-2">
                  Create a session in the <strong>Create Interview Session</strong> tab first.
                </p>
              )}
              {selectedSessionId && (
                <p className="text-xs text-[#00A693] font-medium mt-2">
                  Session selected — open Interview Modules to run the evaluation.
                </p>
              )}
            </div>
          )}

        </>
      )}
    </div>
  );
}
