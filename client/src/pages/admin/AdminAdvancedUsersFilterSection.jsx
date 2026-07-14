import { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Users, Mail, Phone, Briefcase, MapPin, ExternalLink,
  ChevronLeft, ChevronRight, Copy
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const inp = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';
const sel = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition appearance-none';

const normalizeCompany = (name) => {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (lower.includes('brototype')) return 'Brototype';
  if (lower.includes('bridgeon')) return 'Bridgeon';
  return name.trim();
};

const CompanyList = ({ experience }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!experience || experience.length === 0 || !experience[0]?.company) {
    return <span className="text-[#D1D5DB]">-</span>;
  }
  
  const validCompanies = experience.map(e => normalizeCompany(e.company)).filter(Boolean);
  if (validCompanies.length === 0) return <span className="text-[#D1D5DB]">-</span>;
  
  const first = validCompanies[0];
  const rest = validCompanies.slice(1, 3); // show up to 2 more
  
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };
  
  return (
    <div className="flex flex-col gap-1.5 align-top">
      <div className="flex items-center gap-1.5 group w-fit">
        <div className="truncate max-w-[130px] font-medium" title={first}>{first}</div>
        <button 
          onClick={() => copyToClipboard(first)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[#F3F0EB] rounded text-[#9CA3AF] hover:text-[#1A1A1A]"
          title="Copy company name"
        >
          <Copy size={12} />
        </button>
      </div>
      {rest.length > 0 && (
        expanded ? (
          rest.map((comp, idx) => (
            <div key={idx} className="flex items-center gap-1.5 group w-fit text-[#9CA3AF]">
              <div className="truncate max-w-[130px]" title={comp}>{comp}</div>
              <button 
                onClick={() => copyToClipboard(comp)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-[#F3F0EB] rounded text-[#9CA3AF] hover:text-[#1A1A1A]"
                title="Copy company name"
              >
                <Copy size={12} />
              </button>
            </div>
          ))
        ) : (
          <button 
            onClick={() => setExpanded(true)}
            className="text-[10px] text-[#00A693] hover:underline text-left w-fit font-medium"
          >
            +{rest.length} more
          </button>
        )
      )}
    </div>
  );
};

export default function AdminAdvancedUsersFilterSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [designation, setDesignation] = useState('');
  const [company, setCompany] = useState('');

  const [selectedUsers, setSelectedUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('adminAdvancedSelectedUsers');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem('adminAdvancedSelectedUsers', JSON.stringify(Array.from(selectedUsers)));
  }, [selectedUsers]);

  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const toggleAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(new Set(filteredUsers.map(u => u._id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const uniqueCompanies = useMemo(() => {
    const comps = new Set();
    users.forEach(u => {
      if (u.resumeData?.experience && Array.isArray(u.resumeData.experience)) {
        u.resumeData.experience.forEach(exp => {
          if (exp.company) comps.add(normalizeCompany(exp.company));
        });
      }
    });
    return Array.from(comps).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [users]);

  const uniqueDesignations = useMemo(() => {
    const desigs = new Set();
    users.forEach(u => {
      const d = u.designations?.[0] || u.resumeData?.experience?.[0]?.role;
      if (d) {
        desigs.add(d.trim());
      }
    });
    return Array.from(desigs).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [users]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (u.isDeleted) return false;

      // 1. Text Search
      if (search) {
        const q = search.toLowerCase();
        const matchName = u.name?.toLowerCase().includes(q);
        const matchEmail = u.email?.toLowerCase().includes(q);
        const matchPhone = u.phone?.includes(q);
        const matchReg = u.regNumber?.toString().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchReg) return false;
      }

      // 2. Designation
      if (designation) {
        const d = u.designations?.[0] || u.resumeData?.experience?.[0]?.role;
        if (!d || d.trim() !== designation) return false;
      }

      // 3. Company
      if (company) {
        if (!u.resumeData?.experience || !Array.isArray(u.resumeData.experience)) return false;
        const hasCompany = u.resumeData.experience.some(exp => normalizeCompany(exp.company) === company);
        if (!hasCompany) return false;
      }

      return true;
    });
  }, [users, search, designation, company]);

  useEffect(() => {
    setPage(1);
  }, [search, designation, company]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setDesignation('');
    setCompany('');
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center bg-[#FDFCFB]">
        <div className="w-6 h-6 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#FDFCFB] overflow-hidden">


      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Filters */}
        <div className="shrink-0 bg-white border-b border-[#E5E1DA] p-4 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 flex-1">
            
            <div>
              <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Search</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2 text-[#9CA3AF]" size={14} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Name, email, reg..."
                  className={`${inp} pl-8 py-1.5 text-[13px] h-8`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Company</label>
              <select value={company} onChange={e => setCompany(e.target.value)} className={`${sel} py-1.5 text-[13px] h-8`}>
                <option value="">All Companies</option>
                {uniqueCompanies.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider mb-1.5">Designation</label>
              <select value={designation} onChange={e => setDesignation(e.target.value)} className={`${sel} py-1.5 text-[13px] h-8`}>
                <option value="">All Designations</option>
                {uniqueDesignations.map((d, i) => (
                  <option key={i} value={d}>{d}</option>
                ))}
              </select>
            </div>

          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-[12px] font-medium text-[#00A693] bg-[#E6F6F4] px-2.5 py-1.5 rounded-full">
              {filteredUsers.length} Users Found
            </div>
            <button 
              onClick={resetFilters}
              className="text-[12px] font-medium text-[#6B7280] hover:text-[#1A1A1A] transition px-3 py-1.5 border border-[#E5E1DA] rounded-lg h-8 flex items-center justify-center"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#FDFCFB]">
          <div className="flex-1 overflow-auto p-6">
            {filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#9CA3AF]">
                <Filter size={48} className="mb-4 opacity-20" />
                <p>No users match your filters.</p>
              </div>
            ) : (
              <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#FDFCFB] border-b border-[#E5E1DA] text-[#6B7280] font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 w-12">
                        <input 
                          type="checkbox" 
                          checked={selectedUsers.size > 0 && selectedUsers.size === filteredUsers.length}
                          onChange={toggleAll}
                          className="rounded border-[#E5E1DA] text-[#00A693] focus:ring-[#00A693]"
                        />
                      </th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Salary</th>
                      <th className="px-4 py-3">Company</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F0EB]">
                    {paginatedUsers.map(user => (
                      <tr key={user._id} className="hover:bg-[#FDFCFB] transition-colors">
                        <td className="px-4 py-3 w-12">
                          <input 
                            type="checkbox"
                            checked={selectedUsers.has(user._id)}
                            onChange={() => toggleUserSelection(user._id)}
                            className="rounded border-[#E5E1DA] text-[#00A693] focus:ring-[#00A693]"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#E6F6F4] text-[#00A693] flex items-center justify-center font-bold text-sm shrink-0">
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-medium text-[#1A1A1A]">{user.name}</div>
                              {(user.designations?.[0] || user.resumeData?.experience?.[0]?.role) && (
                                <div className="text-[11px] text-[#9CA3AF] capitalize truncate max-w-[150px]">
                                  {user.designations?.[0] || user.resumeData?.experience?.[0]?.role}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {user.yearsOfExperience ? <div className="text-[#1A1A1A] font-medium">{user.yearsOfExperience} Exp</div> : <span className="text-gray-400">-</span>}
                          {user.joiningAvailability && <div className="text-[11px] text-[#00A693] mt-0.5">{user.joiningAvailability}</div>}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280] text-xs">
                          {user.currentSalary || user.expectedSalary ? (
                            <div className="flex flex-col gap-0.5 whitespace-nowrap">
                              {user.currentSalary && <div><span className="text-[#9CA3AF]">Cur:</span> <span className="font-medium text-[#1A1A1A]">₹{user.currentSalary.toLocaleString()}</span></div>}
                              {user.expectedSalary && <div><span className="text-[#9CA3AF]">Exp:</span> <span className="font-medium text-[#1A1A1A]">₹{user.expectedSalary.toLocaleString()}</span></div>}
                            </div>
                          ) : <span className="text-[#D1D5DB]">-</span>}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280] text-xs">
                          <CompanyList experience={user.resumeData?.experience} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white border-t border-[#E5E1DA] p-4 flex items-center justify-between shrink-0">
              <div className="text-sm text-[#6B7280]">
                Showing <span className="font-medium text-[#1A1A1A]">{(page - 1) * PER_PAGE + 1}</span> to <span className="font-medium text-[#1A1A1A]">{Math.min(page * PER_PAGE, filteredUsers.length)}</span> of <span className="font-medium text-[#1A1A1A]">{filteredUsers.length}</span> results
              </div>
              <div className="flex gap-1 items-center max-w-full overflow-x-auto scrollbar-hide px-1">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-1.5 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:bg-[#F3F0EB] disabled:opacity-50 transition shrink-0 mr-2"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: Math.min(20, totalPages - Math.floor((page - 1) / 20) * 20) }, (_, i) => {
                  const pageNum = Math.floor((page - 1) / 20) * 20 + i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`min-w-[30px] h-[30px] flex items-center justify-center rounded-md text-[13px] transition shrink-0 ${
                        page === pageNum 
                          ? 'bg-[#00A693] text-white font-medium' 
                          : 'text-[#6B7280] hover:bg-[#F3F0EB]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-1.5 rounded-lg border border-[#E5E1DA] text-[#6B7280] hover:bg-[#F3F0EB] disabled:opacity-50 transition shrink-0 ml-2"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
