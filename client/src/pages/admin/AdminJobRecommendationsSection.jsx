import { useState, useEffect, useCallback, Fragment } from 'react';
import { Plus, Trash2, Send, CalendarClock, RotateCcw, Pencil, X, CheckCircle2, MessageSquare, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_JOB = { emailId: '', subject: '', gotResponse: false, comment: '', showComment: false };
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
  const [editingSessionRecipients, setEditingSessionRecipients] = useState([]);
  const [sessionPage, setSessionPage] = useState(1);
  const SESSIONS_PER_PAGE = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [reusedFromSessionNumber, setReusedFromSessionNumber] = useState(null);

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
    setReusedFromSessionNumber(session.sessionNumber);
    setEditingSessionSent(false);
    setEditingSessionRecipients([]);
    setJobs(session.jobs.length ? session.jobs.map(j => ({ 
      emailId: j.emailId, 
      subject: j.subject, 
      gotResponse: !!j.gotResponse, 
      comment: j.comment || '', 
      showComment: !!j.comment 
    })) : emptyJobs());
    setLinks(sessionLinks(session));
    setSelectedIds(new Set());
    setScheduledAt('');
    toast.success(`Loaded companies from Session ${session.sessionNumber} — select users to send`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditSession = (session) => {
    setEditingSessionId(session._id);
    setEditingSessionSent(!!session.notified);
    setJobs(session.jobs.length ? session.jobs.map(j => ({ 
      emailId: j.emailId, 
      subject: j.subject, 
      gotResponse: !!j.gotResponse, 
      comment: j.comment || '', 
      showComment: !!j.comment 
    })) : emptyJobs());
    setLinks(sessionLinks(session));
    if (session.notified) {
      setEditingSessionRecipients(session.recipients || []);
      setSelectedIds(new Set((session.recipients || []).map(r => r._id)));
    } else {
      setEditingSessionRecipients([]);
      const validRecipients = (session.recipients || []).filter(r => users.some(u => u._id === r._id));
      setSelectedIds(new Set(validRecipients.map(r => r._id)));
    }
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
    setReusedFromSessionNumber(null);
    setEditingSessionSent(false);
    setEditingSessionRecipients([]);
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

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const companies = [...session.jobs.map(j => j.subject), ...(session.careerLinks || []).map(l => l.company)];
    return companies.some(c => c.toLowerCase().includes(q));
  });

  const sessionPageCount = Math.max(1, Math.ceil(filteredSessions.length / SESSIONS_PER_PAGE));
  const currentSessionPage = Math.min(sessionPage, sessionPageCount);
  const paginatedSessions = filteredSessions.slice((currentSessionPage - 1) * SESSIONS_PER_PAGE, currentSessionPage * SESSIONS_PER_PAGE);

  const renderHighlightedCompanies = (session, query) => {
    const companies = [...session.jobs.map(j => j.subject), ...(session.careerLinks || []).map(l => l.company)];
    const joined = companies.join(', ');
    if (!query.trim()) return joined;
    
    const parts = joined.split(new RegExp(`(${query.trim()})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.trim().toLowerCase() ? <span key={i} className="bg-amber-200 text-amber-900 font-medium px-0.5 rounded">{part}</span> : part
    );
  };

  const toggleUser = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSend = async (isDraft = false) => {
    if (validJobs.length === 0 && validLinks.length === 0) { toast.error('Add at least one job (company name + email id) or one career page link'); return; }
    if (!isDraft && selectedIds.size === 0 && !editingSessionSent) { toast.error('Select at least one user'); return; }
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
              scheduledAt: scheduledAtISO || (isDraft ? null : new Date().toISOString()),
              isDraft,
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
        reusedFromSessionNumber,
        isDraft,
      });
      if (res.data.draft) {
        toast.success(`Draft Session ${res.data.sessionNumber} saved`);
      } else if (res.data.scheduled) {
        toast.success(`Scheduled for ${new Date(res.data.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${res.data.total} user${res.data.total === 1 ? '' : 's'}`);
      } else {
        toast.success(`Sent to ${res.data.sent} of ${res.data.total} selected user${res.data.total === 1 ? '' : 's'}${res.data.failed ? ` (${res.data.failed} failed)` : ''}`);
      }
      setJobs(emptyJobs());
      setLinks(emptyLinks());
      setScheduledAt('');
      setReusedFromSessionNumber(null);
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

      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-6">
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {jobs.map((job, i) => (
                  <Fragment key={i}>
                    <tr className="border-b border-[#F3F0EB] last:border-0">
                      <td className="py-2 pr-3 text-[#6B7280] text-center">{i + 1}</td>
                      <td className="py-2 pr-3 w-[25rem]">
                        <input
                          value={job.subject}
                          onChange={e => handleJobChange(i, 'subject', e.target.value)}
                          placeholder="Company name"
                          className={inp}
                        />
                      </td>
                      <td className="py-2 pr-3 w-[21rem]">
                        <input
                          type="email"
                          value={job.emailId}
                          onChange={e => handleJobChange(i, 'emailId', e.target.value)}
                          placeholder="Email id to send CV"
                          className={inp}
                        />
                      </td>
                      <td className="py-2">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => handleJobChange(i, 'gotResponse', !job.gotResponse)}
                            className={`p-2 rounded-lg border transition-colors ${
                              job.gotResponse 
                                ? 'bg-green-100 border-green-200 text-green-700' 
                                : 'border-[#E5E1DA] text-[#9CA3AF] hover:text-green-500 hover:bg-green-50'
                            }`}
                            title="Applicant got interview call/response"
                          >
                            <CheckCircle2 size={14} />
                          </button>
                          <button
                            onClick={() => handleJobChange(i, 'showComment', !job.showComment)}
                            className={`p-2 rounded-lg border transition-colors ${
                              job.comment || job.showComment
                                ? 'bg-blue-100 border-blue-200 text-blue-700' 
                                : 'border-[#E5E1DA] text-[#9CA3AF] hover:text-blue-500 hover:bg-blue-50'
                            }`}
                            title="Add comment"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => removeRow(i)}
                            disabled={jobs.length === 1}
                            className="p-2 rounded-lg border border-[#E5E1DA] text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {job.showComment && (
                      <tr className="border-b border-[#F3F0EB]">
                        <td colSpan={4} className="pb-3 pt-1">
                          <div className="flex gap-2 items-start bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                            <MessageSquare size={14} className="text-blue-400 mt-2 shrink-0 ml-1" />
                            <textarea
                              value={job.comment}
                              onChange={e => handleJobChange(i, 'comment', e.target.value)}
                              placeholder="Add comment..."
                              className="w-full px-3 py-1.5 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-300/10 transition resize-none"
                              rows={1}
                            />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
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
          ) : users.length === 0 && !editingSessionSent ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">
              No users with resume &amp; cover letter delivered yet.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1 border border-[#F3F0EB] rounded-xl p-2">
              {(editingSessionSent ? editingSessionRecipients : users).map(u => (
                <label
                  key={u._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${editingSessionSent ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#F3F0EB] cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(u._id)}
                    onChange={() => toggleUser(u._id)}
                    disabled={editingSessionSent}
                    className="accent-[#00A693] w-4 h-4 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm font-medium text-[#1A1A1A]">{u.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr] gap-6 items-start">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {links.map((link, i) => (
                <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                  <td className="py-2 pr-3 text-[#6B7280] text-center">{i + 1}</td>
                  <td className="py-2 pr-3 w-[25rem]">
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
          {!editingSessionSent && (
            <button
              onClick={() => handleSend(true)}
              disabled={sending || (validJobs.length === 0 && validLinks.length === 0)}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-[#00A693] text-[#00A693] hover:bg-[#F0FBF9] text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Save size={14} />
              {editingSessionId ? 'Update Draft' : 'Save as Draft'}
            </button>
          )}
          <button
            onClick={() => handleSend(false)}
            disabled={sending || (validJobs.length === 0 && validLinks.length === 0) || (selectedIds.size === 0 && !editingSessionSent)}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={14} />
            {editingSessionId
              ? (sending
                  ? 'Updating…'
                  : editingSessionSent
                    ? 'Update Sent Session'
                    : `Update & Send to ${selectedIds.size} User${selectedIds.size === 1 ? '' : 's'}`)
              : sending
                ? (isScheduling ? 'Scheduling…' : 'Sending…')
                : isScheduling
                  ? `Schedule for ${selectedIds.size} User${selectedIds.size === 1 ? '' : 's'}`
                  : `Send to ${selectedIds.size} User${selectedIds.size === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-sm text-[#1A1A1A]">Session History</h3>
          <input
            type="text"
            placeholder="Search company..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSessionPage(1); }}
            className="px-3 py-1.5 border border-[#E5E1DA] rounded-lg text-xs text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] transition w-48"
          />
        </div>

        {loadingSessions ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">No sessions sent yet.</div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">No matching companies found in any session.</div>
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
                    {session.reusedFromSessionNumber && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
                        Reused from Session {session.reusedFromSessionNumber}
                      </span>
                    )}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                      session.notified
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : session.isDraft
                          ? 'bg-gray-50 text-gray-700 border-gray-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {session.notified ? 'Sent' : session.isDraft ? 'Draft' : 'Scheduled'}
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
                    {renderHighlightedCompanies(session, searchQuery)}
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

        {!loadingSessions && filteredSessions.length > 0 && (
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
