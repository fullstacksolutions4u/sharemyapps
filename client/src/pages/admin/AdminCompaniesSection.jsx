import { Fragment, useEffect, useState } from 'react';
import { Building2, Search, X, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { optimizeImage } from '../../utils/image';

export default function AdminCompaniesSection() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('developers'); // 'developers' | 'alphabetical'
  const [expanded, setExpanded] = useState(null); // company name of open row
  const PER_PAGE = 10;

  useEffect(() => {
    api.get('/admin/companies')
      .then(res => setCompanies(res.data.companies || []))
      .catch(() => toast.error('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const list = companies
    .filter(c =>
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.developers.some(d => d.name?.toLowerCase().includes(q) || d.email?.toLowerCase().includes(q))
    )
    .sort((a, b) => sort === 'alphabetical'
      ? a.name.localeCompare(b.name)
      : b.developerCount - a.developerCount || a.name.localeCompare(b.name));
  const totalPages = Math.ceil(list.length / PER_PAGE);
  const paged = list.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const Avatar = ({ d }) => d.avatar
    ? <img src={optimizeImage(d.avatar, 150)} alt={d.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
    : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{d.name?.[0]?.toUpperCase() || '?'}</span>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex gap-1 bg-[#F3F0EB] p-1 rounded-xl w-fit shrink-0">
          {[
            { key: 'developers',   label: 'Most Developers' },
            { key: 'alphabetical', label: 'A–Z' },
          ].map(t => (
            <button key={t.key} onClick={() => { setSort(t.key); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sort === t.key ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-64 shrink-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] pointer-events-none" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search company or developer…"
            className="w-full pl-9 pr-8 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition" />
          {search && (
            <button type="button" onClick={() => { setSearch(''); setPage(1); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        {search && <p className="text-xs text-[#6B7280]">{list.length} result{list.length !== 1 ? 's' : ''} for <span className="font-medium text-[#1A1A1A]">"{search}"</span></p>}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <Building2 size={28} className="mx-auto mb-3 text-[#9CA3AF]" />
          <p className="text-[#6B7280] text-sm">
            {companies.length === 0
              ? 'No companies found — no resume data has work experience yet'
              : `No matches for "${search}"`}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E1DA] bg-[#FAF9F6]">
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Developers</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden sm:table-cell">Designations</th>
                <th className="w-10 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F0EB]">
              {paged.map(c => (
                <Fragment key={c.name}>
                  <tr onClick={() => setExpanded(expanded === c.name ? null : c.name)}
                    className="hover:bg-[#FAF9F6] transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#E6F7F5] text-[#00A693] flex items-center justify-center shrink-0"><Building2 size={15} /></span>
                        <p className="font-medium text-[#1A1A1A]">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full bg-[#F3F0EB] text-[#6B7280] border border-[#E5E1DA] font-medium">
                        <Users size={11} /> {c.developerCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {(() => {
                        const counts = {};
                        for (const d of c.developers) for (const g of (d.designations || [])) counts[g] = (counts[g] || 0) + 1;
                        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
                        if (sorted.length === 0) return <span className="text-xs text-[#9CA3AF]">—</span>;
                        return (
                          <div className="flex flex-wrap gap-1">
                            {sorted.slice(0, 3).map(([name, count]) => (
                              <span key={name} className="text-xs px-2 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">{name} {count}</span>
                            ))}
                            {sorted.length > 3 && <span className="text-xs text-[#9CA3AF] self-center">+{sorted.length - 3} more</span>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right text-[#9CA3AF]">
                      {expanded === c.name ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </td>
                  </tr>
                  {expanded === c.name && (
                    <tr>
                      <td colSpan={4} className="px-4 pb-4 pt-1 bg-[#FAF9F6]">
                        {(() => {
                          const NO_DESIGNATION = 'No Designation';
                          const groups = {};
                          for (const d of c.developers) {
                            const keys = d.designations?.length ? d.designations : [NO_DESIGNATION];
                            for (const k of keys) (groups[k] = groups[k] || []).push(d);
                          }
                          const sorted = Object.entries(groups).sort((a, b) => {
                            if (a[0] === NO_DESIGNATION) return 1;
                            if (b[0] === NO_DESIGNATION) return -1;
                            return b[1].length - a[1].length || a[0].localeCompare(b[0]);
                          });
                          return (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-start">
                              {sorted.map(([designation, devs]) => (
                                <div key={designation} className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden">
                                  <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-[#E5E1DA] bg-[#FAF9F6]">
                                    <p className={`text-xs font-semibold truncate ${designation === NO_DESIGNATION ? 'text-[#9CA3AF]' : 'text-[#00A693]'}`}>{designation}</p>
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#F3F0EB] text-[#6B7280] border border-[#E5E1DA] font-medium shrink-0">{devs.length}</span>
                                  </div>
                                  <div className="divide-y divide-[#F3F0EB]">
                                    {devs.map(d => (
                                      <div key={d.userId} className="flex items-start gap-2.5 px-3.5 py-2.5">
                                        <Avatar d={d} />
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <p className="text-sm font-medium text-[#1A1A1A] truncate">{d.name}</p>
                                            {d.regNumber && <span className="text-xs text-[#9CA3AF]">#{d.regNumber}</span>}
                                            {d.current && <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#E6F7F5] text-[#00A693] border border-[#00A693]/20 font-medium">Current</span>}
                                          </div>
                                          <p className="text-xs text-[#6B7280] truncate">{d.email}</p>
                                          <div className="mt-1 space-y-0.5">
                                            {d.stints.map((s, i) => (
                                              <p key={i} className="text-xs text-[#6B7280]">
                                                <span className="text-[#1A1A1A] font-medium">{s.role || 'Role not specified'}</span>
                                                {s.period && <span> · {s.period}</span>}
                                              </p>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (() => {
        const GROUP = 10;
        const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
        const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
        return (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-[#9CA3AF]">Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, list.length)} of {list.length}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">‹</button>
              {groupStart > 1 && <button onClick={() => setPage(groupStart - 1)} title={`Pages ${Math.max(1, groupStart - GROUP)}–${groupStart - 1}`} className="px-3 h-8 border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition flex items-center"><ChevronsLeft size={14} /></button>}
              {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
                <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-sm rounded-lg border transition ${n === page ? 'bg-accent text-white border-accent font-medium' : 'border-border text-muted hover:border-accent hover:text-accent'}`}>{n}</button>
              ))}
              {groupEnd < totalPages && <button onClick={() => setPage(groupEnd + 1)} title={`Pages ${groupEnd + 1}–${Math.min(totalPages, groupEnd + GROUP)}`} className="px-3 h-8 border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition flex items-center"><ChevronsRight size={14} /></button>}
              <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 h-8 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">›</button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
