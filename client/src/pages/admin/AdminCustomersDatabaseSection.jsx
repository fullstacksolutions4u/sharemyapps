import { useState, useEffect } from 'react';
import { Database, Search, Download, ExternalLink, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminCustomersDatabaseSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?paginated=false&limit=10000');
      if (Array.isArray(res.data)) {
        setUsers(res.data);
      } else if (res.data && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load customers database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q)) ||
      (u.state && u.state.toLowerCase().includes(q))
    );
  });


  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'State', 'Designations', 'Resume URL'];
    const rows = filteredUsers.map(u => [
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.state || ''}"`,
      `"${u.designations ? u.designations.join(', ') : ''}"`,
      `"${u.cvUrl || ''}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers_database.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-2">
            <Database className="text-[#00A693]" size={24} />
            Customers Database
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">View and manage all customer details</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E1DA] rounded-xl text-sm font-medium text-[#1A1A1A] hover:bg-[#F9F8F6] transition-colors shadow-sm"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#00A693] text-white rounded-xl text-sm font-medium hover:bg-[#007D6F] transition-colors shadow-sm"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="p-4 border-b border-[#E5E1DA] flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={18} />
            <input
              type="text"
              placeholder="Search by name, email, phone or state..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F9F8F6] border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00A693]/20 focus:border-[#00A693] transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#F9F8F6] border-b border-[#E5E1DA] text-[#6B7280]">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Phone</th>
                <th className="px-6 py-4 font-semibold">State</th>
                <th className="px-6 py-4 font-semibold">Designation</th>
                <th className="px-6 py-4 font-semibold">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E1DA]">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#6B7280]">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="animate-spin text-[#00A693]" size={24} />
                      <p>Loading database...</p>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-[#6B7280]">
                    No customers found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-[#F9F8F6] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#1A1A1A]">{user.name || '-'}</div>
                      <div className="text-xs text-[#9CA3AF] capitalize">{user.userType || 'User'}</div>
                    </td>
                    <td className="px-6 py-4 text-[#6B7280]">{user.email || '-'}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{user.phone || '-'}</td>
                    <td className="px-6 py-4 text-[#6B7280]">{user.state || '-'}</td>
                    <td className="px-6 py-4 text-[#6B7280]">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.designations && user.designations.length > 0
                          ? user.designations.map((d, i) => (
                              <span key={i} className="inline-block px-2 py-0.5 bg-[#E6F7F5] text-[#00A693] text-[11px] rounded border border-[#00A693]/20 truncate max-w-full">
                                {d}
                              </span>
                            ))
                          : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.cvUrl ? (
                        <a
                          href={user.cvUrl.startsWith('http') ? user.cvUrl : `https://${user.cvUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#00A693] hover:underline font-medium text-xs bg-[#00A693]/10 px-3 py-1.5 rounded-lg"
                        >
                          View Resume <ExternalLink size={12} />
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF] text-xs italic">No Resume</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!loading && filteredUsers.length > 0 && (
          <div className="p-4 border-t border-[#E5E1DA] bg-[#F9F8F6] text-sm text-[#6B7280] flex justify-between items-center">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-[#E5E1DA] bg-white text-[#1A1A1A] hover:bg-[#F3F0EB] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-[#E5E1DA] bg-white text-[#1A1A1A] hover:bg-[#F3F0EB] disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
