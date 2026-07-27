import { useState, useEffect } from 'react';
import { 
  Search, Filter,
  ChevronLeft, ChevronRight, Copy, Download
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const inp = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition';
const sel = 'w-full px-3 py-2 border border-[#E5E1DA] rounded-lg text-sm text-[#1A1A1A] bg-white focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition appearance-none';

const normalizeCompany = (name) => {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (lower.includes('brototype')) return 'Brototype';
  if (lower.includes('bridgeon')) return 'Bridgeon';
  return name.trim();
};

const CompanyList = ({ experience, userName }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!experience || experience.length === 0) {
    return <span className="text-[#D1D5DB]">-</span>;
  }
  
  const validCompanies = experience
    .map(e => normalizeCompany(e.company))
    .filter(Boolean)
    .filter(c => userName ? c.toLowerCase() !== userName.toLowerCase() : true);
    
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

  // Export states
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportTotal, setExportTotal] = useState(0);


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
  }, []);

  const uniqueCompanies = (() => {
    const comps = new Set();
    users.forEach(u => {
      const exp = u.resumeData?.experience || u.resumeData?.workExperience;
      if (exp && Array.isArray(exp)) {
        exp.forEach(e => {
          if (e.company) {
            const c = normalizeCompany(e.company);
            if (u.name && c.toLowerCase() === u.name.toLowerCase()) return;
            comps.add(c);
          }
        });
      }
    });
    return Array.from(comps).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  })();

  const uniqueDesignations = (() => {
    const desigs = new Set();
    users.forEach(u => {
      const exp = u.resumeData?.experience || u.resumeData?.workExperience;
      const d = u.designations?.[0] || exp?.[0]?.role;
      if (d) {
        desigs.add(d.trim());
      }
    });
    return Array.from(desigs).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  })();

  const filteredUsers = (() => {
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

      const exp = u.resumeData?.experience || u.resumeData?.workExperience;

      // 2. Designation
      if (designation) {
        const d = u.designations?.[0] || exp?.[0]?.role;
        if (!d || d.trim() !== designation) return false;
      }

      // 3. Company
      if (company) {
        if (!exp || !Array.isArray(exp)) return false;
        const hasCompany = exp.some(e => {
          const c = normalizeCompany(e.company);
          if (u.name && c.toLowerCase() === u.name.toLowerCase()) return false;
          return c === company;
        });
        if (!hasCompany) return false;
      }

      return true;
    });
  })();

  const filteredCompaniesCount = (() => {
    const comps = new Set();
    filteredUsers.forEach(u => {
      const exp = u.resumeData?.experience || u.resumeData?.workExperience;
      if (exp && Array.isArray(exp)) {
        exp.forEach(e => {
          if (e.company) {
            const c = normalizeCompany(e.company);
            if (u.name && c.toLowerCase() === u.name.toLowerCase()) return;
            comps.add(c);
          }
        });
      }
    });
    return comps.size;
  })();

  const [prevFilters, setPrevFilters] = useState({ search: '', designation: '', company: '' });

  if (search !== prevFilters.search || designation !== prevFilters.designation || company !== prevFilters.company) {
    setPage(1);
    setPrevFilters({ search, designation, company });
  }

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setDesignation('');
    setCompany('');
  };

  const handleExportCompanies = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      toast.error("Please add VITE_GOOGLE_MAPS_API_KEY in client/.env.local");
      return;
    }

    const companyMap = new Map();
    filteredUsers.forEach(u => {
      const exp = u.resumeData?.experience || u.resumeData?.workExperience;
      if (exp && Array.isArray(exp)) {
        exp.forEach(e => {
          if (e.company) {
            const c = normalizeCompany(e.company);
            if (u.name && c.toLowerCase() === u.name.toLowerCase()) return;
            if (!companyMap.has(c)) {
              companyMap.set(c, { company: c, userCount: 0, users: [] });
            }
            companyMap.get(c).userCount += 1;
            companyMap.get(c).users.push(u.name);
          }
        });
      }
    });

    if (companyMap.size === 0) {
      toast.error("No companies to export");
      return;
    }

    const uniqueCompaniesList = Array.from(companyMap.values()).sort((a, b) => a.company.localeCompare(b.company));
    
    setIsExporting(true);
    setExportTotal(uniqueCompaniesList.length);
    setExportProgress(0);

    const exportData = [];

    for (let i = 0; i < uniqueCompaniesList.length; i++) {
      const c = uniqueCompaniesList[i];
      let locationStr = 'Not Found';
      
      try {
        const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(c.company)}&key=${apiKey}`);
        const data = await res.json();
        
        if (data.status === 'OK' && data.results.length > 0) {
          locationStr = data.results[0].formatted_address;
        }
      } catch (err) {
        console.error("Geocoding error for", c.company, err);
      }
      
      exportData.push({
        'S.No.': i + 1,
        'Company Name': c.company,
        'Location': locationStr,
        'Users Working Here': c.userCount,
        'User Names': c.users.join(', ')
      });
      
      setExportProgress(i + 1);
      
      // Delay 20ms to safely stay under Google's 50 requests/second limit
      await new Promise(r => setTimeout(r, 20));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 8 }, { wch: 40 }, { wch: 50 }, { wch: 20 }, { wch: 80 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    XLSX.writeFile(wb, "Companies_Export.xlsx");
    
    setIsExporting(false);
    toast.success("Exported successfully!");
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
            <div className="text-[12px] font-medium text-[#6B7280] bg-[#F3F0EB] px-2.5 py-1.5 rounded-full">
              {filteredCompaniesCount} Companies Found
            </div>
            <div className="text-[12px] font-medium text-[#00A693] bg-[#E6F6F4] px-2.5 py-1.5 rounded-full">
              {filteredUsers.length} Users Found
            </div>
            <button 
              onClick={resetFilters}
              className="text-[12px] font-medium text-[#6B7280] hover:text-[#1A1A1A] transition px-3 py-1.5 border border-[#E5E1DA] rounded-lg h-8 flex items-center justify-center"
            >
              Reset Filters
            </button>
            <button
              onClick={handleExportCompanies}
              disabled={isExporting}
              className="text-[12px] font-medium text-white bg-[#00A693] hover:bg-[#009282] disabled:bg-[#00A693]/70 transition px-3 py-1.5 rounded-lg h-8 flex items-center justify-center gap-1.5 shadow-sm min-w-[120px]"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                  {exportProgress}/{exportTotal}
                </>
              ) : (
                <>
                  <Download size={14} /> Export to Excel
                </>
              )}
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
                              {(() => {
                                const exp = user.resumeData?.experience || user.resumeData?.workExperience;
                                const role = user.designations?.[0] || exp?.[0]?.role;
                                return role ? (
                                  <div className="text-[11px] text-[#9CA3AF] capitalize truncate max-w-[150px]">
                                    {role}
                                  </div>
                                ) : null;
                              })()}
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
                          <CompanyList experience={user.resumeData?.experience || user.resumeData?.workExperience} userName={user.name} />
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
