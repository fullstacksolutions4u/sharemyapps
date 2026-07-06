import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Send, CalendarClock, History, RotateCcw } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_JOB = { emailId: '', subject: '' };
const inp = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

export default function AdminJobRecommendationsSection() {
  const [jobs, setJobs] = useState([{ ...EMPTY_JOB }]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    api.get('/admin/job-recommendations/premium-users')
      .then(res => {
        setUsers(res.data.users || []);
        setSelectedIds(new Set());
      })
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

  const handleReuseSession = (session) => {
    setJobs(session.jobs.map(j => ({ emailId: j.emailId, subject: j.subject })));
    setSelectedIds(new Set());
    setScheduledAt('');
    toast.success(`Loaded companies from Session ${session.sessionNumber} — select users to send`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleJobChange = (i, field, value) => {
    setJobs(prev => prev.map((j, idx) => idx === i ? { ...j, [field]: value } : j));
  };

  const addRow = () => setJobs(prev => [...prev, { ...EMPTY_JOB }]);
  const removeRow = (i) => setJobs(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const validJobs = jobs.filter(j => j.emailId.trim() && j.subject.trim());

  const q = search.toLowerCase();
  const filteredUsers = users.filter(u =>
    !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  );

  const toggleUser = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u._id));
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredUsers.forEach(u => next.delete(u._id));
      else filteredUsers.forEach(u => next.add(u._id));
      return next;
    });
  };

  const handleSend = async () => {
    if (validJobs.length === 0) { toast.error('Add at least one job with company name and email id'); return; }
    if (selectedIds.size === 0) { toast.error('Select at least one user'); return; }
    setSending(true);
    try {
      const res = await api.post('/admin/job-recommendations/send', {
        jobs: validJobs,
        userIds: [...selectedIds],
        scheduledAt: scheduledAt || undefined,
      });
      if (res.data.scheduled) {
        toast.success(`Scheduled for ${new Date(res.data.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} — ${res.data.total} user${res.data.total === 1 ? '' : 's'}`);
      } else {
        toast.success(`Sent to ${res.data.sent} of ${res.data.total} selected user${res.data.total === 1 ? '' : 's'}${res.data.failed ? ` (${res.data.failed} failed)` : ''}`);
      }
      setJobs([{ ...EMPTY_JOB }]);
      setScheduledAt('');
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send recommendations');
    } finally {
      setSending(false);
    }
  };

  const isScheduling = !!scheduledAt;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[#9CA3AF] border-b border-[#F3F0EB]">
                <th className="py-2 pr-3 font-medium w-12 text-center whitespace-nowrap">Sl No</th>
                <th className="py-2 pr-3 font-medium text-left">Company Name</th>
                <th className="py-2 pr-3 font-medium text-left">Email Id</th>
                <th className="py-2 w-10"></th>
              </tr>
            </thead>
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-semibold text-[#1A1A1A]">
            Users with Resume &amp; Cover Letter Delivered <span className="text-[#9CA3AF] font-normal">({selectedIds.size} of {users.length} selected)</span>
          </p>
          <div className="flex items-center gap-2">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email…"
              className="border border-[#E5E1DA] rounded-lg px-3 py-1.5 text-xs outline-none w-48 focus:border-[#00A693]"
            />
            <button
              onClick={toggleSelectAll}
              disabled={filteredUsers.length === 0}
              className="text-xs font-medium text-[#00A693] hover:text-[#007D6F] transition-colors disabled:opacity-40"
            >
              {allFilteredSelected ? 'Deselect all' : 'Select all'}
            </button>
          </div>
        </div>

        {loadingUsers ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading premium users…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">
            {users.length === 0 ? 'No users with resume & cover letter delivered yet.' : 'No results match your search.'}
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto space-y-1 border border-[#F3F0EB] rounded-xl p-2">
            {filteredUsers.map(u => (
              <label
                key={u._id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F3F0EB] cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(u._id)}
                  onChange={() => toggleUser(u._id)}
                  className="accent-[#00A693] w-4 h-4"
                />
                <span className="text-sm font-medium text-[#1A1A1A]">{u.name}</span>
                <span className="text-xs text-[#9CA3AF]">{u.email}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock size={15} className="text-[#9CA3AF]" />
          <label className="text-sm font-medium text-[#1A1A1A]">Schedule for</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="border border-[#E5E1DA] rounded-lg px-3 py-1.5 text-xs outline-none focus:border-[#00A693]"
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
        <p className="text-xs text-[#9CA3AF]">Leave blank to notify users immediately.</p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={sending || validJobs.length === 0 || selectedIds.size === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={14} />
          {sending
            ? (isScheduling ? 'Scheduling…' : 'Sending…')
            : isScheduling
              ? `Schedule for ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`
              : `Send Now to ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`}
        </button>
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <History size={15} className="text-[#9CA3AF]" /> Session History
        </p>

        {loadingSessions ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-sm text-[#9CA3AF]">No sessions sent yet.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {sessions.map(session => (
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
                    {' · '}{session.jobs.length} compan{session.jobs.length === 1 ? 'y' : 'ies'}
                    {' · '}{session.recipientCount} recipient{session.recipientCount === 1 ? '' : 's'}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-1 truncate">
                    {session.jobs.map(j => j.subject).join(', ')}
                  </p>
                </div>
                <button
                  onClick={() => handleReuseSession(session)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#00A693] hover:text-[#007D6F] border border-[#00A693]/30 hover:bg-[#F0FBF9] px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <RotateCcw size={12} /> Reuse
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
