import { useState } from 'react';
import { Briefcase, CheckCircle, Mail, Pencil, X, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function AddVacancy() {
  const { user } = useAuth();

  const [form, setForm] = useState({ title: '', company: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [posted, setPosted]         = useState(false);

  
  const [emails, setEmails]           = useState(user?.email ? [user.email] : []);
  const [editingIdx, setEditingIdx]   = useState(null);
  const [emailDraft, setEmailDraft]   = useState('');
  const [addingNew, setAddingNew]     = useState(false);
  const [newDraft, setNewDraft]       = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/vacancies', form);
      setPosted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post vacancy');
    } finally {
      setSubmitting(false);
    }
  };

  const saveEdit = (idx) => {
    if (!emailDraft.trim() || !emailDraft.includes('@')) { toast.error('Enter a valid email'); return; }
    setEmails(prev => prev.map((e, i) => i === idx ? emailDraft.trim() : e));
    setEditingIdx(null);
    toast.success('Email updated');
  };

  const saveNew = () => {
    if (!newDraft.trim() || !newDraft.includes('@')) { toast.error('Enter a valid email'); return; }
    if (emails.includes(newDraft.trim())) { toast.error('Email already added'); return; }
    setEmails(prev => [...prev, newDraft.trim()]);
    setNewDraft('');
    setAddingNew(false);
    toast.success('Email added');
  };

  const removeEmail = (idx) => setEmails(prev => prev.filter((_, i) => i !== idx));

  if (posted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-white border border-border rounded-2xl p-10 shadow-sm">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={28} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-text mb-2">Vacancy Posted!</h2>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            We will filter developers based on your requirement and send matching profiles to:
          </p>

          {/* Email list */}
          <div className="space-y-2 mb-3 text-left">
            {emails.map((email, idx) => (
              <div key={idx} className="bg-bg border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                <Mail size={14} className="text-accent shrink-0" />
                {editingIdx === idx ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={e => setEmailDraft(e.target.value)}
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent bg-white"
                      autoFocus
                    />
                    <button onClick={() => saveEdit(idx)} className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-medium">Save</button>
                    <button onClick={() => setEditingIdx(null)} className="text-muted hover:text-text"><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span className="flex-1 text-sm text-text">{email}</span>
                    <button onClick={() => { setEmailDraft(email); setEditingIdx(idx); }} className="text-accent hover:text-accent-hover"><Pencil size={13} /></button>
                    {emails.length > 1 && (
                      <button onClick={() => removeEmail(idx)} className="text-red-400 hover:text-red-600"><X size={13} /></button>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Add new email */}
            {addingNew ? (
              <div className="bg-bg border border-border rounded-xl px-4 py-3 flex items-center gap-2">
                <Mail size={14} className="text-accent shrink-0" />
                <input
                  type="email"
                  value={newDraft}
                  onChange={e => setNewDraft(e.target.value)}
                  placeholder="Enter email address"
                  className="flex-1 text-sm border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent bg-white"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && saveNew()}
                />
                <button onClick={saveNew} className="text-xs bg-accent text-white px-3 py-1.5 rounded-lg font-medium">Add</button>
                <button onClick={() => { setAddingNew(false); setNewDraft(''); }} className="text-muted hover:text-text"><X size={14} /></button>
              </div>
            ) : (
              <button
                onClick={() => setAddingNew(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs text-accent hover:text-accent-hover border border-dashed border-accent/40 hover:border-accent rounded-xl py-2.5 transition-colors"
              >
                <Plus size={13} /> Add another email
              </button>
            )}
          </div>

          <button
            onClick={() => { setPosted(false); setForm({ title: '', company: '', description: '' }); }}
            className="mt-6 text-sm bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
          >
            Post Another Vacancy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-7">
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Briefcase size={17} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text">Post a Vacancy</h1>
          <p className="text-xs text-muted">Paste your job description — we'll match the best developers</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Job Title <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Senior React Developer"
            className="w-full text-sm border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent bg-bg"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">Company Name</label>
          <input
            type="text"
            value={form.company}
            onChange={e => set('company', e.target.value)}
            placeholder="Your company name"
            className="w-full text-sm border border-border rounded-xl px-4 py-2.5 focus:outline-none focus:border-accent bg-bg"
          />
        </div>

        {/* Description — big paste area */}
        <div>
          <label className="block text-sm font-medium text-text mb-1.5">
            Job Description <span className="text-red-500">*</span>
            <span className="text-muted font-normal ml-2">— paste full JD here</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Paste the full job description — role, responsibilities, required skills, experience level, perks..."
            rows={10}
            className="w-full text-sm border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent bg-bg resize-y leading-relaxed"
          />
        </div>


        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          {submitting ? 'Posting…' : 'Post Vacancy'}
        </button>
      </form>
    </div>
  );
}
