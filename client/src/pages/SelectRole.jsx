import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Code2, Briefcase, GraduationCap, Handshake, X, Plus, IndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

const ROLES = [
  {
    key: 'developer',
    icon: Code2,
    label: 'Developer',
    desc: 'Showcase your projects, build a portfolio, and get discovered by clients and recruiters.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-500',
  },
  {
    key: 'recruiter',
    icon: Briefcase,
    label: 'Recruiter',
    desc: 'Find talented developers, browse portfolios, post vacancies, and hire the best fit.',
    color: 'text-accent',
    bg: 'bg-accent-light',
    border: 'border-accent',
  },
  {
    key: 'client',
    icon: Handshake,
    label: 'Hire a Freelancer',
    desc: 'Post your project, define your requirements, and connect with skilled freelance developers.',
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    border: 'border-teal-500',
  },
  {
    key: 'mentee',
    icon: GraduationCap,
    label: 'Looking for Mentor',
    desc: 'Connect with experienced developers, learn new skills, and grow your career.',
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-500',
  },
];

const DURATIONS = ['< 1 month', '1–3 months', '3–6 months', '6+ months'];
const EXP_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Any level'];

const TAG_COLORS = {
  violet: {
    ring: 'focus:ring-violet-400/30 focus:border-violet-400',
    btn: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100',
    tag: 'bg-violet-50 text-violet-700 border-violet-200',
    remove: 'hover:bg-violet-100',
  },
  teal: {
    ring: 'focus:ring-teal-400/30 focus:border-teal-400',
    btn: 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100',
    tag: 'bg-teal-50 text-teal-700 border-teal-200',
    remove: 'hover:bg-teal-100',
  },
};

function TagInput({ tags, onAdd, onRemove, inputValue, onInputChange, placeholder, accent = 'violet' }) {
  const c = TAG_COLORS[accent] || TAG_COLORS.violet;
  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && inputValue.trim()) {
      e.preventDefault();
      onAdd(inputValue.trim().replace(/,$/, ''));
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 text-sm px-3 py-2 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 transition ${c.ring}`}
        />
        <button
          type="button"
          onClick={() => inputValue.trim() && onAdd(inputValue.trim())}
          className={`px-3 py-2 rounded-xl border transition ${c.btn}`}
        >
          <Plus size={15} />
        </button>
      </div>
      <p className="text-[11px] text-muted mt-1">Press Enter or , to add</p>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map(tag => (
            <span key={tag} className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${c.tag}`}>
              {tag}
              <button type="button" onClick={() => onRemove(tag)} className={`rounded-full p-0.5 ${c.remove}`}>
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SelectRole() {
  const { user, selectRole } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const [menteeForm, setMenteeForm] = useState({
    education: '',
    location: '',
    dateOfBirth: '2010-01-01',
    currentSkillTags: [],
    currentSkillInput: '',
    lookingToLearnTags: [],
    lookingToLearnInput: '',
  });

  const [clientForm, setClientForm] = useState({
    projectName: '',
    budget: '',
    duration: '',
    skillsNeededTags: [],
    skillsNeededInput: '',
    experienceLevel: '',
    description: '',
  });

  const homeFor = (u) => {
    if (u.role === 'admin') return '/admin';
    if (u.userType === 'recruiter' || u.userType === 'client') return '/client-profile';
    if (u.userType === 'mentee') return '/portfolios';
    return '/profile';
  };

  if (!user) return <Navigate to="/login" replace />;
  if (user.onboardingComplete) return <Navigate to={homeFor(user)} replace />;

  const addTag = (field, inputField) => (val) => {
    if (!menteeForm[field].includes(val))
      setMenteeForm(f => ({ ...f, [field]: [...f[field], val], [inputField]: '' }));
    else
      setMenteeForm(f => ({ ...f, [inputField]: '' }));
  };
  const removeTag = (field) => (val) =>
    setMenteeForm(f => ({ ...f, [field]: f[field].filter(t => t !== val) }));

  const handleContinue = async () => {
    if (!selected) { toast.error('Please select a role to continue'); return; }

    if (selected === 'mentee') {
      if (menteeForm.lookingToLearnTags.length === 0) {
        toast.error('Please add at least one skill you want to learn');
        return;
      }
    }

    if (selected === 'client') {
      if (!clientForm.projectName.trim()) { toast.error('Please describe what you need to build'); return; }
      if (clientForm.skillsNeededTags.length === 0) { toast.error('Please add at least one skill you need'); return; }
    }

    setLoading(true);
    try {
      let extraData = {};
      if (selected === 'mentee') {
        extraData = {
          menteeProfile: {
            education: menteeForm.education,
            location: menteeForm.location,
            dateOfBirth: menteeForm.dateOfBirth || null,
            currentSkills: menteeForm.currentSkillTags,
            lookingToLearn: menteeForm.lookingToLearnTags,
          },
        };
      } else if (selected === 'client') {
        extraData = {
          clientProfile: {
            projectName: clientForm.projectName,
            budget: clientForm.budget || null,
            duration: clientForm.duration,
            skillsNeeded: clientForm.skillsNeededTags,
            experienceLevel: clientForm.experienceLevel,
            description: clientForm.description,
          },
        };
      }
      const updated = await selectRole(selected, extraData);
      toast.success('Welcome aboard!');
      navigate(homeFor(updated), { replace: true });
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-start px-4 pt-2 pb-6">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-4">
          <img src={logo} alt="ShareMyApps" className="h-10 w-auto mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-text tracking-tight mb-2">
            Welcome, {user.name.split(' ')[0]}!
          </h1>
          <p className="text-muted text-sm">
            Tell us who you are so we can tailor your experience.
          </p>
        </div>

        {/* Role cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {ROLES.map(({ key, icon: Icon, label, desc, color, bg, border }) => {
            const isSelected = selected === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelected(key)}
                className={`flex flex-col items-center text-center gap-4 p-6 rounded-2xl border-2 transition-all duration-150 ${
                  isSelected
                    ? `${border} ${bg} shadow-md`
                    : 'border-border bg-white hover:border-[#C5C0B8] hover:shadow-sm'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl ${isSelected ? bg : 'bg-[#F3F0EB]'} flex items-center justify-center transition-colors`}>
                  <Icon size={26} className={isSelected ? color : 'text-muted'} />
                </div>
                <div>
                  <p className={`font-semibold text-sm mb-1.5 ${isSelected ? color : 'text-text'}`}>
                    {label}
                  </p>
                  <p className="text-xs text-muted leading-relaxed">{desc}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? `${border} ${bg}` : 'border-[#C5C0B8]'
                }`}>
                  {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${color.replace('text-', 'bg-')}`} />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Mentee profile form — shown when "Looking for Mentor" is selected */}
        {selected === 'mentee' && (
          <div className="bg-white border border-violet-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                <GraduationCap size={14} className="text-violet-500" />
              </div>
              <h2 className="text-sm font-bold text-text">Tell us a bit about yourself</h2>
            </div>

            <div className="space-y-5">
              {/* Education */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  Education
                </label>
                <input
                  type="text"
                  value={menteeForm.education}
                  onChange={e => setMenteeForm(f => ({ ...f, education: e.target.value }))}
                  placeholder="e.g. B.Tech in Computer Science, XYZ University"
                  className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Location */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Location
                    </label>
                  <input
                    type="text"
                    value={menteeForm.location}
                    onChange={e => setMenteeForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Bangalore, India"
                    className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                  />
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Date of Birth
                    </label>
                  <input
                    type="date"
                    value={menteeForm.dateOfBirth}
                    onChange={e => setMenteeForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Current skills */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Skills you already know
                    </label>
                  <TagInput
                    tags={menteeForm.currentSkillTags}
                    onAdd={addTag('currentSkillTags', 'currentSkillInput')}
                    onRemove={removeTag('currentSkillTags')}
                    inputValue={menteeForm.currentSkillInput}
                    onInputChange={v => setMenteeForm(f => ({ ...f, currentSkillInput: v }))}
                    placeholder="e.g. HTML, CSS, Python"
                  />
                </div>

                {/* Looking to learn */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Skills you want to learn / Looking mentor for <span className="text-red-400">*</span>
                  </label>
                  <TagInput
                    tags={menteeForm.lookingToLearnTags}
                    onAdd={addTag('lookingToLearnTags', 'lookingToLearnInput')}
                    onRemove={removeTag('lookingToLearnTags')}
                    inputValue={menteeForm.lookingToLearnInput}
                    onInputChange={v => setMenteeForm(f => ({ ...f, lookingToLearnInput: v }))}
                    placeholder="e.g. React, System Design, DSA"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Client profile form — shown when "Hire a Freelancer" is selected */}
        {selected === 'client' && (
          <div className="bg-white border border-teal-200 rounded-2xl p-6 mb-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <Handshake size={14} className="text-teal-600" />
              </div>
              <h2 className="text-sm font-bold text-text">Tell us about your project</h2>
            </div>

            <div className="space-y-5">
              {/* What you need to build */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">
                  What do you need built? <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={clientForm.projectName}
                  onChange={e => setClientForm(f => ({ ...f, projectName: e.target.value }))}
                  placeholder="e.g. E-commerce website, Mobile app, REST API"
                  className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Budget */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Budget (₹)</label>
                  <div className="relative">
                    <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="number"
                      min="0"
                      value={clientForm.budget}
                      onChange={e => setClientForm(f => ({ ...f, budget: e.target.value }))}
                      placeholder="e.g. 50000"
                      className="w-full pl-8 pr-4 text-sm py-2.5 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition"
                    />
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Project duration</label>
                  <select
                    value={clientForm.duration}
                    onChange={e => setClientForm(f => ({ ...f, duration: e.target.value }))}
                    className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition appearance-none"
                  >
                    <option value="">Select duration</option>
                    {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Skills needed */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">
                    Skills / Tech stack needed <span className="text-red-400">*</span>
                  </label>
                  <TagInput
                    tags={clientForm.skillsNeededTags}
                    onAdd={(val) => {
                      if (!clientForm.skillsNeededTags.includes(val))
                        setClientForm(f => ({ ...f, skillsNeededTags: [...f.skillsNeededTags, val], skillsNeededInput: '' }));
                      else setClientForm(f => ({ ...f, skillsNeededInput: '' }));
                    }}
                    onRemove={(val) => setClientForm(f => ({ ...f, skillsNeededTags: f.skillsNeededTags.filter(t => t !== val) }))}
                    inputValue={clientForm.skillsNeededInput}
                    onInputChange={v => setClientForm(f => ({ ...f, skillsNeededInput: v }))}
                    placeholder="e.g. React, Node.js, Flutter"
                    accent="teal"
                  />
                </div>

                {/* Experience level */}
                <div>
                  <label className="block text-xs font-semibold text-text mb-1.5">Experience level needed</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {EXP_LEVELS.map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setClientForm(f => ({ ...f, experienceLevel: f.experienceLevel === lvl ? '' : lvl }))}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${clientForm.experienceLevel === lvl ? 'bg-teal-100 text-teal-700 border-teal-300' : 'bg-bg text-muted border-border hover:border-teal-300'}`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-text mb-1.5">Brief description</label>
                <textarea
                  rows={3}
                  value={clientForm.description}
                  onChange={e => setClientForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your project, goals, and any specific requirements…"
                  className="w-full text-sm px-3.5 py-2.5 border border-border rounded-xl bg-bg text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-400 transition resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected || loading}
          className="w-full bg-orange-700 hover:bg-orange-800 text-white py-3.5 rounded-xl font-medium text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting up your account…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
