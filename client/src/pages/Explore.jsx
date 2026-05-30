import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, LayoutGrid } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const CATEGORIES = [
  'E-Commerce', 'Project Management', 'Customer Relationship Management (CRM)',
  'Finance & Accounting', 'Productivity Tools', 'Social Networking & Community',
  'Healthcare & Fitness', 'Education & Learning Platforms', 'HR & Recruitment',
  'Marketing & SEO', 'Real Estate', 'Travel & Booking', 'Food Delivery & Restaurant',
  'Gaming', 'Blockchain & Web3', 'Automation Tools', 'Analytics & Reporting',
  'Communication & Chat Apps', 'Inventory Management', 'Event Management', 'Others',
];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [activeType, setActiveType] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProjects = useCallback(async (p = 1, s = search, t = activeTag, c = activeCategory, tp = activeType) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (s) params.set('search', s);
      if (t) params.set('tag', t);
      if (c) params.set('category', c);
      if (tp) params.set('type', tp);
      const res = await api.get(`/projects?${params}`);
      setProjects(res.data.projects);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(p);
    } catch { /* silently ignore */ }
    finally { setLoading(false); }
  }, [search, activeTag, activeCategory, activeType]);

  useEffect(() => {
    const type = searchParams.get('type') || '';
    setActiveType(type);
    fetchProjects(1, '', '', '', type);
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const handleSearch = (e) => { e.preventDefault(); fetchProjects(1, search, activeTag, activeCategory); };

  const handleTag = (tag) => {
    const next = activeTag === tag ? '' : tag;
    setActiveTag(next);
    fetchProjects(1, search, next, activeCategory);
  };

  const handleCategory = (cat) => {
    const next = activeCategory === cat ? '' : cat;
    setActiveCategory(next);
    fetchProjects(1, search, activeTag, next);
  };

  const clearAll = () => {
    setSearch(''); setActiveTag(''); setActiveCategory(''); setActiveType('');
    fetchProjects(1, '', '', '', '');
  };

  const hasFilters = search || activeTag || activeCategory || activeType;

  return (
    <div className="w-full pl-5 pr-4 sm:pr-6 py-10">
      <div className="flex gap-4">

        {/* ── Left sidebar: categories ── */}
        <aside className="hidden lg:block shrink-0 w-44 overflow-hidden">
          <div className="sticky top-24">
            <div className="flex items-center gap-1.5 mb-2">
              <LayoutGrid size={12} className="text-[#6B7280]" />
              <span className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">Categories</span>
            </div>
            <nav className="space-y-0.5">
              <button
                onClick={() => handleCategory('')}
                className={`w-full text-left px-1.5 py-1 rounded-md text-xs transition-colors truncate ${
                  !activeCategory
                    ? 'bg-[#E6F7F5] text-[#00A693] font-medium'
                    : 'text-[#6B7280] hover:bg-[#F3F0EB] hover:text-[#1A1A1A]'
                }`}
              >
                All Categories
              </button>
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleCategory(cat)}
                  className={`w-full text-left px-1.5 py-1 rounded-md text-xs transition-colors truncate ${
                    activeCategory === cat
                      ? 'bg-[#E6F7F5] text-[#00A693] font-medium'
                      : 'text-[#6B7280] hover:bg-[#F3F0EB] hover:text-[#1A1A1A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Search bar */}
          <form onSubmit={handleSearch} className="relative mb-4">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
            {hasFilters && (
              <button type="button" onClick={clearAll} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A]">
                <X size={16} />
              </button>
            )}
          </form>

          {/* Mobile category select */}
          <div className="lg:hidden mb-3">
            <select
              value={activeCategory}
              onChange={e => handleCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] focus:outline-none focus:border-[#00A693] transition"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Active filters summary */}
          {hasFilters && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {activeCategory && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-[#E6F7F5] text-[#00A693] px-3 py-1 rounded-full font-medium">
                  {activeCategory}
                  <button onClick={() => handleCategory(activeCategory)}><X size={11} /></button>
                </span>
              )}
              {activeTag && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-[#F3F0EB] text-[#6B7280] px-3 py-1 rounded-full font-medium">
                  {activeTag}
                  <button onClick={() => handleTag(activeTag)}><X size={11} /></button>
                </span>
              )}
              {search && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-[#F3F0EB] text-[#6B7280] px-3 py-1 rounded-full font-medium">
                  "{search}"
                  <button onClick={() => { setSearch(''); fetchProjects(1, '', activeTag, activeCategory); }}><X size={11} /></button>
                </span>
              )}
              <span className="text-xs text-[#9CA3AF]">{total} result{total !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 9 }).map((_, i) => <ProjectSkeleton key={i} />)
              : projects.length > 0
                ? projects.map(p => <ProjectCard key={p._id} project={p} />)
                : (
                  <div className="col-span-4 text-center py-20">
                    <p className="text-[#6B7280] text-sm">No projects found. Try a different filter.</p>
                    <button onClick={clearAll} className="mt-3 text-sm text-[#00A693] hover:underline">Clear all filters</button>
                  </div>
                )
            }
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12">
              <button onClick={() => fetchProjects(page - 1)} disabled={page === 1}
                className="px-4 py-2 text-sm border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] disabled:opacity-40 disabled:cursor-not-allowed transition">
                Previous
              </button>
              <span className="text-sm text-[#6B7280] px-2">Page {page} of {pages}</span>
              <button onClick={() => fetchProjects(page + 1)} disabled={page === pages}
                className="px-4 py-2 text-sm border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] disabled:opacity-40 disabled:cursor-not-allowed transition">
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
