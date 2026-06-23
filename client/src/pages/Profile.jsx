import { useState, useEffect, useRef } from 'react';
import { COUNTRIES, STATES_BY_COUNTRY, DISTRICTS_BY_STATE } from '../data/locationData';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, User, Mail, Phone, Link2, GitBranch,
  Globe, Save, Trash2, AlertTriangle, Camera, Loader2, FileText, Check, Plus, X as XIcon,
  Briefcase, BookOpen, IndianRupee, Code2, Languages, Clock, MapPin, Monitor, Calendar, Crown,
} from 'lucide-react';

const PRESET_DESIGNATIONS = [
  'MERN Stack Developer', 'MEAN Stack Developer', 'MEVN Stack Developer', 'PERN Stack Developer',
  'Python Full Stack Developer', 'Backend Developer',
  'React Developer', 'Next.js Developer', 'Vue.js Developer', 'Angular Developer',
  'PHP Developer', 'Laravel Developer',
  'Flutter Developer', 'React Native Developer', 'Android Developer', 'iOS Developer',
  'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'UI/UX Developer',
  'Java Full Stack Developer', '.NET Developer', 'Spring Boot Developer',
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" className="text-muted">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z" />
  </svg>
);

const TABS = [
  { id: 'basic', label: 'Basic Info', icon: User },
  { id: 'links', label: 'Developer Links', icon: Link2 },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'resume', label: 'Resume / CV', icon: FileText },
];

function Field({ icon, label, name, value, onChange, placeholder, type = 'text', readOnly = false, hint }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-2">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-2">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition ${readOnly ? 'bg-[#F9F8F6] cursor-not-allowed text-[#9CA3AF]' : 'bg-white'}`}
        />
      </div>
    </div>
  );
}

function DeleteModal({ onConfirm, onClose, deleting }) {
  const [input, setInput] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={20} className="text-red-500" />
        </div>
        <h2 className="text-base font-bold text-text text-center">Delete your account?</h2>
        <p className="text-xs text-muted text-center mt-1.5 mb-4">
          This will permanently delete your account and all your projects. This action cannot be undone.
        </p>
        <p className="text-xs font-medium text-text mb-1.5">
          Type <span className="font-bold text-red-500">DELETE</span> to confirm
        </p>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="DELETE"
          className="w-full border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-border text-muted hover:text-text rounded-xl py-2.5 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={input !== 'DELETE' || deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    linkedinUrl: user?.linkedinUrl || '',
    githubUrl: user?.githubUrl || '',
    leetcodeUrl: user?.leetcodeUrl || '',
    portfolioUrl: user?.portfolioUrl || '',
    cvUrl: user?.cvUrl || '',
    freelanceAvailable: user?.freelanceAvailable || false,
    freelanceRate: user?.freelanceRate ?? '',
    mentorshipAvailable: user?.mentorshipAvailable || false,
    mentorshipRate: user?.mentorshipRate ?? '',
    mentorshipTech: user?.mentorshipTech?.length ? user.mentorshipTech : [''],
    familiarTech: user?.familiarTech?.length ? user.familiarTech : [],
    mentorshipSchedule: user?.mentorshipSchedule || {},
    languagePreference: user?.languagePreference?.length ? user.languagePreference : [''],
    joiningAvailability: user?.joiningAvailability || '',
    currentSalary: user?.currentSalary ?? '',
    expectedSalary: user?.expectedSalary ?? '',
    preferredLocations: user?.preferredLocations?.length ? user.preferredLocations : [''],
    jobMode: user?.jobMode || [],
    yearsOfExperience: user?.yearsOfExperience || '',
    gender: user?.gender || '',
    place: user?.place || '',
    district: user?.district || 'Ernakulam',
    state: user?.state || 'Kerala',
    country: user?.country || 'India',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '2005-01-01',
    designations: user?.designations?.length ? user.designations : [],
  });
  const [designationInput, setDesignationInput] = useState('');
  const [showDesignationInput, setShowDesignationInput] = useState(false);
  const [techInput, setTechInput] = useState('');
  const [familiarTechInput, setFamiliarTechInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [placementPlan, setPlacementPlan] = useState(null);
  const avatarInputRef = useRef(null);
  const techRefs = useRef([]);
  const langRefs = useRef([]);

  const handleTechChange = (e, i) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',').map(p => p.trim()).filter((p, idx) => idx === 0 || p);
      setForm(f => {
        const updated = [...f.mentorshipTech];
        updated.splice(i, 1, ...parts);
        return { ...f, mentorshipTech: updated };
      });
      setTimeout(() => techRefs.current[i + parts.length - 1]?.focus(), 0);
    } else {
      setForm(f => ({ ...f, mentorshipTech: f.mentorshipTech.map((v, j) => j === i ? val : v) }));
    }
  };

  const handleTechKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForm(f => {
        const updated = [...f.mentorshipTech];
        updated.splice(i + 1, 0, '');
        return { ...f, mentorshipTech: updated };
      });
      setTimeout(() => techRefs.current[i + 1]?.focus(), 0);
    }
  };

  const handleLangChange = (e, i) => {
    const val = e.target.value;
    if (val.includes(',')) {
      const parts = val.split(',').map(p => p.trim()).filter((p, idx) => idx === 0 || p);
      setForm(f => {
        const updated = [...f.languagePreference];
        updated.splice(i, 1, ...parts);
        return { ...f, languagePreference: updated };
      });
      setTimeout(() => langRefs.current[i + parts.length - 1]?.focus(), 0);
    } else {
      setForm(f => ({ ...f, languagePreference: f.languagePreference.map((v, j) => j === i ? val : v) }));
    }
  };

  const handleLangKeyDown = (e, i) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setForm(f => {
        const updated = [...f.languagePreference];
        updated.splice(i + 1, 0, '');
        return { ...f, languagePreference: updated };
      });
      setTimeout(() => langRefs.current[i + 1]?.focus(), 0);
    }
  };

  useEffect(() => {
    if (user?.userType === 'client') navigate('/client-profile', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    api.get('/payments/placement/my-purchases')
      .then(r => {
        if (r.data.length > 0) {
          const top = r.data.reduce((a, b) => b.amountPaise > a.amountPaise ? b : a);
          const name = top.pack.replace('placement_', '');
          setPlacementPlan(name.charAt(0).toUpperCase() + name.slice(1));
        }
      })
      .catch(() => {});
  }, []);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleDeleteAvatar = async () => {
    try {
      const res = await api.delete('/auth/avatar');
      setUser(res.data.user);
      toast.success('Profile photo removed');
    } catch {
      toast.error('Failed to remove photo');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.put('/auth/profile', fd);
      setUser(res.data.user);
      toast.success('Profile photo updated!');
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete('/auth/account');
      setUser(null);
      toast.success('Account deleted');
      navigate('/');
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
  };

  const handleNext = () => {
    if (activeTab === 0 && !form.name.trim()) {
      toast.error('Full name is required');
      return;
    }
    setCompleted(prev => new Set(prev).add(activeTab));
    setActiveTab(i => i + 1);
  };

  const handleBack = () => setActiveTab(i => i - 1);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.cvUrl.trim()) { toast.error('Google Drive CV link is required'); return; }
    setCompleted(prev => new Set(prev).add(activeTab));
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      toast.success('Profile updated!');
      const isOnboarding = location.state?.fromOnboarding || searchParams.get('fromOnboarding') === 'true';
      navigate(isOnboarding ? '/career-services' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isLast = activeTab === TABS.length - 1;

  const COMPLETION_ITEMS = [
    { label: 'Profile photo',    done: !!user?.avatar },
    { label: 'Mobile number',    done: !!form.phone },
    { label: 'Gender',           done: !!form.gender },
    { label: 'Location',         done: !!(form.country && form.state) },
    { label: 'Date of birth',    done: !!form.dateOfBirth },
    { label: 'Designation',       done: form.designations.length > 0 },
    { label: 'LinkedIn',         done: !!form.linkedinUrl },
    { label: 'GitHub',           done: !!form.githubUrl },
    { label: 'Portfolio URL',    done: !!form.portfolioUrl },
    { label: 'CV / Resume',        done: !!form.cvUrl },
    { label: 'Opportunities',      done: form.freelanceAvailable || form.mentorshipAvailable || !!form.joiningAvailability },
    { label: 'Mode of Job',        done: form.jobMode.length > 0 },
    { label: 'Years of Experience', done: !!form.yearsOfExperience },
  ];
  const completedCount = COMPLETION_ITEMS.filter(i => i.done).length;
  const completionPct = Math.round((completedCount / COMPLETION_ITEMS.length) * 100);
  const completionColor = completionPct >= 80 ? '#00A693' : '#F59E0B';

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-3 pt-2 pb-6">
<div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: sticky profile card ── */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 space-y-4 lg:mt-20">

          {/* Avatar card with full progress border */}
          <div className="relative group">
            {/* Missing items tooltip */}
            {COMPLETION_ITEMS.some(i => !i.done) && (
              <div className="absolute top-full inset-x-0 mx-auto mt-2.5 z-50 w-56 bg-gray-900 text-white text-xs rounded-xl px-3.5 py-3 shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                {/* Arrow */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
                <p className="font-semibold text-[11px] text-gray-300 mb-2">Missing to complete profile:</p>
                <ul className="space-y-1.5">
                  {COMPLETION_ITEMS.filter(i => !i.done).map(item => (
                    <li key={item.label} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div
              className="rounded-2xl p-0.75 transition-all duration-500"
              style={{
                background: `conic-gradient(from -90deg, ${completionColor} ${completionPct}%, #EF4444 ${completionPct}%)`,
              }}
            >
            <div className="bg-white rounded-[14px] p-5 relative">
              <span className="absolute top-2 right-3 text-[10px] font-semibold" style={{ color: completionColor }}>
                {completionPct}%
              </span>
              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  {user?.avatar
                    ? <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                    : <span className="w-20 h-20 rounded-full bg-linear-to-br from-accent/20 to-accent/40 border-2 border-accent/30 flex flex-col items-center justify-center overflow-hidden">
                        <span className="w-8 h-8 rounded-full bg-accent/40 flex items-center justify-center mb-0.5">
                          <User size={16} className="text-accent" />
                        </span>
                        <span className="w-12 h-6 rounded-t-full bg-accent/30" />
                      </span>
                  }
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-accent hover:bg-accent-hover rounded-full flex items-center justify-center border-2 border-white transition-colors disabled:opacity-60"
                  >
                    {avatarUploading
                      ? <Loader2 size={12} className="text-white animate-spin" />
                      : <Camera size={12} className="text-white" />
                    }
                  </button>
                  {user?.avatar && (
                    <button
                      type="button"
                      onClick={handleDeleteAvatar}
                      className="absolute -bottom-0.5 -left-0.5 w-7 h-7 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center border-2 border-white transition-colors"
                      title="Remove photo"
                    >
                      <Trash2 size={12} className="text-white" />
                    </button>
                  )}
                  {!user?.avatar && (
                    <span className="absolute -top-1 -left-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center border-2 border-white" title="No profile photo">
                      <AlertTriangle size={11} className="text-white" />
                    </span>
                  )}
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <p className="font-semibold text-text">{user?.name}</p>
                    {user?.regNumber && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-accent-light text-accent border border-accent/20">
                        {user.userType === 'client' ? 'C' : 'D'}{user.regNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mt-0.5">{user?.email}</p>
                  {placementPlan && (
                    <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      <Crown size={10} className="text-amber-500" /> {placementPlan} Plan Active
                    </span>
                  )}
                  <span className="text-xs text-muted mt-1 block">
                    {user?.isGoogleUser ? 'Signed in with Google' : 'Click camera to change photo'}
                  </span>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border border-red-100 bg-red-50/50 rounded-2xl p-6 lg:mt-8">
            <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
            <p className="text-xs text-muted mb-3">Permanently delete your account and all your projects.</p>
            <button
              onClick={() => setShowDelete(true)}
              className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Trash2 size={13} /> Delete Account
            </button>
          </div>
        </div>

        {/* ── Right: tab wizard ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Step indicators */}
          <div className="flex items-center">
            {TABS.map((tab, i) => {
              const Icon = tab.icon;
              const isActive = i === activeTab;
              const isDone = completed.has(i);
              return (
                <div key={tab.id} className="flex items-center flex-1 last:flex-none">
                  <button
                    type="button"
                    onClick={() => setActiveTab(i)}
                    className="flex flex-col items-center gap-1.5 flex-1 group"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-accent border-accent text-white shadow-md shadow-accent/30'
                        : isDone
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'bg-white border-border text-muted group-hover:border-accent/40 group-hover:text-accent'
                    }`}>
                      {isDone && !isActive ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-[11px] font-medium hidden sm:block transition-colors ${
                      isActive ? 'text-accent' : isDone ? 'text-accent' : 'text-muted'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                  {i < TABS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-300 ${
                      completed.has(i) ? 'bg-accent' : 'bg-border'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="bg-white border border-border rounded-2xl p-5 min-h-70">

            {/* Tab 0 — Basic Info */}
            {activeTab === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <User size={15} className="text-accent" />
                  <h2 className="text-sm font-semibold text-text">Basic Info</h2>
                </div>

                {/* Row 1: Full name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<User size={15} />}
                    label={<>Full name <span className="text-red-400">*</span></>}
                    name="name"
                    value={form.name}
                    onChange={handle}
                    placeholder="Your full name"
                  />
                  <Field
                    icon={<Mail size={15} />}
                    label="Email"
                    name="email"
                    value={user?.email || ''}
                    placeholder=""
                    readOnly
                    />
                </div>

                {/* Row 2: Mobile + Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<Phone size={15} />}
                    label="Mobile"
                    name="phone"
                    value={form.phone}
                    onChange={handle}
                    placeholder="9847012345"
                    type="tel"
                  />
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">Gender</label>
                    <div className="flex gap-2">
                      {[
                        { label: 'Male', value: 'male' },
                        { label: 'Female', value: 'female' },
                        { label: 'Other', value: 'other' },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, gender: f.gender === opt.value ? '' : opt.value }))}
                          className={`px-5 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                            form.gender === opt.value
                              ? 'bg-accent text-white border-accent'
                              : 'bg-white text-muted border-border hover:border-accent/40 hover:text-accent'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Country + State + District */}
                {(() => {
                  const stateOptions = STATES_BY_COUNTRY[form.country] || [];
                  const districtOptions = DISTRICTS_BY_STATE[form.state] || [];
                  const selectCls = 'w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white appearance-none';
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">Country</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><MapPin size={15} /></span>
                          <select name="country" value={form.country} className={selectCls}
                            onChange={e => setForm(f => ({ ...f, country: e.target.value, state: '', district: '' }))}>
                            <option value="">Select country</option>
                            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">State</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><MapPin size={15} /></span>
                          <select name="state" value={form.state} className={selectCls}
                            disabled={!stateOptions.length}
                            onChange={e => setForm(f => ({ ...f, state: e.target.value, district: '' }))}>
                            <option value="">Select state</option>
                            {stateOptions.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">District</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><MapPin size={15} /></span>
                          <select name="district" value={form.district} className={selectCls}
                            disabled={!districtOptions.length}
                            onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                            <option value="">Select district</option>
                            {districtOptions.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Row 4: Date of Birth + Designation */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    icon={<Calendar size={15} />}
                    label="Date of Birth"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handle}
                    type="date"
                    placeholder=""
                  />
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                      <Briefcase size={13} className="text-muted" /> Designation
                    </label>
                    {showDesignationInput ? (
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          type="text"
                          value={designationInput}
                          onChange={e => setDesignationInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const val = designationInput.trim();
                              if (val && !form.designations.includes(val))
                                setForm(f => ({ ...f, designations: [...f.designations, val] }));
                              setDesignationInput(''); setShowDesignationInput(false);
                            }
                            if (e.key === 'Escape') { setDesignationInput(''); setShowDesignationInput(false); }
                          }}
                          placeholder="e.g. Golang Developer"
                          className="flex-1 pl-3.5 pr-3 py-2.5 border border-accent rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/10 bg-white"
                        />
                        <button type="button"
                          onClick={() => {
                            const val = designationInput.trim();
                            if (val && !form.designations.includes(val))
                              setForm(f => ({ ...f, designations: [...f.designations, val] }));
                            setDesignationInput(''); setShowDesignationInput(false);
                          }}
                          className="w-10 h-10 flex items-center justify-center bg-accent text-white rounded-xl hover:bg-accent-hover transition-colors shrink-0">
                          <Check size={14} />
                        </button>
                        <button type="button"
                          onClick={() => { setDesignationInput(''); setShowDesignationInput(false); }}
                          className="w-10 h-10 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 border border-border rounded-xl transition-colors shrink-0">
                          <XIcon size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <select
                          value=""
                          onChange={e => {
                            const val = e.target.value;
                            if (val && !form.designations.includes(val))
                              setForm(f => ({ ...f, designations: [...f.designations, val] }));
                          }}
                          className="flex-1 pl-3.5 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition appearance-none"
                        >
                          <option value="">Select designation</option>
                          {PRESET_DESIGNATIONS.filter(d => !form.designations.includes(d)).map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                        <button type="button"
                          onClick={() => setShowDesignationInput(true)}
                          title="Add custom designation"
                          className="w-10 h-10 flex items-center justify-center border border-dashed border-accent/60 text-accent hover:bg-accent/5 rounded-xl transition-colors shrink-0">
                          <Plus size={15} />
                        </button>
                      </div>
                    )}
                    {form.designations.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {form.designations.map(d => (
                          <span key={d} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                            {d}
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, designations: f.designations.filter(x => x !== d) }))}
                              className="hover:opacity-60 transition-opacity">
                              <XIcon size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1 — Developer Links */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={15} className="text-accent" />
                  <h2 className="text-sm font-semibold text-text">Developer Links <span className="text-xs text-muted font-normal">(all optional)</span></h2>
                </div>

                {/* Row 1: LinkedIn + GitHub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<Link2 size={15} />} label="LinkedIn" name="linkedinUrl" value={form.linkedinUrl} onChange={handle} placeholder="linkedin.com/in/yourprofile" />
                  <Field icon={<GitBranch size={15} />} label="GitHub" name="githubUrl" value={form.githubUrl} onChange={handle} placeholder="github.com/yourusername" />
                </div>

                {/* Row 2: LeetCode + Portfolio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field icon={<LeetCodeIcon />} label="LeetCode" name="leetcodeUrl" value={form.leetcodeUrl} onChange={handle} placeholder="leetcode.com/yourusername" />
                  <Field icon={<Globe size={15} />} label="Portfolio" name="portfolioUrl" value={form.portfolioUrl} onChange={handle} placeholder="yourportfolio.com" />
                </div>

                {/* Tech Stack — Know Well */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1">
                    <Code2 size={13} className="text-muted" /> Know Well
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={techInput}
                        onChange={e => setTechInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = techInput.trim().replace(/,$/, '');
                            if (val && !form.mentorshipTech.filter(Boolean).includes(val))
                              setForm(f => ({ ...f, mentorshipTech: [...f.mentorshipTech.filter(Boolean), val] }));
                            setTechInput('');
                          }
                        }}
                        placeholder="e.g. React, Node.js… (Enter or comma to add)"
                        className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = techInput.trim();
                          if (val && !form.mentorshipTech.filter(Boolean).includes(val))
                            setForm(f => ({ ...f, mentorshipTech: [...f.mentorshipTech.filter(Boolean), val] }));
                          setTechInput('');
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent-hover text-white rounded-xl transition-colors shrink-0"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    {form.mentorshipTech.filter(Boolean).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.mentorshipTech.filter(Boolean).map((t, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-accent/10 text-accent border border-accent/20">
                            {t}
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, mentorshipTech: f.mentorshipTech.filter((_, j) => j !== i) }))}
                              className="hover:opacity-60 transition-opacity">
                              <XIcon size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Tech Stack — Familiar With */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1">
                    <Code2 size={13} className="text-muted" /> Familiar With
                  </label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={familiarTechInput}
                        onChange={e => setFamiliarTechInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ',') {
                            e.preventDefault();
                            const val = familiarTechInput.trim().replace(/,$/, '');
                            if (val && !form.familiarTech.includes(val))
                              setForm(f => ({ ...f, familiarTech: [...f.familiarTech, val] }));
                            setFamiliarTechInput('');
                          }
                        }}
                        placeholder="e.g. Docker, Kubernetes… (Enter or comma to add)"
                        className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = familiarTechInput.trim();
                          if (val && !form.familiarTech.includes(val))
                            setForm(f => ({ ...f, familiarTech: [...f.familiarTech, val] }));
                          setFamiliarTechInput('');
                        }}
                        className="w-10 h-10 flex items-center justify-center bg-muted hover:bg-[#4B5563] text-white rounded-xl transition-colors shrink-0"
                      >
                        <Plus size={15} />
                      </button>
                    </div>
                    {form.familiarTech.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.familiarTech.map((t, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-muted/10 text-muted border border-muted/20">
                            {t}
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, familiarTech: f.familiarTech.filter((_, j) => j !== i) }))}
                              className="hover:opacity-60 transition-opacity">
                              <XIcon size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2 — Opportunities */}
            {activeTab === 2 && (
              <div className="space-y-6">

                {/* Freelance */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                      <Briefcase size={13} className="text-teal-600" />
                    </div>
                    <h2 className="text-sm font-semibold text-text">Freelance</h2>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-[#F9F8F6] rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">Available for freelance?</p>
                      {form.freelanceAvailable && <p className="text-xs text-muted mt-0.5">Hourly rate (in ₹)</p>}
                    </div>
                    {form.freelanceAvailable && (
                      <div className="relative w-36 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={13} /></span>
                        <input
                          type="number" min="0" name="freelanceRate"
                          value={form.freelanceRate}
                          onChange={handle}
                          placeholder="Rate/hr"
                          className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                        />
                      </div>
                    )}
                    <div
                      onClick={() => setForm(f => ({ ...f, freelanceAvailable: !f.freelanceAvailable }))}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${form.freelanceAvailable ? 'bg-accent' : 'bg-border'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.freelanceAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                </div>

                {/* Mentorship */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <BookOpen size={13} className="text-purple-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-text">Mentorship</h2>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-[#F9F8F6] rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text">Available for mentorship?</p>
                      {form.mentorshipAvailable && <p className="text-xs text-muted mt-0.5">Session rate (in ₹)</p>}
                    </div>
                    {form.mentorshipAvailable && (
                      <div className="relative w-36 shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={13} /></span>
                        <input
                          type="number" min="0" name="mentorshipRate"
                          value={form.mentorshipRate}
                          onChange={handle}
                          placeholder="Rate/session"
                          className="w-full pl-8 pr-3 py-1.5 border border-border rounded-lg text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                        />
                      </div>
                    )}
                    <div
                      onClick={() => setForm(f => ({ ...f, mentorshipAvailable: !f.mentorshipAvailable }))}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${form.mentorshipAvailable ? 'bg-accent' : 'bg-border'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.mentorshipAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </div>
                  {form.mentorshipAvailable && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                            <Code2 size={13} className="text-muted" /> Stack you can mentor in
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {form.mentorshipTech.map((t, i) => (
                              <div key={i} className="flex gap-1.5 items-center">
                                <input
                                  ref={el => techRefs.current[i] = el}
                                  type="text" value={t}
                                  onChange={e => handleTechChange(e, i)}
                                  onKeyDown={e => handleTechKeyDown(e, i)}
                                  placeholder="e.g. MERN Stack"
                                  className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                                />
                                {i === form.mentorshipTech.length - 1 ? (
                                  <button type="button"
                                    onClick={() => setForm(f => ({ ...f, mentorshipTech: [...f.mentorshipTech, ''] }))}
                                    className="w-7 h-7 flex items-center justify-center text-accent hover:bg-accent/10 rounded-lg transition-colors border border-accent/30 shrink-0">
                                    <Plus size={12} />
                                  </button>
                                ) : (
                                  <button type="button"
                                    onClick={() => setForm(f => ({ ...f, mentorshipTech: f.mentorshipTech.filter((_, j) => j !== i) }))}
                                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <XIcon size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                            <Languages size={13} className="text-muted" /> Language preference
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {form.languagePreference.map((l, i) => (
                              <div key={i} className="flex gap-1.5 items-center">
                                <input
                                  ref={el => langRefs.current[i] = el}
                                  type="text" value={l}
                                  onChange={e => handleLangChange(e, i)}
                                  onKeyDown={e => handleLangKeyDown(e, i)}
                                  placeholder="e.g. English"
                                  className="flex-1 min-w-0 px-3 py-2 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                                />
                                {i === form.languagePreference.length - 1 ? (
                                  <button type="button"
                                    onClick={() => setForm(f => ({ ...f, languagePreference: [...f.languagePreference, ''] }))}
                                    className="w-7 h-7 flex items-center justify-center text-accent hover:bg-accent/10 rounded-lg transition-colors border border-accent/30 shrink-0">
                                    <Plus size={12} />
                                  </button>
                                ) : (
                                  <button type="button"
                                    onClick={() => setForm(f => ({ ...f, languagePreference: f.languagePreference.filter((_, j) => j !== i) }))}
                                    className="w-7 h-7 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                                    <XIcon size={12} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-3">
                          <Clock size={13} className="text-muted" /> Weekly availability
                          <span className="text-xs text-muted font-normal ml-1">(select days &amp; time)</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS.map(day => {
                            const active = !!form.mentorshipSchedule[day];
                            return (
                              <div
                                key={day}
                                onClick={() => setForm(f => {
                                  const sched = { ...f.mentorshipSchedule };
                                  if (sched[day]) delete sched[day];
                                  else sched[day] = { from: '19:00', to: '22:00' };
                                  return { ...f, mentorshipSchedule: sched };
                                })}
                                className={`rounded-xl border transition-colors cursor-pointer ${active ? 'bg-purple-50 border-purple-300' : 'bg-[#F9F8F6] border-border hover:border-purple-200'}`}
                              >
                                <div className={`w-full px-4 py-1.5 text-xs font-semibold text-center ${active ? 'text-purple-700' : 'text-muted'}`}>
                                  {DAY_SHORT[day]}
                                </div>
                                {active && (
                                  <div className="px-2 pb-2 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                                    <input
                                      type="time"
                                      value={form.mentorshipSchedule[day].from}
                                      onChange={e => setForm(f => ({ ...f, mentorshipSchedule: { ...f.mentorshipSchedule, [day]: { ...f.mentorshipSchedule[day], from: e.target.value } } }))}
                                      className="border border-purple-200 rounded-lg px-1.5 py-1 text-[11px] text-text bg-white focus:outline-none focus:border-accent transition w-full"
                                    />
                                    <input
                                      type="time"
                                      value={form.mentorshipSchedule[day].to}
                                      onChange={e => setForm(f => ({ ...f, mentorshipSchedule: { ...f.mentorshipSchedule, [day]: { ...f.mentorshipSchedule[day], to: e.target.value } } }))}
                                      className="border border-purple-200 rounded-lg px-1.5 py-1 text-[11px] text-text bg-white focus:outline-none focus:border-accent transition w-full"
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* Tab 3 — Resume / CV */}
            {activeTab === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <FileText size={13} className="text-blue-500" />
                  </div>
                  <h2 className="text-sm font-semibold text-text">Resume / CV</h2>
                </div>

                {/* CV link */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-text">Google Drive CV link <span className="text-red-400">*</span></label>
                    {form.cvUrl && (
                      <a href={form.cvUrl.startsWith('http') ? form.cvUrl : `https://${form.cvUrl}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
                        <FileText size={12} /> Preview your CV
                      </a>
                    )}
                  </div>

                  {/* Instructions */}
                  <p className="mb-3 text-xs text-red-500 leading-snug">
                    Upload your CV to Google Drive → <span className="font-semibold">Share</span> → <span className="font-semibold">Share</span> → <span className="font-semibold">Anyone with the link</span> → set role to <span className="font-semibold">Viewer</span>, then paste the link below.
                  </p>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><FileText size={15} /></span>
                    <input
                      type="text"
                      name="cvUrl"
                      value={form.cvUrl}
                      onChange={handle}
                      placeholder="drive.google.com/file/d/…"
                      className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                    />
                  </div>
                </div>

                <hr className="border-border" />

                {/* Current & Expected salary */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Current Salary <span className="text-xs text-muted font-normal">(per year)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={14} /></span>
                      <input
                        type="number" min="0" name="currentSalary"
                        value={form.currentSalary}
                        onChange={handle}
                        placeholder="e.g. 350000"
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      Expected Salary <span className="text-xs text-muted font-normal">(per year)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={14} /></span>
                      <input
                        type="number" min="0" name="expectedSalary"
                        value={form.expectedSalary}
                        onChange={handle}
                        placeholder="e.g. 500000"
                        className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Joining availability + Mode of Job */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="block text-sm font-medium text-text mb-2">
                      <span className="flex items-center gap-1.5"><Clock size={13} className="text-muted" /> Joining Availability</span>
                    </label>
                    <select
                      name="joiningAvailability"
                      value={form.joiningAvailability}
                      onChange={handle}
                      className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    >
                      <option value="">Select availability</option>
                      {['Immediately', '15 days', '1 month', '2 months', '3 months', '3+ months'].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                      <Monitor size={13} className="text-muted" /> Mode of Job <span className="text-xs text-muted font-normal">(You can select multiple options)</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Remote', 'Hybrid', 'On-site'].map(mode => {
                        const active = form.jobMode.includes(mode);
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setForm(f => ({
                              ...f,
                              jobMode: active ? f.jobMode.filter(m => m !== mode) : [...f.jobMode, mode],
                            }))}
                            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                              active
                                ? 'bg-accent text-white border-accent'
                                : 'bg-white text-muted border-border hover:border-accent/40 hover:text-accent'
                            }`}
                          >
                            {mode}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Preferred Locations + Years of Experience */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                      <MapPin size={13} className="text-muted" /> Preferred Locations
                    </label>
                    <div className="space-y-2">
                      {form.preferredLocations.map((loc, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="text" value={loc}
                            onChange={e => setForm(f => ({ ...f, preferredLocations: f.preferredLocations.map((v, j) => j === i ? e.target.value : v) }))}
                            placeholder="e.g. Kochi"
                            className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                          />
                          {form.preferredLocations.length > 1 && (
                            <button type="button"
                              onClick={() => setForm(f => ({ ...f, preferredLocations: f.preferredLocations.filter((_, j) => j !== i) }))}
                              className="w-8 h-8 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                              <XIcon size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, preferredLocations: [...f.preferredLocations, ''] }))}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                        <Plus size={12} /> Add location
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                      <Briefcase size={13} className="text-muted" /> Years of Experience
                    </label>
                    <select
                      value={form.yearsOfExperience}
                      onChange={e => setForm(f => ({ ...f, yearsOfExperience: e.target.value }))}
                      className="w-full border border-border rounded-xl px-3.5 py-2.5 text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    >
                      <option value="">Select experience</option>
                      <option value="Fresher">Fresher (0 years)</option>
                      <option value="0-1">Less than 1 year</option>
                      <option value="1-2">1 – 2 years</option>
                      <option value="2-3">2 – 3 years</option>
                      <option value="3-5">3 – 5 years</option>
                      <option value="5-7">5 – 7 years</option>
                      <option value="7-10">7 – 10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={activeTab === 0}
              className="flex items-center gap-1.5 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-muted hover:text-text hover:border-muted disabled:opacity-0 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft size={14} /> Back
            </button>
            {isLast ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-60 shadow-sm shadow-accent/20"
              >
                <Save size={14} /> {saving ? 'Saving…' : 'Save Profile'}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-medium text-sm transition-colors shadow-sm shadow-accent/20"
              >
                Next <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteModal
          onConfirm={handleDelete}
          onClose={() => setShowDelete(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
