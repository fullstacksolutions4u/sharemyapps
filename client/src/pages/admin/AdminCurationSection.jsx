import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Plus, X,
  ClipboardList,
  Edit3, RefreshCw, Trash2,
  Video, BookMarked, Users, ChevronDown, Layers,
  Share2, Copy, ExternalLink
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';
import AdminInterviewModulesSection from './AdminInterviewModulesSection';

const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const AVATAR_COLORS = ['bg-violet-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-teal-500'];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ─── @ user picker (all users, admin) ─────────────────────────────────────────
function AtUserSelect({
  value,
  selectedUser,
  onChange,
  disabled,
  placeholder = 'Type @ to search users...',
  label,
}) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [input, setInput] = useState('');
  const [showDrop, setShowDrop] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    let ignore = false;
    api.get('/admin/users')
      .then(res => {
        if (!ignore) setUsers((res.data || []).filter(u => !u.isDeleted));
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoadingUsers(false); });
    return () => { ignore = true; };
  }, []);

  const atIdx = input.lastIndexOf('@');
  const query = atIdx < 0 ? null : input.slice(atIdx + 1).trim().toLowerCase();

  const filtered = useMemo(() => {
    if (query === null) return [];
    if (!query) return users.slice(0, 80);
    return users.filter(u =>
      (u.name || '').toLowerCase().includes(query) ||
      (u.email || '').toLowerCase().includes(query)
    ).slice(0, 40);
  }, [users, query]);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setShowDrop(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pickUser = (u) => {
    onChange(u._id, u);
    setInput('');
    setShowDrop(false);
  };

  const clear = () => {
    onChange('', null);
    setInput('');
  };

  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">{label}</label>
      )}
      {selectedUser && value && (
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 bg-[#F3F0EB] border border-[#E5E1DA] text-[#1A1A1A] text-xs font-medium px-2.5 py-1.5 rounded-full">
            {selectedUser.avatar
              ? <img src={optimizeImage(selectedUser.avatar, 150)} alt={selectedUser.name} className="w-4 h-4 rounded-full object-cover" />
              : <span className={`w-4 h-4 rounded-full ${avatarColor(selectedUser.name)} text-white text-[9px] flex items-center justify-center font-semibold`}>{selectedUser.name?.[0]?.toUpperCase()}</span>
            }
            {selectedUser.name}
            <button type="button" onClick={clear} className="text-[#9CA3AF] hover:text-red-400 transition-colors ml-0.5">
              <X size={11} />
            </button>
          </span>
        </div>
      )}
      <div className="relative" ref={ref}>
        <input
          type="text"
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (e.target.value.includes('@')) setShowDrop(true);
          }}
          onFocus={() => { if (input.includes('@')) setShowDrop(true); }}
          disabled={disabled || loadingUsers}
          placeholder={loadingUsers ? 'Loading users...' : placeholder}
          className={inp}
        />
        {showDrop && filtered.length > 0 && (
          <ul className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#E5E1DA] rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
            {filtered.map(u => (
              <li key={u._id}>
                <button
                  type="button"
                  onMouseDown={() => pickUser(u)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#F3F0EB] transition-colors text-left"
                >
                  {u.avatar
                    ? <img src={optimizeImage(u.avatar, 150)} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    : <span className={`w-7 h-7 rounded-full ${avatarColor(u.name)} text-white text-xs flex items-center justify-center font-semibold shrink-0`}>{u.name?.[0]?.toUpperCase()}</span>
                  }
                  <div className="min-w-0">
                    <p className="text-sm text-[#1A1A1A] truncate">{u.name}</p>
                    {u.email && <p className="text-[11px] text-[#6B7280] truncate">{u.email}</p>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ratingColor = (r) => r >= 8 ? 'text-emerald-600' : r >= 6 ? 'text-amber-500' : 'text-red-500';

const getLocalDatetimeString = (date = new Date()) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const ACTIVE_UPCOMING_STATUSES = new Set(['scheduled', 'postponed']);

function filterUpcomingSessions(sessions, { applicantId, jobId } = {}) {
  const now = Date.now();
  return (sessions || [])
    .filter(s => {
      if (!ACTIVE_UPCOMING_STATUSES.has(s.status)) return false;
      if (new Date(s.interviewedAt).getTime() < now - 60_000) return false;

      const sessionUserId = String(s.user?._id || s.user || '');
      if (!sessionUserId) return true;

      if (!applicantId || sessionUserId !== String(applicantId)) return false;
      if (!jobId) return true;
      const sessionVacancyId = String(s.vacancy?._id || s.vacancy || '');
      return !sessionVacancyId || sessionVacancyId === String(jobId);
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

function formatJobOptionLabel(job) {
  return job.title || '';
}

// ─── Quick add evaluation vacancy (interview + report, not on Opportunities) ───
function QuickInterviewVacancyModal({ open, onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Job title is required');
    setSaving(true);
    try {
      const res = await api.post('/admin/vacancies', {
        title: title.trim(),
        company: company.trim(),
        description: 'Vacancy for conducting interviews and preparing evaluation reports.',
        listOnOpportunities: false,
        status: 'active',
      });
      toast.success('Vacancy created — ready for interview and evaluation');
      onCreated?.(res.data);
      setTitle('');
      setCompany('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create vacancy');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Add evaluation vacancy</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Job title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className={inp}
              placeholder="e.g. Senior React Developer"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Company (optional)</label>
            <input
              value={company}
              onChange={e => setCompany(e.target.value)}
              className={inp}
              placeholder="Company name"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[#E5E1DA] rounded-xl text-sm font-medium text-[#6B7280] hover:bg-[#F3F0EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#00A693] hover:bg-[#008f7e] disabled:opacity-50 text-white rounded-xl text-sm font-semibold"
            >
              {saving ? 'Adding...' : 'Add vacancy'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Job + applicant picker (screening pool) ──────────────────────────────────
function ScreeningJobApplicantPicker({
  jobs,
  loading,
  selectedJobId,
  selectedApplicantId,
  selectedApplicant,
  onJobSelect,
  onApplicantSelect,
  onAddVacancy,
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
        <div className="flex items-stretch gap-2">
          <div className="relative flex-1 min-w-0">
            <select
              value={selectedJobId}
              onChange={e => onJobSelect(e.target.value)}
              disabled={loading}
              className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
            >
              <option value="">— Choose a job —</option>
              {jobs.map(j => (
                <option key={j._id} value={j._id}>{formatJobOptionLabel(j)}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>
          {onAddVacancy && (
            <button
              type="button"
              onClick={onAddVacancy}
              title="Add vacancy for interview & evaluation"
              className="shrink-0 w-11 rounded-xl border border-[#00A693] bg-[#00A693]/10 text-[#00A693] hover:bg-[#00A693] hover:text-white transition flex items-center justify-center"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      <AtUserSelect
        label="Interview Screening Applicant"
        value={selectedApplicantId}
        selectedUser={selectedApplicant}
        onChange={onApplicantSelect}
        disabled={loading}
        placeholder="Type @ to search and select a user..."
      />

      {loading && <p className="text-xs text-[#9CA3AF]">Loading jobs...</p>}
      {!loading && jobs.length === 0 && (
        <p className="text-xs text-[#9CA3AF]">No jobs found. Use + to add a vacancy for interview and evaluation.</p>
      )}
      {helperText && <p className="text-xs text-[#6B7280]">{helperText}</p>}
    </div>
  );
}

// ─── Create interview session (general pool slot) ─────────────────────────────
function CreateInterviewSessionTab({ jobs, loading, onCreated, onAddVacancy, initialJobId = '' }) {
  const [jobId, setJobId] = useState(initialJobId);
  const [applicantId, setApplicantId] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [interviewedAt, setInterviewedAt] = useState(() => getLocalDatetimeString());
  const [googleMeetLink, setGoogleMeetLink] = useState('');
  const [status, setStatus] = useState('scheduled');
  const [saving, setSaving] = useState(false);

  const handleJobChange = (id) => {
    setJobId(id);
    setApplicantId('');
    setSelectedApplicant(null);
  };

  const handleApplicantChange = (userId, user) => {
    setApplicantId(userId);
    setSelectedApplicant(user);
  };

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
      if (applicantId) payload.user = applicantId;
      if (jobId) payload.vacancy = jobId;
      await api.post('/admin/interviews', payload);
      toast.success('Interview session created');
      setJobId('');
      setApplicantId('');
      setSelectedApplicant(null);
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
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Job / Vacancy</label>
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1 min-w-0">
              <select
                value={jobId}
                onChange={e => handleJobChange(e.target.value)}
                disabled={loading}
                className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
              >
                <option value="">— Choose a job (optional) —</option>
                {jobs.map(j => (
                  <option key={j._id} value={j._id}>{formatJobOptionLabel(j)}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
            </div>
            {onAddVacancy && (
              <button
                type="button"
                onClick={onAddVacancy}
                title="Add vacancy for interview & evaluation"
                className="shrink-0 w-11 rounded-xl border border-[#00A693] bg-[#00A693]/10 text-[#00A693] hover:bg-[#00A693] hover:text-white transition flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>

        <AtUserSelect
          label="Interview Screening Applicant"
          value={applicantId}
          selectedUser={selectedApplicant}
          onChange={handleApplicantChange}
          disabled={loading}
          placeholder="Type @ to search and select a user (optional)..."
        />

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
      const testNames = new Set(['Amir Ali', 'Tony Sunny']);
      setSessions((res.data.sessions || []).filter(s => !s.user || !testNames.has(s.user.name)));
    } catch {
      toast.error('Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []); // eslint-disable-line react-hooks/set-state-in-effect

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Delete this interview session? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/interviews/${sessionId}`);
      setSessions(prev => prev.filter(s => s._id !== sessionId));
      toast.success('Session deleted');
    } catch {
      toast.error('Failed to delete session');
    }
  };

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
                    <button
                      onClick={() => deleteSession(s._id)}
                      className="p-2 hover:bg-red-50 rounded-xl transition text-red-400 hover:text-red-600"
                      title="Delete session"
                    >
                      <Trash2 size={14} />
                    </button>
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

// ─── Share Profiles Tab ────────────────────────────────────────────────────────
function ShareProfilesTab({ jobs, loading }) {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [sessionCount, setSessionCount] = useState(0);

  const selectedJob = jobs.find(j => j._id === selectedJobId) || null;

  useEffect(() => {
    if (!selectedJobId) {
      return;
    }
    // Quick fetch to get count of sessions for this vacancy
    api.get('/admin/interviews?limit=500').then(res => {
      const validSessions = (res.data.sessions || []).filter(s => s.vacancy && String(s.vacancy._id || s.vacancy) === selectedJobId);
      setSessionCount(validSessions.length);
    }).catch(() => {});
  }, [selectedJobId]);

  const copyLink = () => {
    const link = `${window.location.origin}/shared-profiles/${selectedJobId}`;
    navigator.clipboard.writeText(link);
    toast.success('Shareable link copied to clipboard');
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#6B7280] mb-1.5">Select Job / Vacancy</label>
          <div className="relative">
            <select
              value={selectedJobId}
              onChange={e => {
                const val = e.target.value;
                setSelectedJobId(val);
                if (!val) setSessionCount(0);
              }}
              disabled={loading}
              className={`${inp} appearance-none pr-10 cursor-pointer disabled:opacity-60`}
            >
              <option value="">— Choose a job —</option>
                  {jobs.map(j => (
                    <option key={j._id} value={j._id}>{formatJobOptionLabel(j)}</option>
                  ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          </div>
        </div>
        
        {selectedJobId && (
          <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E5E1DA]">
            <p className="text-sm font-medium text-[#1A1A1A] mb-1">Vacancy selected: {selectedJob?.title}</p>
            <p className="text-xs text-[#6B7280] mb-4">
              Found <strong className="text-[#00A693]">{sessionCount}</strong> shortlisted candidates with evaluation reports.
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={copyLink}
                disabled={sessionCount === 0}
                className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-[#00A693] hover:bg-[#008f7e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
              >
                <Copy size={16} /> Copy Shareable Link
              </button>
              
              <a
                href={`/shared-profiles/${selectedJobId}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 border border-[#E5E1DA] text-[#6B7280] hover:text-[#1A1A1A] hover:bg-white rounded-xl text-sm font-semibold transition ${sessionCount === 0 ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <ExternalLink size={16} /> Preview
              </a>
            </div>
          </div>
        )}
      </div>
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
  const [showVacancyModal, setShowVacancyModal] = useState(false);
  const [createTabSelectJobId, setCreateTabSelectJobId] = useState('');

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
      const testNames = new Set(['Amir Ali', 'Tony Sunny']);
      const validSessions = (sessionRes.data.sessions || []).filter(s => !s.user || !testNames.has(s.user.name));
      setAllSessionsCount(validSessions.length);
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

  const fetchUpcomingPoolSessions = async (ignore = false, applicantId = selectedApplicantId, jobId = selectedJobId) => {
    if (!applicantId || !jobId) return;
    setLoadingSessions(true);
    try {
      const [poolRes, userRes] = await Promise.all([
        api.get('/admin/interviews?unassigned=true&limit=200'),
        api.get(`/admin/interviews/user/${applicantId}`),
      ]);
      if (!ignore) {
        const merged = [...(poolRes.data.sessions || []), ...(userRes.data.sessions || [])];
        const seen = new Set();
        const unique = merged.filter(s => {
          if (seen.has(s._id)) return false;
          seen.add(s._id);
          return true;
        });
        setUpcomingSessions(filterUpcomingSessions(unique, { applicantId, jobId }));
      }
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

  const handleApplicantSelect = (userId, user) => {
    setSelectedApplicantId(userId);
    setSelectedSessionId('');
    setSelectedSession(null);
    if (!userId || !selectedJob) {
      setModulesApplicant(null);
      setUpcomingSessions([]);
      if (tab === 'modules') setTab('session');
      return;
    }
    setModulesApplicant(user);
    setModulesVacancy(selectedJob);
    fetchUpcomingPoolSessions(false, userId, selectedJob._id);
  };

  const handleSessionSelect = async (sessionId) => {
    if (!sessionId) {
      setSelectedSessionId('');
      setSelectedSession(null);
      return;
    }

    setSelectedSessionId(sessionId);
    const session = upcomingSessions.find(s => s._id === sessionId) || null;
    setSelectedSession(session);
    if (!selectedApplicantId || !selectedJobId) return;

    const sessionUserId = String(session?.user?._id || session?.user || '');
    if (sessionUserId === String(selectedApplicantId)) {
      setTab('modules');
      return;
    }

    try {
      const res = await api.put(`/admin/interviews/${sessionId}`, {
        user: selectedApplicantId,
        vacancy: selectedJobId,
      });
      setSelectedSession(res.data.session);
      setUpcomingSessions(prev => prev.filter(s => s._id !== sessionId));
      setTab('modules');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign session');
      setSelectedSessionId('');
      setSelectedSession(null);
    }
  };



  const handleTabChange = (key) => {
    setTab(key);
  };

  const handleInterviewVacancyCreated = async (vacancy) => {
    await fetchData();
    if (vacancy?._id) {
      setSelectedJobId(vacancy._id);
      setSelectedApplicantId('');
      setCreateTabSelectJobId(vacancy._id);
    }
  };

  return (
    <div className={tab === 'modules' ? 'max-w-6xl mx-auto' : 'max-w-5xl mx-auto'}>
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-[#F3F0EB] rounded-2xl p-1 mb-6 w-fit">
        {[
          { key: 'session', label: 'Interview Session', icon: ClipboardList },
          { key: 'modules', label: 'Interview Modules', icon: Layers },
          { key: 'create', label: 'Create Interview Session', icon: Plus },
          { key: 'sessions', label: 'Interview Sessions', icon: BookMarked, count: allSessionsCount },
          { key: 'share', label: 'Share Profiles', icon: Share2 },
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => handleTabChange(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              tab === t.key
                ? 'bg-white shadow text-[#1A1A1A]'
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

      {tab === 'modules' ? (
        <AdminInterviewModulesSection
          key={`${modulesApplicant?._id || 'none'}-${selectedSessionId || 'none'}`}
          initialApplicant={modulesApplicant}
          initialVacancy={modulesVacancy}
          initialSession={selectedSession}
        />
      ) : tab === 'create' ? (
        <CreateInterviewSessionTab
          key={createTabSelectJobId || 'create-session'}
          jobs={jobs}
          loading={loading}
          initialJobId={createTabSelectJobId}
          onAddVacancy={() => setShowVacancyModal(true)}
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
      ) : tab === 'share' ? (
        <ShareProfilesTab jobs={jobs} loading={loading} />
      ) : (
        <>
          <ScreeningJobApplicantPicker
            jobs={jobs}
            loading={loading}
            selectedJobId={selectedJobId}
            selectedApplicantId={selectedApplicantId}
            selectedApplicant={modulesApplicant}
            onJobSelect={handleJobSelect}
            onApplicantSelect={handleApplicantSelect}
            onAddVacancy={() => setShowVacancyModal(true)}
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
              {!loadingSessions && upcomingSessions.length === 0 && (
                <p className="text-xs text-[#6B7280] mt-2">
                  Create a session in the <strong>Create Interview Session</strong> tab first.
                </p>
              )}
            </div>
          )}

        </>
      )}

      <QuickInterviewVacancyModal
        open={showVacancyModal}
        onClose={() => setShowVacancyModal(false)}
        onCreated={handleInterviewVacancyCreated}
      />
    </div>
  );
}
