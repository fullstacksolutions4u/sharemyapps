import { useState, useEffect, useMemo } from 'react';
import { Send, Search, Users, CheckSquare, Square, FileText, Pencil, Trash2, Save, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const inp = 'w-full px-3 py-2 border border-border rounded-lg text-sm text-text bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition';

export default function AdminEmailSection() {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const [templates, setTemplates] = useState([]);
  const [templateName, setTemplateName] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    api.get('/admin/email/users')
      .then(res => setUsers(res.data.users || []))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoadingUsers(false));
    api.get('/admin/email/templates')
      .then(res => setTemplates(res.data.templates || []))
      .catch(() => {});
  }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) { toast.error('Template name is required'); return; }
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!body.trim()) { toast.error('Body is required'); return; }
    setSavingTemplate(true);
    try {
      if (editingTemplateId) {
        const res = await api.put(`/admin/email/templates/${editingTemplateId}`, {
          name: templateName, subject, body,
        });
        setTemplates(prev => prev.map(t => t._id === editingTemplateId ? res.data.template : t));
        toast.success('Template updated');
      } else {
        const res = await api.post('/admin/email/templates', { name: templateName, subject, body });
        setTemplates(prev => [res.data.template, ...prev]);
        toast.success('Template saved');
      }
      setTemplateName('');
      setEditingTemplateId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleUseTemplate = (t) => {
    setSubject(t.subject);
    setBody(t.body);
    toast.success(`Template "${t.name}" loaded into compose`);
  };

  const handleEditTemplate = (t) => {
    setSubject(t.subject);
    setBody(t.body);
    setTemplateName(t.name);
    setEditingTemplateId(t._id);
  };

  const cancelEditTemplate = () => {
    setTemplateName('');
    setEditingTemplateId(null);
  };

  const handleDeleteTemplate = async (t) => {
    if (!window.confirm(`Delete template "${t.name}"?`)) return;
    try {
      await api.delete(`/admin/email/templates/${t._id}`);
      setTemplates(prev => prev.filter(x => x._id !== t._id));
      if (editingTemplateId === t._id) cancelEditTemplate();
      toast.success('Template deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter(u => {
      if (typeFilter !== 'all' && (u.userType || 'developer') !== typeFilter) return false;
      if (!q) return true;
      return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });
  }, [users, search, typeFilter]);

  const allFilteredSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedIds.has(u._id));

  const toggleUser = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filteredUsers.forEach(u => next.delete(u._id));
      } else {
        filteredUsers.forEach(u => next.add(u._id));
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!subject.trim()) { toast.error('Subject is required'); return; }
    if (!body.trim()) { toast.error('Body is required'); return; }
    if (selectedIds.size === 0) { toast.error('Select at least one user'); return; }

    setSending(true);
    setLastResult(null);
    try {
      const res = await api.post('/admin/email/send', {
        subject,
        body,
        userIds: [...selectedIds],
      });
      setLastResult(res.data);
      if (res.data.failed?.length) {
        toast.error(`Sent ${res.data.sent} of ${res.data.total} — ${res.data.failed.length} failed`);
      } else {
        toast.success(`Email sent to ${res.data.sent} user${res.data.sent === 1 ? '' : 's'}`);
        setSubject('');
        setBody('');
        setSelectedIds(new Set());
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Compose ── */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text">Compose Email</h3>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Subject</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={'Write your message…\n\nEach recipient gets a personalized greeting ("Hi <name>,") followed by this message inside the ShareMyApps email template. Use {{name}} anywhere to insert the recipient\'s name.'}
              rows={12}
              className={`${inp} resize-y`}
            />
          </div>

          {/* Save as template */}
          <div className="border-t border-border pt-3">
            <label className="block text-xs font-medium text-muted mb-1.5">
              {editingTemplateId ? 'Editing template' : 'Save this email as a template'}
            </label>
            <div className="flex items-center gap-2">
              <input
                value={templateName}
                onChange={e => setTemplateName(e.target.value)}
                placeholder="Template name (e.g. Free Premium Access)"
                className={inp}
              />
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                <Save size={13} />
                {savingTemplate ? 'Saving…' : editingTemplateId ? 'Update' : 'Save'}
              </button>
              {editingTemplateId && (
                <button
                  onClick={cancelEditTemplate}
                  className="flex items-center gap-1 px-2.5 py-2 border border-border text-muted hover:text-text text-xs font-medium rounded-lg transition-colors shrink-0"
                >
                  <X size={12} /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Recipients ── */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-3 flex flex-col">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
              <Users size={14} className="text-[#9CA3AF]" />
              Recipients
              {selectedIds.size > 0 && (
                <span className="text-xs font-medium text-white bg-accent rounded-full px-2 py-0.5">{selectedIds.size} selected</span>
              )}
            </h3>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="border border-border rounded-lg px-2 py-1.5 text-xs text-[#374151] outline-none focus:border-accent"
            >
              <option value="all">All users</option>
              <option value="developer">Developers</option>
              <option value="client">Clients</option>
            </select>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className={`${inp} pl-9`}
            />
          </div>

          {loadingUsers ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">Loading users…</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#9CA3AF]">No users found.</div>
          ) : (
            <>
              <button
                onClick={toggleAllFiltered}
                className="flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors self-start"
              >
                {allFilteredSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                {allFilteredSelected ? 'Deselect all' : 'Select all'} ({filteredUsers.length})
              </button>
              <div className="max-h-96 overflow-y-auto space-y-1 border border-[#F3F0EB] rounded-xl p-2">
                {filteredUsers.map(u => (
                  <label
                    key={u._id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#F3F0EB] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(u._id)}
                      onChange={() => toggleUser(u._id)}
                      className="accent-accent w-4 h-4 shrink-0"
                    />
                    {u.avatar
                      ? <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                      : <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-[10px] flex items-center justify-center font-bold shrink-0">{u.name?.[0]?.toUpperCase() || '?'}</span>
                    }
                    <span className="text-sm font-medium text-text truncate">{u.name}</span>
                    <span className="text-xs text-[#9CA3AF] truncate">{u.email}</span>
                    {u.userType === 'client' && (
                      <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">Client</span>
                    )}
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Templates ── */}
      <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-text flex items-center gap-1.5">
          <FileText size={14} className="text-[#9CA3AF]" />
          Email Templates
          <span className="text-xs font-normal text-[#9CA3AF]">— reusable in flows like free premium access grants</span>
        </h3>
        {templates.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No templates yet. Compose an email above and save it as a template.</p>
        ) : (
          <div className="divide-y divide-border border border-[#F3F0EB] rounded-xl overflow-hidden">
            {templates.map(t => (
              <div key={t._id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{t.name}</p>
                  <p className="text-xs text-[#9CA3AF] truncate">{t.subject}</p>
                </div>
                <button
                  onClick={() => handleUseTemplate(t)}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent hover:text-white transition-colors shrink-0"
                >
                  Use
                </button>
                <button
                  onClick={() => handleEditTemplate(t)}
                  title="Edit template"
                  className="p-1.5 text-muted hover:text-text transition-colors shrink-0"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t)}
                  title="Delete template"
                  className="p-1.5 text-muted hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Send bar ── */}
      <div className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
        <p className="text-xs text-[#9CA3AF]">
          Emails are sent to each user's registered email address via Brevo.
        </p>
        <button
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim() || selectedIds.size === 0}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Send size={14} />
          {sending ? 'Sending…' : `Send to ${selectedIds.size} Selected User${selectedIds.size === 1 ? '' : 's'}`}
        </button>
      </div>

      {lastResult?.failed?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-medium text-red-800 mb-1">
            {lastResult.failed.length} email{lastResult.failed.length === 1 ? '' : 's'} failed to send:
          </p>
          <p className="text-xs text-red-700 break-all">{lastResult.failed.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
