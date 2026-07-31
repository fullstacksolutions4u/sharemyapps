import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, Plus, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/image';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const CATEGORIES = [
  'Mobile Applications', 'E-Commerce', 'Project Management', 'Customer Relationship Management (CRM)',
  'Finance & Accounting', 'Productivity Tools', 'Social Networking & Community',
  'Healthcare & Fitness', 'Education & Learning Platforms', 'HR & Recruitment',
  'Marketing & SEO', 'Real Estate', 'Travel & Booking', 'Food Delivery & Restaurant',
  'Gaming', 'Blockchain & Web3', 'Automation Tools', 'Analytics & Reporting',
  'Communication & Chat Apps', 'Inventory Management', 'Event Management',
  'AI & Machine Learning', 'DevTools & Developer Utilities', 'Cybersecurity',
  'IoT & Embedded Systems', 'AR & VR', 'Media & Entertainment',
  'Legal & Compliance', 'Logistics & Supply Chain', 'Agriculture & Farming',
  'Environment & Sustainability', 'Non-Profit & Social Impact',
  'Personal Finance & Budgeting', 'Job Board & Freelancing',
  'News & Blogging', 'Sports & Recreation', 'Fashion & Lifestyle',
  'Open Source Project', 'Portfolios', 'Company Website',
];

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ title: '', description: '', liveUrl: '', techTags: '', appType: 'web', category: '' });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [githubUrls, setGithubUrls] = useState(['']);
  const [githubVisible, setGithubVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [projectStatus, setProjectStatus] = useState('');

  const [forSale, setForSale] = useState(false);
  const [salePrice, setSalePrice] = useState('');

  const [collaborators, setCollaborators] = useState([]);
  const [collabInput, setCollabInput] = useState('');
  const [collabResults, setCollabResults] = useState([]);
  const [showCollabDrop, setShowCollabDrop] = useState(false);
  const collabRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/projects/${id}`)
      .then(res => {
        const p = res.data;
        const cat = p.category || '';
        const isCustom = cat && !CATEGORIES.includes(cat);
        setForm({ title: p.title, description: p.description, liveUrl: p.liveUrl, techTags: p.techTags?.join(', ') || '', appType: p.appType || 'web', category: cat });
        setIsCustomCategory(isCustom);
        setProjectStatus(p.status || '');
        const urls = p.githubUrls?.length ? p.githubUrls : (p.githubUrl ? [p.githubUrl] : ['']);
        setGithubUrls(urls);
        setGithubVisible(p.githubVisible !== false);
        setForSale(p.forSale || false);
        setSalePrice(p.salePrice != null ? String(p.salePrice) : '');
        if (p.collaborators?.length) setCollaborators(p.collaborators);
      })
      .catch(() => { toast.error('Failed to load project'); navigate('/dashboard'); })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  useEffect(() => {
    const atIdx = collabInput.lastIndexOf('@');
    const query = atIdx < 0 ? null : collabInput.slice(atIdx + 1).trim();
    const timer = setTimeout(() => {
      if (query === null) { setCollabResults([]); setShowCollabDrop(false); return; }
      api.get(`/users/search?q=${encodeURIComponent(query)}`)
        .then(res => {
          const filtered = res.data.filter(u =>
            u._id !== user?._id && !collaborators.some(c => c._id === u._id)
          );
          setCollabResults(filtered);
          setShowCollabDrop(filtered.length > 0);
        })
        .catch(() => {});
    }, 250);
    return () => clearTimeout(timer);
  }, [collabInput, collaborators, user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (collabRef.current && !collabRef.current.contains(e.target)) setShowCollabDrop(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const addCollaborator = (u) => {
    setCollaborators(prev => [...prev, u]);
    setCollabInput('');
    setCollabResults([]);
    setShowCollabDrop(false);
  };

  const removeCollaborator = (cid) => setCollaborators(prev => prev.filter(c => c._id !== cid));

  const handleNext = () => {
    if (!form.appType) { toast.error('Select an app type'); return; }
    if (!form.category) { toast.error('Select a category'); return; }
    if (!form.title.trim()) { toast.error('Project title is required'); return; }
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.liveUrl.trim()) { toast.error('Live URL is required'); return; }
    setLoading(true);
    try {
      const data = new FormData();
      data.append('title', form.title.trim());
      data.append('description', form.description.trim());
      data.append('liveUrl', form.liveUrl.trim());
      data.append('appType', form.appType);
      data.append('category', form.category);
      data.append('techTags', form.techTags);
      githubUrls.forEach(url => { if (url.trim()) data.append('githubUrls', url.trim()); });
      data.append('githubVisible', githubVisible);
      data.append('forSale', forSale);
      if (forSale && salePrice.trim()) data.append('salePrice', salePrice.trim());
      collaborators.forEach(c => data.append('collaborators', c._id));

      if (isEdit) {
        const isResubmit = projectStatus === 'rejected';
        if (isResubmit) data.append('resubmit', 'true');
        await api.put(`/projects/${id}`, data);
        toast.success(isResubmit ? 'Project resubmitted for approval!' : 'Project updated!');
      } else {
        await api.post('/projects', data);
        toast.success('Project submitted for approval!');
      }
      navigate('/dashboard/projects');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <>
    <div className="px-4 sm:px-6 pt-3">
      <Link to="/dashboard/projects" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-text transition-colors">
        <ArrowLeft size={14} /> Back to Projects
      </Link>
    </div>

    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
      <h1 className="text-2xl font-bold text-text tracking-tight mb-6">
        {isEdit ? 'Edit project' : 'Add a new project'}
      </h1>

      {/* Step tabs */}
      <div className="flex items-center gap-0 mb-8 border border-[#E5E1DA] rounded-xl overflow-hidden">
        {[
          { n: 1, label: 'Project Info' },
          { n: 2, label: 'Details & Links' },
        ].map(({ n, label }) => {
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => { if (done) setStep(n); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                ${active ? 'bg-accent text-white' : done ? 'bg-[#F3F0EB] text-accent cursor-pointer hover:bg-accent-light' : 'bg-white text-[#9CA3AF] cursor-default'}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0
                ${active ? 'bg-white/20 text-white' : done ? 'bg-accent text-white' : 'bg-border text-[#9CA3AF]'}`}>
                {n}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            {/* App type */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">App type <span className="text-red-400">*</span></label>
              <div className="flex gap-2 p-1 bg-[#F3F0EB] rounded-xl w-fit">
                {[{ value: 'web', label: 'Web App' }, { value: 'mobile', label: 'Mobile App' }].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, appType: opt.value }))}
                    className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${form.appType === opt.value ? 'bg-white text-text shadow-sm' : 'text-[#6B7280] hover:text-text'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category + Title row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-text">Category <span className="text-red-400">*</span></label>
                  {isCustomCategory && (
                    <button
                      type="button"
                      onClick={() => { setIsCustomCategory(false); setForm(f => ({ ...f, category: '' })); }}
                      className="text-xs text-accent hover:underline font-medium"
                    >
                      Select from list
                    </button>
                  )}
                </div>
                {isCustomCategory ? (
                  <input
                    type="text"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="e.g. Developer Tools"
                    className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    autoFocus
                  />
                ) : (
                  <select
                    value={form.category}
                    onChange={e => {
                      if (e.target.value === 'new_category') {
                        setIsCustomCategory(true);
                        setForm(f => ({ ...f, category: '' }));
                      } else {
                        setForm(f => ({ ...f, category: e.target.value }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="new_category" className="font-semibold text-accent">+ Add New Category</option>
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Project title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. DevTracker"
                  className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Description <span className="text-red-400">*</span></label>
              <textarea
                rows={5}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe what your project does, who it's for, and what makes it interesting..."
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition resize-none"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors"
              >
                Next: Details & Links <ChevronRight size={15} />
              </button>
              <Link
                to="/dashboard/projects"
                className="px-5 py-3 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#6B7280] hover:text-text rounded-xl text-sm font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            {/* Live URL */}
            <div>
              <label className="block text-sm font-medium text-text mb-2">Live URL <span className="text-red-400">*</span></label>
              <input
                type="url"
                value={form.liveUrl}
                onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))}
                placeholder="https://yourapp.com"
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
              />
            </div>

            {/* Tech tags */}
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">Tech stack</label>
              <p className="text-xs text-[#6B7280] mb-2">Comma-separated tags, e.g. React, Node.js, MongoDB</p>
              <input
                type="text"
                value={form.techTags}
                onChange={e => setForm(f => ({ ...f, techTags: e.target.value }))}
                placeholder="React, Node.js, MongoDB"
                className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
              />
            </div>

            {/* GitHub repo URLs */}
            <div className="border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text mb-0.5">GitHub repositories</h3>
                <p className="text-xs text-[#6B7280]">Add repo links for this project (optional)</p>
              </div>
              <div className="space-y-2">
                {githubUrls.map((url, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={url}
                      onChange={e => setGithubUrls(urls => urls.map((u, j) => j === i ? e.target.value : u))}
                      placeholder="github.com/username/repo"
                      className="flex-1 px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                    />
                    {githubUrls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGithubUrls(urls => urls.filter((_, j) => j !== i))}
                        className="w-8 h-8 flex items-center justify-center text-[#9CA3AF] hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setGithubUrls(urls => [...urls, ''])}
                  className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
                >
                  <Plus size={13} /> Add another GitHub link
                </button>
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
                <div
                  onClick={() => setGithubVisible(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative ${githubVisible ? 'bg-accent' : 'bg-[#D1D5DB]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${githubVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-xs text-[#6B7280]">
                  {githubVisible ? 'Visible to everyone' : 'Hidden from other users'}
                </span>
              </label>
            </div>

            {/* Code for Sale */}
            <div className={`border rounded-2xl p-5 space-y-4 transition-colors ${forSale ? 'border-amber-300 bg-amber-50/40' : 'border-border'}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-text mb-0.5">Available for sale</h3>
                  <p className="text-xs text-muted">Offer the source code of this project for purchase. GitHub repo will be hidden from others.</p>
                </div>
                <div
                  onClick={() => setForSale(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative shrink-0 cursor-pointer mt-0.5 ${forSale ? 'bg-amber-500' : 'bg-[#D1D5DB]'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${forSale ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
              </div>
              {forSale && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1.5">Sale price (₹) — optional</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 4999"
                    className="w-full px-3.5 py-2.5 border border-amber-200 rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition bg-white"
                  />
                </div>
              )}
            </div>

            {/* Collaborators */}
            <div className="border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-text mb-0.5 flex items-center gap-2">
                  <Users size={14} className="text-[#6B7280]" /> Collaborators
                </h3>
                <p className="text-xs text-[#6B7280]">Tag teammates from the platform who worked on this project</p>
              </div>

              {collaborators.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {collaborators.map(c => (
                    <span key={c._id} className="inline-flex items-center gap-1.5 bg-[#F3F0EB] border border-[#E5E1DA] text-text text-xs font-medium px-2.5 py-1.5 rounded-full">
                      {c.avatar
                        ? <img src={optimizeImage(c.avatar, 150)} alt={c.name} className="w-4 h-4 rounded-full object-cover" />
                        : <span className={`w-4 h-4 rounded-full ${avatarColor(c.name)} text-white text-[9px] flex items-center justify-center font-semibold`}>{c.name?.[0]?.toUpperCase()}</span>
                      }
                      {c.name}
                      <button type="button" onClick={() => removeCollaborator(c._id)} className="text-[#9CA3AF] hover:text-red-400 transition-colors ml-0.5">
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative" ref={collabRef}>
                <input
                  type="text"
                  value={collabInput}
                  onChange={e => setCollabInput(e.target.value)}
                  onFocus={() => { if (collabResults.length) setShowCollabDrop(true); }}
                  placeholder="Type @ to search and add a collaborator..."
                  className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
                />
                {showCollabDrop && (
                  <ul className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-[#E5E1DA] rounded-xl shadow-lg overflow-hidden">
                    {collabResults.map(u => (
                      <li key={u._id}>
                        <button
                          type="button"
                          onMouseDown={() => addCollaborator(u)}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-[#F3F0EB] transition-colors text-left"
                        >
                          {u.avatar
                            ? <img src={optimizeImage(u.avatar, 150)} alt={u.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                            : <span className={`w-7 h-7 rounded-full ${avatarColor(u.name)} text-white text-xs flex items-center justify-center font-semibold shrink-0`}>{u.name?.[0]?.toUpperCase()}</span>
                          }
                          <span className="text-sm text-text">{u.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => { setStep(1); window.scrollTo(0, 0); }}
                className="flex items-center gap-1.5 px-5 py-3 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#6B7280] hover:text-text rounded-xl text-sm font-medium transition-colors"
              >
                <ChevronLeft size={15} /> Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
              >
                {loading
                  ? (isEdit ? (projectStatus === 'rejected' ? 'Resubmitting...' : 'Saving...') : 'Submitting...')
                  : (isEdit ? (projectStatus === 'rejected' ? 'Resubmit for Approval' : 'Save changes') : 'Submit for Approval')
                }
              </button>
              <Link
                to="/dashboard/projects"
                className="px-5 py-3 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#6B7280] hover:text-text rounded-xl text-sm font-medium transition-colors text-center"
              >
                Cancel
              </Link>
            </div>
          </>
        )}

      </form>
    </div>
    </>
  );
}
