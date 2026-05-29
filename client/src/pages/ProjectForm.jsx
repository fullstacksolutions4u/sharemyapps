import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, X, Plus } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  const CATEGORIES = [
    'E-Commerce', 'Project Management', 'Customer Relationship Management (CRM)',
    'Finance & Accounting', 'Productivity Tools', 'Social Networking & Community',
    'Healthcare & Fitness', 'Education & Learning Platforms', 'HR & Recruitment',
    'Marketing & SEO', 'Real Estate', 'Travel & Booking', 'Food Delivery & Restaurant',
    'Gaming', 'Blockchain & Web3', 'Automation Tools', 'Analytics & Reporting',
    'Communication & Chat Apps', 'Inventory Management', 'Event Management', 'Others',
  ];

  const [form, setForm] = useState({ title: '', description: '', liveUrl: '', techTags: '', appType: 'web', category: '' });
  const [githubUrls, setGithubUrls] = useState(['']);
  const [githubVisible, setGithubVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [projectStatus, setProjectStatus] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/projects/${id}`)
      .then(res => {
        const p = res.data;
        setForm({ title: p.title, description: p.description, liveUrl: p.liveUrl, techTags: p.techTags?.join(', ') || '', appType: p.appType || 'web', category: p.category || '' });
        setProjectStatus(p.status || '');
        const urls = p.githubUrls?.length ? p.githubUrls : (p.githubUrl ? [p.githubUrl] : ['']);
        setGithubUrls(urls);
        setGithubVisible(p.githubVisible !== false);
      })
      .catch(() => { toast.error('Failed to load project'); navigate('/dashboard'); })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.liveUrl.trim()) {
      toast.error('Title, description, and live URL are required');
      return;
    }
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

      if (isEdit) {
        const isResubmit = projectStatus === 'rejected';
        if (isResubmit) data.append('resubmit', 'true');
        await api.put(`/projects/${id}`, data);
        toast.success(isResubmit ? 'Project resubmitted for approval!' : 'Project updated!');
      } else {
        await api.post('/projects', data);
        toast.success('Project submitted for approval!');
      }
      navigate('/dashboard');
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight mb-8">
        {isEdit ? 'Edit project' : 'Add a new project'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* App type tab */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">App type <span className="text-red-400">*</span></label>
          <div className="flex gap-2 p-1 bg-[#F3F0EB] rounded-xl w-fit">
            {[{ value: 'web', label: 'Web App' }, { value: 'mobile', label: 'Mobile App' }].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, appType: opt.value }))}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${form.appType === opt.value ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Category <span className="text-red-400">*</span></label>
          <select
            required
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Project title <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="e.g. DevTracker — habit tracker for developers"
            className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Description <span className="text-red-400">*</span></label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe what your project does, who it's for, and what makes it interesting..."
            className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition resize-none"
          />
        </div>

        {/* Live URL */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Live URL <span className="text-red-400">*</span></label>
          <input
            type="url"
            required
            value={form.liveUrl}
            onChange={e => setForm(f => ({ ...f, liveUrl: e.target.value }))}
            placeholder="https://yourapp.com"
            className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
          />
        </div>

        {/* Tech tags */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Tech stack</label>
          <p className="text-xs text-[#6B7280] mb-2">Comma-separated tags, e.g. React, Node.js, MongoDB</p>
          <input
            type="text"
            value={form.techTags}
            onChange={e => setForm(f => ({ ...f, techTags: e.target.value }))}
            placeholder="React, Node.js, MongoDB"
            className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
          />
        </div>

        {/* GitHub repo URLs */}
        <div className="border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-0.5">GitHub repositories</h3>
            <p className="text-xs text-[#6B7280]">Add repo links for this project (optional)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              GitHub URLs <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <div className="space-y-2">
              {githubUrls.map((url, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={url}
                    onChange={e => setGithubUrls(urls => urls.map((u, j) => j === i ? e.target.value : u))}
                    placeholder="github.com/username/repo"
                    className="flex-1 px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
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
                className="inline-flex items-center gap-1.5 text-xs text-[#00A693] hover:text-[#007D6F] font-medium transition-colors"
              >
                <Plus size={13} /> Add another GitHub link
              </button>
            </div>
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none w-fit">
              <div
                onClick={() => setGithubVisible(v => !v)}
                className={`w-9 h-5 rounded-full transition-colors relative ${githubVisible ? 'bg-[#00A693]' : 'bg-[#D1D5DB]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${githubVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[#6B7280]">
                {githubVisible ? 'Visible to everyone' : 'Hidden from other users'}
              </span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-[#00A693] hover:bg-[#007D6F] text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
          >
            {loading
              ? (isEdit ? (projectStatus === 'rejected' ? 'Resubmitting...' : 'Saving...') : 'Submitting...')
              : (isEdit ? (projectStatus === 'rejected' ? 'Resubmit for Approval' : 'Save changes') : 'Submit for Approval')
            }
          </button>
          <Link
            to="/dashboard"
            className="px-5 py-3 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#6B7280] hover:text-[#1A1A1A] rounded-xl text-sm font-medium transition-colors text-center"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
