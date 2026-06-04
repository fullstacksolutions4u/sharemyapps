import { useState, useEffect } from 'react';
import {
  Plus, Save, Check, Trash2, Pencil, ToggleLeft, ToggleRight,
  Laptop, ChevronDown, Users as UsersIcon, Send,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const TYPE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
const TYPE_STYLE = {
  remote: 'bg-green-50 text-green-700 border-green-200',
  onsite: 'bg-blue-50 text-blue-700 border-blue-200',
  hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
};
const EMPTY = { title: '', description: '', skills: '', budget: '', duration: '', type: 'remote', status: 'active' };
const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

function FormFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Title *</label>
        <input name="title" value={form.title} onChange={onChange} placeholder="e.g. Build a React Dashboard" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Budget</label>
        <input name="budget" value={form.budget} onChange={onChange} placeholder="e.g. ₹10k–20k / $500–1000" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Duration</label>
        <input name="duration" value={form.duration} onChange={onChange} placeholder="e.g. 2 weeks, 1 month" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Type</label>
        <select name="type" value={form.type} onChange={onChange} className={inp}>
          <option value="remote">Remote</option>
          <option value="onsite">On-site</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Status</label>
        <select name="status" value={form.status} onChange={onChange} className={inp}>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Skills Required <span className="font-normal text-[#9CA3AF]">(comma-separated)</span></label>
        <input name="skills" value={form.skills} onChange={onChange} placeholder="React, Node.js, MongoDB" className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Description *</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={4}
          placeholder="Describe the project, deliverables, and requirements..."
          className={`${inp} resize-none`} />
      </div>
    </div>
  );
}

export default function AdminFreelanceSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedInterests, setExpandedInterests] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);

  useEffect(() => {
    api.get('/admin/freelance')
      .then(res => setItems(res.data))
      .catch(() => toast.error('Failed to load freelance opportunities'))
      .finally(() => setLoading(false));
  }, []);

  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/freelance', form);
      setItems(prev => [res.data, ...prev]);
      setForm(EMPTY); setShowAdd(false);
      toast.success('Freelance opportunity posted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEditSave = async (id) => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/admin/freelance/${id}`, form);
      setItems(prev => prev.map(v => v._id === id ? res.data : v));
      setEditId(null);
      toast.success('Updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/freelance/${id}`);
      setItems(prev => prev.filter(v => v._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/admin/freelance/${id}/toggle-status`);
      setItems(prev => prev.map(v => v._id === id ? { ...v, status: res.data.status } : v));
    } catch { toast.error('Failed to update status'); }
  };

  const startEdit = (v) => {
    setEditId(v._id);
    setForm({ title: v.title, description: v.description, skills: v.skills?.join(', ') || '', budget: v.budget || '', duration: v.duration || '', type: v.type || 'remote', status: v.status || 'active' });
    setShowAdd(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !replyOpen) return;
    setReplySending(true);
    try {
      await api.post(`/admin/freelance/${replyOpen.itemId}/reply`, { userId: replyOpen.userId, message: replyText });
      toast.success('Message sent');
      setReplyOpen(null); setReplyText('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send'); }
    finally { setReplySending(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => { setShowAdd(v => !v); setEditId(null); setForm(EMPTY); }}
          className="flex items-center gap-1.5 text-sm font-medium bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={14} /> {showAdd ? 'Cancel' : 'Add Project'}
        </button>
      </div>

      {showAdd && (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-[#1A1A1A]">New Freelance Project</p>
          <FormFields form={form} onChange={handleField} />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Post Project'}
            </button>
            <button onClick={() => { setShowAdd(false); setForm(EMPTY); }}
              className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <Laptop size={28} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No freelance projects yet. Post the first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(v => (
            <div key={v._id} className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
              {editId === v._id ? (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Edit Project</p>
                  <FormFields form={form} onChange={handleField} />
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditSave(v._id)} disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
                      <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditId(null)}
                      className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded-xl transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-4 flex items-start gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Laptop size={15} className="text-indigo-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-[#1A1A1A]">{v.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TYPE_STYLE[v.type]}`}>{TYPE_LABEL[v.type]}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${v.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>{v.status}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1 flex-wrap">
                        {v.budget && <span className="font-medium text-green-700">{v.budget}</span>}
                        {v.duration && <span className="px-2 py-0.5 rounded-full bg-[#F3F0EB] border border-[#E5E1DA]">{v.duration}</span>}
                      </div>
                      <p className="text-xs text-[#9CA3AF] line-clamp-2">{v.description}</p>
                      {v.skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {v.skills.map(s => <span key={s} className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{s}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setExpandedInterests(expandedInterests === v._id ? null : v._id)}
                        className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1A1A1A] px-2.5 py-1.5 rounded-lg hover:bg-[#F3F0EB] transition-colors">
                        <UsersIcon size={13} />
                        <span>{v.interests?.length || 0}</span>
                        <ChevronDown size={11} className={`transition-transform ${expandedInterests === v._id ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => handleToggle(v._id)}
                        className={`p-1.5 rounded-lg transition-colors ${v.status === 'active' ? 'hover:bg-orange-50 text-[#9CA3AF] hover:text-orange-500' : 'hover:bg-green-50 text-[#9CA3AF] hover:text-green-600'}`}
                        title={v.status === 'active' ? 'Close' : 'Reopen'}>
                        {v.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-[#6B7280] hover:text-[#1A1A1A] transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {expandedInterests === v._id && (
                    <div className="border-t border-[#F3F0EB] px-4 py-3">
                      {!v.interests?.length ? (
                        <p className="text-xs text-[#9CA3AF] py-2">No one has shown interest yet.</p>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">
                            {v.interests.length} Interested Developer{v.interests.length !== 1 ? 's' : ''}
                          </p>
                          {v.interests.map(u => (
                            <div key={u._id} className="space-y-2">
                              <div className="flex items-center gap-3">
                                {u.avatar
                                  ? <img src={u.avatar} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                                  : <span className="w-7 h-7 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{u.name?.[0]?.toUpperCase()}</span>
                                }
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-[#1A1A1A] truncate">{u.name}</p>
                                  <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                                </div>
                                <button
                                  onClick={() => {
                                    const key = `${v._id}-${u._id}`;
                                    if (replyOpen?.key === key) { setReplyOpen(null); setReplyText(''); }
                                    else { setReplyOpen({ key, itemId: v._id, userId: u._id }); setReplyText(''); }
                                  }}
                                  className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${replyOpen?.key === `${v._id}-${u._id}` ? 'bg-accent text-white border-transparent' : 'text-muted border-border hover:border-accent hover:text-accent'}`}
                                >
                                  <Send size={11} /> Reply
                                </button>
                              </div>
                              {replyOpen?.key === `${v._id}-${u._id}` && (
                                <div className="ml-10 flex gap-2">
                                  <input
                                    type="text" value={replyText} onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                                    placeholder={`Message to ${u.name}…`} autoFocus
                                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                                  />
                                  <button onClick={handleReply} disabled={!replyText.trim() || replySending}
                                    className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                                    {replySending ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
