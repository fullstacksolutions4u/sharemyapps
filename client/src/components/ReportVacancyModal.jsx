import { useState } from 'react';
import { X, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ReportVacancyModal({ isOpen, onClose, user }) {
  const exp = user?.resumeData?.experience || user?.resumeData?.workExperience || [];
  const companies = [...new Set(exp.map(e => e.company).filter(Boolean))];

  const [activeTab, setActiveTab] = useState('my-companies');

  const [formData, setFormData] = useState({
    company: companies.length > 0 ? companies[0] : '',
    customCompany: '',
    title: '',
    salaryRange: '',
    type: 'remote',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  
  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    setFormData({
      company: companies.length > 0 ? companies[0] : '',
      customCompany: '',
      title: '',
      salaryRange: '',
      type: 'remote',
      description: ''
    });
    setActiveTab('my-companies');
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCompany = activeTab === 'my-companies' ? formData.company : formData.customCompany;
    
    if (activeTab === 'my-companies' && companies.length === 0) return toast.error('No previous companies found');
    if (!finalCompany?.trim()) return toast.error('Please specify a company');
    if (!formData.title?.trim()) return toast.error('Please specify a designation');
    if (!formData.description?.trim()) return toast.error('Please provide a job description');

    setLoading(true);
    try {
      await api.post('/vacancies/report', {
        company: finalCompany.trim(),
        title: formData.title.trim(),
        salaryRange: formData.salaryRange.trim(),
        type: formData.type,
        description: formData.description.trim()
      });
      toast.success('Vacancy reported successfully! Admin will review it shortly.');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to report vacancy');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>

        <div className="p-6 sm:p-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'my-companies'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('my-companies')}
            >
              My Companies
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm font-semibold text-center border-b-2 transition-colors ${
                activeTab === 'other-companies'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('other-companies')}
            >
              Other Companies
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'my-companies' ? (
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">Select Company <span className="text-red-500">*</span></label>
                {companies.length > 0 ? (
                  <select
                    value={formData.company}
                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
                  >
                    {companies.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 text-gray-500 text-sm">
                    No previous companies found. Please use the "Other Companies" tab.
                  </div>
                )}
              </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-semibold text-text mb-1.5">Company Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Google, Meta"
                  value={formData.customCompany}
                  onChange={e => setFormData({ ...formData, customCompany: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Designation <span className="text-red-500">*</span></label>
              <input
                type="text"
                placeholder="e.g. Senior Frontend Developer"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">Salary Range</label>
                <input
                  type="text"
                  placeholder="e.g. 15 LPA - 20 LPA"
                  value={formData.salaryRange}
                  onChange={e => setFormData({ ...formData, salaryRange: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-text mb-1.5">Work Mode</label>
                <select
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
                >
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Job Description <span className="text-red-500">*</span></label>
              <textarea
                placeholder="Paste the job description, requirements, and responsibilities here..."
                rows={4}
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm resize-none custom-scrollbar"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} /> Report Vacancy
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
