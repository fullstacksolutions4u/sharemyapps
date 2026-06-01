import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Phone, GitBranch, Link2, Code2,
  Globe, Layers, ChevronLeft, ChevronRight, Users, Sparkles, Monitor, Smartphone,
} from 'lucide-react';
import api from '../api/axios';

const BADGE = {
  new_member: { label: 'New',      cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  active:     { label: 'Active',   cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  top:        { label: 'Top',      cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  champion:   { label: 'Champion', cls: 'bg-purple-50 text-purple-600 border-purple-200' },
};

const PROJECT_CHIP_COLORS = [
  'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100',
  'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100',
  'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
  'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100',
  'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100',
];

const CARD_ACCENTS = [
  'from-[#00A693]/20 to-teal-100/30',
  'from-blue-400/20 to-indigo-100/30',
  'from-violet-400/20 to-purple-100/30',
  'from-amber-400/20 to-orange-100/30',
  'from-rose-400/20 to-pink-100/30',
  'from-emerald-400/20 to-green-100/30',
];

const toAbs = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

function SocialBtn({ href, icon: Icon, label, cls }) {
  if (!href) return (
    <div className="invisible pointer-events-none flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border border-transparent">
      <Icon size={11} />{label}
    </div>
  );
  return (
    <a href={toAbs(href)} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-all hover:scale-105 hover:shadow-sm ${cls}`}>
      <Icon size={11} />
      {label}
    </a>
  );
}

function DeveloperCard({ dev, idx }) {
  const initials = dev.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const badge = BADGE[dev.badge] || BADGE.new_member;
  const accent = CARD_ACCENTS[idx % CARD_ACCENTS.length];

  return (
    <div className="group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">

      {/* Gradient banner */}
      <div className={`h-16 bg-linear-to-r ${accent} relative`}>
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
      </div>

      {/* Avatar — overlapping the banner */}
      <div className="px-5 -mt-8 mb-3 flex items-end justify-between">
        {dev.avatar ? (
          <img src={dev.avatar} alt={dev.name}
            className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${accent} border-4 border-white shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
            <span className="text-xl font-bold text-[#00A693]">{initials}</span>
          </div>
        )}
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 flex flex-col gap-3 flex-1">

        {/* Name + project count */}
        <div>
          <h3 className="font-bold text-base text-text leading-tight">{dev.name}</h3>
          <p className="text-xs text-muted mt-0.5">
            {dev.projects.length} project{dev.projects.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Contact */}
        {dev.phone && (
          <div className="rounded-xl overflow-hidden border border-teal-200">
            <a href={`tel:${dev.phone}`}
              className="flex items-center gap-2.5 text-xs px-3 py-2 bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 transition-colors group">
              <span className="w-6 h-6 rounded-lg bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center shrink-0 transition-colors">
                <Phone size={11} className="text-teal-600" />
              </span>
              <span className="font-medium">{dev.phone}</span>
            </a>
          </div>
        )}

        {/* Social links */}
        {(dev.linkedinUrl || dev.githubUrl || dev.leetcodeUrl || dev.portfolioUrl) && (
          <div className="grid grid-cols-2 gap-1.5">
            <SocialBtn href={dev.linkedinUrl} icon={Link2} label="LinkedIn"
              cls="bg-[#EEF4FF] text-[#0A66C2] border-[#0A66C2]/20" />
            <SocialBtn href={dev.githubUrl} icon={GitBranch} label="GitHub"
              cls="bg-gray-900 text-white border-gray-900 hover:bg-gray-800" />
            <SocialBtn href={dev.portfolioUrl} icon={Globe} label="Portfolio"
              cls="bg-teal-50 text-teal-600 border-teal-200" />
            <SocialBtn href={dev.leetcodeUrl} icon={Code2} label="LeetCode"
              cls="bg-orange-50 text-orange-600 border-orange-200" />
          </div>
        )}

        {/* Projects */}
        {dev.projects.length > 0 && (
          <div>
            <p className="flex items-center gap-1 text-[10px] font-semibold text-muted uppercase tracking-widest mb-2">
              <Layers size={10} /> Projects
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {dev.projects.slice(0, 4).map((p, pi) => {
                const TypeIcon = p.appType === 'mobile' ? Smartphone : Monitor;
                return (
                  <Link key={p._id} to={`/project/${p._id}`} title={p.title}
                    className={`inline-flex items-center gap-1 text-[11px] border px-2.5 py-1 rounded-full transition-colors font-medium min-w-0 ${PROJECT_CHIP_COLORS[pi % PROJECT_CHIP_COLORS.length]}`}>
                    <TypeIcon size={9} className="shrink-0" />
                    <span className="truncate">{p.title}</span>
                  </Link>
                );
              })}
              {dev.projects.length > 4 && (
                <Link to={`/portfolio/${dev._id}`}
                  className="col-span-2 text-[11px] text-accent hover:underline font-medium px-1">
                  +{dev.projects.length - 4} more
                </Link>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2">
          <Link to={`/portfolio/${dev._id}`}
            className="flex items-center justify-center gap-2 w-full text-xs font-semibold bg-linear-to-r from-accent to-teal-500 hover:from-accent-hover hover:to-teal-600 text-white rounded-xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md">
            View Portfolio
          </Link>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden animate-pulse">
      <div className="h-16 bg-linear-to-r from-slate-100 to-slate-200" />
      <div className="px-5 -mt-8 mb-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-200 border-4 border-white" />
      </div>
      <div className="px-5 pb-5 space-y-3">
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-100 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/4" />
        </div>
        <div className="h-14 bg-slate-100 rounded-xl" />
        <div className="flex gap-1.5">
          <div className="h-6 w-16 bg-slate-100 rounded-full" />
          <div className="h-6 w-14 bg-slate-100 rounded-full" />
        </div>
        <div className="h-9 bg-slate-100 rounded-xl" />
      </div>
    </div>
  );
}

export default function Developers() {
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const fetchDevelopers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page });
        if (debouncedSearch) params.set('search', debouncedSearch);
        const res = await api.get(`/users/developers?${params}`);
        if (!cancelled) {
          setDevelopers(res.data.developers);
          setTotalPages(res.data.totalPages);
        }
      } catch {
        if (!cancelled) setDevelopers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDevelopers();
    return () => { cancelled = true; };
  }, [page, debouncedSearch]);

  const goPage = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const pageNumbers = () => {
    const pages = [];
    const win = 10;
    let start = Math.max(1, page - Math.floor(win / 2));
    let end = start + win - 1;
    if (end > totalPages) { end = totalPages; start = Math.max(1, end - win + 1); }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-accent/10 via-white to-violet-50 relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Hero banner */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-md shrink-0">
              <Users size={18} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-text tracking-tight">Developers</h1>
          </div>

          <p className="text-sm text-muted items-center gap-1.5 hidden sm:flex">
            <Sparkles size={13} className="text-accent shrink-0" />
            Connect with our developers for hiring and freelance projects
          </p>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 py-8">

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : developers.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-20 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-muted" />
            </div>
            <p className="font-semibold text-text text-lg">No developers found</p>
            {debouncedSearch && (
              <button onClick={() => setSearch('')} className="text-sm text-accent hover:underline mt-2">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {developers.map((dev, i) => <DeveloperCard key={dev._id} dev={dev} idx={i} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-1.5 mt-12">
            <button onClick={() => goPage(page - 1)} disabled={page === 1}
              className="p-2 rounded-xl border border-border text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">
              <ChevronLeft size={16} />
            </button>
            {pageNumbers().map(n => (
              <button key={n} onClick={() => goPage(n)}
                className={`w-9 h-9 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                  n === page
                    ? 'bg-accent border-accent text-white shadow-accent/30 shadow-md'
                    : 'bg-white border-border text-muted hover:border-accent hover:text-accent'
                }`}>
                {n}
              </button>
            ))}
            <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
              className="p-2 rounded-xl border border-border text-muted hover:border-accent hover:text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
