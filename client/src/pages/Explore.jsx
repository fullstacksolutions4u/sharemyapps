import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Megaphone, Heart, Star, MessageCircle } from 'lucide-react';
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

const getPageNumbers = (current, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
};

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [newlyAdded, setNewlyAdded] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [tickerIndex, setTickerIndex] = useState(0);
  const activeType = searchParams.get('type') || '';
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
    fetchProjects(1, '', '', '', type); // eslint-disable-line react-hooks/set-state-in-effect
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const load = () => api.get('/announcements/feed').then(res => setAnnouncements(res.data)).catch(() => {});
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (announcements.length === 0) return;
    const len = announcements.length;
    setTickerIndex(0);
    const timer = setInterval(() => {
      setTickerIndex(i => (i + 1) % len);
    }, 6000);
    return () => clearInterval(timer);
  }, [announcements]); // eslint-disable-line react-hooks/exhaustive-deps

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
    setSearch(''); setActiveTag(''); setActiveCategory('');
    setSearchParams({});
    fetchProjects(1, '', '', '', '');
  };

  const hasFilters = search || activeTag || activeCategory || activeType;

  return (
    <div className="w-full px-4 sm:px-6 py-8">

      {/* ── Top bar: search + announcement + category ── */}
      <div className="flex items-stretch gap-0 mb-0">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="relative flex-[0.8]">
          <Search size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={handleSearchInput}
            className="w-full pl-6 pr-8 py-3 bg-transparent border-0 border-b border-border text-sm text-text placeholder-muted focus:outline-none focus:border-text transition"
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); fetchProjects(1, '', activeTag, activeCategory); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text">
              <X size={14} />
            </button>
          )}
        </form>

        {/* Announcement ticker (centre) */}
        {announcements.length > 0 ? (
          <div className="flex items-center gap-2 flex-4 overflow-hidden border-b border-border px-3">
            <Megaphone size={15} className="text-orange-500 shrink-0" />
            <div className="flex-1 overflow-hidden h-full flex items-center gap-1.5">
              {announcements[tickerIndex]?.kind === 'activity' && (
                <span key={tickerIndex + '_icons'} className="animate-ticker-up flex items-center gap-1 shrink-0">
                  {announcements[tickerIndex].types?.includes('like')      && <Heart size={12} className="text-pink-500" />}
                  {announcements[tickerIndex].types?.includes('rated')     && <Star size={12} className="text-amber-400" />}
                  {announcements[tickerIndex].types?.includes('commented') && <MessageCircle size={12} className="text-blue-400" />}
                </span>
              )}
              <span
                key={tickerIndex}
                className={`animate-ticker-up text-sm truncate block ${
                  announcements[tickerIndex]?.kind === 'activity' ? 'text-violet-500' : 'text-accent'
                }`}
              >
                {announcements[tickerIndex]?.text}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex-4 border-b border-border" />
        )}

        {/* Category dropdown */}
        <div className="relative flex-1">
          <select
            value={activeCategory}
            onChange={e => handleCategory(e.target.value)}
            className="w-full appearance-none pl-4 pr-8 py-3 bg-transparent border-0 border-b border-border text-sm text-text focus:outline-none focus:border-text transition cursor-pointer"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <svg className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Full-width divider */}
      <div className="h-px bg-border mb-4" />

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
        <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
          <button onClick={() => fetchProjects(page - 1)} disabled={page === 1}
            className="px-3 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
            ‹
          </button>
          {getPageNumbers(page, pages).map((p, i) =>
            p === '...' ? (
              <span key={`e${i}`} className="w-9 h-9 flex items-center justify-center text-sm text-muted">…</span>
            ) : (
              <button key={p} onClick={() => fetchProjects(p)}
                className={`w-9 h-9 text-sm rounded-lg border transition ${
                  p === page
                    ? 'bg-accent text-white border-accent font-medium'
                    : 'border-border text-muted hover:border-accent hover:text-accent'
                }`}>
                {p}
              </button>
            )
          )}
          <button onClick={() => fetchProjects(page + 1)} disabled={page === pages}
            className="px-3 h-9 text-sm border border-border rounded-lg text-muted hover:border-accent hover:text-accent disabled:opacity-40 disabled:cursor-not-allowed transition">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
