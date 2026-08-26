import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Briefcase, Check, X, ExternalLink, Link as LinkIcon, MapPin, Laptop, Edit2, Plus, Save, Clock, Sparkles, Building, Calendar, ChevronDown, Copy, Download, MousePointerClick, Unlock } from 'lucide-react';

const DESIGNATION_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "MERN Stack Developer",
  "MEAN Stack Developer",
  "React Developer",
  "React Native Developer",
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
  const [activeTab, setActiveTab] = useState('approved');
  const [companies, setCompanies] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [editingLinkId, setEditingLinkId] = useState(null);
  
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [linkToReject, setLinkToReject] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejecting, setRejecting] = useState(false);
  
  const createBlankDraft = () => ({
    id: Date.now() + Math.random(),
    url: '',
    title: '',
    company: '',
    postedDate: '',
    workMode: '',
    location: '',
    experience: '',
    submitting: false
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [drafts, setDrafts] = useState([]);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  
  const [feedbackData, setFeedbackData] = useState([]);
  const [expandedClicks, setExpandedClicks] = useState({});

  // AI extraction state — for Add New form
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccess, setAiSuccess] = useState(false);

  // AI extraction state — for pending/edit forms (keyed by link._id)
  const [aiTextMap, setAiTextMap] = useState({});
  const [aiLoadingMap, setAiLoadingMap] = useState({});

  const handleAIExtract = async () => {
    if (!aiText.trim()) { toast.error('Paste the job description first.'); return; }
    setAiLoading(true);
    setAiSuccess(false);
    try {
      const currentUrl = drafts[0]?.url || '';
      const res = await api.post('/job-links/extract-job-details', { text: aiText, url: currentUrl });
      if (res.data.success) {
        const extractedJobs = res.data.data;
        if (!extractedJobs || extractedJobs.length === 0) {
          toast.error('AI could not extract any job positions.');
          return;
        }

        let updatedCustom = [...customDesignations];
        let hasCustomChange = false;

        const newDrafts = extractedJobs.map((job, idx) => {
          const title = job.title || '';
          if (title && !DESIGNATION_OPTIONS.includes(title) && !updatedCustom.includes(title)) {
            updatedCustom.push(title);
            hasCustomChange = true;
          }
          return {
            id: `extracted-${idx}-${Date.now()}`,
            url: currentUrl,
            title: title,
            company: job.company || '',
            postedDate: job.postedDate || '',
            workMode: job.workMode || '',
            location: job.location || '',
            experience: job.experience || '',
            isDuplicate: job.isDuplicate || false,
            duplicateReason: job.duplicateReason || null,
            matchedJob: job.matchedJob || null,
            aiDuplicateNote: job.aiDuplicateNote || '',
            submitting: false
          };
        });

        if (hasCustomChange) {
          setCustomDesignations(updatedCustom);
          localStorage.setItem('customDesignations', JSON.stringify(updatedCustom));
        }

        setDrafts(newDrafts);
        setAiSuccess(true);

        const duplicateCount = newDrafts.filter(d => d.isDuplicate).length;
        if (duplicateCount > 0) {
          toast.error(`AI found ${duplicateCount} duplicate(s) of already listed job posts. Prefer Allow Access for user submissions.`, { duration: 5000 });
        } else {
          toast.success(`Successfully extracted ${newDrafts.length} position(s)!`);
        }
        setTimeout(() => setAiSuccess(false), 3000);
        fetchCompanies();
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
    try {
      const link = jobLinks.find(l => l._id === linkId);
      const res = await api.post('/job-links/extract-job-details', {
        text,
        url: editForms[linkId]?.url || link?.url || '',
        excludeId: linkId,
      });
      if (res.data.success) {
        const d = (res.data.data && res.data.data[0]) || {};
        const title = d.title || '';
        if (title && !DESIGNATION_OPTIONS.includes(title) && !customDesignations.includes(title)) {
          const updated = [...customDesignations, title];
          setCustomDesignations(updated);
          localStorage.setItem('customDesignations', JSON.stringify(updated));
        }
        setEditForms(prev => ({
          ...prev,
          [linkId]: {
            ...prev[linkId],
            title: title || prev[linkId]?.title || '',
            company: d.company || prev[linkId]?.company || '',
            postedDate: d.postedDate || prev[linkId]?.postedDate || '',
            workMode: d.workMode || prev[linkId]?.workMode || '',
            location: d.location || prev[linkId]?.location || '',
            experience: d.experience || prev[linkId]?.experience || '',
            isDuplicate: d.isDuplicate || false,
            duplicateReason: d.duplicateReason || null,
            matchedJob: d.matchedJob || null,
            aiDuplicateNote: d.aiDuplicateNote || '',
          }
        }));
        if (d.isDuplicate) {
          const matchLabel = d.matchedJob
            ? `${d.matchedJob.title || 'Job'} @ ${d.matchedJob.company || 'company'}`
            : (d.aiDuplicateNote || 'an already listed post');
          toast.error(`Duplicate detected: matches ${matchLabel}. Use Allow Access instead of Approve.`, { duration: 5000 });
        } else {
          toast.success('Fields auto-filled by AI!');
        }
        fetchCompanies();
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

  const fetchFeedback = async () => {
    try {
      const res = await api.get('/job-links/admin/feedback');
      if (res.data.success) {
        setFeedbackData(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/job-links/admin/companies');
      if (res.data.success) {
        setCompanies(res.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportCompanies = () => {
    if (companies.length === 0) {
      toast.error('No companies to export');
      return;
    }
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Company Name,Email IDs\n";
    
    companies.forEach(company => {
      const name = `"${(company.name || '').replace(/"/g, '""')}"`;
      const emails = company.emails && company.emails.length > 0 ? `"${company.emails.join(', ')}"` : '""';
      csvContent += `${name},${emails}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_companies_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobLinks();
    fetchFeedback();
    fetchCompanies();
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
        const msg = status === 'access_granted'
          ? 'Access granted — user unlocked for more applies (not listed publicly)'
          : 'Job link updated!';
        toast.success(msg);
        setEditingLinkId(null);
        fetchJobLinks();
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to update job link`);
    }
  };

  const handleConfirmReject = async () => {
    if (!linkToReject) return;
    setRejecting(true);
    try {
      const res = await api.put(`/job-links/${linkToReject._id}`, { 
        status: 'rejected',
        adminNote: rejectComment
      });
      if (res.data.success) {
        toast.success(`Job link rejected`);
        fetchJobLinks();
        setRejectModalOpen(false);
        setRejectComment('');
        setLinkToReject(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject job link');
    } finally {
      setRejecting(false);
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

  const handleDraftChange = (id, field, value) => {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleAddDraft = () => {
    const currentUrl = drafts[0]?.url || '';
    const currentCompany = drafts[0]?.company || '';
    const currentPostedDate = drafts[0]?.postedDate || '';
    const currentWorkMode = drafts[0]?.workMode || '';
    const currentLocation = drafts[0]?.location || '';
    const currentExperience = drafts[0]?.experience || '';
    setDrafts(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        url: currentUrl,
        title: '',
        company: currentCompany,
        postedDate: currentPostedDate,
        workMode: currentWorkMode,
        location: currentLocation,
        experience: currentExperience,
        submitting: false
      }
    ]);
  };

  const handleRemoveDraft = (id) => {
    setDrafts(prev => {
      const remaining = prev.filter(d => d.id !== id);
      if (remaining.length === 0) {
        setShowAddForm(false);
        return [];
      }
      return remaining;
    });
  };

  const handleSubmitDraft = async (id) => {
    const draft = drafts.find(d => d.id === id);
    if (!draft) return;
    if (!draft.url || !draft.title || !draft.workMode) {
      toast.error('URL, Designation, and Work Mode are required');
      return;
    }

    setDrafts(prev => prev.map(d => d.id === id ? { ...d, submitting: true } : d));
    try {
      const res = await api.post('/job-links/admin', draft);
      if (res.data.success) {
        toast.success(`Job link "${draft.title}" added successfully!`);
        setDrafts(prev => {
          const remaining = prev.filter(d => d.id !== id);
          if (remaining.length === 0) {
            setShowAddForm(false);
            return [];
          }
          return remaining;
        });
        fetchJobLinks();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to add job link');
      setDrafts(prev => prev.map(d => d.id === id ? { ...d, submitting: false } : d));
    }
  };

  const handleSubmitAllDrafts = async () => {
    const invalidDraft = drafts.find(d => !d.url || !d.title || !d.workMode);
    if (invalidDraft) {
      toast.error('All positions must have a URL, Designation, and Work Mode.');
      return;
    }

    setSubmittingAll(true);
    const draftsToSubmit = [...drafts];
    let successCount = 0;

    for (const draft of draftsToSubmit) {
      setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, submitting: true } : d));
      try {
        const res = await api.post('/job-links/admin', {
          ...draft,
        });
        if (res.data.success) {
          successCount++;
          setDrafts(prev => prev.filter(d => d.id !== draft.id));
        }
      } catch (err) {
        console.error(err);
        toast.error(`Failed to add "${draft.title}": ${err.response?.data?.message || 'Error'}`);
        setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, submitting: false } : d));
      }
    }

    setSubmittingAll(false);
    if (successCount > 0) {
      toast.success(`Successfully added ${successCount} job link(s) to timeline!`);
      fetchJobLinks();
    }
    if (successCount === draftsToSubmit.length) {
      setShowAddForm(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading...</div>;

  const pendingLinks = jobLinks
    .filter(l => l.status === 'pending')
    .filter(l => !companySearch.trim() || (l.company || '').toLowerCase().includes(companySearch.trim().toLowerCase()));
  const approvedLinks = jobLinks
    .filter(l => l.status === 'approved')
    .filter(l => !companySearch.trim() || (l.company || '').toLowerCase().includes(companySearch.trim().toLowerCase()));

  const filteredCompanies = companies
    .filter(c => !companySearch.trim() || (c.name || '').toLowerCase().includes(companySearch.trim().toLowerCase()));

  const ITEMS_PER_PAGE = 10;
  const activeList = activeTab === 'companies' 
    ? filteredCompanies 
    : (activeTab === 'pending' ? pendingLinks : approvedLinks);

  const totalItems = activeList.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedList = activeList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalClicks = jobLinks.reduce((sum, link) => sum + (link.clicks?.length || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-border flex-wrap gap-4 mb-6">
        <div className="flex">
          <button
            onClick={() => { setActiveTab('approved'); setCurrentPage(1); }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'approved' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            Approved Links ({approvedLinks.length})
          </button>

          <button
            onClick={() => { setActiveTab('pending'); setCurrentPage(1); }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 relative ${activeTab === 'pending' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            Pending Links ({pendingLinks.length})
            {pendingLinks.length > 0 && (
              <span className="absolute top-2.5 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('companies'); setCurrentPage(1); }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'companies' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'}`}
          >
            Companies ({filteredCompanies.length})
          </button>
        </div>
        
        {/* Right Side Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-1">
          {/* Search Bar */}
          <div className="relative w-64 max-w-full">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              type="text"
              value={companySearch}
              onChange={e => { setCompanySearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by company name..."
              className="w-full pl-9 pr-8 py-1.5 text-[12px] text-gray-700 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 bg-white shadow-sm transition-all"
            />
            {companySearch && (
              <button onClick={() => { setCompanySearch(''); setCurrentPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Total Clicks */}
          <div className="bg-violet-50 border border-violet-100 rounded-lg px-3 py-1.5 flex items-center gap-1.5 shrink-0 shadow-sm text-[12px] font-bold text-violet-700">
            <MousePointerClick size={14} className="text-violet-600" />
            <span>Total Click {totalClicks}</span>
          </div>

          {activeTab === 'approved' && (
            <button
              onClick={() => {
                if (!showAddForm) {
                  setAiText('');
                  setAiSuccess(false);
                  setDrafts([createBlankDraft()]);
                } else {
                  setDrafts([]);
                }
                setShowAddForm(!showAddForm);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              {showAddForm ? 'Cancel' : 'Add New'}
            </button>
          )}

          {activeTab === 'companies' && (
            <button
              onClick={handleExportCompanies}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Export to Excel
            </button>
          )}
        </div>
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

          <div className="space-y-6 mt-4">
            {drafts.map((draft, idx) => (
              <form 
                key={draft.id} 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  if (drafts.length === 1) {
                    handleSubmitDraft(draft.id); 
                  }
                }} 
                className="p-5 rounded-xl border border-gray-100 bg-gray-50/30 relative space-y-4 shadow-sm"
              >
                {/* Draft header / Indicator */}
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                      Position #{idx + 1}
                    </span>
                    {draft.isDuplicate && (
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-red-50 text-red-600 border border-red-100 rounded flex items-center gap-1 animate-pulse" title={draft.aiDuplicateNote || draft.duplicateReason || ''}>
                        Already listed
                        {draft.matchedJob?.title ? ` — ${draft.matchedJob.title}${draft.matchedJob.company ? ` @ ${draft.matchedJob.company}` : ''}` : ''}
                      </span>
                    )}
                  </div>
                  {drafts.length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDraft(draft.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove position"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="url"
                    required
                    placeholder="Job URL (e.g. https://linkedin.com/jobs/...)"
                    value={draft.url}
                    onChange={e => handleDraftChange(draft.id, 'url', e.target.value)}
                    className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Briefcase size={16} className="absolute left-3 top-3 text-gray-400" />
                      <select
                        required
                        value={draft.title}
                        onChange={e => handleDraftChange(draft.id, 'title', e.target.value)}
                        className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent text-gray-700 bg-white"
                      >
                        <option value="" disabled>Select Designation</option>
                        {draft.title && !DESIGNATION_OPTIONS.includes(draft.title) && !customDesignations.includes(draft.title) && (
                          <option value={draft.title}>{draft.title}</option>
                        )}
                        {[...DESIGNATION_OPTIONS, ...customDesignations].map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const added = handleAddDesignation();
                        if (added) handleDraftChange(draft.id, 'title', added);
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
                      value={draft.workMode}
                      onChange={e => handleDraftChange(draft.id, 'workMode', e.target.value)}
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
                      placeholder="Location (e.g. Noida, Uttar Pradesh) - Optional"
                      value={draft.location}
                      onChange={e => handleDraftChange(draft.id, 'location', e.target.value)}
                      className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Building size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Company Name - Optional"
                      value={draft.company}
                      onChange={e => handleDraftChange(draft.id, 'company', e.target.value)}
                      className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Posted Date (e.g. 2 days ago) - Optional"
                      value={draft.postedDate}
                      onChange={e => handleDraftChange(draft.id, 'postedDate', e.target.value)}
                      className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                    />
                  </div>
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Experience (e.g. 2-5 Yrs) - Optional"
                      value={draft.experience}
                      onChange={e => handleDraftChange(draft.id, 'experience', e.target.value)}
                      className="w-full pl-9 p-2.5 text-sm border border-border rounded-lg focus:outline-none focus:border-accent bg-white"
                    />
                  </div>
                </div>
                
                {drafts.length === 1 && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={draft.submitting}
                      className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg font-medium text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                    >
                      {draft.submitting ? 'Adding...' : (
                        <>
                          <Check size={16} /> Add to Timeline
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            ))}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={handleAddDraft}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 text-xs font-semibold rounded-lg transition-colors bg-white shadow-sm"
              >
                <Plus size={14} /> Add Another Position Form
              </button>

              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={handleSubmitAllDrafts}
                  disabled={submittingAll}
                  className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {submittingAll ? 'Adding All Positions...' : (
                    <>
                      <Check size={16} /> Add All Positions to Timeline
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      <div className="space-y-4">
        {activeTab === 'companies' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {filteredCompanies.length === 0 ? (
              <div className="p-8 text-center text-muted">No companies found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[13px] text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3 font-medium">Company Name</th>
                      <th className="px-5 py-3 font-medium">Extracted Emails</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedList.map(company => (
                      <tr key={company._id} className="hover:bg-gray-50/50 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 group">
                            <Building size={16} className="text-gray-400" />
                            <span className="font-semibold text-gray-800 text-[14px]">{company.name}</span>
                            <button
                              onClick={() => handleCopy(company.name)}
                              className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Copy company name"
                            >
                              <Copy size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {company.emails && company.emails.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {company.emails.map((email, idx) => (
                                <div key={idx} className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 rounded-md text-[13px] font-medium border border-violet-100 group">
                                  <a href={`mailto:${email}`} className="hover:underline">
                                    {email}
                                  </a>
                                  <button
                                    onClick={() => handleCopy(email)}
                                    className="text-violet-400 hover:text-violet-700 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                    title="Copy email"
                                  >
                                    <Copy size={13} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-[13px]">No emails found</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab !== 'companies' && activeTab === 'pending' && pendingLinks.length === 0 && (
          <div className="p-8 text-center text-muted bg-white rounded-xl shadow-sm border border-border">No pending job links.</div>
        )}
        {activeTab === 'approved' && approvedLinks.length === 0 && (
          <div className="p-8 text-center text-muted bg-white rounded-xl shadow-sm border border-border">No approved job links.</div>
        )}

        {activeTab !== 'companies' && paginatedList.map(link => {
          const isEditing = editingLinkId === link._id || activeTab === 'pending';
          const isUrlDuplicate = activeTab === 'pending' && jobLinks.some(
            (other) =>
              other._id !== link._id &&
              other.status === 'approved' &&
              (other.url || '').trim() === (link.url || '').trim()
          );
          const aiDuplicate = activeTab === 'pending' && editForms[link._id]?.isDuplicate;
          const duplicateInfo = editForms[link._id];
          
          return (
            <div key={link._id} className={`bg-white rounded-xl shadow-sm border p-4 sm:p-5 flex flex-row gap-4 transition hover:shadow-md mb-2 ${aiDuplicate || isUrlDuplicate ? 'border-amber-300' : 'border-gray-100'}`}>
              
              {/* Left Column for Content */}
              <div className="flex flex-col gap-4 flex-1 min-w-0">
                
                {/* Header Row: Single Line Row */}
                <div className="flex flex-row items-center gap-3 sm:gap-4 w-full overflow-hidden">
                  
                  {/* 3. Link Badges */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {(isUrlDuplicate || aiDuplicate) && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide shrink-0" title="Same URL or AI match — prefer Allow Access">
                        {aiDuplicate ? 'AI: Duplicate' : 'Duplicate URL'}
                      </span>
                    )}
                  </div>
                </div>



                {/* Form Content Area */}
                <div className="w-full mt-1">
                  {/* Form for adding details if Pending or Editing */}
                  {isEditing ? (
                    <>
                      {/* Form Container */}
                      <div className="flex flex-col gap-3">
                        {/* AI Extract Panel */}
                        <div className="flex items-center gap-3 bg-[#f8f6fe] border border-[#e4dcf9] rounded-xl p-2.5">
                          <div className="shrink-0 pl-1">
                            <Sparkles size={16} className="text-violet-500" />
                          </div>
                          <textarea
                            rows={1}
                            value={aiTextMap[link._id] || ''}
                            onChange={e => setAiTextMap(prev => ({ ...prev, [link._id]: e.target.value }))}
                            placeholder="Paste job description content here to auto-fill fields…"
                            className="flex-1 bg-transparent text-[13px] text-gray-700 border-0 p-0 focus:ring-0 outline-none resize-none placeholder-gray-500 min-h-[20px] overflow-hidden leading-tight"
                          />
                          <button
                            type="button"
                            onClick={() => handleAIExtractForLink(link._id)}
                            disabled={aiLoadingMap[link._id] || !aiTextMap[link._id]?.trim()}
                            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-[12px] font-medium rounded-lg transition shrink-0"
                          >
                            <Sparkles size={14} className={aiLoadingMap[link._id] ? 'animate-pulse' : ''} />
                            {aiLoadingMap[link._id] ? 'Extracting…' : 'Auto-fill'}
                          </button>
                        </div>

                        {(aiDuplicate || isUrlDuplicate) && (
                          <div className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[12px] text-amber-900">
                            <div className="font-semibold">
                              {aiDuplicate ? 'AI flagged this as an already listed job post' : 'Duplicate URL — already listed'}
                            </div>
                            <div className="text-amber-800/90">
                              {duplicateInfo?.matchedJob
                                ? `Matches: ${duplicateInfo.matchedJob.title || 'Job'}${duplicateInfo.matchedJob.company ? ` @ ${duplicateInfo.matchedJob.company}` : ''}. Use Allow Access to unlock the user without listing again.`
                                : duplicateInfo?.aiDuplicateNote
                                  || 'Use Allow Access to unlock the contributor without listing this link again.'}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Designation */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <Briefcase size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Designation</label>
                              <select
                                value={editForms[link._id]?.title !== undefined ? editForms[link._id].title : link.title}
                                onChange={(e) => handleFormChange(link._id, 'title', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none cursor-pointer placeholder-gray-400 appearance-none"
                              >
                                <option value="" disabled>Select designation</option>
                                {(() => {
                                  const currentTitle = editForms[link._id]?.title !== undefined ? editForms[link._id].title : link.title;
                                  const allOpts = [...DESIGNATION_OPTIONS, ...customDesignations];
                                  return currentTitle && !allOpts.includes(currentTitle) ? (
                                    <option value={currentTitle}>{currentTitle}</option>
                                  ) : null;
                                })()}
                                {[...DESIGNATION_OPTIONS, ...customDesignations].map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 pointer-events-none mt-2" />
                          </div>

                          {/* Work Mode */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <Laptop size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Work Mode</label>
                              <select
                                value={editForms[link._id]?.workMode !== undefined ? editForms[link._id].workMode : (link.workMode || '')}
                                onChange={(e) => handleFormChange(link._id, 'workMode', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none cursor-pointer appearance-none"
                              >
                                <option value="" disabled>Select work mode</option>
                                <option value="Remote">Remote</option>
                                <option value="Onsite">Onsite</option>
                                <option value="Hybrid">Hybrid</option>
                              </select>
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 pointer-events-none mt-2" />
                          </div>

                          {/* Location */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <MapPin size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Location</label>
                              <input
                                type="text"
                                placeholder="e.g. Bangalore, India"
                                value={editForms[link._id]?.location !== undefined ? editForms[link._id].location : link.location}
                                onChange={(e) => handleFormChange(link._id, 'location', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none placeholder-gray-500"
                              />
                            </div>
                          </div>

                          {/* Company Name */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <Building size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Company Name <span className="font-normal text-gray-400">(Optional)</span></label>
                              <input
                                type="text"
                                placeholder="Enter company name"
                                value={editForms[link._id]?.company !== undefined ? editForms[link._id].company : link.company}
                                onChange={(e) => handleFormChange(link._id, 'company', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none placeholder-gray-500"
                              />
                            </div>
                          </div>

                          {/* Posted Date */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <Calendar size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Posted Date <span className="font-normal text-gray-400">(Optional)</span></label>
                              <input
                                type="text"
                                placeholder="Select date"
                                value={editForms[link._id]?.postedDate !== undefined ? editForms[link._id].postedDate : link.postedDate}
                                onChange={(e) => handleFormChange(link._id, 'postedDate', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none placeholder-gray-500"
                              />
                            </div>
                            <Calendar size={14} className="text-gray-400 shrink-0 pointer-events-none mt-2" />
                          </div>

                          {/* Experience */}
                          <div className="relative border border-gray-100 rounded-xl p-3 flex items-start gap-3 bg-white focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400 transition-colors shadow-xs">
                            <Clock size={16} className="text-violet-600 shrink-0 mt-0.5" />
                            <div className="flex flex-col flex-1 min-w-0">
                              <label className="text-[11px] font-semibold text-gray-800 mb-0.5">Experience <span className="font-normal text-gray-400">(Optional)</span></label>
                              <input
                                type="text"
                                placeholder="e.g. 2-5 Yrs"
                                value={editForms[link._id]?.experience !== undefined ? editForms[link._id].experience : link.experience}
                                onChange={(e) => handleFormChange(link._id, 'experience', e.target.value)}
                                className="w-full bg-transparent border-0 p-0 text-[13px] text-gray-600 focus:ring-0 outline-none placeholder-gray-500"
                              />
                            </div>
                            <ChevronDown size={14} className="text-gray-400 shrink-0 pointer-events-none mt-2" />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-gray-500 font-medium bg-[#f4f6fa] p-3.5 rounded-lg border border-gray-100/50">
                      {link.title && <div className="flex items-center gap-2 text-gray-800 font-semibold"><Briefcase size={15} className="text-gray-400"/>{link.title}</div>}
                      {link.company && <div className="flex items-center gap-2"><Building size={15} className="text-gray-400"/>{link.company}</div>}
                      {link.workMode && <div className="flex items-center gap-2"><Laptop size={15} className="text-gray-400"/>{link.workMode}</div>}
                      {link.location && <div className="flex items-center gap-2"><MapPin size={15} className="text-gray-400"/>{link.location}</div>}
                      {link.experience && <div className="flex items-center gap-2"><Clock size={15} className="text-gray-400"/>{link.experience}</div>}
                      {link.postedDate && <div className="flex items-center gap-2"><Calendar size={15} className="text-gray-400"/>{link.postedDate}</div>}
                    </div>
                  )}

                  {activeTab === 'approved' && !isEditing && (
                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center bg-gray-50/80 p-2 rounded border border-gray-100 text-[11px] text-gray-500">
                        {feedbackData.filter(f => f.jobLink?._id === link._id).length > 0 ? (
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="font-semibold text-gray-600">Applicant Feedback (Heard back?):</span>
                            {feedbackData.filter(f => f.jobLink?._id === link._id).map(f => (
                              <span key={f._id} className={`px-1.5 py-0.5 rounded-sm border ${f.heardBack ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                {f.user?.name || 'Unknown'}: {f.heardBack ? 'Yes' : 'No'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="italic text-gray-400">No applicant feedback yet.</span>
                        )}
                        
                        <button
                          onClick={() => setExpandedClicks(prev => ({ ...prev, [link._id]: !prev[link._id] }))}
                          className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors"
                        >
                          <span>Tracked Clicks ({link.clicks?.length || 0})</span>
                          <ChevronDown size={14} className={`transform transition-transform ${expandedClicks[link._id] ? 'rotate-180' : ''}`} />
                        </button>
                      </div>

                      {expandedClicks[link._id] && (
                        <div className="bg-violet-50/50 border border-violet-100 rounded-lg p-3 text-[12px]">
                          {link.clicks && link.clicks.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {link.clicks.map(u => (
                                <span key={u._id} className="bg-white border border-violet-200 text-gray-700 px-2 py-1 rounded-md shadow-xs">
                                  {u.name} ({u.email})
                                </span>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-400 italic">No users have clicked "Apply Now" yet.</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
              </div>

              {/* Right Column for Actions */}
              <div className="flex flex-col justify-center items-stretch gap-2 shrink-0">
                <a href={editForms[link._id]?.url !== undefined ? editForms[link._id].url : link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-[12px] font-semibold transition shadow-sm w-full" title="Open Job Link">
                  <ExternalLink size={14} className="text-gray-400" /> Open Link
                </a>
                {activeTab === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdate(link._id, 'approved')}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white rounded-lg text-[12px] font-bold transition shadow-sm"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => { setLinkToReject(link); setRejectModalOpen(true); }}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[12px] font-bold transition shadow-sm"
                    >
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                
                {activeTab === 'approved' && !isEditing && (
                  <button
                    onClick={() => startEditing(link)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg text-[12px] font-bold transition shadow-sm"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                )}

                {activeTab === 'approved' && isEditing && (
                  <>
                    <button
                      onClick={() => handleUpdate(link._id, 'approved')}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white rounded-lg text-[12px] font-bold transition shadow-sm"
                    >
                      <Save size={14} /> Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-lg text-[12px] font-bold transition shadow-sm"
                    >
                      <X size={14} /> Cancel
                    </button>
                  </>
                )}

                {activeTab === 'approved' && !isEditing && (
                  <button
                    onClick={() => { setLinkToReject(link); setRejectModalOpen(true); }}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg text-[12px] font-bold transition shadow-sm"
                  >
                    <X size={14} /> Remove
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === 1}
            className="px-3.5 py-2 rounded-xl border border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => {
            const p = idx + 1;
            return (
              <button
                key={p}
                onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className={`w-10 h-10 rounded-xl border text-sm font-semibold transition-all ${
                  currentPage === p
                    ? 'bg-accent border-accent text-white shadow-sm'
                    : 'border-border bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            disabled={currentPage === totalPages}
            className="px-3.5 py-2 rounded-xl border border-border bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-800">Reject Job Link</h3>
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="e.g. This link is no longer active, or not relevant..."
                className="w-full border border-gray-200 rounded-lg p-3 text-[13px] focus:outline-none focus:border-red-400 min-h-[100px] resize-y"
              />
            </div>
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="px-4 py-2 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {rejecting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
