import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
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
  const [newlyAdded, setNewlyAdded] = useState([]);
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
      setNewlyAdded(res.data.newlyAdded || []);
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

  const debounceRef = useRef(null);

  const handleSearch = (e) => { e.preventDefault(); fetchProjects(1, search, activeTag, activeCategory); };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchProjects(1, val, activeTag, activeCategory);
    }, 350);
  };

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
    <div className="w-full px-4 sm:px-6 py-8">

      {/* ── Top bar: search + categories ── */}
      <div className="flex items-center gap-3 mb-4">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={handleSearchInput}
            className="w-full pl-10 pr-10 py-3 bg-white border border-border rounded-xl text-sm text-text placeholder-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition"
          />
          {hasFilters && (
            <button type="button" onClick={clearAll} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-text">
              <X size={16} />
            </button>
          )}
        </form>

        {/* Category dropdown */}
        <select
          value={activeCategory}
          onChange={e => handleCategory(e.target.value)}
          className="h-11.5 flex-1 px-3.5 py-2.5 bg-white border border-border rounded-xl text-sm text-text focus:outline-none focus:border-accent transition"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Active filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-accent-light text-accent px-3 py-1 rounded-full font-medium">
              {activeCategory}
              <button onClick={() => handleCategory(activeCategory)}><X size={11} /></button>
            </span>
          )}
          {activeTag && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#F3F0EB] text-muted px-3 py-1 rounded-full font-medium">
              {activeTag}
              <button onClick={() => handleTag(activeTag)}><X size={11} /></button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-[#F3F0EB] text-muted px-3 py-1 rounded-full font-medium">
              "{search}"
              <button onClick={() => { setSearch(''); fetchProjects(1, '', activeTag, activeCategory); }}><X size={11} /></button>
            </span>
          )}
          <span className="text-xs text-[#9CA3AF]">{total} result{total !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProjectSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 && newlyAdded.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted text-sm">No projects found. Try a different filter.</p>
          <button onClick={clearAll} className="mt-3 text-sm text-accent hover:underline">Clear all filters</button>
        </div>
      ) : (
        <>
          {/* Score-sorted rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>

          {/* Newly added row — page 1 only */}
          {newlyAdded.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-text">Newly Added</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {newlyAdded.map(p => <ProjectCard key={p._id} project={p} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button onClick={() => fetchProjects(page - 1)} disabled={page === 1}
            className="px-4 py-2 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
            Previous
          </button>
          <span className="text-sm text-muted px-2">Page {page} of {pages}</span>
          <button onClick={() => fetchProjects(page + 1)} disabled={page === pages}
            className="px-4 py-2 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
            Next
          </button>
        </div>
      )}
    </div>
  );
}
