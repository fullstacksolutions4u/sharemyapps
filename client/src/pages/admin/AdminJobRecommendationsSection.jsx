import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Send } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const EMPTY_JOB = { emailId: '', subject: '', workMode: 'remote', location: '' };
const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

export default function AdminJobRecommendationsSection() {
  const [jobs, setJobs] = useState([{ ...EMPTY_JOB }]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);

  const loadUsers = useCallback(() => {
    setLoadingUsers(true);
    api.get('/admin/job-recommendations/premium-users')
      .then(res => {
        setUsers(res.data.users || []);
        setSelectedIds(new Set());
      })
      .catch(() => toast.error('Failed to load premium users'))
      .finally(() => setLoadingUsers(false));
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleJobChange = (i, field, value) => {
    setJobs(prev => prev.map((j, idx) => {
      if (idx !== i) return j;
      const next = { ...j, [field]: value };
      if (field === 'workMode' && value === 'remote') next.location = '';
      return next;
    }));
  };

  const addRow = () => setJobs(prev => [...prev, { ...EMPTY_JOB }]);
  const removeRow = (i) => setJobs(prev => prev.length === 1 ? prev : prev.filter((_, idx) => idx !== i));

  const validJobs = jobs.filter(j =>
    j.emailId.trim() && j.subject.trim() && (j.workMode === 'remote' || j.location.trim())
  );

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
    if (validJobs.length === 0) { toast.error('Add at least one job with email id and subject'); return; }
    if (selectedIds.size === 0) { toast.error('Select at least one premium user'); return; }
    setSending(true);
    try {
      const res = await api.post('/admin/job-recommendations/send', {
        jobs: validJobs,
        userIds: [...selectedIds],
      });
      toast.success(`Sent to ${res.data.sent} of ${res.data.total} selected user${res.data.total === 1 ? '' : 's'}${res.data.failed ? ` (${res.data.failed} failed)` : ''}`);
      setJobs([{ ...EMPTY_JOB }]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send recommendations');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
        <div className="space-y-3">
          {jobs.map((job, i) => (
            <div
              key={i}
              className={`grid grid-cols-1 ${job.workMode === 'remote' ? 'sm:grid-cols-[1fr_1fr_1fr_auto]' : 'sm:grid-cols-[1fr_1fr_1fr_1fr_auto]'} gap-2 items-start`}
            >
              <input
                type="email"
                value={job.emailId}
                onChange={e => handleJobChange(i, 'emailId', e.target.value)}
                placeholder="Email id to send CV"
                className={inp}
              />
              <input
                value={job.subject}
                onChange={e => handleJobChange(i, 'subject', e.target.value)}
                placeholder="Subject"
                className={inp}
              />
              <select
                value={job.workMode}
                onChange={e => handleJobChange(i, 'workMode', e.target.value)}
                className={inp}
              >
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
              {job.workMode !== 'remote' && (
                <input
                  value={job.location}
                  onChange={e => handleJobChange(i, 'location', e.target.value)}
                  placeholder="Location"
                  className={inp}
                />
              )}
              <button
                onClick={() => removeRow(i)}
                disabled={jobs.length === 1}
                className="p-2.5 rounded-xl border border-[#E5E1DA] text-[#9CA3AF] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
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
            Premium Users <span className="text-[#9CA3AF] font-normal">({selectedIds.size} of {users.length} selected)</span>
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
            {users.length === 0 ? 'No premium users found.' : 'No results match your search.'}
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

      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={sending || validJobs.length === 0 || selectedIds.size === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={14} /> {sending ? 'Sending…' : `Send to ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`}
        </button>
      </div>
    </div>
  );
}
