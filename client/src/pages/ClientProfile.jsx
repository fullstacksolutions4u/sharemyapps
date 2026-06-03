import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Globe, Layers, Phone, Mail, Save, ArrowLeft, ChevronRight,
  Handshake, IndianRupee, Clock, Code2, GraduationCap, FileText, X, Plus,
  FolderOpen, Pencil, Trash2, AlertCircle,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance & Banking', 'E-Commerce', 'Education',
  'Real Estate', 'Marketing & Advertising', 'Legal', 'Manufacturing', 'Logistics',
  'Media & Entertainment', 'Non-Profit', 'Other',
];

const DURATIONS = ['< 1 month', '1–3 months', '3–6 months', '6+ months'];
const EXP_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Any level'];
const STATUSES = [
  { value: 'open',        label: 'Open',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'in-progress', label: 'In Progress',  cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  { value: 'closed',      label: 'Closed',       cls: 'bg-slate-100 text-slate-500 border-slate-200' },
];

function statusCls(s) {
  return STATUSES.find(x => x.value === s)?.cls || STATUSES[0].cls;
}
function statusLabel(s) {
  return STATUSES.find(x => x.value === s)?.label || 'Open';
}

function Field({ icon, label, name, value, onChange, placeholder, type = 'text', hint, readOnly }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1.5">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
        <input
          type={type} name={name} value={value} onChange={onChange}
          placeholder={placeholder} readOnly={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition ${readOnly ? 'bg-[#F9F8F6] cursor-not-allowed text-[#9CA3AF]' : 'bg-white'}`}
        />
      </div>
    </div>
  );
}

/* ── Reusable project form ────────────────────────────────────────────────── */
function ProjectForm({ initial = {}, onSave, onCancel, saving }) {
  const [form, setForm] = useState({
    projectName: initial.projectName || '',
    budget: initial.budget ?? '',
    duration: initial.duration || '',
    skillsNeeded: initial.skillsNeeded || [],
    skillInput: '',
    experienceLevel: initial.experienceLevel || '',
    description: initial.description || '',
    status: initial.status || 'open',
  });

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const addSkill = (val) => {
    const clean = val.replace(/,$/, '').trim();
    if (clean && !form.skillsNeeded.includes(clean))
      setForm(f => ({ ...f, skillsNeeded: [...f.skillsNeeded, clean], skillInput: '' }));
    else setForm(f => ({ ...f, skillInput: '' }));
  };

  const handleSkillKey = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && form.skillInput.trim()) {
      e.preventDefault();
      addSkill(form.skillInput);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.projectName.trim()) { toast.error('Project name is required'); return; }
    if (form.skillsNeeded.length === 0) { toast.error('Add at least one skill'); return; }
    onSave({
      projectName: form.projectName,
      budget: form.budget || null,
      duration: form.duration,
      skillsNeeded: form.skillsNeeded,
      experienceLevel: form.experienceLevel,
      description: form.description,
      status: form.status,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-teal-50/60 border border-teal-200 rounded-2xl p-5 space-y-4">
      {/* Name */}
      <div>
        <label className="block text-xs font-semibold text-text mb-1.5">
          What do you need built? <span className="text-red-400">*</span>
        </label>
        <input type="text" name="projectName" value={form.projectName} onChange={handle}
          placeholder="e.g. E-commerce website, Mobile app, REST API"
          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-white text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Budget */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Budget (₹)</label>
          <div className="relative">
            <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="number" min="0" name="budget" value={form.budget} onChange={handle}
              placeholder="e.g. 50000"
              className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition" />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Duration</label>
          <div className="relative">
            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <select name="duration" value={form.duration} onChange={handle}
              className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm bg-white text-text focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition appearance-none">
              <option value="">Select duration</option>
              {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-semibold text-text mb-1.5">
          Skills / Tech stack needed <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
          <input type="text" value={form.skillInput}
            onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
            onKeyDown={handleSkillKey}
            placeholder="e.g. React, Node.js, Flutter"
            className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm bg-white text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition" />
          <button type="button" onClick={() => form.skillInput.trim() && addSkill(form.skillInput)}
            className="px-3 py-2.5 rounded-xl bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 transition">
            <Plus size={15} />
          </button>
        </div>
        <p className="text-[11px] text-muted mt-1">Press Enter or , to add</p>
        {form.skillsNeeded.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.skillsNeeded.map(s => (
              <span key={s} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-white text-teal-700 border-teal-200">
                {s}
                <button type="button" onClick={() => setForm(f => ({ ...f, skillsNeeded: f.skillsNeeded.filter(x => x !== s) }))}
                  className="rounded-full p-0.5 hover:bg-teal-100"><X size={10} /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Experience level */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Experience needed</label>
          <div className="flex flex-wrap gap-1.5">
            {EXP_LEVELS.map(lvl => (
              <button key={lvl} type="button"
                onClick={() => setForm(f => ({ ...f, experienceLevel: f.experienceLevel === lvl ? '' : lvl }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${form.experienceLevel === lvl ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-white text-muted border-border hover:border-teal-300'}`}>
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map(s => (
              <button key={s.value} type="button"
                onClick={() => setForm(f => ({ ...f, status: s.value }))}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${form.status === s.value ? s.cls : 'bg-white text-muted border-border hover:border-slate-300'}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-text mb-1.5">
          Description <span className="text-[11px] text-muted font-normal">(optional)</span>
        </label>
        <textarea name="description" rows={3} value={form.description} onChange={handle}
          placeholder="Describe your project goals, features, constraints…"
          className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-white text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition resize-none" />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:text-text transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
          <Save size={13} />{saving ? 'Saving…' : 'Save project'}
        </button>
      </div>
    </form>
  );
}

/* ── Project card ─────────────────────────────────────────────────────────── */
function ProjectCard({ project, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Delete this project?')) return;
    setDeleting(true);
    await onDelete(project._id);
    setDeleting(false);
  };

  return (
    <div className="bg-white border border-border rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-text truncate">{project.projectName}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusCls(project.status)}`}>
              {statusLabel(project.status)}
            </span>
            {project.budget && (
              <span className="text-[11px] text-muted flex items-center gap-0.5">
                <IndianRupee size={10} />{Number(project.budget).toLocaleString('en-IN')}
              </span>
            )}
            {project.duration && (
              <span className="text-[11px] text-muted flex items-center gap-0.5">
                <Clock size={10} />{project.duration}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={() => onEdit(project)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-teal-600 hover:bg-teal-50 transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {project.skillsNeeded?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {project.skillsNeeded.map(s => (
            <span key={s} className="text-[11px] text-muted bg-[#F9F8F6] px-2 py-0.5 rounded-full border border-border">{s}</span>
          ))}
        </div>
      )}

      {project.experienceLevel && (
        <p className="text-[11px] text-muted">
          Experience: <span className="font-medium text-text">{project.experienceLevel}</span>
        </p>
      )}

      {project.description && (
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{project.description}</p>
      )}

      <p className="text-[11px] text-muted">
        Added {new Date(project.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>
    </div>
  );
}

/* ── Recruiter view (unchanged) ─────────────────────────────────────────── */
function RecruiterProfile({ user, setUser, navigate }) {
  const isSetup = !user?.companyName;
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    companyWebsite: user?.companyWebsite || '',
    industry: user?.industry || '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      toast.success(isSetup ? 'Profile set up! Welcome aboard.' : 'Profile updated!');
      if (isSetup) navigate('/developers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: 'company', label: 'Company', icon: Building2 },
    { key: 'contact', label: 'Contact', icon: Phone },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {!isSetup && (
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
      )}
      <div className="flex gap-1 bg-[#F3F0EB] rounded-xl p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-accent shadow-sm' : 'text-muted hover:text-text'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        {activeTab === 'company' && (
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text">Company Information</h2>
            <Field icon={<Building2 size={15} />} label="Company name" name="companyName" value={form.companyName} onChange={handle} placeholder="Acme Inc." />
            <Field icon={<Globe size={15} />} label={<>Company website <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>} name="companyWebsite" value={form.companyWebsite} onChange={handle} placeholder="acme.com" />
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Industry <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><Layers size={15} /></span>
                <select name="industry" value={form.industry} onChange={handle}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition appearance-none">
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'contact' && (
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text">Contact Details</h2>
            <Field icon={<Mail size={15} />} label="Email" name="email" value={user?.email || ''} readOnly hint="Email cannot be changed" />
            <Field icon={<Phone size={15} />} label={<>Phone <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>} name="phone" value={form.phone} onChange={handle} placeholder="+1 234 567 8900" type="tel" />
          </div>
        )}
        <div className="flex gap-3">
          {activeTab !== 'contact' ? (
            <button type="button" onClick={() => setActiveTab('contact')}
              className="flex-1 flex items-center justify-center gap-2 border border-border bg-white hover:border-accent hover:text-accent text-muted py-3 rounded-xl font-medium text-sm transition-colors">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60">
              <Save size={14} />{saving ? 'Saving…' : 'Save profile'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ── Client (freelance hirer) view ──────────────────────────────────────── */
function ClientFreelanceProfile({ user, setUser, navigate }) {
  const cp = user?.clientProfile || {};
  const isSetup = !cp.projectName;

  // ── Contact form state ──
  const [contactForm, setContactForm] = useState({ phone: user?.phone || '' });
  const [contactSaving, setContactSaving] = useState(false);

  // ── Profile (primary requirement) form state ──
  const [profileForm, setProfileForm] = useState({
    projectName: cp.projectName || '',
    budget: cp.budget ?? '',
    duration: cp.duration || '',
    skillsNeeded: cp.skillsNeeded || [],
    skillInput: '',
    experienceLevel: cp.experienceLevel || '',
    description: cp.description || '',
  });
  const [profileSaving, setProfileSaving] = useState(false);

  // ── My Projects state ──
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectSaving, setProjectSaving] = useState(false);

  const [activeTab, setActiveTab] = useState(isSetup ? 'profile' : 'projects');

  // Fetch projects when on the My Projects tab
  useEffect(() => {
    if (activeTab !== 'projects' || isSetup) return;
    let cancelled = false;
    api.get('/users/client-projects')
      .then(r => { if (!cancelled) { setProjects(r.data); setProjectsLoading(false); } })
      .catch(() => { if (!cancelled) { toast.error('Failed to load projects'); setProjectsLoading(false); } });
    return () => { cancelled = true; };
  }, [activeTab, isSetup]);

  // ── Setup flow (first time) ──
  const handleSetupSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.projectName.trim()) { toast.error('Please describe what you need built'); return; }
    if (profileForm.skillsNeeded.length === 0) { toast.error('Please add at least one skill'); return; }
    setProfileSaving(true);
    try {
      const payload = {
        phone: contactForm.phone,
        clientProfile: {
          projectName: profileForm.projectName,
          budget: profileForm.budget || null,
          duration: profileForm.duration,
          skillsNeeded: profileForm.skillsNeeded,
          experienceLevel: profileForm.experienceLevel,
          description: profileForm.description,
        },
      };
      const res = await api.put('/auth/profile', payload);
      setUser(res.data.user);
      toast.success('Profile set up! Welcome aboard.');
      navigate('/developers');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Contact save ──
  const saveContact = async (e) => {
    e.preventDefault();
    setContactSaving(true);
    try {
      const res = await api.put('/auth/profile', { phone: contactForm.phone });
      setUser(res.data.user);
      toast.success('Contact updated!');
    } catch {
      toast.error('Failed to update contact');
    } finally {
      setContactSaving(false);
    }
  };

  // ── My Projects CRUD ──
  const handleAddProject = async (data) => {
    setProjectSaving(true);
    try {
      const res = await api.post('/users/client-projects', data);
      setProjects(p => [res.data, ...p]);
      setShowAddForm(false);
      toast.success('Project added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add project');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleEditProject = async (data) => {
    setProjectSaving(true);
    try {
      const res = await api.put(`/users/client-projects/${editingProject._id}`, data);
      setProjects(p => p.map(x => x._id === editingProject._id ? res.data : x));
      setEditingProject(null);
      toast.success('Project updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update project');
    } finally {
      setProjectSaving(false);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      await api.delete(`/users/client-projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const TABS = isSetup
    ? [{ key: 'profile', label: 'Your Requirements', icon: Handshake }, { key: 'contact', label: 'Contact', icon: Phone }]
    : [{ key: 'projects', label: 'My Projects', icon: FolderOpen }, { key: 'profile', label: 'Profile', icon: Handshake }, { key: 'contact', label: 'Contact', icon: Phone }];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {!isSetup && (
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text mb-6 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
      )}

      {isSetup && (
        <div className="mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
            <Handshake size={22} className="text-teal-600" />
          </div>
          <h1 className="text-xl font-bold text-text">Set up your hiring profile</h1>
          <p className="text-sm text-muted mt-1">Tell developers what you're looking for</p>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#F3F0EB] rounded-xl p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${activeTab === key ? 'bg-white text-teal-600 shadow-sm' : 'text-muted hover:text-text'}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* ── My Projects tab ── */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
            {!showAddForm && !editingProject && (
              <button onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl transition-colors">
                <Plus size={13} /> Add Project
              </button>
            )}
          </div>

          {showAddForm && (
            <ProjectForm
              onSave={handleAddProject}
              onCancel={() => setShowAddForm(false)}
              saving={projectSaving}
            />
          )}

          {projectsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-4 h-4 border-2 border-teal-300 border-t-teal-600 rounded-full animate-spin mr-2" />
              <span className="text-sm text-muted">Loading…</span>
            </div>
          ) : projects.length === 0 && !showAddForm ? (
            <div className="bg-white border border-border rounded-2xl p-12 text-center">
              <AlertCircle size={28} className="text-muted mx-auto mb-3" />
              <p className="text-sm font-semibold text-text mb-1">No projects yet</p>
              <p className="text-xs text-muted mb-4">Post your first project to start finding freelancers</p>
              <button onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl transition-colors">
                <Plus size={13} /> Add your first project
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => editingProject?._id === p._id ? (
                <ProjectForm
                  key={p._id}
                  initial={p}
                  onSave={handleEditProject}
                  onCancel={() => setEditingProject(null)}
                  saving={projectSaving}
                />
              ) : (
                <ProjectCard
                  key={p._id}
                  project={p}
                  onEdit={setEditingProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Profile tab (edit primary requirements) ── */}
      {activeTab === 'profile' && (
        <form onSubmit={isSetup ? handleSetupSubmit : async (e) => {
          e.preventDefault();
          if (!profileForm.projectName.trim()) { toast.error('Please describe what you need built'); return; }
          if (profileForm.skillsNeeded.length === 0) { toast.error('Please add at least one skill'); return; }
          setProfileSaving(true);
          try {
            const res = await api.put('/auth/profile', {
              clientProfile: {
                projectName: profileForm.projectName,
                budget: profileForm.budget || null,
                duration: profileForm.duration,
                skillsNeeded: profileForm.skillsNeeded,
                experienceLevel: profileForm.experienceLevel,
                description: profileForm.description,
              },
            });
            setUser(res.data.user);
            toast.success('Profile updated!');
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save');
          } finally {
            setProfileSaving(false);
          }
        }} className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-5 space-y-5">
            <h2 className="text-sm font-semibold text-text flex items-center gap-2">
              <Handshake size={14} className="text-teal-600" /> Primary Requirements
            </h2>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                What do you need built? <span className="text-red-400">*</span>
              </label>
              <input type="text" value={profileForm.projectName}
                onChange={e => setProfileForm(f => ({ ...f, projectName: e.target.value }))}
                placeholder="e.g. E-commerce website, Mobile app, REST API"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition bg-white" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Budget (₹)</label>
                <div className="relative">
                  <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input type="number" min="0" value={profileForm.budget}
                    onChange={e => setProfileForm(f => ({ ...f, budget: e.target.value }))}
                    placeholder="e.g. 50000"
                    className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition bg-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Duration</label>
                <div className="relative">
                  <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <select value={profileForm.duration}
                    onChange={e => setProfileForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full pl-8 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-white focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition appearance-none">
                    <option value="">Select duration</option>
                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5">
                <Code2 size={13} className="text-muted" /> Skills needed <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input type="text" value={profileForm.skillInput}
                  onChange={e => setProfileForm(f => ({ ...f, skillInput: e.target.value }))}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && profileForm.skillInput.trim()) {
                      e.preventDefault();
                      const v = profileForm.skillInput.trim().replace(/,$/, '');
                      if (!profileForm.skillsNeeded.includes(v))
                        setProfileForm(f => ({ ...f, skillsNeeded: [...f.skillsNeeded, v], skillInput: '' }));
                      else setProfileForm(f => ({ ...f, skillInput: '' }));
                    }
                  }}
                  placeholder="e.g. React, Node.js, Flutter"
                  className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition bg-white" />
                <button type="button"
                  onClick={() => {
                    const v = profileForm.skillInput.trim();
                    if (v && !profileForm.skillsNeeded.includes(v))
                      setProfileForm(f => ({ ...f, skillsNeeded: [...f.skillsNeeded, v], skillInput: '' }));
                    else setProfileForm(f => ({ ...f, skillInput: '' }));
                  }}
                  className="px-3 py-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-100 transition">
                  <Plus size={15} />
                </button>
              </div>
              <p className="text-xs text-muted mt-1">Press Enter or , to add</p>
              {profileForm.skillsNeeded.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profileForm.skillsNeeded.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                      {s}
                      <button type="button"
                        onClick={() => setProfileForm(f => ({ ...f, skillsNeeded: f.skillsNeeded.filter(x => x !== s) }))}
                        className="rounded-full p-0.5 hover:bg-teal-100"><X size={10} /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                <GraduationCap size={13} className="text-muted" /> Experience level
              </label>
              <div className="flex flex-wrap gap-2">
                {EXP_LEVELS.map(lvl => (
                  <button key={lvl} type="button"
                    onClick={() => setProfileForm(f => ({ ...f, experienceLevel: f.experienceLevel === lvl ? '' : lvl }))}
                    className={`text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${profileForm.experienceLevel === lvl ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-[#F9F8F6] text-muted border-border hover:border-teal-300'}`}>
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5">
                <FileText size={13} className="text-muted" /> Description <span className="text-xs text-muted font-normal">(optional)</span>
              </label>
              <textarea rows={4} value={profileForm.description}
                onChange={e => setProfileForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your project in detail…"
                className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-400/10 transition bg-white resize-none" />
            </div>
          </div>

          {isSetup ? (
            <button type="button" onClick={() => setActiveTab('contact')}
              className="w-full flex items-center justify-center gap-2 border border-border bg-white hover:border-teal-400 hover:text-teal-600 text-muted py-3 rounded-xl font-medium text-sm transition-colors">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button type="submit" disabled={profileSaving}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60">
              <Save size={14} />{profileSaving ? 'Saving…' : 'Save profile'}
            </button>
          )}
        </form>
      )}

      {/* ── Contact tab ── */}
      {activeTab === 'contact' && (
        <form onSubmit={isSetup ? handleSetupSubmit : saveContact} className="space-y-5">
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text">Contact Details</h2>
            <Field icon={<Mail size={15} />} label="Email" name="email" value={user?.email || ''} readOnly hint="Email cannot be changed" />
            <Field icon={<Phone size={15} />} label={<>Phone <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>}
              name="phone" value={contactForm.phone}
              onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+91 98765 43210" type="tel" />
          </div>
          <button type="submit" disabled={profileSaving || contactSaving}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60">
            <Save size={14} />{(profileSaving || contactSaving) ? 'Saving…' : 'Save'}
          </button>
        </form>
      )}
    </div>
  );
}

/* ── Root ─────────────────────────────────────────────────────────────────── */
export default function ClientProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  if (user?.userType === 'client') {
    return <ClientFreelanceProfile user={user} setUser={setUser} navigate={navigate} />;
  }
  return <RecruiterProfile user={user} setUser={setUser} navigate={navigate} />;
}
