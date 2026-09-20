import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function AdminDubaiEnquiriesSection() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEnquiries = async () => {
    try {
      const res = await api.get('/admin/dubai-enquiries');
      setEnquiries(res.data.enquiries);
    } catch (_err) {
      toast.error('Failed to load Dubai enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const res = await api.patch(`/admin/dubai-enquiries/${id}/status`, { status });
      setEnquiries(prev => prev.map(e => e._id === id ? res.data.enquiry : e));
      toast.success('Status updated');
    } catch (_err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading enquiries...</div>;
  }

  if (enquiries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E1DA] p-8 text-center shadow-sm mt-6">
        <p className="text-gray-500">No Dubai Job Hunting Package enquiries found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {enquiries.map(enquiry => (
        <div key={enquiry._id} className="bg-white p-5 rounded-xl border border-[#E5E1DA] shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900">{enquiry.name}</h3>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-sm text-gray-500">{format(new Date(enquiry.createdAt), 'MMM d, yyyy h:mm a')}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p className="text-gray-600">Email: <span className="font-medium text-gray-800">{enquiry.email}</span></p>
              <p className="text-gray-600">Phone: <span className="font-medium text-gray-800">{enquiry.phone}</span></p>
            </div>
            
            <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">Message:</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap">{enquiry.message || <span className="italic text-gray-400">No message provided</span>}</p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              enquiry.status === 'pending' ? 'bg-amber-100 text-amber-700' :
              enquiry.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
              'bg-green-100 text-green-700'
            }`}>
              {enquiry.status}
            </span>
            
            <select
              value={enquiry.status}
              onChange={(e) => updateStatus(enquiry._id, e.target.value)}
              className="mt-2 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-400 bg-white"
            >
              <option value="pending">Mark Pending</option>
              <option value="contacted">Mark Contacted</option>
              <option value="closed">Mark Closed</option>
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
