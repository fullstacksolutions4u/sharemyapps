import { useState, useCallback, useRef } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Plus } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const CATEGORIES = [
  'Mobile Applications', 'E-Commerce', 'Project Management', 'Customer Relationship Management (CRM)',
  'Finance & Accounting', 'Productivity Tools', 'Social Networking & Community',
  'Healthcare & Fitness', 'Education & Learning Platforms', 'HR & Recruitment',
  'Marketing & SEO', 'Real Estate', 'Travel & Booking', 'Food Delivery & Restaurant',
  'Gaming', 'Blockchain & Web3', 'Automation Tools', 'Analytics & Reporting',
  'Communication & Chat Apps', 'Inventory Management', 'Event Management',
  'AI & Machine Learning', 'DevTools & Developer Utilities', 'Cybersecurity',
  'IoT & Embedded Systems', 'AR & VR', 'Media & Entertainment',
  'Legal & Compliance', 'Logistics & Supply Chain', 'Agriculture & Farming',
  'Environment & Sustainability', 'Non-Profit & Social Impact',
  'Personal Finance & Budgeting', 'Job Board & Freelancing',
  'News & Blogging', 'Sports & Recreation', 'Fashion & Lifestyle',
  'Open Source Project', 'Portfolios', 'Company Website',
];

const SKELETONS = Array.from({ length: 16 });
const GROUP = 10;
const getPageGroup = (current, total) => {
  const groupStart = Math.floor((current - 1) / GROUP) * GROUP + 1;
  const groupEnd = Math.min(groupStart + GROUP - 1, total);
  return { groupStart, groupEnd, hasPrev: groupStart > 1, hasNext: groupEnd < total };
};

const fetchProjects = async ({ page, search, tag, category, type }) => {
  const params = new URLSearchParams({ page });
  if (search) params.set('search', search);
  if (tag) params.set('tag', tag);
  if (category) params.set('category', category);
  if (type) params.set('type', type);
  const res = await api.get(`/projects?${params}`);
  return res.data;
};



export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const activeType = searchParams.get('type') || '';
  const [page, setPage] = useState(1);
  const debounceRef = useRef(null);

  const projectsQuery = useQuery({
    queryKey: ['projects', page, search, activeTag, activeCategory, activeType, location.key],
    queryFn: () => fetchProjects({ page, search, tag: activeTag, category: activeCategory, type: activeType }),
    keepPreviousData: true,
    staleTime: 1000 * 60,
  });


  const projects = projectsQuery.data?.projects || [];
  const newlyAdded = projectsQuery.data?.newlyAdded || [];
  const pages = projectsQuery.data?.pages || 1;
  const total = projectsQuery.data?.total || 0;
  const loading = projectsQuery.isLoading || projectsQuery.isFetching;


  const goPage = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSearch = (e) => { e.preventDefault(); goPage(1); };

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); }, 350);
  };

  const handleTag = (tag) => {
    setActiveTag(prev => prev === tag ? '' : tag);
    setPage(1);
  };

  const handleCategory = (cat) => {
    setActiveCategory(prev => (prev === cat ? '' : cat));
    setPage(1);
  };

  const clearAll = () => {
    setSearch(''); setActiveTag(''); setActiveCategory('');
    setSearchParams({});
    setPage(1);
  };

  const hasFilters = search || activeTag || activeCategory || activeType;

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-8">

      {/* ── Sticky top bar: search + announcement + category ── */}
      <div className="sticky top-20 z-20 bg-white rounded-xl shadow-sm border border-border mt-3 mb-4 overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-col md:flex-row items-stretch md:items-center">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1 border-b md:border-b-0 md:border-r border-border bg-white flex items-center">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={handleSearchInput}
              className="w-full pl-12 pr-8 py-3.5 bg-transparent border-0 text-sm text-text placeholder-muted focus:outline-none focus:ring-0 transition"
            />
            {search && (
              <button type="button" onClick={() => { setSearch(''); setPage(1); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text bg-gray-100 rounded-full p-1 transition-colors">
                <X size={14} />
              </button>
            )}
          </form>

          {/* Category dropdown (Centered) */}
          <div className="relative flex-1 border-b md:border-b-0 md:border-r border-border flex items-center justify-center bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <select
              value={activeCategory}
              onChange={e => handleCategory(e.target.value)}
              className="appearance-none w-full px-4 py-3.5 bg-transparent border-0 text-sm text-text font-medium focus:outline-none transition cursor-pointer text-center"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <svg className="absolute right-[calc(50%-85px)] top-1/2 -translate-y-1/2 pointer-events-none text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Add Project Button (Right side) */}
          <div className="flex-1 flex justify-center items-center px-4 py-3 md:py-0 bg-gray-50/30">
            <Link 
              to="/dashboard/add" 
              className="w-full md:w-auto justify-center bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Plus size={18} />
              List your project
            </Link>
          </div>
        </div>
      </div>{/* end sticky bar */}

      <div className="mt-4" />

      {/* Active filters */}
      {hasFilters && (
        <div className="flex items-center gap-2 mt-4 mb-4 flex-wrap">
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
              <button onClick={() => { setSearch(''); setPage(1); }}><X size={11} /></button>
            </span>
          )}
          <span className="text-xs text-[#9CA3AF]">{total} result{total !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SKELETONS.map((_, i) => <ProjectSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 && newlyAdded.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-muted text-sm">No projects found. Try a different filter.</p>
          <button onClick={clearAll} className="mt-3 text-sm text-accent hover:underline">Clear all filters</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>

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
      {pages > 1 && (() => {
        const { groupStart, groupEnd, hasPrev, hasNext } = getPageGroup(page, pages);
        return (
          <div className="w-3/4 mx-auto flex items-center justify-center gap-1 mt-12 flex-wrap">
            <button onClick={() => goPage(page - 1)} disabled={page === 1}
              className="px-3 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
              ‹
            </button>
            {hasPrev && (
              <button onClick={() => goPage(groupStart - GROUP)}
                className="px-2.5 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition"
                title={`Pages ${groupStart - GROUP}–${groupStart - 1}`}>
                «
              </button>
            )}
            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(p => (
              <button key={p} onClick={() => goPage(p)}
                className={`w-9 h-9 text-sm rounded-lg border transition ${
                  p === page
                    ? 'bg-accent text-white border-accent font-medium'
                    : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}>
                {p}
              </button>
            ))}
            {hasNext && (
              <button onClick={() => goPage(groupEnd + 1)}
                className="px-2.5 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent transition"
                title={`Pages ${groupEnd + 1}–${Math.min(groupEnd + GROUP, pages)}`}>
                »
              </button>
            )}
            <button onClick={() => goPage(page + 1)} disabled={page === pages}
              className="px-3 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
              ›
            </button>
          </div>
        );
      })()}
    </div>
  );
}
