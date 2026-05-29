import { useEffect, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const POPULAR_TAGS = ['React', 'Node.js', 'Python', 'Next.js', 'Vue', 'MongoDB', 'TypeScript', 'Flutter'];

export default function Explore() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetch = useCallback(async (p = 1, s = search, t = activeTag) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p });
      if (s) params.set('search', s);
      if (t) params.set('tag', t);
      const res = await api.get(`/projects?${params}`);
      setProjects(res.data.projects);
      setPages(res.data.pages);
      setTotal(res.data.total);
      setPage(p);
    } catch {
      /* silently ignore */
    } finally {
      setLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/projects?page=1');
        setProjects(res.data.projects);
        setPages(res.data.pages);
        setTotal(res.data.total);
        setPage(1);
      } catch { /* ignore */ } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetch(1, search, activeTag);
  };

  const handleTag = (tag) => {
    const next = activeTag === tag ? '' : tag;
    setActiveTag(next);
    fetch(1, search, next);
  };

  const clearSearch = () => {
    setSearch('');
    setActiveTag('');
    fetch(1, '', '');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1A1A1A] tracking-tight mb-2">Explore projects</h1>
        <p className="text-[#6B7280] text-sm">{total} project{total !== 1 ? 's' : ''} listed by developers</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-3 bg-white border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#6B7280] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
        />
        {(search || activeTag) && (
          <button type="button" onClick={clearSearch} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] hover:text-[#1A1A1A]">
            <X size={16} />
          </button>
        )}
      </form>

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {POPULAR_TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => handleTag(tag)}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
              activeTag === tag
                ? 'bg-[#00A693] text-white border-[#00A693]'
                : 'bg-white text-[#6B7280] border-[#E5E1DA] hover:border-[#00A693] hover:text-[#00A693]'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? Array.from({ length: 9 }).map((_, i) => <ProjectSkeleton key={i} />)
          : projects.length > 0
            ? projects.map(p => <ProjectCard key={p._id} project={p} />)
            : (
              <div className="col-span-3 text-center py-20">
                <p className="text-[#6B7280] text-sm">No projects found. Try a different search.</p>
                <button onClick={clearSearch} className="mt-3 text-sm text-[#00A693] hover:underline">Clear filters</button>
              </div>
            )
        }
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12">
          <button
            onClick={() => fetch(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Previous
          </button>
          <span className="text-sm text-[#6B7280] px-2">Page {page} of {pages}</span>
          <button
            onClick={() => fetch(page + 1)}
            disabled={page === pages}
            className="px-4 py-2 text-sm border border-[#E5E1DA] rounded-lg text-[#6B7280] hover:border-[#00A693] hover:text-[#00A693] disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
