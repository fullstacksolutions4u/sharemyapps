import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, User, Mail, Phone, Link2, GitBranch,
  Globe, Save, Trash2, AlertTriangle, Camera, Loader2, FileText, Check, Plus, X as XIcon,
  Briefcase, BookOpen, IndianRupee, Code2, Languages, Clock, MapPin, Monitor,
} from 'lucide-react';

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
    mentorshipSchedule: user?.mentorshipSchedule || {},
    languagePreference: user?.languagePreference?.length ? user.languagePreference : [''],
    joiningAvailability: user?.joiningAvailability || '',
    currentSalary: user?.currentSalary ?? '',
    expectedSalary: user?.expectedSalary ?? '',
    preferredLocations: user?.preferredLocations?.length ? user.preferredLocations : [''],
    jobMode: user?.jobMode || [],
  });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (user?.userType === 'client') navigate('/client-profile', { replace: true });
  }, [user, navigate]);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const isLast = activeTab === TABS.length - 1;

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-3 py-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text mb-4 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Left: sticky profile card ── */}
        <div className="w-full lg:w-72 shrink-0 lg:sticky lg:top-6 space-y-4">

          {/* Avatar card */}
          <div className="bg-white border border-border rounded-2xl p-5">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="relative">
                {user?.avatar
                  ? <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover" />
                  : <span className="w-20 h-20 rounded-full bg-accent text-white text-2xl font-bold flex items-center justify-center">
                      {user?.name?.[0]?.toUpperCase()}
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
                <span className="text-xs text-muted mt-1 block">
                  {user?.isGoogleUser ? 'Signed in with Google' : 'Click camera to change photo'}
                </span>
              </div>
            </div>
          </div>

          {/* Danger zone */}
          <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4">
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
                  hint="Email cannot be changed"
                />
                <Field
                  icon={<Phone size={15} />}
                  label={<>Mobile <span className="text-xs text-muted font-normal">(optional)</span></>}
                  name="phone"
                  value={form.phone}
                  onChange={handle}
                  placeholder="+1 234 567 8900"
                  type="tel"
                />
              </div>
            )}

            {/* Tab 1 — Developer Links */}
            {activeTab === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Link2 size={15} className="text-accent" />
                  <h2 className="text-sm font-semibold text-text">Developer Links <span className="text-xs text-muted font-normal">(all optional)</span></h2>
                </div>
                <Field icon={<Link2 size={15} />} label="LinkedIn" name="linkedinUrl" value={form.linkedinUrl} onChange={handle} placeholder="linkedin.com/in/yourprofile" />
                <Field icon={<GitBranch size={15} />} label="GitHub" name="githubUrl" value={form.githubUrl} onChange={handle} placeholder="github.com/yourusername" />
                <Field icon={<LeetCodeIcon />} label="LeetCode" name="leetcodeUrl" value={form.leetcodeUrl} onChange={handle} placeholder="leetcode.com/yourusername" />
                <Field icon={<Globe size={15} />} label={<>Portfolio <span className="text-xs text-muted font-normal">(optional)</span></>} name="portfolioUrl" value={form.portfolioUrl} onChange={handle} placeholder="yourportfolio.com" />
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
                  <label className="flex items-center justify-between p-3 bg-[#F9F8F6] rounded-xl cursor-pointer select-none">
                    <div>
                      <p className="text-sm font-medium text-text">Available for freelance?</p>
                      <p className="text-xs text-muted mt-0.5">Let clients know you're open to projects</p>
                    </div>
                    <div
                      onClick={() => setForm(f => ({ ...f, freelanceAvailable: !f.freelanceAvailable }))}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${form.freelanceAvailable ? 'bg-accent' : 'bg-border'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.freelanceAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </label>
                  {form.freelanceAvailable && (
                    <div>
                      <label className="block text-sm font-medium text-text mb-2">
                        Rate / hour <span className="text-xs text-muted font-normal">(approximate, in ₹)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={14} /></span>
                        <input
                          type="number" min="0" name="freelanceRate"
                          value={form.freelanceRate}
                          onChange={handle}
                          placeholder="e.g. 500"
                          className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                {/* Mentorship */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                      <BookOpen size={13} className="text-purple-500" />
                    </div>
                    <h2 className="text-sm font-semibold text-text">Mentorship</h2>
                  </div>
                  <label className="flex items-center justify-between p-3 bg-[#F9F8F6] rounded-xl cursor-pointer select-none">
                    <div>
                      <p className="text-sm font-medium text-text">Available for mentorship?</p>
                      <p className="text-xs text-muted mt-0.5">Guide others and share your expertise</p>
                    </div>
                    <div
                      onClick={() => setForm(f => ({ ...f, mentorshipAvailable: !f.mentorshipAvailable }))}
                      className={`w-10 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${form.mentorshipAvailable ? 'bg-accent' : 'bg-border'}`}
                    >
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.mentorshipAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                    </div>
                  </label>
                  {form.mentorshipAvailable && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text mb-2">
                          Session rate <span className="text-xs text-muted font-normal">(₹ per session)</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"><IndianRupee size={14} /></span>
                          <input
                            type="number" min="0" name="mentorshipRate"
                            value={form.mentorshipRate}
                            onChange={handle}
                            placeholder="e.g. 1000"
                            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                          <Code2 size={13} className="text-muted" /> Technologies you can mentor in
                        </label>
                        <div className="space-y-2">
                          {form.mentorshipTech.map((t, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input
                                type="text" value={t}
                                onChange={e => setForm(f => ({ ...f, mentorshipTech: f.mentorshipTech.map((v, j) => j === i ? e.target.value : v) }))}
                                placeholder="e.g. React, Node.js, Python"
                                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                              />
                              {form.mentorshipTech.length > 1 && (
                                <button type="button"
                                  onClick={() => setForm(f => ({ ...f, mentorshipTech: f.mentorshipTech.filter((_, j) => j !== i) }))}
                                  className="w-8 h-8 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                  <XIcon size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, mentorshipTech: [...f.mentorshipTech, ''] }))}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                            <Plus size={12} /> Add technology
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-2">
                          <Languages size={13} className="text-muted" /> Language preference
                        </label>
                        <div className="space-y-2">
                          {form.languagePreference.map((l, i) => (
                            <div key={i} className="flex gap-2 items-center">
                              <input
                                type="text" value={l}
                                onChange={e => setForm(f => ({ ...f, languagePreference: f.languagePreference.map((v, j) => j === i ? e.target.value : v) }))}
                                placeholder="e.g. English, Hindi, Tamil"
                                className="flex-1 px-3.5 py-2.5 border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition bg-white"
                              />
                              {form.languagePreference.length > 1 && (
                                <button type="button"
                                  onClick={() => setForm(f => ({ ...f, languagePreference: f.languagePreference.filter((_, j) => j !== i) }))}
                                  className="w-8 h-8 flex items-center justify-center text-muted hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                  <XIcon size={13} />
                                </button>
                              )}
                            </div>
                          ))}
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, languagePreference: [...f.languagePreference, ''] }))}
                            className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors">
                            <Plus size={12} /> Add language
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-3">
                          <Clock size={13} className="text-muted" /> Weekly availability
                          <span className="text-xs text-muted font-normal ml-1">(select days &amp; time)</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {DAYS.map(day => {
                            const active = !!form.mentorshipSchedule[day];
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setForm(f => {
                                  const sched = { ...f.mentorshipSchedule };
                                  if (sched[day]) delete sched[day];
                                  else sched[day] = { from: '09:00', to: '17:00' };
                                  return { ...f, mentorshipSchedule: sched };
                                })}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-purple-100 text-purple-700 border-purple-300' : 'bg-[#F9F8F6] text-muted border-border hover:border-purple-200 hover:text-purple-600'}`}
                              >
                                {DAY_SHORT[day]}
                              </button>
                            );
                          })}
                        </div>
                        {DAYS.filter(d => form.mentorshipSchedule[d]).length > 0 && (
                          <div className="space-y-2 bg-[#F9F8F6] rounded-xl p-3">
                            {DAYS.filter(d => form.mentorshipSchedule[d]).map(day => (
                              <div key={day} className="flex items-center gap-2">
                                <span className="w-8 text-xs font-semibold text-purple-700 shrink-0">{DAY_SHORT[day]}</span>
                                <input
                                  type="time"
                                  value={form.mentorshipSchedule[day].from}
                                  onChange={e => setForm(f => ({ ...f, mentorshipSchedule: { ...f.mentorshipSchedule, [day]: { ...f.mentorshipSchedule[day], from: e.target.value } } }))}
                                  className="border border-border rounded-lg px-2 py-1 text-xs text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                                />
                                <span className="text-muted text-xs">–</span>
                                <input
                                  type="time"
                                  value={form.mentorshipSchedule[day].to}
                                  onChange={e => setForm(f => ({ ...f, mentorshipSchedule: { ...f.mentorshipSchedule, [day]: { ...f.mentorshipSchedule[day], to: e.target.value } } }))}
                                  className="border border-border rounded-lg px-2 py-1 text-xs text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                                />
                              </div>
                            ))}
                          </div>
                        )}
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
                <Field
                  icon={<FileText size={15} />}
                  label={<>Google Drive CV link <span className="text-red-400">*</span></>}
                  name="cvUrl"
                  value={form.cvUrl}
                  onChange={handle}
                  placeholder="drive.google.com/file/d/…"
                />
                {form.cvUrl && (
                  <a href={form.cvUrl.startsWith('http') ? form.cvUrl : `https://${form.cvUrl}`} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-medium">
                    <FileText size={12} /> Preview your CV
                  </a>
                )}

                <hr className="border-border" />

                {/* Joining availability */}
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

                {/* Preferred locations */}
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
                          placeholder="e.g. Bangalore, Remote, Mumbai"
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

                {/* Mode of job */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1">
                    <Monitor size={13} className="text-muted" /> Mode of Job
                  </label>
                  <p className="text-xs text-muted mb-2">You can select multiple options</p>
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
                          className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
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
