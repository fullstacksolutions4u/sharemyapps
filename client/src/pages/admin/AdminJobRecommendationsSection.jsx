import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Send, CalendarClock, RotateCcw, Pencil, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_JOB = { emailId: '', subject: '' };
const EMPTY_LINK = { company: '', url: '' };
const DEFAULT_ROWS = 10;
const DEFAULT_LINK_ROWS = 3;
const emptyJobs = () => Array.from({ length: DEFAULT_ROWS }, () => ({ ...EMPTY_JOB }));
const emptyLinks = () => Array.from({ length: DEFAULT_LINK_ROWS }, () => ({ ...EMPTY_LINK }));
const inp = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminJobRecommendationsSection() {
  const [jobs, setJobs] = useState(emptyJobs);
  const [links, setLinks] = useState(emptyLinks);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [sending, setSending] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingSessionSent, setEditingSessionSent] = useState(false);
  const [sessionPage, setSessionPage] = useState(1);
  const SESSIONS_PER_PAGE = 5;

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    api.get('/admin/job-recommendations/premium-users')
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load eligible users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  const loadSessions = useCallback(() => {
    setLoadingSessions(true);
    api.get('/admin/job-recommendations/sessions')
      .then(res => setSessions(res.data.sessions || []))
      .catch(() => toast.error('Failed to load session history'))
      .finally(() => setLoadingSessions(false));
  }, []);

  useEffect(() => { loadUsers(); loadSessions(); }, [loadUsers, loadSessions]); // eslint-disable-line react-hooks/set-state-in-effect

  const sessionLinks = (session) =>
    session.careerLinks?.length ? session.careerLinks.map(l => ({ company: l.company, url: l.url })) : emptyLinks();

  const handleReuseSession = (session) => {
    setEditingSessionId(null);
    setEditingSessionSent(false);
    setJobs(session.jobs.length ? session.jobs.map(j => ({ emailId: j.emailId, subject: j.subject })) : emptyJobs());
    setLinks(sessionLinks(session));
    setSelectedIds(new Set());
    setScheduledAt('');
    toast.success(`Loaded companies from Session ${session.sessionNumber} — select users to send`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session._id);
    setEditingSessionSent(!!session.notified);
    setJobs(session.jobs.length ? session.jobs.map(j => ({ emailId: j.emailId, subject: j.subject })) : emptyJobs());
    setLinks(sessionLinks(session));
    // Filter recipients to only include users that are currently visible in the list
    const validRecipients = (session.recipients || []).filter(id => users.some(u => u._id === id));
    setSelectedIds(new Set(validRecipients));
    setScheduledAt(session.notified ? '' : toDatetimeLocal(session.scheduledAt));
    toast.success(`Editing Session ${session.sessionNumber}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteSession = async (session) => {
    const confirmMsg = session.notified
      ? `Delete Session ${session.sessionNumber} from history? This cannot be undone.`
      : `Cancel and delete scheduled Session ${session.sessionNumber}? Users will not be notified. This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;
    try {
      await api.delete(`/admin/job-recommendations/sessions/${session._id}`);
      if (editingSessionId === session._id) cancelEdit();
      toast.success(`Session ${session.sessionNumber} deleted`);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session');
    }
  };

  const cancelEdit = () => {
    setEditingSessionId(null);
    setEditingSessionSent(false);
    setJobs(emptyJobs());
    setLinks(emptyLinks());
    setSelectedIds(new Set());
    setScheduledAt('');
  };

  const handleJobChange = (i, field, value) => {
    setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: value } : j));
  };

  const addRow = () => setJobs(prev => [...prev, { ...EMPTY_JOB }]);
  const removeRow = (i) => setJobs(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const handleLinkChange = (i, field, value) => {
    setLinks(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: value } : l));
  };

  const addLinkRow = () => setLinks(prev => [...prev, { ...EMPTY_LINK }]);
  const removeLinkRow = (i) => setLinks(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const validJobs = jobs.filter(j => j.emailId.trim() && j.subject.trim());
  const validLinks = links.filter(l => l.company.trim() && l.url.trim());

  const sessionPageCount = Math.max(1, Math.ceil(sessions.length / SESSIONS_PER_PAGE));
  const currentSessionPage = Math.min(sessionPage, sessionPageCount);
  const paginatedSessions = sessions.slice((currentSessionPage - 1) * SESSIONS_PER_PAGE, currentSessionPage * SESSIONS_PER_PAGE);

  const toggleUser = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSend = async () => {
    if (validJobs.length === 0 && validLinks.length === 0) { toast.error('Add at least one job (company name + email id) or one career page link'); return; }
    if (selectedIds.size === 0 && !editingSessionSent) { toast.error('Select at least one user'); return; }
    setSending(true);
    try {
      const scheduledAtISO = scheduledAt ? new Date(scheduledAt).toISOString() : undefined;

      if (editingSessionId) {
        // Sent sessions: only the company/email list can change — recipients & schedule are locked
        const res = await api.put(`/admin/job-recommendations/sessions/${editingSessionId}`, editingSessionSent
          ? { jobs: validJobs, careerLinks: validLinks }
          : {
              jobs: validJobs,
              careerLinks: validLinks,
              userIds: [...selectedIds],
              scheduledAt: scheduledAtISO || new Date().toISOString(),
            });
        toast.success(`Session ${res.data.session.sessionNumber} updated`);
        cancelEdit();
        loadSessions();
        return;
      }

      const res = await api.post('/admin/job-recommendations/send', {
        jobs: validJobs,
        careerLinks: validLinks,
        userIds: [...selectedIds],
        scheduledAt: scheduledAtISO,
      });
      if (res.data.scheduled) {
        toast.success(`Scheduled for ${new Date(res.data.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${res.data.total} user${res.data.total === 1 ? '' : 's'}`);
      } else {
        toast.success(`Sent to ${res.data.sent} of ${res.data.total} selected user${res.data.total === 1 ? '' : 's'}${res.data.failed ? ` (${res.data.failed} failed)` : ''}`);
      }
      setJobs(emptyJobs());
      setLinks(emptyLinks());
      setScheduledAt('');
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || (editingSessionId ? 'Failed to update session' : 'Failed to send recommendations'));
    } finally {
      setSending(false);
    }
  };

  const isScheduling = !!scheduledAt;

  return (
    <div className="space-y-6">
      {editingSessionId && (
        <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-amber-800">
            {editingSessionSent
              ? 'Editing sent session — you can update the company/email list (e.g. remove rejected emails). Recipients will not be re-notified.'
              : 'Editing scheduled session — changes will update this session instead of creating a new one.'}
          </p>
          <button
            onClick={cancelEdit}
            className="flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 shrink-0"
          >
            <X size={13} /> Cancel edit
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {jobs.map((job, i) => (
                  <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                    <td className="py-2 pr-3 text-[#6B7280] text-center">{i + 1}</td>
                    <td className="py-2 pr-3">
                      <input
                        value={job.subject}
                        onChange={e => handleJobChange(i, 'subject', e.target.value)}
                        placeholder="Company name"
                        className={inp}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <input
                        type="email"
                        value={job.emailId}
                        onChange={e => handleJobChange(i, 'emailId', e.target.value)}
                        placeholder="Email id to send CV"
                        className={inp}
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeRow(i)}
                        disabled={jobs.length === 1}
                        className="p-2 rounded-lg border border-[#E5E1DA] text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm font-medium text-[#00A693] hover:text-[#007D6F] transition-colors"
          >
            <Plus size={14} /> Add another job
          </button>
        </div>

        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          {loadingUsers ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading premium users…</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">
              No users with resume &amp; cover letter delivered yet.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 border border-[#F3F0EB] rounded-xl p-2">
              {users.map(u => (
                <label
                  key={u._id}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F3F0EB] cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u._id)}
                    onChange={() => toggleUser(u._id)}
                    disabled={editingSessionSent}
                    className="accent-[#00A693] w-4 h-4 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-[#1A1A1A]">{u.name}</span>
                  <span className="text-xs text-[#9CA3AF]">{u.email}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {links.map((link, i) => (
                <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                  <td className="py-2 pr-3 text-[#6B7280] text-center">{i + 1}</td>
                  <td className="py-2 pr-3 w-1/3">
                    <input
                      value={link.company}
                      onChange={e => handleLinkChange(i, 'company', e.target.value)}
                      placeholder="Company name"
                      className={inp}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => handleLinkChange(i, 'url', e.target.value)}
                      placeholder="Career page link (https://…)"
                      className={inp}
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => removeLinkRow(i)}
                      disabled={links.length === 1}
                      className="p-2 rounded-lg border border-[#E5E1DA] text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={addLinkRow}
          className="flex items-center gap-1.5 text-sm font-medium text-[#00A693] hover:text-[#007D6F] transition-colors"
        >
          <Plus size={14} /> Add another link
        </button>
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <CalendarClock size={15} className="text-[#9CA3AF]" />
          <label className="text-sm font-medium text-[#1A1A1A]">Schedule for</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            disabled={editingSessionSent}
            className="border border-[#E5E1DA] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#00A693] disabled:opacity-40 disabled:cursor-not-allowed"
          />
          {scheduledAt && (
            <button
              onClick={() => setScheduledAt('')}
              className="text-xs text-[#9CA3AF] hover:text-red-500 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex justify-center gap-2 flex-wrap">
          {editingSessionId && (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-[#E5E1DA] text-[#6B7280] hover:text-red-500 hover:bg-red-50 text-sm font-medium rounded-xl transition-colors"
            >
              <X size={14} /> Cancel
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={sending || (validJobs.length === 0 && validLinks.length === 0) || (selectedIds.size === 0 && !editingSessionSent)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            {editingSessionId
              ? (sending
                  ? 'Updating…'
                  : editingSessionSent
                    ? 'Update Sent Session'
                    : `Update Session for ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`)
              : sending
                ? (isScheduling ? 'Scheduling…' : 'Sending…')
                : isScheduling
                  ? `Schedule for ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`
                  : `Send Now to ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">

        {loadingSessions ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">No sessions sent yet.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {paginatedSessions.map(session => (
              <div
                key={session._id}
                className="flex items-center justify-between gap-3 border border-[#F3F0EB] rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#1A1A1A]">Session {session.sessionNumber}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      session.notified
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {session.notified ? 'Sent' : 'Scheduled'}
                    </span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-1">
                    {new Date(session.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    {!session.notified && session.scheduledAt && (
                      <> {' · '}Scheduled for {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                    )}
                    {' · '}{session.jobs.length} compan{session.jobs.length === 1 ? 'y' : 'ies'}
                    {session.careerLinks?.length > 0 && <> {' · '}{session.careerLinks.length} link{session.careerLinks.length === 1 ? '' : 's'}</>}
                    {' · '}{session.recipientCount} recipient{session.recipientCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1 truncate">
                    {[...session.jobs.map(j => j.subject), ...(session.careerLinks || []).map(l => l.company)].join(', ')}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEditSession(session)}
                    className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-900 border border-amber-300 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleReuseSession(session)}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#00A693] hover:text-[#007D6F] border border-[#00A693]/30 hover:bg-[#F0FBF9] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw size={12} /> Reuse
                  </button>
                  <button
                    onClick={() => handleDeleteSession(session)}
                    className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loadingSessions && sessions.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-[#9CA3AF]">
              Page {currentSessionPage} of {sessionPageCount}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSessionPage(p => Math.max(1, p - 1))}
                disabled={currentSessionPage === 1}
                className="text-xs font-medium text-[#00A693] hover:text-[#007D6F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setSessionPage(p => Math.min(sessionPageCount, p + 1))}
                disabled={currentSessionPage === sessionPageCount}
                className="text-xs font-medium text-[#00A693] hover:text-[#007D6F] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
