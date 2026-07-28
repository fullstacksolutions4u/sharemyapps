import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Briefcase, Check, X, ExternalLink, Link as LinkIcon, MapPin, Laptop, Edit2, Plus, Save, Clock, Sparkles, Building, Calendar, Share2 } from 'lucide-react';

const DESIGNATION_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "React Developer",
  "Node.js Developer",
  "Python Developer",
  "Java Developer",
  "Android Developer",
  "iOS Developer",
  "DevOps Engineer",
  "UI/UX Designer",
  "QA Engineer",
  "Data Scientist",
  "Data Analyst",
  "Product Manager",
  "Other"
];

export default function AdminJobLinksSection() {
  const [jobLinks, setJobLinks] = useState([]);
  const [customDesignations, setCustomDesignations] = useState(() => {
    const saved = localStorage.getItem('customDesignations');
    return saved ? JSON.parse(saved) : [];
  });

  const handleAddDesignation = () => {
    const newDesig = window.prompt("Enter new custom designation:");
    if (newDesig && newDesig.trim()) {
      const clean = newDesig.trim();
      if (!DESIGNATION_OPTIONS.includes(clean) && !customDesignations.includes(clean)) {
        const updated = [...customDesignations, clean];
        setCustomDesignations(updated);
        localStorage.setItem('customDesignations', JSON.stringify(updated));
      }
      return clean;
    }
    return null;
  };
  const [loading, setLoading] = useState(true);
  const [editForms, setEditForms] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  
  const [editingLinkId, setEditingLinkId] = useState(null);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLinkForm, setNewLinkForm] = useState({
    url: '',
    title: '',
    company: '',
    postedDate: '',
    workMode: '',
    location: '',
    experience: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // AI extraction state — for Add New form
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // AI extraction state — for pending/edit forms (keyed by link._id)
  const [aiTextMap, setAiTextMap] = useState({});
  const [aiLoadingMap, setAiLoadingMap] = useState({});
  const [aiSuccessMap, setAiSuccessMap] = useState({});

  const handleAIExtract = async () => {
    if (!aiText.trim()) { toast.error('Paste the job description first.'); return; }
    setAiLoading(true);
    setAiSuccess(false);
    try {
      const res = await api.post('/job-links/extract-job-details', { text: aiText });
      if (res.data.success) {
        const d = res.data.data;
        setNewLinkForm(prev => ({
          ...prev,
          title: d.title || prev.title,
          company: d.company || prev.company,
          postedDate: d.postedDate || prev.postedDate,
          workMode: d.workMode || prev.workMode,
          location: d.location || prev.location,
          experience: d.experience || prev.experience,
        }));
        setAiSuccess(true);
        toast.success('Fields auto-filled by AI!');
        setTimeout(() => setAiSuccess(false), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI extraction failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExtractForLink = async (linkId) => {
    const text = aiTextMap[linkId] || '';
    if (!text.trim()) { toast.error('Paste the job description first.'); return; }
    setAiLoadingMap(prev => ({ ...prev, [linkId]: true }));
    setAiSuccessMap(prev => ({ ...prev, [linkId]: false }));
    try {
      const res = await api.post('/job-links/extract-job-details', { text });
      if (res.data.success) {
        const d = res.data.data;
        setEditForms(prev => ({
          ...prev,
          [linkId]: {
            ...prev[linkId],
            title: d.title || prev[linkId]?.title || '',
            company: d.company || prev[linkId]?.company || '',
            postedDate: d.postedDate || prev[linkId]?.postedDate || '',
            workMode: d.workMode || prev[linkId]?.workMode || '',
            location: d.location || prev[linkId]?.location || '',
            experience: d.experience || prev[linkId]?.experience || '',
          }
        }));
        setAiSuccessMap(prev => ({ ...prev, [linkId]: true }));
        toast.success('Fields auto-filled by AI!');
        setTimeout(() => setAiSuccessMap(prev => ({ ...prev, [linkId]: false })), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI extraction failed.');
    } finally {
      setAiLoadingMap(prev => ({ ...prev, [linkId]: false }));
    }
  };

  const fetchJobLinks = async () => {
    try {
      const res = await api.get('/job-links/admin');
      if (res.data.success) {
        setJobLinks(res.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load job links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobLinks();
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      const link = jobLinks.find(l => l._id === id);
      const updates = { status };
      
      if (status === 'approved') {
        const title = editForms[id]?.title !== undefined ? editForms[id].title : link.title;
        const company = editForms[id]?.company !== undefined ? editForms[id].company : link.company;
        const postedDate = editForms[id]?.postedDate !== undefined ? editForms[id].postedDate : link.postedDate;
        const workMode = editForms[id]?.workMode !== undefined ? editForms[id].workMode : link.workMode;
        const location = editForms[id]?.location !== undefined ? editForms[id].location : link.location;
        const experience = editForms[id]?.experience !== undefined ? editForms[id].experience : link.experience;
        const url = editForms[id]?.url !== undefined ? editForms[id].url : link.url;
        
        if (!title || !workMode || !url) {
          toast.error('URL, Designation, and Work Mode are required!');
          return;
        }
        updates.title = title;
        updates.company = company;
        updates.postedDate = postedDate;
        updates.workMode = workMode;
        updates.location = location;
        updates.experience = experience;
        updates.url = url;
      }

      const res = await api.put(`/job-links/${id}`, updates);
      if (res.data.success) {
        toast.success(`Job link updated!`);
        setEditingLinkId(null);
        fetchJobLinks();
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update job link`);
    }
  };

  const handleFormChange = (id, field, value) => {
    setEditForms(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const startEditing = (link) => {
    setEditForms(prev => ({
      ...prev,
      [link._id]: {
        url: link.url,
        title: link.title,
        company: link.company,
        postedDate: link.postedDate,
        workMode: link.workMode,
        location: link.location,
        experience: link.experience || ''
      }
    }));
    setEditingLinkId(link._id);
  };

  const cancelEditing = () => {
    setEditingLinkId(null);
  };

  const handleAddNew = async (e) => {
    e.preventDefault();
    if (!newLinkForm.url || !newLinkForm.title || !newLinkForm.workMode) {
      toast.error('URL, Designation, and Work Mode are required');
      return;
    }
    
    setSubmittingAdd(true);
    try {
      const res = await api.post('/job-links/admin', newLinkForm);
      if (res.data.success) {
        toast.success('Job link added successfully!');
        setNewLinkForm({ url: '', title: '', workMode: '', location: '', experience: '' });
        setShowAddForm(false);
        fetchJobLinks();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add job link');
    } finally {
      setSubmittingAdd(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;

  const pendingLinks = jobLinks.filter(l => l.status === 'pending');
  const approvedLinks = jobLinks.filter(l => l.status === 'approved');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-border flex-wrap gap-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'pending' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            Pending Verification ({pendingLinks.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'approved' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            Approved Links ({approvedLinks.length})
          </button>
        </div>
        {activeTab === 'approved' && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors mb-1"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            {showAddForm ? 'Cancel' : 'Add New'}
          </button>
        )}
      </div>

      {showAddForm && activeTab === 'approved' && (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-border">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={18} className="text-accent" />
            Add New Job Link Directly
          </h3>

          {/* AI Extract Panel */}
          <div className="mb-4 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-violet-500" />
              <span className="text-sm font-semibold text-violet-700">AI Auto-Fill</span>
              <span className="text-xs text-violet-500">— paste job content and let AI fill the fields</span>
            </div>
            <textarea
              rows={3}
              value={aiText}
              onChange={e => { setAiText(e.target.value); setAiSuccess(false); }}
              placeholder="Paste the full job posting content here (copy from LinkedIn, Naukri, etc.)…"
              className="w-full text-sm border border-violet-200 rounded-lg px-3 py-2 focus:outline-none focus:border-violet-400 bg-white resize-none mb-2"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleAIExtract}
                disabled={aiLoading || !aiText.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition"
              >
                <Sparkles size={14} />
                {aiLoading ? 'Extracting…' : 'Extract with AI'}
              </button>
              {aiSuccess && (
                <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                  <Check size={13} /> Fields auto-filled!
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleAddNew} className="space-y-4">
            <div className="relative">
              <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="url"
                required
                placeholder="Job URL (e.g. https://linkedin.com/jobs/...)"
                value={newLinkForm.url}
                onChange={e => setNewLinkForm(prev => ({...prev, url: e.target.value}))}
                className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Briefcase size={16} className="absolute left-3 top-3 text-gray-400" />
                  <select
                    required
                    value={newLinkForm.title}
                    onChange={e => setNewLinkForm(prev => ({...prev, title: e.target.value}))}
                    className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent text-gray-700 bg-white"
                  >
                    <option value="" disabled>Select Designation</option>
                    {[...DESIGNATION_OPTIONS, ...customDesignations].map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const added = handleAddDesignation();
                    if (added) setNewLinkForm(prev => ({...prev, title: added}));
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 rounded-lg transition shrink-0 flex items-center justify-center border border-border"
                  title="Add Custom Designation"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="relative">
                <Laptop size={16} className="absolute left-3 top-3 text-gray-400" />
                <select
                  required
                  value={newLinkForm.workMode}
                  onChange={e => setNewLinkForm(prev => ({...prev, workMode: e.target.value}))}
                  className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent text-gray-700 bg-white"
                >
                  <option value="" disabled>Select Work Mode</option>
                  <option value="Remote">Remote</option>
                  <option value="Onsite">Onsite</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Location (e.g. Bangalore, India) - Optional"
                  value={newLinkForm.location}
                  onChange={e => setNewLinkForm(prev => ({...prev, location: e.target.value}))}
                  className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div className="relative">
                <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Company Name - Optional"
                  value={newLinkForm.company}
                  onChange={e => setNewLinkForm(prev => ({...prev, company: e.target.value}))}
                  className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Posted Date (e.g. 2 days ago) - Optional"
                  value={newLinkForm.postedDate}
                  onChange={e => setNewLinkForm(prev => ({...prev, postedDate: e.target.value}))}
                  className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Experience (e.g. 2-5 Yrs) - Optional"
                  value={newLinkForm.experience}
                  onChange={e => setNewLinkForm(prev => ({...prev, experience: e.target.value}))}
                  className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submittingAdd}
                className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2"
              >
                {submittingAdd ? 'Adding...' : (
                  <>
                    <Check size={16} /> Add to Timeline
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {activeTab === 'pending' && pendingLinks.length === 0 && (
          <div className="p-8 text-center text-muted bg-white rounded-xl shadow-sm border border-border">No pending job links.</div>
        )}
        {activeTab === 'approved' && approvedLinks.length === 0 && (
          <div className="p-8 text-center text-muted bg-white rounded-xl shadow-sm border border-border">No approved job links.</div>
        )}

        {(activeTab === 'pending' ? pendingLinks : approvedLinks).map(link => {
          const isEditing = editingLinkId === link._id || activeTab === 'pending';
          
          return (
            <div key={link._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start transition hover:shadow-md">
              
              {/* Main Content Area */}
              <div className="flex-1 w-full min-w-0">
                
                {/* Header: User / URL / Status */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0">
                      <Share2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-bold text-[#1f2937] whitespace-nowrap mb-0.5">
                        {link.createdBy?.name || 'Admin ShareMyApps'}
                      </div>
                      
                      {isEditing ? (
                        <div className="relative mt-1">
                          <LinkIcon size={12} className="absolute left-2.5 top-2 text-gray-400" />
                          <input
                            type="url"
                            placeholder="Job URL"
                            value={editForms[link._id]?.url !== undefined ? editForms[link._id].url : link.url}
                            onChange={(e) => handleFormChange(link._id, 'url', e.target.value)}
                            className="w-full pl-7 p-1 text-xs border rounded bg-white text-gray-600 focus:outline-none focus:border-accent"
                          />
                        </div>
                      ) : (
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#0d9488] hover:underline flex items-center gap-1 font-medium w-fit">
                          View Original Post <ExternalLink size={12} className="shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0 ml-4
                    ${link.status === 'approved' ? 'bg-[#dcfce7] text-[#166534]' : 
                      link.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                      'bg-yellow-100 text-yellow-700'}`}
                  >
                    {link.status}
                  </span>
                </div>

                  {/* Form for adding details if Pending or Editing */}
                  {isEditing ? (
                    <>
                      {/* AI Extract Panel */}
                      <div className="mt-3 mb-2 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1.5">
                          <Sparkles size={14} className="text-violet-500" />
                          <span className="text-xs font-semibold text-violet-700">AI Auto-Fill</span>
                          <span className="text-xs text-violet-500">— paste job content to fill fields</span>
                        </div>
                        <div className="flex gap-2">
                          <textarea
                            rows={2}
                            value={aiTextMap[link._id] || ''}
                            onChange={e => setAiTextMap(prev => ({ ...prev, [link._id]: e.target.value }))}
                            placeholder="Paste job description content here to auto-fill fields…"
                            className="flex-1 text-xs border border-violet-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-violet-400 bg-white resize-none"
                          />
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAIExtractForLink(link._id)}
                              disabled={aiLoadingMap[link._id] || !aiTextMap[link._id]?.trim()}
                              className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition whitespace-nowrap"
                            >
                              <Sparkles size={12} />
                              {aiLoadingMap[link._id] ? 'Extracting…' : 'Extract'}
                            </button>
                            {aiSuccessMap[link._id] && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600">
                                <Check size={11} /> Auto-filled!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                        <div className="flex gap-1.5">
                          <div className="relative flex-1 min-w-0">
                            <Briefcase size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                            <select
                              value={editForms[link._id]?.title !== undefined ? editForms[link._id].title : link.title}
                              onChange={(e) => handleFormChange(link._id, 'title', e.target.value)}
                              className="w-full pl-8 p-1.5 text-sm border rounded bg-white text-gray-700 focus:outline-none focus:border-accent"
                            >
                              <option value="" disabled>Select Designation</option>
                              {[...DESIGNATION_OPTIONS, ...customDesignations].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const added = handleAddDesignation();
                              if (added) handleFormChange(link._id, 'title', added);
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 rounded transition shrink-0 flex items-center justify-center border border-border"
                            title="Add Custom Designation"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <div className="relative">
                          <Laptop size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <select
                            value={editForms[link._id]?.workMode !== undefined ? editForms[link._id].workMode : (link.workMode || '')}
                            onChange={(e) => handleFormChange(link._id, 'workMode', e.target.value)}
                            className="w-full pl-8 p-1.5 text-sm border rounded bg-white text-gray-700 focus:outline-none focus:border-accent"
                          >
                            <option value="" disabled>Select Work Mode</option>
                            <option value="Remote">Remote</option>
                            <option value="Onsite">Onsite</option>
                            <option value="Hybrid">Hybrid</option>
                          </select>
                        </div>
                        <div className="relative">
                          <MapPin size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Location (e.g. Bangalore, India) - Optional"
                            value={editForms[link._id]?.location !== undefined ? editForms[link._id].location : link.location}
                            onChange={(e) => handleFormChange(link._id, 'location', e.target.value)}
                            className="w-full pl-8 p-1.5 text-sm border rounded bg-white focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="relative">
                          <Building size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Company Name - Optional"
                            value={editForms[link._id]?.company !== undefined ? editForms[link._id].company : link.company}
                            onChange={(e) => handleFormChange(link._id, 'company', e.target.value)}
                            className="w-full pl-8 p-1.5 text-sm border rounded bg-white focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="relative">
                          <Calendar size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Posted Date - Optional"
                            value={editForms[link._id]?.postedDate !== undefined ? editForms[link._id].postedDate : link.postedDate}
                            onChange={(e) => handleFormChange(link._id, 'postedDate', e.target.value)}
                            className="w-full pl-8 p-1.5 text-sm border rounded bg-white focus:outline-none focus:border-accent"
                          />
                        </div>
                        <div className="relative">
                          <Clock size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Experience (e.g. 2-5 Yrs) - Optional"
                            value={editForms[link._id]?.experience !== undefined ? editForms[link._id].experience : link.experience}
                            onChange={(e) => handleFormChange(link._id, 'experience', e.target.value)}
                            className="w-full pl-8 p-1.5 text-sm border rounded bg-white focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-gray-500 font-medium bg-[#f4f6fa] p-3.5 rounded-lg border border-gray-100/50 mt-1">
                      {link.title && <div className="flex items-center gap-2 text-gray-800 font-semibold"><Briefcase size={15} className="text-gray-400"/>{link.title}</div>}
                      {link.company && <div className="flex items-center gap-2"><Building size={15} className="text-gray-400"/>{link.company}</div>}
                      {link.workMode && <div className="flex items-center gap-2"><Laptop size={15} className="text-gray-400"/>{link.workMode}</div>}
                      {link.location && <div className="flex items-center gap-2"><MapPin size={15} className="text-gray-400"/>{link.location}</div>}
                      {link.experience && <div className="flex items-center gap-2"><Clock size={15} className="text-gray-400"/>{link.experience}</div>}
                      {link.postedDate && <div className="flex items-center gap-2"><Calendar size={15} className="text-gray-400"/>{link.postedDate}</div>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 w-full md:w-28 shrink-0 mt-3 md:mt-0 md:pl-4 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0">
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => handleUpdate(link._id, 'approved')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white rounded-md text-sm font-semibold transition"
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  
                  {activeTab === 'approved' && !isEditing && (
                    <button
                      onClick={() => startEditing(link)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white rounded-md text-sm font-semibold transition"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                  )}

                  {activeTab === 'approved' && isEditing && (
                    <>
                      <button
                        onClick={() => handleUpdate(link._id, 'approved')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white rounded-md text-sm font-semibold transition"
                      >
                        <Save size={14} /> Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-500 hover:bg-gray-100 rounded-md text-sm font-semibold transition"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </>
                  )}

                  {(!isEditing || activeTab === 'pending') && (
                    <button
                      onClick={() => handleUpdate(link._id, 'rejected')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-[#ef4444] hover:bg-red-50 rounded-md text-sm font-semibold transition"
                    >
                      <X size={14} /> {activeTab === 'pending' ? 'Reject' : 'Remove'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
    </div>
  );
}
