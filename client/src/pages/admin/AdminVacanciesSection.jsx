import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Plus, Save, Check, Trash2, Pencil, ToggleLeft, ToggleRight,
  MapPin, Briefcase, ChevronDown, Users as UsersIcon, Send, MessageCircle, Home, X, Eye
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const TYPE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };
const TYPE_STYLE = {
  remote: 'bg-green-50 text-green-700 border-green-200',
  onsite: 'bg-blue-50 text-blue-700 border-blue-200',
  hybrid: 'bg-purple-50 text-purple-700 border-purple-200',
};
const EMPTY_FORM = { title: '', company: '', description: '', skills: '', location: '', type: 'remote', industry: '', jobType: '', experience: '', salaryRange: '', status: 'active' };
const EXPERIENCE_OPTIONS = ['Fresher', '0-1 years', '0-2 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'];
const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

function VacancyFormFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Title *</label>
        <input name="title" value={form.title} onChange={onChange} placeholder="e.g. Full-Stack Developer" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Company</label>
        <input name="company" value={form.company} onChange={onChange} placeholder="Company name" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Location</label>
        <input name="location" value={form.location} onChange={onChange} placeholder="e.g. Bangalore, India" className={inp} />
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
          <option value="pending">Pending</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Industry</label>
        <input name="industry" value={form.industry} onChange={onChange} placeholder="e.g. Technology, Healthcare, Finance…" className={inp} />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Job Type</label>
        <select name="jobType" value={form.jobType} onChange={onChange} className={inp}>
          <option value="">Select job type</option>
          {['Full-time', 'Part-time', 'Freelance', 'Contract', 'Internship'].map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Experience</label>
        <select name="experience" value={form.experience} onChange={onChange} className={inp}>
          <option value="">Select experience level</option>
          {EXPERIENCE_OPTIONS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Salary Range</label>
        <input name="salaryRange" value={form.salaryRange} onChange={onChange} placeholder="e.g. ₹8L–12L / $60k–80k" className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Required Skills <span className="font-normal text-[#9CA3AF]">(comma-separated)</span></label>
        <input name="skills" value={form.skills} onChange={onChange} placeholder="React, Node.js, MongoDB" className={inp} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Description *</label>
        <textarea name="description" value={form.description} onChange={onChange} rows={4}
          placeholder="Describe the role, responsibilities, and what you're looking for..."
          className={`${inp} resize-none`} />
      </div>
    </div>
  );
}

const AdminVacanciesSection = forwardRef(function AdminVacanciesSection({ hideTitle = false, filterStatus = 'standard' }, ref) {
  const [vacancies, setVacancies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [expandedInterests, setExpandedInterests] = useState(null);
  const [replyOpen, setReplyOpen] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, vacancyId: null, userId: null, status: null, note: '' });
  const [viewModal, setViewModal] = useState({ isOpen: false, vacancy: null });
  const { user } = useAuth();

  useImperativeHandle(ref, () => ({
    openAddVacancy: () => {
      setShowAdd(v => !v);
      setEditId(null);
      setForm(EMPTY_FORM);
    }
  }));

  useEffect(() => {
    api.get('/admin/vacancies')
      .then(res => setVacancies(res.data))
      .catch(() => toast.error('Failed to load vacancies'))
      .finally(() => setLoading(false));
  }, []);

  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAdd = async () => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    setSaving(true);
    try {
      const res = await api.post('/admin/vacancies', form);
      setVacancies(prev => [res.data, ...prev]);
      setForm(EMPTY_FORM);
      setShowAdd(false);
      toast.success('Vacancy posted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleEditSave = async (id) => {
    if (!form.title.trim() || !form.description.trim()) { toast.error('Title and description are required'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/admin/vacancies/${id}`, form);
      setVacancies(prev => prev.map(v => v._id === id ? res.data : v));
      setEditId(null);
      toast.success('Vacancy updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/admin/vacancies/${id}`);
      setVacancies(prev => prev.filter(v => v._id !== id));
      toast.success('Vacancy deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await api.patch(`/admin/vacancies/${id}/toggle-status`);
      setVacancies(prev => prev.map(v => v._id === id ? { ...v, status: res.data.status } : v));
      toast.success(res.data.status === 'active' ? 'Vacancy activated' : 'Vacancy closed');
    } catch { toast.error('Failed to update status'); }
  };

  const handleViewVacancy = async (v) => {
    setViewModal({ isOpen: true, vacancy: v });
    if (v.status === 'pending' && !v.isViewed) {
      try {
        await api.patch(`/admin/vacancies/${v._id}/view`);
        setVacancies(prev => prev.map(vac => vac._id === v._id ? { ...vac, isViewed: true } : vac));
        window.dispatchEvent(new CustomEvent('decrementPendingVacancies'));
      } catch {
        // ignore errors if view update fails silently
      }
    }
  };

  const handleStatusChange = async (vacancyId, userId, status) => {
    if (status === 'rejected') {
      const defaultNote = "Thank you for your application. Unfortunately, we have decided to move forward with other candidates whose profiles more closely match our current requirements.\n\nWe encourage you to keep applying for our future vacancies, as we would be happy to consider your profile for other suitable opportunities.\n\nWe wish you all the best in your job search.";
      setStatusModal({ isOpen: true, vacancyId, userId, status, note: defaultNote });
    } else {
      setStatusModal({ isOpen: true, vacancyId, userId, status, note: '' });
    }
  };

  const submitStatusChange = async () => {
    setSaving(true);
    try {
      const { vacancyId, userId, status, note } = statusModal;
      await api.put(`/admin/vacancies/${vacancyId}/applicant-status`, { userId, status, note });
      setVacancies(prev => prev.map(v => {
        if (v._id !== vacancyId) return v;
        const history = v.applicantStatusHistory?.[userId] || [];
        return {
          ...v,
          applicantStatus: { ...v.applicantStatus, [userId]: status },
          applicantStatusHistory: { ...v.applicantStatusHistory, [userId]: [...history, { status, date: new Date().toISOString() }] }
        };
      }));
      toast.success('Applicant status updated');
      setStatusModal({ isOpen: false, vacancyId: null, userId: null, status: null, note: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status'); }
    finally { setSaving(false); }
  };

  const startEdit = (v) => {
    setEditId(v._id);
    setForm({ title: v.title, company: v.company || '', description: v.description, skills: v.skills?.join(', ') || '', location: v.location || '', type: v.type || 'remote', industry: v.industry || '', jobType: v.jobType || '', experience: v.experience || '', salaryRange: v.salaryRange || '', status: v.status || 'active' });
    setShowAdd(false);
  };

  const handleReply = async () => {
    if (!replyText.trim() || !replyOpen) return;
    setReplySending(true);
    try {
      await api.post(`/admin/vacancies/${replyOpen.vacancyId}/reply`, { userId: replyOpen.userId, message: replyText });
      toast.success('Message sent to user');
      setReplyOpen(null);
      setReplyText('');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to send message'); }
    finally { setReplySending(false); }
  };

  const displayedVacancies = vacancies.filter(v => filterStatus === 'reported' ? v.status === 'pending' : v.status !== 'pending');

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Vacancies</h2>
          <button
            onClick={() => { setShowAdd(v => !v); setEditId(null); setForm(EMPTY_FORM); }}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={14} /> {showAdd ? 'Cancel' : 'Add Vacancy'}
          </button>
        </div>
      )}

      {showAdd && (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <p className="text-sm font-semibold text-[#1A1A1A]">New Vacancy</p>
          <VacancyFormFields form={form} onChange={handleField} />
          <div className="flex items-center gap-2">
            <button onClick={handleAdd} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50">
              <Save size={14} /> {saving ? 'Saving…' : 'Post Vacancy'}
            </button>
            <button onClick={() => { setShowAdd(false); setForm(EMPTY_FORM); }}
              className="px-4 py-2 text-sm text-[#6B7280] hover:text-[#1A1A1A] border border-[#E5E1DA] rounded-xl transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : displayedVacancies.length === 0 ? (
        <div className="text-center p-12 text-muted border border-border rounded-xl bg-white">No {filterStatus === 'reported' ? 'reported' : ''} vacancies found.</div>
      ) : (
        <div className="space-y-3">
          {displayedVacancies.map(v => (
            <div key={v._id} className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
              {editId === v._id ? (
                <div className="p-5 space-y-4">
                  <p className="text-sm font-semibold text-[#1A1A1A]">Edit Vacancy</p>
                  <VacancyFormFields form={form} onChange={handleField} />
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
                    <div className="w-9 h-9 rounded-xl bg-[#E6F7F5] flex items-center justify-center shrink-0">
                      <Briefcase size={15} className="text-[#00A693]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-[#1A1A1A]">{v.title}</h3>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${TYPE_STYLE[v.type]}`}>{TYPE_LABEL[v.type]}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
                          v.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          v.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-gray-100 text-gray-500 border-gray-200'
                        }`}>{v.status}</span>
                      </div>
                      {(v.company || v.location || v.industry || v.jobType || v.experience || v.salaryRange) && (
                        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1 flex-wrap">
                          {v.company && <span className="font-medium text-[#1A1A1A]">{v.company}</span>}
                          {v.jobType && <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{v.jobType}</span>}
                          {v.experience && <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">{v.experience}</span>}
                          {v.industry && <span className="px-2 py-0.5 rounded-full bg-[#F3F0EB] border border-[#E5E1DA]">{v.industry}</span>}
                          {v.salaryRange && <span className="font-medium text-green-700">{v.salaryRange}</span>}
                          {v.location && <span className="flex items-center gap-1">{v.location?.toLowerCase() === 'remote' ? <Home size={10} /> : <MapPin size={10} />}{v.location}</span>}
                        </div>
                      )}

                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => handleViewVacancy(v)}
                        className="p-1.5 rounded-lg hover:bg-accent/10 text-accent hover:text-accent-hover transition-colors" title="View details">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => setExpandedInterests(expandedInterests === v._id ? null : v._id)}
                        className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#1A1A1A] px-2.5 py-1.5 rounded-lg hover:bg-[#F3F0EB] transition-colors">
                        <UsersIcon size={13} />
                        <span>{v.interests?.length || 0}</span>
                        <ChevronDown size={11} className={`transition-transform ${expandedInterests === v._id ? 'rotate-180' : ''}`} />
                      </button>
                      <button onClick={() => handleToggleStatus(v._id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          v.status === 'active' ? 'text-green-500 hover:bg-green-50' : 
                          v.status === 'pending' ? 'text-amber-500 hover:bg-amber-50' : 
                          'text-red-400 hover:bg-red-50'
                        }`}
                        title={v.status === 'active' ? 'Close vacancy' : 'Activate vacancy'}>
                        {v.status === 'active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      </button>
                      <button onClick={() => startEdit(v)} className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-[#6B7280] hover:text-[#1A1A1A] transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(v._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </div>

                  {expandedInterests === v._id && (
                    <div className="border-t border-[#F3F0EB] px-4 py-3">
                      {v.interests?.length === 0 ? (
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
                                  <p className="text-sm font-medium text-[#1A1A1A] truncate">
                                    {u.name}
                                    {u.regNumber && <span className="ml-1.5 text-xs font-medium text-accent">{u.userType === 'client' ? 'C' : 'D'}{u.regNumber}</span>}
                                  </p>
                                  <p className="text-xs text-[#6B7280] truncate">{u.email}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <select
                                    value={v.applicantStatus?.[u._id] || 'applied'}
                                    onChange={(e) => handleStatusChange(v._id, u._id, e.target.value)}
                                    className="px-2 py-1.5 text-xs font-medium border border-border rounded-lg text-text bg-white focus:outline-none focus:border-accent"
                                  >
                                    <option value="applied">Applied</option>
                                    <option value="reviewing">Reviewing</option>
                                    <option value="contacting">Contacting</option>
                                    <option value="1 round interview">1st Round Interview</option>
                                    <option value="2nd round interview">2nd Round Interview</option>
                                    <option value="3rd round interview">3rd Round Interview</option>
                                    <option value="selected">Selected</option>
                                    <option value="rejected">Not Selected This Time</option>
                                  </select>

                                  <button
                                    onClick={() => {
                                      if (!u.phone) {
                                        toast.error('No phone number provided by user');
                                        return;
                                      }
                                      const namePart = user?.name?.split(' ')[0];
                                      const adminName = (!namePart || namePart.toLowerCase() === 'admin') ? 'Kevin' : namePart;
                                      const devName = u.name?.split(' ')[0] || 'there';
                                      const msg = `Hi ${devName}. its me ${adminName} from sharemyapps. thank you for applying for ${v.title} position. need some more details from you`;
                                      const phone = u.phone.replace(/\D/g, '');
                                      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
                                    }}
                                    className="shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors"
                                    title="WhatsApp"
                                  >
                                    <MessageCircle size={13} /> WA
                                  </button>

                                  <button
                                    onClick={() => {
                                      const key = `${v._id}-${u._id}`;
                                      if (replyOpen?.key === key) { setReplyOpen(null); setReplyText(''); }
                                      else { setReplyOpen({ key, vacancyId: v._id, userId: u._id }); setReplyText(''); }
                                    }}
                                    className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${replyOpen?.key === `${v._id}-${u._id}` ? 'bg-accent text-white border-transparent' : 'text-muted border-border hover:border-accent hover:text-accent'}`}
                                  >
                                    <Send size={11} /> Reply
                                  </button>
                                </div>
                              </div>
                              {replyOpen?.key === `${v._id}-${u._id}` && (
                                <div className="ml-10 flex gap-2">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleReply()}
                                    placeholder={`Message to ${u.name}…`}
                                    autoFocus
                                    className="flex-1 px-3 py-2 text-sm border border-border rounded-lg text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                                  />
                                  <button
                                    onClick={handleReply}
                                    disabled={!replyText.trim() || replySending}
                                    className="w-9 h-9 bg-accent hover:bg-accent-hover text-white rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                  >
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

      {/* Status Modal */}
      {statusModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setStatusModal({ ...statusModal, isOpen: false })} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
              <X size={20} />
            </button>
            
            <div className="mb-6 mt-4">
              <label className="block text-sm font-medium text-text mb-2">
                Note to Applicant {statusModal.status !== 'rejected' && <span className="text-muted font-normal">(Optional)</span>}
              </label>
              <textarea
                value={statusModal.note}
                onChange={e => setStatusModal({ ...statusModal, note: e.target.value })}
                placeholder={statusModal.status === 'rejected' ? "e.g., We are looking for someone with more React experience..." : "e.g., Leave an optional comment about their status..."}
                rows={statusModal.status === 'rejected' ? 8 : 4}
                className="w-full px-4 py-3 border border-border rounded-xl text-sm text-text bg-white placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                className="px-5 py-2.5 text-sm font-semibold text-text bg-[#F3F0EB] hover:bg-[#E5E1DA] rounded-xl transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={submitStatusChange}
                disabled={saving || (statusModal.status === 'rejected' && !statusModal.note.trim())}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors flex items-center justify-center min-w-[100px] disabled:opacity-50 disabled:cursor-not-allowed ${statusModal.status === 'rejected' ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-hover'}`}
              >
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewModal.isOpen && viewModal.vacancy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in duration-200">
            <button onClick={() => setViewModal({ isOpen: false, vacancy: null })} className="absolute top-4 right-4 text-muted hover:text-text transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-text mb-4 border-b pb-3">Vacancy Details</h2>
            
            <div className="space-y-4 text-sm text-[#1A1A1A]">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-semibold text-muted">Title:</span> <p className="font-medium">{viewModal.vacancy.title}</p></div>
                <div><span className="font-semibold text-muted">Company:</span> <p className="font-medium">{viewModal.vacancy.company}</p></div>
                <div><span className="font-semibold text-muted">Salary Range:</span> <p className="font-medium">{viewModal.vacancy.salaryRange || 'Not specified'}</p></div>
                <div><span className="font-semibold text-muted">Work Mode:</span> <p className="font-medium capitalize">{viewModal.vacancy.type}</p></div>
                <div><span className="font-semibold text-muted">Status:</span> <p className="font-medium capitalize">{viewModal.vacancy.status}</p></div>
                <div>
                  <span className="font-semibold text-muted">Posted By:</span> 
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium">{viewModal.vacancy.createdBy?.name || 'Admin'} {viewModal.vacancy.createdBy?.email && `(${viewModal.vacancy.createdBy.email})`}</p>
                    {viewModal.vacancy.createdBy?.phone && (
                      <a 
                        href={`https://wa.me/${viewModal.vacancy.createdBy.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${viewModal.vacancy.createdBy.name}, I'm contacting you regarding the ${viewModal.vacancy.title} role you submitted to our platform. Please let me know when you might be free for a short verification call.`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                      >
                        <MessageCircle size={12} /> WhatsApp
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <span className="font-semibold text-muted block mb-1">Description:</span> 
                <div className="bg-gray-50 p-4 rounded-xl whitespace-pre-wrap font-medium">{viewModal.vacancy.description}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setViewModal({ isOpen: false, vacancy: null })}
                className="px-5 py-2 text-sm font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AdminVacanciesSection;
