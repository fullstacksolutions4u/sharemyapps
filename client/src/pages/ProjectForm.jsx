import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Upload, X, Plus } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', liveUrl: '', techTags: '', contactEmail: '', contactPhone: '', linkedinUrl: '', githubUrl: '', githubVisible: true });
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [screenshotPreviews, setScreenshotPreviews] = useState([]);
  const [removedScreenshots, setRemovedScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [projectStatus, setProjectStatus] = useState('');

  const bannerRef = useRef();
  const ssRef = useRef();

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/projects/${id}`)
      .then(res => {
        const p = res.data;
        setForm({ title: p.title, description: p.description, liveUrl: p.liveUrl, techTags: p.techTags?.join(', ') || '', contactEmail: p.contactEmail || '', contactPhone: p.contactPhone || '', linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '', githubVisible: p.githubVisible !== false });
        setProjectStatus(p.status || '');
        setBannerPreview(p.bannerImage || '');
        setScreenshotPreviews(p.screenshots || []);
      })
      .catch(() => { toast.error('Failed to load project'); navigate('/dashboard'); })
      .finally(() => setFetching(false));
  }, [id, isEdit, navigate]);

  const handleBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleScreenshots = (e) => {
    const files = Array.from(e.target.files);
    const total = screenshotPreviews.length - removedScreenshots.length + screenshots.length + files.length;
    if (total > 5) { toast.error('Maximum 5 screenshots'); return; }
    setScreenshots(s => [...s, ...files]);
    setScreenshotPreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeExistingScreenshot = (url) => {
    setRemovedScreenshots(r => [...r, url]);
    setScreenshotPreviews(p => p.filter(x => x !== url));
  };

  const removeNewScreenshot = (idx) => {
    const newIdx = idx - (screenshotPreviews.length - screenshots.length);
    setScreenshots(s => s.filter((_, i) => i !== newIdx));
    setScreenshotPreviews(p => p.filter((_, i) => i !== idx));
  };

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
      data.append('techTags', form.techTags);
      data.append('contactEmail', form.contactEmail.trim());
      data.append('contactPhone', form.contactPhone.trim());
      data.append('linkedinUrl', form.linkedinUrl.trim());
      data.append('githubUrl', form.githubUrl.trim());
      data.append('githubVisible', form.githubVisible);
      if (banner) data.append('banner', banner);
      screenshots.forEach(f => data.append('screenshots', f));
      removedScreenshots.forEach(url => data.append('removeScreenshots', url));

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

        {/* Contact info */}
        <div className="border border-[#E5E1DA] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-0.5">Contact information</h3>
            <p className="text-xs text-[#6B7280]">Let people reach out to you about this project</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Email <span className="text-red-400">*</span></label>
            <input
              type="email"
              required
              value={form.contactEmail}
              onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              Mobile number <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={form.contactPhone}
              onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))}
              placeholder="+1 234 567 8900"
              className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">LinkedIn URL <span className="text-red-400">*</span></label>
            <input
              type="text"
              required
              value={form.linkedinUrl}
              onChange={e => setForm(f => ({ ...f, linkedinUrl: e.target.value }))}
              placeholder="linkedin.com/in/yourprofile"
              className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
              GitHub URL <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={form.githubUrl}
              onChange={e => setForm(f => ({ ...f, githubUrl: e.target.value }))}
              placeholder="github.com/username/repo"
              className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
            <label className="flex items-center gap-2.5 mt-3 cursor-pointer select-none w-fit">
              <div
                onClick={() => setForm(f => ({ ...f, githubVisible: !f.githubVisible }))}
                className={`w-9 h-5 rounded-full transition-colors relative ${form.githubVisible ? 'bg-[#00A693]' : 'bg-[#D1D5DB]'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.githubVisible ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-[#6B7280]">
                {form.githubVisible ? 'Visible to everyone' : 'Hidden from other users'}
              </span>
            </label>
          </div>
        </div>

        {/* Banner image */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Banner image</label>
          {bannerPreview ? (
            <div className="relative rounded-xl overflow-hidden mb-2">
              <img src={bannerPreview} alt="Banner" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={() => { setBanner(null); setBannerPreview(''); if (bannerRef.current) bannerRef.current.value = ''; }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-[#E5E1DA] hover:border-[#00A693] rounded-xl flex flex-col items-center justify-center gap-2 text-[#6B7280] hover:text-[#00A693] transition-colors"
            >
              <Upload size={20} />
              <span className="text-xs font-medium">Click to upload banner</span>
              <span className="text-xs">PNG, JPG, WebP up to 5MB</span>
            </button>
          )}
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBanner} className="hidden" />
        </div>

        {/* Screenshots */}
        <div>
          <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">Screenshots</label>
          <p className="text-xs text-[#6B7280] mb-2">Up to 5 screenshots of your project in action</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {screenshotPreviews.map((src, i) => (
              <div key={i} className="relative rounded-lg overflow-hidden">
                <img src={src} alt={`ss ${i}`} className="w-full h-20 object-cover" />
                <button
                  type="button"
                  onClick={() => {
                    const isExisting = !src.startsWith('blob:');
                    if (isExisting) removeExistingScreenshot(src);
                    else removeNewScreenshot(i);
                  }}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {screenshotPreviews.length < 5 && (
              <button
                type="button"
                onClick={() => ssRef.current?.click()}
                className="h-20 border-2 border-dashed border-[#E5E1DA] hover:border-[#00A693] rounded-lg flex flex-col items-center justify-center gap-1 text-[#6B7280] hover:text-[#00A693] transition-colors"
              >
                <Plus size={16} />
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
          <input ref={ssRef} type="file" accept="image/*" multiple onChange={handleScreenshots} className="hidden" />
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
