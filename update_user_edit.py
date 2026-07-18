import os

file_path = 'client/src/pages/admin/AdminUsersSection.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('function UserEditPage(')
end_idx = content.find('\nfunction NoteCell(')

if start_idx == -1 or end_idx == -1:
    print("Could not find boundaries")
    exit(1)

new_component = """function UserEditPage({ user: initial, onBack, onSaved, allDesignations = [] }) {
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
  const [skillInput, setSkillInput] = useState('');
  const [designationDropdownOpen, setDesignationDropdownOpen] = useState(false);
  const [resumeJson, setResumeJson] = useState(initial.resumeData ? JSON.stringify(initial.resumeData, null, 2) : '');
  const [resumeJsonError, setResumeJsonError] = useState('');
  const [savingResume, setSavingResume] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState(0);
  const [completed, setCompleted] = useState(new Set());

  // Calculate completed tabs dynamically
  useEffect(() => {
    const newCompleted = new Set();
    if (form.name.trim()) newCompleted.add(0);
    if (form.bio || form.linkedinUrl || form.githubUrl || form.cvUrl) newCompleted.add(1);
    if (form.mentorshipAvailable || form.freelanceAvailable || form.yearsOfExperience) newCompleted.add(2);
    if (initial.resumeData) newCompleted.add(3);
    newCompleted.add(4);
    setCompleted(newCompleted);
  }, [form, initial.resumeData]);

  const TABS = [
    { id: 'basic', label: 'Basic Info', icon: UserCircle2 },
    { id: 'links', label: 'Developer Links', icon: LinkIcon },
    { id: 'opportunities', label: 'Job Opportunities', icon: Briefcase },
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
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 bg-[#00A693] hover:bg-[#007D6F] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50">
          <Save size={14} /> {saving ? 'Saving…' : 'Save Changes'}
        </button>
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
                    ? <img src={initial.avatar} alt={initial.name} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
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
        </div>

        {/* Right: Tab wizard */}
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
                        ? 'bg-[#00A693] border-[#00A693] text-white shadow-md shadow-[#00A693]/30'
                        : isDone
                        ? 'bg-[#00A693]/10 border-[#00A693] text-[#00A693]'
                        : 'bg-white border-[#E5E1DA] text-[#9CA3AF] group-hover:border-[#00A693]/40 group-hover:text-[#00A693]'
                    }`}>
                      {isDone && !isActive ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-[11px] font-medium hidden sm:block transition-colors ${
                      isActive ? 'text-[#00A693]' : isDone ? 'text-[#00A693]' : 'text-[#9CA3AF]'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                  {i < TABS.length - 1 && (
                    <div className={`h-0.5 flex-1 mx-1 rounded-full transition-all duration-300 ${
                      completed.has(i) ? 'bg-[#00A693]' : 'bg-[#E5E1DA]'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>

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

            {/* Tab 2 — Job Opportunities */}
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
                  <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Badge Assignment</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {BADGES.map(b => {
                      const Icon = b.icon;
                      const active = form.badge === b.value;
                      return (
                        <button key={b.value} type="button"
                          onClick={() => setForm(f => ({ ...f, badge: b.value }))}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm transition-colors ${active ? 'border-[#00A693] bg-[#E6F7F5]' : 'border-[#E5E1DA] hover:border-[#00A693]/40 bg-white'}`}>
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${b.cls}`}>
                            {Icon && <Icon size={11} />} {b.label}
                          </span>
                          {active && <Check size={13} className="ml-auto text-[#00A693]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-[#E5E1DA]">
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

                <div className="pt-8 border-t border-[#E5E1DA]">
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h3>
                    <p className="text-xs text-red-500/80 mb-4">Permanently delete this user account. This action cannot be undone.</p>
                    <button onClick={() => setShowDelete(true)}
                      className="flex items-center gap-2 border border-red-200 text-red-500 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
                      <Trash2 size={13} /> Delete Account
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"""

content = content[:start_idx] + new_component + content[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Success')
