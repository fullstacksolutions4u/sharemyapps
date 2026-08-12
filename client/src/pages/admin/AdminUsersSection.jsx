import { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, X, Save, Check, Mail, Link as LinkIcon,
  AlertCircle, FileText, Briefcase, Pencil, Trash2, Eye, EyeOff,
  UserCircle2, Search, Zap, FolderOpen as FolderOpenIcon,
  Heart, Star, Users, History, ChevronDown, ChevronUp, ExternalLink,
  MessageSquare, ChevronsLeft, ChevronsRight,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';

const BADGES = [
  { value: 'new_member', label: 'New Member',    icon: UserCircle2, cls: 'bg-[#F3F0EB] text-[#6B7280] border-[#E5E1DA]' },
  { value: 'active',     label: 'Active Member', icon: Zap,         cls: 'bg-blue-50 text-blue-600 border-blue-200' },
];

const inp = 'w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';

const RESUME_TEMPLATE = `{

"summary":"empty"

}`;

function UserEditPage({ user: initial, onBack, onSaved, allDesignations = [] }) {
  const [form, setForm] = useState({
    name:                initial.name                || '',
    designations:        initial.designations?.filter(Boolean) || [],
    mentorshipTech:      (() => {
      const mt = initial.mentorshipTech?.filter(Boolean) || [];
      if (mt.length > 0) return mt;
      const rs = initial.resumeData?.skills;
      if (Array.isArray(rs)) return rs.filter(Boolean);
      if (rs && typeof rs === 'object') return Object.values(rs).flat().filter(Boolean);
      return [];
    })(),
    languagePreference:  initial.languagePreference?.filter(Boolean).length ? initial.languagePreference.filter(Boolean) : [''],
    phone:               initial.phone               || '',
    bio:                 initial.bio                 || '',
    gender:              initial.gender              || '',
    place:               initial.place               || '',
    district:            initial.district            || '',
    state:               initial.state               || '',
    country:             initial.country             || '',
    yearsOfExperience:   initial.yearsOfExperience   || '',
    dateOfBirth:         initial.dateOfBirth ? new Date(initial.dateOfBirth).toISOString().split('T')[0] : '',
    linkedinUrl:         initial.linkedinUrl         || '',
    githubUrl:           initial.githubUrl           || '',
    leetcodeUrl:         initial.leetcodeUrl         || '',
    portfolioUrl:        initial.portfolioUrl        || '',
    cvUrl:               initial.cvUrl               || '',
    companyName:         initial.companyName         || '',
    companyWebsite:      initial.companyWebsite      || '',
    industry:            initial.industry            || '',
    requirements:        initial.requirements        || '',
    badge:               initial.badge               || 'new_member',
    hidden:              initial.hidden              || false,
    userType:            initial.userType            || 'developer',
    joiningAvailability: initial.joiningAvailability || '',
    currentSalary:       initial.currentSalary       ?? '',
    expectedSalary:      initial.expectedSalary      ?? '',
    preferredLocations:  initial.preferredLocations?.filter(Boolean).length ? initial.preferredLocations.filter(Boolean) : [''],
    jobMode:             initial.jobMode             || [],
    freelanceAvailable:  initial.freelanceAvailable  || false,
    freelanceRate:       initial.freelanceRate        ?? '',
    mentorshipAvailable: initial.mentorshipAvailable || false,
    mentorshipRate:      initial.mentorshipRate       ?? '',
  });

  const [saving, setSaving] = useState(false);
  const [designationInput, setDesignationInput] = useState('');
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [resumeJson, setResumeJson] = useState(initial.resumeData ? JSON.stringify(initial.resumeData, null, 2) : '');
  const [resumeJsonError, setResumeJsonError] = useState('');
  const [savingResume, setSavingResume] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState(0);

  // Calculate completed tabs dynamically during render
  const completed = (() => {
    const newCompleted = new Set();
    if (form.name.trim()) newCompleted.add(0);
    if (form.bio || form.linkedinUrl || form.githubUrl || form.cvUrl) newCompleted.add(1);
    if (form.mentorshipAvailable || form.freelanceAvailable || form.yearsOfExperience) newCompleted.add(2);
    if (initial.resumeData) newCompleted.add(3);
    newCompleted.add(4);
    return newCompleted;
  })();

  const TABS = [
    { id: 'basic', label: 'Basic Info', icon: UserCircle2 },
    { id: 'links', label: 'Developer Links', icon: LinkIcon },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'resume', label: 'Resume Data', icon: FileText },
    { id: 'admin', label: 'Admin Controls', icon: Zap },
  ];

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const addDesignation = () => {
    const val = designationInput.trim();
    if (val && !form.designations.includes(val)) {
      setForm(f => ({ ...f, designations: [...f.designations, val] }));
      setDesignationInput('');
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Name is required');
    setSaving(true);
    try {
      const res = await api.put(`/admin/users/${initial._id}`, form);
      onSaved(res.data);
      toast.success('User updated successfully');
    } catch { toast.error('Failed to save changes'); }
    finally { setSaving(false); }
  };

  const handleSaveResume = async () => {
    setResumeJsonError('');
    let parsed = null;
    if (resumeJson.trim()) {
      try { parsed = JSON.parse(resumeJson); }
      catch { setResumeJsonError('Invalid JSON — fix the syntax and try again.'); return; }
    }
    setSavingResume(true);
    try {
      await api.put(`/admin/users/${initial._id}/resume`, { resumeData: parsed });
      toast.success('Resume data saved');
    } catch { toast.error('Failed to save resume data'); }
    finally { setSavingResume(false); }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium text-[#6B7280] hover:text-[#1A1A1A] transition-colors">
          <ArrowLeft size={16} /> Back to Users
        </button>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-between w-full lg:px-12 mb-4">
        {TABS.map((tab, i) => {
          const Icon = tab.icon;
          const isActive = i === activeTab;
          const isDone = completed.has(i);
          return (
            <div key={tab.id} className="contents">
              <button
                type="button"
                onClick={() => setActiveTab(i)}
                className="flex flex-col items-center gap-1.5 group w-[72px] sm:w-[90px] shrink-0"
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                  isActive
                    ? 'bg-[#00A693] border-[#00A693] text-white shadow-md shadow-[#00A693]/30'
                    : isDone
                    ? 'bg-[#00A693]/10 border-[#00A693] text-[#00A693]'
                    : 'bg-white border-[#E5E1DA] text-[#9CA3AF] group-hover:border-[#00A693]/40 group-hover:text-[#00A693]'
                }`}>
                  {isDone && !isActive ? <Check size={14} /> : <Icon size={14} />}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-medium hidden sm:block text-center transition-colors ${
                  isActive ? 'text-[#00A693]' : isDone ? 'text-[#00A693]' : 'text-[#9CA3AF]'
                }`}>
                  {tab.label}
                </span>
              </button>
              {i < TABS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 sm:mx-4 rounded-full transition-all duration-300 ${
                  completed.has(i) ? 'bg-[#00A693]' : 'bg-[#E5E1DA]'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
        {/* Left: Summary panel */}
        <div className="lg:w-[280px] shrink-0 space-y-6">
          <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-[#00A693]/20 to-[#E6F7F5]" />
            <div className="bg-white rounded-[14px] p-5 relative">
              <span className="absolute top-2 right-3 text-[10px] font-semibold text-[#00A693]">
                {Math.round((completed.size / TABS.length) * 100)}%
              </span>
              <div className="flex flex-col items-center text-center gap-3 -mt-12">
                <div className="relative">
                  {initial?.avatar
                    ? <img src={optimizeImage(initial.avatar, 150)} alt={initial.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
                    : <span className="w-20 h-20 rounded-full bg-gradient-to-br from-[#00A693]/20 to-[#00A693]/40 border-4 border-white shadow-sm flex flex-col items-center justify-center overflow-hidden">
                        <span className="w-8 h-8 rounded-full bg-[#00A693]/40 flex items-center justify-center mb-0.5">
                          <UserCircle2 size={16} className="text-[#00A693]" />
                        </span>
                        <span className="w-12 h-6 rounded-t-full bg-[#00A693]/30" />
                      </span>
                  }
                </div>
                <div>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#1A1A1A]">{initial?.name}</p>
                    {initial?.regNumber && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20">
                        {form.userType === 'client' ? 'C' : 'D'}{initial.regNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[#9CA3AF] mt-0.5">{initial?.email}</p>
                  <span className={`inline-block text-[11px] px-2.5 py-1 mt-2 rounded-full border font-medium ${form.userType === 'client' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-[#E6F7F5] text-[#00A693] border-[#00A693]/20'}`}>
                    {form.userType === 'client' ? 'Client' : 'Developer'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-6 py-3.5 rounded-2xl font-bold text-sm transition-colors disabled:opacity-50 shadow-sm">
            <Save size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Right: Tab wizard */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Tab content */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 min-h-[500px]">
            {/* Tab 0 — Basic Info */}
            {activeTab === 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <UserCircle2 size={16} className="text-[#00A693]" />
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Basic Info</h2>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Full Name <span className="text-red-400">*</span></label>
                    <input type="text" value={form.name} onChange={set('name')} className={inp} placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">User Type</label>
                    <div className="flex gap-1.5 p-1 bg-[#F3F0EB] rounded-xl w-fit">
                      {[{ value: 'developer', label: 'Developer' }, { value: 'client', label: 'Client' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, userType: opt.value }))}
                          className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.userType === opt.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#6B7280]">Designations</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={designationInput}
                        onChange={e => { setDesignationInput(e.target.value); setDesignationDropdownOpen(true); }}
                        onFocus={() => setDesignationDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setDesignationDropdownOpen(false), 150)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addDesignation(); } if (e.key === 'Escape') setDesignationDropdownOpen(false); }}
                        className={inp}
                        placeholder="e.g. MERN Stack Developer"
                      />
                      {designationDropdownOpen && (() => {
                        const q = designationInput.trim().toLowerCase();
                        const suggestions = allDesignations.filter(d => !form.designations.includes(d) && (!q || d.toLowerCase().includes(q)));
                        return suggestions.length > 0 ? (
                          <div className="absolute left-0 top-full mt-1 z-30 w-full bg-white border border-[#E5E1DA] rounded-xl shadow-lg py-1 max-h-48 overflow-y-auto">
                            {suggestions.map(d => (
                              <button key={d} type="button"
                                onMouseDown={() => { setForm(f => ({ ...f, designations: [...f.designations, d] })); setDesignationInput(''); setDesignationDropdownOpen(false); }}
                                className="w-full text-left px-3 py-2 text-sm text-[#1A1A1A] hover:bg-[#E6F7F5] hover:text-[#00A693] transition-colors">
                                {d}
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <button type="button" onClick={addDesignation} className="w-10 h-10 flex items-center justify-center bg-[#00A693] text-white rounded-xl">
                      <Plus size={16} />
                    </button>
                  </div>
                  {form.designations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.designations.map((d, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">
                          {d}
                          <button type="button" onClick={() => setForm(f => ({ ...f, designations: f.designations.filter((_, j) => j !== i) }))} className="hover:text-red-500">
                            <X size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Phone</label>
                    <input type="tel" value={form.phone} onChange={set('phone')} className={inp} placeholder="+91 00000 00000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Gender</label>
                    <div className="flex gap-2">
                      {[{ label: 'Male', value: 'male' }, { label: 'Female', value: 'female' }, { label: 'Other', value: 'other' }].map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => setForm(f => ({ ...f, gender: f.gender === opt.value ? '' : opt.value }))}
                          className={`px-4 py-2 rounded-xl text-xs font-medium border transition-colors ${form.gender === opt.value ? 'bg-[#00A693] text-white border-[#00A693]' : 'bg-white text-[#6B7280] border-[#E5E1DA] hover:border-[#00A693]/40'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Place</label>
                    <input type="text" value={form.place} onChange={set('place')} className={inp} placeholder="e.g. Bangalore" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Date of Birth</label>
                    <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} className={inp} />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 1 — Developer Links & Bio */}
            {activeTab === 1 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <LinkIcon size={16} className="text-[#00A693]" />
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Developer Links & Contact</h2>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Bio</label>
                  <textarea rows={3} value={form.bio} onChange={set('bio')} className={`${inp} resize-none`} placeholder="Brief developer bio…" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">LinkedIn URL</label>
                    <input type="text" value={form.linkedinUrl} onChange={set('linkedinUrl')} className={inp} placeholder="linkedin.com/in/username" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">GitHub URL</label>
                    <input type="text" value={form.githubUrl} onChange={set('githubUrl')} className={inp} placeholder="github.com/username" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">LeetCode URL</label>
                    <input type="text" value={form.leetcodeUrl} onChange={set('leetcodeUrl')} className={inp} placeholder="leetcode.com/username" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Portfolio URL</label>
                    <input type="text" value={form.portfolioUrl} onChange={set('portfolioUrl')} className={inp} placeholder="yourportfolio.com" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#6B7280] mb-1.5">CV / Resume URL</label>
                  <input type="text" value={form.cvUrl} onChange={set('cvUrl')} className={inp} placeholder="drive.google.com/file/d/…" />
                  {form.cvUrl && (
                    <a href={form.cvUrl.startsWith('http') ? form.cvUrl : `https://${form.cvUrl}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#00A693] hover:underline font-medium">
                      <FileText size={11} /> Preview CV
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2 — Opportunities */}
            {activeTab === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-[#00A693]" />
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Career & Opportunities</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Years of Experience</label>
                    <select value={form.yearsOfExperience} onChange={set('yearsOfExperience')} className={inp}>
                      <option value="">Select…</option>
                      {['0-1', '1-2', '2-3', '3-5', '5-7', '7-10', '10+'].map(o => (
                        <option key={o} value={o}>{o} years</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Joining Availability</label>
                    <select value={form.joiningAvailability} onChange={set('joiningAvailability')} className={inp}>
                      <option value="">Select…</option>
                      {['Immediately', '15 days', '1 month', '2 months', '3 months', '3+ months'].map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Current Salary (per year)</label>
                    <input type="number" min="0" value={form.currentSalary} onChange={set('currentSalary')} className={inp} placeholder="e.g. 350000" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Expected Salary (per year)</label>
                    <input type="number" min="0" value={form.expectedSalary} onChange={set('expectedSalary')} className={inp} placeholder="e.g. 500000" />
                  </div>
                </div>

                <div className="space-y-4 pt-2 border-t border-[#E5E1DA]">
                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-[#F9F8F6] rounded-xl cursor-pointer">
                      <p className="text-sm font-medium text-[#1A1A1A]">Available for freelance?</p>
                      <div onClick={() => setForm(f => ({ ...f, freelanceAvailable: !f.freelanceAvailable }))}
                        className={`w-10 h-6 rounded-full transition-colors relative ${form.freelanceAvailable ? 'bg-[#00A693]' : 'bg-[#E5E1DA]'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.freelanceAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </label>
                    {form.freelanceAvailable && (
                      <div className="pl-3">
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Freelance Rate / hour (₹)</label>
                        <input type="number" min="0" value={form.freelanceRate} onChange={set('freelanceRate')} className={inp} placeholder="e.g. 500" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center justify-between p-3 bg-[#F9F8F6] rounded-xl cursor-pointer">
                      <p className="text-sm font-medium text-[#1A1A1A]">Available for mentorship?</p>
                      <div onClick={() => setForm(f => ({ ...f, mentorshipAvailable: !f.mentorshipAvailable }))}
                        className={`w-10 h-6 rounded-full transition-colors relative ${form.mentorshipAvailable ? 'bg-[#00A693]' : 'bg-[#E5E1DA]'}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.mentorshipAvailable ? 'translate-x-5' : 'translate-x-1'}`} />
                      </div>
                    </label>
                    {form.mentorshipAvailable && (
                      <div className="pl-3">
                        <label className="block text-xs font-medium text-[#6B7280] mb-1.5">Mentorship Rate / session (₹)</label>
                        <input type="number" min="0" value={form.mentorshipRate} onChange={set('mentorshipRate')} className={inp} placeholder="e.g. 1000" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3 — Resume Data */}
            {activeTab === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#00A693]" />
                    <h2 className="text-sm font-semibold text-[#1A1A1A]">Resume Data</h2>
                  </div>
                  <button onClick={handleSaveResume} disabled={savingResume}
                    className="flex items-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] disabled:opacity-50 text-white px-4 py-1.5 rounded-lg font-medium text-xs transition-colors">
                    <Save size={13} /> {savingResume ? 'Saving…' : 'Save JSON'}
                  </button>
                </div>

                {initial.resumeData && (
                  <div className="bg-[#F9F8F6] rounded-xl p-4 border border-[#E5E1DA] space-y-4 mb-6">
                    {initial.resumeData.summary && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">Summary</h4>
                        <p className="text-sm text-[#6B7280]">{initial.resumeData.summary}</p>
                      </div>
                    )}
                    {initial.resumeData.skills && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(Array.isArray(initial.resumeData.skills) ? initial.resumeData.skills : typeof initial.resumeData.skills === 'object' ? Object.values(initial.resumeData.skills).flat() : []).map((s, i) => (
                            <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {initial.resumeData.experience && initial.resumeData.experience.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">Experience</h4>
                        <div className="space-y-2">
                          {initial.resumeData.experience.map((exp, i) => (
                            <div key={i} className="text-sm text-[#6B7280]">
                              <span className="font-semibold text-[#1A1A1A]">{exp.role}</span> at {exp.company} <span className="text-xs">({exp.duration})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Raw JSON Data</label>
                    <div className="flex gap-2">
                      {!resumeJson.trim() && (
                        <button type="button" onClick={() => { setResumeJson(RESUME_TEMPLATE); setResumeJsonError(''); }}
                          className="text-[11px] text-[#00A693] hover:underline font-medium">Load template</button>
                      )}
                      {resumeJson.trim() && (
                        <button type="button" onClick={() => { setResumeJson(''); setResumeJsonError(''); }}
                          className="text-[11px] text-red-400 hover:underline font-medium">Clear</button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={12}
                    value={resumeJson}
                    onChange={e => { setResumeJson(e.target.value); setResumeJsonError(''); }}
                    spellCheck={false}
                    placeholder={'Paste resume JSON here…'}
                    className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-mono text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 resize-y transition ${resumeJsonError ? 'border-red-400 focus:ring-red-400/20' : 'border-[#E5E1DA] focus:border-[#00A693] focus:ring-[#00A693]/10'}`}
                  />
                  {resumeJsonError && <p className="text-xs text-red-500">{resumeJsonError}</p>}
                </div>
              </div>
            )}

            {/* Tab 4 — Admin Controls */}
            {activeTab === 4 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[#00A693]" />
                  <h2 className="text-sm font-semibold text-[#1A1A1A]">Admin Controls</h2>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Visibility & Access</p>
                  <label className="flex items-center justify-between p-3 bg-white border border-[#E5E1DA] rounded-xl cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{form.hidden ? 'Hidden from public' : 'Visible in listings'}</p>
                      <p className="text-xs text-[#9CA3AF] mt-0.5">{form.hidden ? "This user won't appear in the Developers page" : 'User appears in the Developers page'}</p>
                    </div>
                    <div onClick={() => setForm(f => ({ ...f, hidden: !f.hidden }))}
                      className={`ml-4 w-10 h-6 rounded-full transition-colors relative shrink-0 ${form.hidden ? 'bg-red-400' : 'bg-[#00A693]'}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.hidden ? 'translate-x-1' : 'translate-x-5'}`} />
                    </div>
                  </label>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteCell({ u, editingNote, setEditingNote, noteSaving, handleSaveNote }) {
  const isEditing = editingNote?.id === u._id;
  if (isEditing) {
    return (
      <div className="flex flex-col gap-1.5">
        <textarea
          autoFocus
          className="w-full text-xs px-2 py-1.5 border border-[#00A693] rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#00A693]/20 bg-white text-[#1A1A1A]"
          rows={3}
          value={editingNote.text}
          onChange={e => setEditingNote(n => ({ ...n, text: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveNote(); if (e.key === 'Escape') setEditingNote(null); }}
          placeholder="Add a note..."
        />
        <div className="flex gap-1">
          <button onClick={handleSaveNote} disabled={noteSaving === u._id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-[#00A693] text-white font-medium disabled:opacity-60"><Check size={10} /> Save</button>
          <button onClick={() => setEditingNote(null)} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border border-[#E5E1DA] text-[#6B7280] font-medium"><X size={10} /> Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <button onClick={() => setEditingNote({ id: u._id, text: u.adminNote || '' })} className="group flex items-start gap-1.5 w-full text-left">
      <MessageSquare size={11} className="mt-0.5 shrink-0 text-[#9CA3AF] group-hover:text-[#00A693] transition-colors" />
      {u.adminNote
        ? <span className="text-xs text-[#1A1A1A] line-clamp-2 leading-tight">{u.adminNote}</span>
        : <span className="text-xs text-[#9CA3AF] italic">Add note…</span>}
    </button>
  );
}

export default function AdminUsersSection({ initialTab = 'developers' }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [page, setPage] = useState(1);
  const [badgeLoading, setBadgeLoading] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(null);
  const [hideLoading, setHideLoading] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [jdHistoryUser, setJdHistoryUser] = useState(null);
  const [jdHistory, setJdHistory] = useState([]);
  const [jdHistoryLoading, setJdHistoryLoading] = useState(false);
  const [portfolioVisitsUser, setPortfolioVisitsUser] = useState(null);
  const [portfolioVisits, setPortfolioVisits] = useState([]);
  const [portfolioVisitsLoading, setPortfolioVisitsLoading] = useState(false);
  const [expandedJD, setExpandedJD] = useState(null);
  const [editingNote, setEditingNote] = useState(null); // { id, text }
  const [noteSaving, setNoteSaving] = useState(null);
  const [filterPlaceholderCv, setFilterPlaceholderCv] = useState(false);
  const [filterUpdatedCv, setFilterUpdatedCv] = useState(false);
  const [messagingUser, setMessagingUser] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [messageSending, setMessageSending] = useState(false);
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/admin/users')
      .then(res => {
        console.log('[Admin] /admin/users raw sample (first 5) →', res.data.slice(0, 5).map(u => ({ name: u.name, points: u.points, userType: u.userType })));
        setUsers(res.data);
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const close = () => setPickerOpen(null);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [pickerOpen]);

  const handleToggleHidden = async (userId) => {
    setHideLoading(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/hide`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, hidden: res.data.hidden } : u));
      toast.success(res.data.hidden ? 'Developer hidden from public list' : 'Developer visible again');
    } catch { toast.error('Failed to update visibility'); }
    finally { setHideLoading(null); }
  };

  const handleBadge = async (userId, badge) => {
    setPickerOpen(null);
    setBadgeLoading(userId);
    try {
      const res = await api.patch(`/admin/users/${userId}/badge`, { badge });
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, badge: res.data.badge } : u));
      const label = BADGES.find(b => b.value === badge)?.label || badge;
      toast.success(badge === 'member' ? 'Badge removed' : `${label} badge granted`);
    } catch { toast.error('Failed to update badge'); }
    finally { setBadgeLoading(null); }
  };

  const handleUserSaved = (updated) => {
    setUsers(prev => prev.map(u => u._id === updated._id ? { ...u, ...updated } : u));
    setEditingUser(null);
  };

  const handleDeleteUser = async (userId) => {
    setDeleteLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isDeleted: true, deletedAt: new Date().toISOString() } : u));
      setConfirmDelete(null);
      toast.success('User deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally { setDeleteLoading(null); }
  };

  const handleSendMessage = async () => {
    if (!messagingUser || !messageText.trim()) return;
    setMessageSending(true);
    try {
      await api.post(`/admin/users/${messagingUser._id}/message`, { text: messageText.trim() });
      toast.success(`Message sent to ${messagingUser.name}`);
      setMessagingUser(null);
      setMessageText('');
    } catch { toast.error('Failed to send message'); }
    finally { setMessageSending(false); }
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;
    setNoteSaving(editingNote.id);
    try {
      const res = await api.patch(`/admin/users/${editingNote.id}/note`, { note: editingNote.text });
      setUsers(prev => prev.map(u => u._id === editingNote.id ? { ...u, adminNote: res.data.adminNote } : u));
      setEditingNote(null);
      toast.success('Note saved');
    } catch { toast.error('Failed to save note'); }
    finally { setNoteSaving(null); }
  };

  const openPortfolioVisits = async (u) => {
    setPortfolioVisitsUser(u);
    setPortfolioVisits([]);
    setPortfolioVisitsLoading(true);
    try {
      const res = await api.get(`/admin/users/${u._id}/portfolio-visits`);
      setPortfolioVisits(res.data);
    } catch { toast.error('Failed to load portfolio visits'); }
    finally { setPortfolioVisitsLoading(false); }
  };

  const openJDHistory = async (u) => {
    setJdHistoryUser(u);
    setJdHistory([]);
    setExpandedJD(null);
    setJdHistoryLoading(true);
    try {
      const res = await api.get(`/admin/users/${u._id}/jd-history`);
      setJdHistory(res.data);
    } catch { toast.error('Failed to load JD history'); }
    finally { setJdHistoryLoading(false); }
  };

  const isPlaceholderCv = (url) => {
    if (!url) return false;
    const cleaned = url.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    return cleaned === 'drive.google.com';
  };

  const activeUsers = users.filter(u => !u.isDeleted);
  const developers = activeUsers.filter(u => u.userType === 'developer');

  const devRankMap = (() => {
    const sorted = [...developers].sort((a, b) => {
      const pd = (b.points || 0) - (a.points || 0);
      if (pd !== 0) return pd;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
    const map = {};
    sorted.forEach((u, i) => { map[u._id] = i + 1; });
    console.log('[Admin] devRankMap top 10 →', sorted.slice(0, 10).map((u, i) => ({ rank: i + 1, name: u.name, points: u.points || 0 })));
    return map;
  })();
  const missingCvCount = developers.filter(u => !u.cvUrl).length;
  const missingSummaryCount = developers.filter(u => u.cvUrl && !u.resumeData).length;
  const placeholderCvCount = developers.filter(u => isPlaceholderCv(u.cvUrl)).length;
  const updatedCvCount = developers.filter(u => u.cvWasPlaceholder && !isPlaceholderCv(u.cvUrl) && u.cvUrl).length;
  const recruiters = activeUsers.filter(u => u.userType === 'recruiter');
  const clients    = activeUsers.filter(u => u.userType === 'client');
  const mentees    = activeUsers.filter(u => u.userType === 'mentee');
  const deletedUsers = users.filter(u => u.isDeleted);
  const allDesignations = [...new Set(users.flatMap(u => u.designations || []).filter(Boolean))];
  const q = search.trim().toLowerCase();
  const listMap = { developers, recruiters, clients, mentees, deleted: deletedUsers };
  const list = (listMap[tab] || [])
    .filter(u => !q || u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q))
    .filter(u => !filterPlaceholderCv || isPlaceholderCv(u.cvUrl))
    .filter(u => !filterUpdatedCv || (u.cvWasPlaceholder && !isPlaceholderCv(u.cvUrl) && u.cvUrl))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const totalPages = Math.ceil(list.length / PER_PAGE);
  const paged = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Avatar = ({ u }) => u.avatar
    ? <img src={optimizeImage(u.avatar, 150)} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
    : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{u.name[0].toUpperCase()}</span>;

  if (editingUser) {
    return <UserEditPage user={editingUser} onBack={() => setEditingUser(null)} onSaved={handleUserSaved} allDesignations={allDesignations} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#1A1A1A] capitalize">{tab === 'deleted' ? 'Deleted Accounts' : tab}</h2>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit shrink-0">
          {[
            { key: 'developers', label: `Developers (${developers.length})` },
            { key: 'recruiters', label: `Recruiters (${recruiters.length})` },
            { key: 'clients',    label: `Clients (${clients.length})` },
            { key: 'mentees',    label: `Mentees (${mentees.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setPage(1); setSearch(''); setFilterPlaceholderCv(false); setFilterUpdatedCv(false); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-52 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition" />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        {search && <p className="text-xs text-[#6B7280]">{list.length} result{list.length !== 1 ? 's' : ''} for <span className="font-medium text-[#1A1A1A]">"{search}"</span></p>}
        {!loading && (missingCvCount > 0 || missingSummaryCount > 0 || placeholderCvCount > 0 || updatedCvCount > 0) && (
          <div className="ml-auto flex items-center gap-2 shrink-0">
            {missingCvCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-orange-600 font-medium whitespace-nowrap">
                <AlertCircle size={12} className="shrink-0" />
                <span>CV · <span className="font-bold">{missingCvCount}</span></span>
              </div>
            )}
            {placeholderCvCount > 0 && (
              <button
                onClick={() => { setTab('developers'); setFilterPlaceholderCv(f => !f); setFilterUpdatedCv(false); setPage(1); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium whitespace-nowrap transition-colors ${
                  filterPlaceholderCv
                    ? 'border-purple-400 bg-purple-100 text-purple-700'
                    : 'border-purple-200 bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                <AlertCircle size={12} className="shrink-0" />
                <span>Placeholder · <span className="font-bold">{placeholderCvCount}</span></span>
              </button>
            )}
            {updatedCvCount > 0 && (
              <button
                onClick={() => { setTab('developers'); setFilterUpdatedCv(f => !f); setFilterPlaceholderCv(false); setPage(1); }}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border font-medium whitespace-nowrap transition-colors ${
                  filterUpdatedCv
                    ? 'border-blue-400 bg-blue-100 text-blue-700'
                    : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                }`}
              >
                <FileText size={12} className="shrink-0" />
                <span>CV Updated · <span className="font-bold">{updatedCvCount}</span></span>
              </button>
            )}
            {missingSummaryCount > 0 && (
              <div className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border border-yellow-200 bg-yellow-50 text-yellow-600 font-medium whitespace-nowrap">
                <AlertCircle size={12} className="shrink-0" />
                <span>Summary · <span className="font-bold">{missingSummaryCount}</span></span>
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <p className="text-[#6B7280] text-sm">{tab === 'deleted' ? 'No deleted accounts' : `No ${tab} accounts yet`}</p>
        </div>
      ) : tab === 'developers' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Developer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Ranking</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Designation</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Resume</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden xl:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p></div></div></td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {(() => {
                      const rank = devRankMap[u._id];
                      const pts = u.points || 0;
                      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null;
                      const rankColor = rank === 1 ? 'text-amber-600 bg-amber-50 border-amber-200' : rank === 2 ? 'text-slate-500 bg-slate-50 border-slate-200' : rank === 3 ? 'text-orange-600 bg-orange-50 border-orange-200' : 'text-[#6B7280] bg-[#F3F0EB] border-[#E5E1DA]';
                      return (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-semibold w-fit ${rankColor}`}>
                            {medal && <span>{medal}</span>}#{rank}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-700 font-medium w-fit">
                            🪙 {pts} pts
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.designations?.filter(Boolean).length
                      ? <div className="flex flex-wrap gap-1">{u.designations.filter(Boolean).map((d, i) => <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{d}</span>)}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <div className="flex flex-col gap-1">
                      {!u.cvUrl
                        ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200 font-medium w-fit"><AlertCircle size={10} /> No CV link</span>
                        : isPlaceholderCv(u.cvUrl)
                        ? <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium w-fit" title={u.cvUrl}><AlertCircle size={10} /> Placeholder CV</span>
                        : u.cvWasPlaceholder
                        ? <a href={u.cvUrl.startsWith('http') ? u.cvUrl : `https://${u.cvUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200 font-medium w-fit hover:bg-blue-100 transition-colors"><FileText size={10} /> CV Updated{u.resumeData?.summary === 'empty' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 ml-0.5 animate-pulse" title="Resume summary is empty"></span>}</a>
                        : <a href={u.cvUrl.startsWith('http') ? u.cvUrl : `https://${u.cvUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-[#00A693] hover:underline font-medium"><FileText size={11} /> View CV</a>
                      }
                      {!u.resumeData && <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-200 font-medium w-fit"><AlertCircle size={10} /> No summary</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    <NoteCell u={u} editingNote={editingNote} setEditingNote={setEditingNote} noteSaving={noteSaving} handleSaveNote={handleSaveNote} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1 w-[90px] ml-auto">
                      <button onClick={() => setViewingUser(u)} title="View" className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] transition-colors"><Eye size={13} /></button>
                      <button onClick={() => setEditingUser(u)} title="Edit" className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] transition-colors"><Pencil size={13} /></button>
                      <button onClick={() => { setMessagingUser(u); setMessageText(''); }} title="Message" className="w-7 h-7 flex items-center justify-center rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-colors"><Mail size={13} /></button>
                      {u.phone ? (
                        <a
                          href={`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${u.name.split(' ')[0]}, thank you for choosing our premium services! This is Kevin from ShareMyApps.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp ${u.name}`}
                          className="flex items-center justify-center w-7 h-7 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      ) : (
                        <span title="No phone number" className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </span>
                      )}
                      <button onClick={() => setConfirmDelete(u)} title="Delete" className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'recruiters' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Recruiter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">JD History</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Portfolio Visits</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden xl:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p></div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.companyName ? <div><p className="text-xs font-medium text-[#1A1A1A]">{u.companyName}</p>{u.industry && <p className="text-xs text-[#9CA3AF]">{u.industry}</p>}</div> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openJDHistory(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-purple-200 text-purple-600 hover:bg-purple-50 font-medium transition-colors"><History size={10} /> View History</button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openPortfolioVisits(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium transition-colors"><Eye size={10} /> View Visits</button>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    <NoteCell u={u} editingNote={editingNote} setEditingNote={setEditingNote} noteSaving={noteSaving} handleSaveNote={handleSaveNote} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => { setMessagingUser(u); setMessageText(''); }} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 font-medium transition-colors"><Mail size={10} /> Message</button>
                      {u.phone && (
                        <a href={`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${u.name.split(' ')[0]}, thank you for choosing our premium services! This is Kevin from ShareMyApps.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
                        </a>
                      )}
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'clients' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Client</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Project / Budget</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Skills needed</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden xl:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p></div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.clientProfile?.projectName ? <div><p className="text-xs font-medium text-[#1A1A1A] truncate max-w-[160px]">{u.clientProfile.projectName}</p>{u.clientProfile.budget && <p className="text-xs text-[#9CA3AF]">₹{Number(u.clientProfile.budget).toLocaleString('en-IN')}</p>}</div> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.clientProfile?.skillsNeeded?.length > 0
                      ? <div className="flex flex-wrap gap-1">{u.clientProfile.skillsNeeded.slice(0, 3).map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">{s}</span>)}{u.clientProfile.skillsNeeded.length > 3 && <span className="text-xs text-[#9CA3AF]">+{u.clientProfile.skillsNeeded.length - 3}</span>}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    <NoteCell u={u} editingNote={editingNote} setEditingNote={setEditingNote} noteSaving={noteSaving} handleSaveNote={handleSaveNote} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                      <button onClick={() => setViewingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Eye size={10} /> View</button>
                      <button onClick={() => setEditingUser(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] font-medium transition-colors"><Pencil size={10} /> Edit</button>
                      <button onClick={() => { setMessagingUser(u); setMessageText(''); }} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 font-medium transition-colors"><Mail size={10} /> Message</button>
                      {u.phone && (
                        <a href={`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${u.name.split(' ')[0]}, thank you for choosing our premium services! This is Kevin from ShareMyApps.`)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> WhatsApp
                        </a>
                      )}
                      <button onClick={() => setConfirmDelete(u)} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 font-medium transition-colors"><Trash2 size={10} /> Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'mentees' ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Mentee</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Education</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Looking to learn</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden xl:table-cell">Notes</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(u => (
                <tr key={u._id} className="hover:bg-[#FAF9F6] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Avatar u={u} /><div className="min-w-0"><p className="font-medium text-[#1A1A1A] truncate">{u.name}</p></div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.menteeProfile?.education ? <p className="text-xs text-[#1A1A1A] truncate max-w-[160px]">{u.menteeProfile.education}</p> : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.menteeProfile?.lookingToLearn?.length > 0
                      ? <div className="flex flex-wrap gap-1">{u.menteeProfile.lookingToLearn.slice(0, 3).map(s => <span key={s} className="text-xs px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{s}</span>)}{u.menteeProfile.lookingToLearn.length > 3 && <span className="text-xs text-[#9CA3AF]">+{u.menteeProfile.lookingToLearn.length - 3}</span>}</div>
                      : <span className="text-xs text-[#9CA3AF]">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell max-w-[180px]">
                    <NoteCell u={u} editingNote={editingNote} setEditingNote={setEditingNote} noteSaving={noteSaving} handleSaveNote={handleSaveNote} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="grid grid-cols-2 gap-1 w-[60px] ml-auto">
                      {/* Row 1 */}
                      <button onClick={() => setViewingUser(u)} title="View" className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#F0FBF9] transition-colors"><Eye size={13} /></button>
                      <button onClick={() => setEditingUser(u)} title="Edit" className="flex items-center justify-center w-7 h-7 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] hover:bg-[#F0FBF9] transition-colors"><Pencil size={13} /></button>
                      {/* Row 2 */}
                      {u.phone ? (
                        <a
                          href={`https://wa.me/${u.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${u.name.split(' ')[0]}, this is Kevin from ShareMyApps!\n\nWe wanted to check in - have you been able to find a mentor through our portal?\n\nIf not, we'd love to help you find the right mentor based on your requirements. Just let us know and we'll assist you personally!`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`WhatsApp ${u.name}`}
                          className="flex items-center justify-center w-7 h-7 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </a>
                      ) : (
                        <span title="No phone number" className="flex items-center justify-center w-7 h-7 rounded-lg border border-gray-100 text-gray-300 cursor-not-allowed">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        </span>
                      )}
                      <button onClick={() => setConfirmDelete(u)} title="Delete" className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white border border-red-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-red-100 bg-red-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Deleted On</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-red-50">
              {paged.map(u => (
                <tr key={u._id} className="opacity-70">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0"><span className="text-xs font-medium text-red-400">{u.name?.[0]?.toUpperCase() || '?'}</span></div><div className="min-w-0"><p className="font-medium text-[#6B7280] truncate line-through decoration-red-300">{u.name}</p></div></div></td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${u.userType === 'client' ? 'bg-teal-50 text-teal-400 border-teal-200' : u.userType === 'recruiter' ? 'bg-blue-50 text-blue-400 border-blue-200' : u.userType === 'mentee' ? 'bg-violet-50 text-violet-400 border-violet-200' : 'bg-[#E6F7F5] text-[#00A693]/60 border-[#00A693]/20'}`}>{u.userType || 'developer'}</span>
                  </td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200 font-medium"><Trash2 size={10} /> Deleted</span></td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs hidden md:table-cell">{u.deletedAt ? new Date(u.deletedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (() => {
        const GROUP = 10;
        const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
        const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
        return (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-[#9CA3AF]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, list.length)} of {list.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>
              {groupStart > 1 && <button onClick={() => setPage(groupStart - 1)} className="px-3 h-8 flex items-center justify-center border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition"><ChevronsLeft size={14} /></button>}
              {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-sm rounded-lg border transition ${n === page ? 'bg-accent text-white border-accent font-medium' : 'border-border text-muted hover:border-accent hover:text-accent'}`}>{n}</button>
              ))}
              {groupEnd < totalPages && <button onClick={() => setPage(groupEnd + 1)} className="px-3 h-8 flex items-center justify-center border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition"><ChevronsRight size={14} /></button>}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
            </div>
          </div>
        );
      })()}

      {viewingUser && (() => {
        const u = users.find(x => x._id === viewingUser._id) || viewingUser;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setViewingUser(null)}>
            <div className="bg-white rounded-2xl shadow-xl border border-[#E5E1DA] w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA]">
                <div className="flex items-center gap-3">
                  {u.avatar ? <img src={optimizeImage(u.avatar, 150)} alt={u.name} className="w-10 h-10 rounded-full object-cover" /> : <span className="w-10 h-10 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-bold">{u.name?.[0]?.toUpperCase()}</span>}
                  <div><p className="font-semibold text-[#1A1A1A] text-sm">{u.name}</p><p className="text-xs text-[#6B7280]">{u.email}</p></div>
                </div>
                <button onClick={() => setViewingUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F0EB] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"><X size={15} /></button>
              </div>
              <div className="px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-xl px-3 py-2.5">
                    <Users size={13} className="text-[#9CA3AF] shrink-0" />
                    <div><p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">Followers</p><p className="text-sm font-semibold text-[#1A1A1A]">{u.followers?.length || 0}</p></div>
                  </div>
                  {u.userType === 'developer' && (
                    <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-xl px-3 py-2.5">
                      <FolderOpenIcon size={13} className="text-[#9CA3AF] shrink-0" />
                      <div><p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">Projects</p><p className="text-sm font-semibold text-[#1A1A1A]">{u.projectCount || 0}</p></div>
                    </div>
                  )}
                  {u.userType === 'developer' && (
                    <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-xl px-3 py-2.5">
                      <Heart size={13} className="text-red-400 shrink-0" />
                      <div><p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">Total Likes</p><p className="text-sm font-semibold text-[#1A1A1A]">{u.totalLikes || 0}</p></div>
                    </div>
                  )}
                  {u.userType === 'developer' && (
                    <div className="flex items-center gap-2 bg-[#FAF9F6] rounded-xl px-3 py-2.5">
                      <Star size={13} className="text-amber-400 shrink-0" />
                      <div><p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wider">Avg Rating</p><p className="text-sm font-semibold text-[#1A1A1A]">{u.avgRating > 0 ? u.avgRating : '—'}</p></div>
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Designations</p>
                  {u.designations?.filter(Boolean).length
                    ? <div className="flex flex-wrap gap-1.5">{u.designations.filter(Boolean).map((d, i) => <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{d}</span>)}</div>
                    : <p className="text-xs text-[#9CA3AF]">—</p>}
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Badge</p>
                  <div className="flex flex-wrap gap-1.5">
                    {BADGES.map(b => {
                      const Icon = b.icon;
                      const active = (u.badge || 'new_member') === b.value;
                      return (
                        <button key={b.value} onClick={() => handleBadge(u._id, b.value)} disabled={badgeLoading === u._id}
                          className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors disabled:opacity-50 ${b.cls} ${active ? 'ring-2 ring-offset-1 ring-current' : 'opacity-50 hover:opacity-100'}`}>
                          {Icon && <Icon size={10} />} {b.label}
                          {active && <Check size={10} className="ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {u.adminNote && (
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Admin Note</p>
                    <p className="text-xs text-[#1A1A1A] bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 whitespace-pre-wrap leading-relaxed">{u.adminNote}</p>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1">Joined</p>
                    <p className="text-xs text-[#6B7280]">{new Date(u.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                  </div>
                  <button onClick={() => handleToggleHidden(u._id)} disabled={hideLoading === u._id}
                    className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${u.hidden ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                    {hideLoading === u._id ? '…' : u.hidden ? <><EyeOff size={11} /> Hidden</> : <><Eye size={11} /> Visible</>}
                  </button>
                </div>
              </div>
              <div className="flex gap-2 px-5 py-4 border-t border-[#E5E1DA]">
                <button onClick={() => { setEditingUser(u); setViewingUser(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] transition-colors">
                  <Pencil size={13} /> Edit
                </button>
                <button onClick={() => { setConfirmDelete(u); setViewingUser(null); }}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {jdHistoryUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setJdHistoryUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E1DA] w-full max-w-3xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA] shrink-0">
              <div className="flex items-center gap-3">
                {jdHistoryUser.avatar
                  ? <img src={optimizeImage(jdHistoryUser.avatar, 150)} alt={jdHistoryUser.name} className="w-9 h-9 rounded-full object-cover" />
                  : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-bold">{jdHistoryUser.name?.[0]?.toUpperCase()}</span>
                }
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{jdHistoryUser.name}</p>
                  <p className="text-xs text-[#9CA3AF]">JD Analysis History</p>
                </div>
              </div>
              <button onClick={() => setJdHistoryUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F0EB] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"><X size={15} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              {jdHistoryLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 bg-[#F3F0EB] rounded-xl animate-pulse" />)}
                </div>
              ) : jdHistory.length === 0 ? (
                <div className="text-center py-12">
                  <History size={32} className="mx-auto text-[#E5E1DA] mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No JD searches yet</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">This recruiter hasn't used Find Developers yet.</p>
                </div>
              ) : (
                jdHistory.map((entry, idx) => {
                  const skills = entry.extracted?.skills || [];
                  const roles = entry.extracted?.roles || [];
                  const level = entry.extracted?.level;
                  const isExpanded = expandedJD === entry._id;
                  const title = [level && level !== 'any' ? level.charAt(0).toUpperCase() + level.slice(1) : null, roles[0]].filter(Boolean).join(' ') || `Search #${jdHistory.length - idx}`;
                  return (
                    <div key={entry._id} className="border border-[#E5E1DA] rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 bg-[#FAF9F6] hover:bg-[#F3F0EB] transition-colors text-left gap-3"
                        onClick={() => setExpandedJD(isExpanded ? null : entry._id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-medium text-[#1A1A1A] truncate">{title}</span>
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-200 font-medium">{entry.resultCount} match{entry.resultCount !== 1 ? 'es' : ''}</span>
                          {skills.slice(0, 3).map(s => (
                            <span key={s} className="shrink-0 hidden sm:inline text-xs px-1.5 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20">{s}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-[#9CA3AF]">{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          {isExpanded ? <ChevronUp size={13} className="text-[#9CA3AF]" /> : <ChevronDown size={13} className="text-[#9CA3AF]" />}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-4 py-3 space-y-3 border-t border-[#F3F0EB]">
                          <div>
                            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Job Description</p>
                            <p className="text-xs text-[#6B7280] whitespace-pre-line line-clamp-5 bg-[#FAF9F6] rounded-lg px-3 py-2 border border-[#F3F0EB]">{entry.jd}</p>
                          </div>

                          {skills.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Extracted Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{s}</span>)}
                              </div>
                            </div>
                          )}

                          {entry.developers?.length > 0 && (
                            <div>
                              <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-wider mb-1.5">Matched Developers ({entry.developers.length})</p>
                              <div className="rounded-xl border border-[#E5E1DA] overflow-hidden">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="bg-[#FAF9F6] border-b border-[#E5E1DA]">
                                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">#</th>
                                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280]">Developer</th>
                                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280] hidden sm:table-cell">Score</th>
                                      <th className="text-left px-3 py-2 font-semibold text-[#6B7280] hidden md:table-cell">Links</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F3F0EB]">
                                    {entry.developers.slice(0, 10).map((dev, i) => (
                                      <tr key={dev._id || i} className="hover:bg-[#FAF9F6]">
                                        <td className="px-3 py-2 text-[#9CA3AF]">{i + 1}</td>
                                        <td className="px-3 py-2">
                                          <div className="flex items-center gap-2">
                                            {dev.avatar
                                              ? <img src={optimizeImage(dev.avatar, 150)} alt={dev.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                              : <span className="w-6 h-6 rounded-full bg-[#00A693] text-white text-[10px] flex items-center justify-center font-bold shrink-0">{dev.name?.[0]?.toUpperCase()}</span>
                                            }
                                            <div className="min-w-0">
                                              <p className="font-medium text-[#1A1A1A] truncate">{dev.name}</p>
                                              {dev.designations?.[0] && <p className="text-[10px] text-[#9CA3AF] truncate">{dev.designations[0]}</p>}
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-3 py-2 hidden sm:table-cell">
                                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">{dev.matchScore ?? '—'}</span>
                                        </td>
                                        <td className="px-3 py-2 hidden md:table-cell">
                                          <div className="flex items-center gap-1.5">
                                            {dev.portfolioUrl && <a href={dev.portfolioUrl.startsWith('http') ? dev.portfolioUrl : `https://${dev.portfolioUrl}`} target="_blank" rel="noopener noreferrer" className="text-[#00A693] hover:underline"><ExternalLink size={11} /></a>}
                                            {dev.linkedinUrl && <a href={dev.linkedinUrl.startsWith('http') ? dev.linkedinUrl : `https://${dev.linkedinUrl}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline"><ExternalLink size={11} /></a>}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {entry.developers.length > 10 && (
                                  <p className="text-[10px] text-[#9CA3AF] text-center py-2 border-t border-[#F3F0EB]">+{entry.developers.length - 10} more developers</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#E5E1DA] shrink-0 flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">{jdHistory.length} search{jdHistory.length !== 1 ? 'es' : ''} total</p>
              <button onClick={() => setJdHistoryUser(null)} className="px-4 py-2 rounded-xl border border-[#E5E1DA] text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {portfolioVisitsUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setPortfolioVisitsUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E1DA] w-full max-w-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA] shrink-0">
              <div className="flex items-center gap-3">
                {portfolioVisitsUser.avatar
                  ? <img src={optimizeImage(portfolioVisitsUser.avatar, 150)} alt={portfolioVisitsUser.name} className="w-9 h-9 rounded-full object-cover" />
                  : <span className="w-9 h-9 rounded-full bg-indigo-500 text-white text-sm flex items-center justify-center font-bold">{portfolioVisitsUser.name?.[0]?.toUpperCase()}</span>
                }
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{portfolioVisitsUser.name}</p>
                  <p className="text-xs text-[#9CA3AF]">Developer Portfolio Visits</p>
                </div>
              </div>
              <button onClick={() => setPortfolioVisitsUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F0EB] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"><X size={15} /></button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              {portfolioVisitsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-[#F3F0EB] rounded-xl animate-pulse" />)}
                </div>
              ) : portfolioVisits.length === 0 ? (
                <div className="text-center py-12">
                  <Eye size={32} className="mx-auto text-[#E5E1DA] mb-3" />
                  <p className="text-sm text-[#9CA3AF]">No portfolio visits yet</p>
                  <p className="text-xs text-[#9CA3AF] mt-1">This recruiter hasn't visited any developer portfolios.</p>
                </div>
              ) : (
                portfolioVisits.map((visit) => (
                  <div key={visit._id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E1DA] bg-[#FAF9F6]">
                    {visit.user?.avatar
                      ? <img src={optimizeImage(visit.user.avatar, 150)} alt={visit.user.name} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-bold shrink-0">{visit.user?.name?.[0]?.toUpperCase()}</span>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{visit.user?.name || 'Unknown'}</p>
                      {visit.user?.designations?.[0] && <p className="text-xs text-[#9CA3AF] truncate">{visit.user.designations[0]}</p>}
                    </div>
                    <p className="text-xs text-[#9CA3AF] shrink-0">
                      {new Date(visit.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#E5E1DA] shrink-0 flex items-center justify-between">
              <p className="text-xs text-[#9CA3AF]">{portfolioVisits.length} visit{portfolioVisits.length !== 1 ? 's' : ''} total</p>
              <button onClick={() => setPortfolioVisitsUser(null)} className="px-4 py-2 rounded-xl border border-[#E5E1DA] text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {messagingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setMessagingUser(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-[#E5E1DA] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA]">
              <div className="flex items-center gap-3">
                {messagingUser.avatar
                  ? <img src={optimizeImage(messagingUser.avatar, 150)} alt={messagingUser.name} className="w-9 h-9 rounded-full object-cover" />
                  : <span className="w-9 h-9 rounded-full bg-[#00A693] text-white text-sm flex items-center justify-center font-bold">{messagingUser.name?.[0]?.toUpperCase()}</span>}
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{messagingUser.name}</p>
                  <p className="text-xs text-[#9CA3AF]">{messagingUser.email}</p>
                </div>
              </div>
              <button onClick={() => setMessagingUser(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F0EB] text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors"><X size={15} /></button>
            </div>
            <div className="px-5 py-4">
              <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2 block">Message</label>
              <textarea
                autoFocus
                rows={5}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSendMessage(); }}
                placeholder="Write your message to this user…"
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition resize-none"
              />
              <p className="text-xs text-[#9CA3AF] mt-1.5">{messageText.length}/2000 · Ctrl+Enter to send</p>
            </div>
            <div className="flex gap-2 px-5 py-4 border-t border-[#E5E1DA]">
              <button onClick={() => setMessagingUser(null)} className="flex-1 px-4 py-2 rounded-xl border border-[#E5E1DA] text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors">Cancel</button>
              <button onClick={handleSendMessage} disabled={!messageText.trim() || messageSending}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A693] hover:bg-[#008f7e] text-white text-sm font-medium transition-colors disabled:opacity-50">
                <Mail size={13} /> {messageSending ? 'Sending…' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0"><Trash2 size={18} className="text-red-500" /></div>
              <div><p className="font-semibold text-[#1A1A1A] text-sm">Delete User</p><p className="text-xs text-[#6B7280] mt-0.5">This action cannot be undone</p></div>
            </div>
            <p className="text-sm text-[#6B7280] mb-5">
              Are you sure you want to delete <span className="font-semibold text-[#1A1A1A]">{confirmDelete.name}</span> ({confirmDelete.email})? Their account will be soft-deleted and removed from public listings.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-xl border border-[#E5E1DA] text-sm text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors">Cancel</button>
              <button onClick={() => handleDeleteUser(confirmDelete._id)} disabled={deleteLoading === confirmDelete._id}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors disabled:opacity-50">
                <Trash2 size={13} /> {deleteLoading === confirmDelete._id ? 'Deleting…' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
