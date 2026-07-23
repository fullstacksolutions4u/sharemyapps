import { useState, useEffect } from 'react';
import { X, Gift, Send } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function ReportVacancyModal({ isOpen, onClose, user }) {
  const exp = user?.resumeData?.experience || user?.resumeData?.workExperience || [];
  const companies = [...new Set(exp.map(e => e.company).filter(Boolean))];

  const [formData, setFormData] = useState({
    company: companies.length > 0 ? companies[0] : 'custom',
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
      company: companies.length > 0 ? companies[0] : 'custom',
      customCompany: '',
      title: '',
      salaryRange: '',
      type: 'remote',
      description: ''
    });
  } else if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCompany = formData.company === 'custom' ? formData.customCompany : formData.company;
    
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
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 p-4 rounded-xl mb-6 flex gap-3 items-start shadow-sm">
            <div className="bg-amber-100 text-amber-600 p-1.5 rounded-lg shrink-0 mt-0.5">
              <Gift size={16} />
            </div>
            <p className="text-sm text-amber-900 leading-snug">
              <span className="font-semibold block mb-0.5">Bonus Reward!</span>
              If you share a vacancy in your company and it gets verified, you'll get our <span className="font-semibold">Premium Placement Support Services</span> completely FREE! 🎉
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-text mb-1.5">Select Company <span className="text-red-500">*</span></label>
              <select
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-gray-50 focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-hidden text-sm"
              >
                {companies.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="custom">Other Company...</option>
              </select>
            </div>

            {formData.company === 'custom' && (
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
                    <Send size={18} /> Submit Report
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
