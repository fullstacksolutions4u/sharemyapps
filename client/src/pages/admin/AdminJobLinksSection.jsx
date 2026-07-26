import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { Briefcase, Check, X, ExternalLink, Link as LinkIcon, MapPin, Laptop, Edit2, Plus, Save, Clock } from 'lucide-react';
import { optimizeImage } from '../../utils/image';

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
    workMode: '',
    location: '',
    experience: ''
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

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
        const workMode = editForms[id]?.workMode !== undefined ? editForms[id].workMode : link.workMode;
        const location = editForms[id]?.location !== undefined ? editForms[id].location : link.location;
        const experience = editForms[id]?.experience !== undefined ? editForms[id].experience : link.experience;
        const url = editForms[id]?.url !== undefined ? editForms[id].url : link.url;
        
        if (!title || !workMode || !location || !url) {
          toast.error('URL, Designation, Work Mode, and Location are required!');
          return;
        }
        updates.title = title;
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
    if (!newLinkForm.url || !newLinkForm.title || !newLinkForm.workMode || !newLinkForm.location) {
      toast.error('All fields are required');
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
                  required
                  placeholder="Location (e.g. Bangalore, India)"
                  value={newLinkForm.location}
                  onChange={e => setNewLinkForm(prev => ({...prev, location: e.target.value}))}
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

      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {activeTab === 'pending' && pendingLinks.length === 0 && (
            <div className="p-8 text-center text-muted">No pending job links.</div>
          )}
          {activeTab === 'approved' && approvedLinks.length === 0 && (
            <div className="p-8 text-center text-muted">No approved job links.</div>
          )}

          {(activeTab === 'pending' ? pendingLinks : approvedLinks).map(link => {
            const isEditing = editingLinkId === link._id || activeTab === 'pending';
            
            return (
              <div key={link._id} className="p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-start md:items-center hover:bg-gray-50/50 transition">
                
                {/* User Info & URL */}
                <div className="flex-1 w-full min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
                    <div className="flex items-center gap-2 shrink-0">
                      <img 
                        src={optimizeImage(link.createdBy?.profileImage || link.createdBy?.avatar, 150) || `https://ui-avatars.com/api/?name=${link.createdBy?.name || 'Admin'}`} 
                        alt="" 
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{link.createdBy?.name || 'Admin'}</span>
                    </div>
                    
                    {isEditing ? (
                      <div className="flex-1 relative min-w-0">
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
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1 break-all flex-1 min-w-0 line-clamp-1">
                        {link.url} <ExternalLink size={12} className="shrink-0" />
                      </a>
                    )}

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 self-start sm:self-auto
                      ${link.status === 'approved' ? 'bg-green-100 text-green-700' : 
                        link.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                        'bg-yellow-100 text-yellow-700'}`}
                    >
                      {link.status}
                    </span>
                  </div>

                  {/* Form for adding details if Pending or Editing */}
                  {isEditing ? (
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
                          placeholder="Location (e.g. Bangalore, India)"
                          value={editForms[link._id]?.location !== undefined ? editForms[link._id].location : link.location}
                          onChange={(e) => handleFormChange(link._id, 'location', e.target.value)}
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
                  ) : (
                    <div className="flex flex-wrap items-center gap-3 text-sm mt-2 text-gray-600 bg-gray-50 p-2 rounded-lg border border-black/5">
                      {link.title && <div className="flex items-center gap-1 font-semibold text-gray-900"><Briefcase size={14}/>{link.title}</div>}
                      {link.workMode && <div className="flex items-center gap-1"><Laptop size={14}/>{link.workMode}</div>}
                      {link.location && <div className="flex items-center gap-1"><MapPin size={14}/>{link.location}</div>}
                      {link.experience && <div className="flex items-center gap-1"><Clock size={14}/>{link.experience}</div>}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto shrink-0 mt-3 md:mt-0 pt-3 md:pt-0 border-t md:border-0 border-border self-end">
                  {activeTab === 'pending' && (
                    <button
                      onClick={() => handleUpdate(link._id, 'approved')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition"
                    >
                      <Check size={16} /> Approve
                    </button>
                  )}
                  
                  {activeTab === 'approved' && !isEditing && (
                    <button
                      onClick={() => startEditing(link)}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                  )}

                  {activeTab === 'approved' && isEditing && (
                    <>
                      <button
                        onClick={() => handleUpdate(link._id, 'approved')}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-sm font-medium transition"
                      >
                        <Save size={16} /> Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                      >
                        <X size={16} /> Cancel
                      </button>
                    </>
                  )}

                  {(!isEditing || activeTab === 'pending') && (
                    <button
                      onClick={() => handleUpdate(link._id, 'rejected')}
                      className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition"
                    >
                      <X size={16} /> {activeTab === 'pending' ? 'Reject' : 'Remove'}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
