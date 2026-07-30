import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/image';
import { Trash2 } from 'lucide-react';

const STATUS_STYLE = {
  'Sent':                 'bg-blue-50 text-blue-700 border-blue-200',
  'Send Failed':          'bg-red-50 text-red-600 border-red-200',
  'Response Mail':        'bg-amber-50 text-amber-700 border-amber-200',
  'Interview Call':       'bg-purple-50 text-purple-700 border-purple-200',
  'Interview Scheduled':  'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function AdminApplicantStatusesSection() {
  const [loading, setLoading] = useState(true);
  const [statuses, setStatuses] = useState([]);

  const loadStatuses = () => {
    setLoading(true);
    api.get('/admin/job-alerts/applicant-statuses')
      .then(res => setStatuses(res.data.statuses || []))
      .catch(err => {
        console.error(err);
        toast.error('Failed to load applicant statuses');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this status entry?')) return;
    try {
      await api.delete(`/admin/job-alerts/applicant-statuses/${id}`);
      setStatuses(prev => prev.filter(s => s._id !== id));
      toast.success('Removed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove status entry');
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-sm text-muted">Loading statuses...</div>;
  }

  if (statuses.length === 0) {
    return <div className="text-center py-10 text-sm text-muted">No applicant statuses have been saved yet.</div>;
  }

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6">
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#E5E1DA] text-sm text-muted">
              <th className="pb-3 font-semibold px-4">Applicant</th>
              <th className="pb-3 font-semibold px-4">Company</th>
              <th className="pb-3 font-semibold px-4">Email</th>
              <th className="pb-3 font-semibold px-4">Status</th>
              <th className="pb-3 font-semibold px-4">Comment</th>
              <th className="pb-3 font-semibold px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {statuses.map(s => (
              <tr key={s._id} className="border-b border-[#E5E1DA] last:border-none hover:bg-gray-50/50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    {s.user?.avatar ? (
                      <img src={optimizeImage(s.user.avatar, 100)} alt="" className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#E5E1DA] flex items-center justify-center font-bold text-gray-500 text-xs">
                        {s.user?.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-text">{s.user?.name}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4 font-medium text-text">{s.companyName}</td>
                <td className="py-4 px-4 text-muted select-all">{s.emailId || <span className="italic text-gray-400">—</span>}</td>
                <td className="py-4 px-4">
                  <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded border ${STATUS_STYLE[s.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {s.status}
                  </span>
                </td>
                <td className="py-4 px-4 text-muted max-w-[200px] truncate" title={s.comment}>
                  {s.comment || <span className="italic text-gray-400">None</span>}
                </td>
                <td className="py-4 px-4 text-center">
                  <button
                    onClick={() => handleRemove(s._id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                    title="Remove status entry"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
