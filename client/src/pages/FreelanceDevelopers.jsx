import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Phone, GitBranch, Link2, Code2,
  Globe, Layers, ChevronLeft, ChevronRight, Users, IndianRupee, Monitor, Smartphone, Briefcase,
} from 'lucide-react';
import api from '../api/axios';
import { optimizeImage } from '../utils/image';

const BADGE = {
  new_member: { label: 'New Member',    cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  active:     { label: 'Active Member', cls: 'bg-blue-50 text-blue-600 border-blue-200' },
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

const toAbs = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`);

function SocialBtn({ href, icon: Icon, label, cls }) {
  if (!href) return (
    <div className="invisible pointer-events-none flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border border-transparent">
      <Icon size={11} />{label}
    </div>
  );
  return (
    <a href={toAbs(href)} target="_blank" rel="noopener noreferrer"
      className={`flex items-center justify-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-full border transition-all hover:scale-105 hover:shadow-sm ${cls}`}>
      <Icon size={11} />{label}
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
      {(() => {
        const bannerItems = [...(dev.designations || [])];
        return (
          <div className={`bg-linear-to-r ${accent} relative overflow-hidden ${bannerItems.length ? 'h-24' : 'h-16'}`}>
            <div className="absolute inset-0 opacity-30"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
            {bannerItems.length > 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-4">
                <span className="text-[11px] font-semibold text-accent/90 leading-tight text-center">
                  {bannerItems.join(' | ')}
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* Avatar + rate badge row */}
      <div className="px-5 -mt-8 mb-3 flex items-end justify-between">
        {dev.avatar ? (
          <img src={optimizeImage(dev.avatar, 150)} alt={dev.name}
            className="w-16 h-16 rounded-2xl object-cover border-4 border-white shadow-md group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className={`w-16 h-16 rounded-2xl bg-linear-to-br ${accent} border-4 border-white shadow-md flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
            <span className="text-xl font-bold text-accent">{initials}</span>
          </div>
        )}
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${badge.cls}`}>
          {badge.label}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 flex flex-col gap-3 flex-1">

        {/* Name + rate */}
        <div>
          <h3 className="font-bold text-base text-text leading-tight">{dev.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {dev.expectedSalary && (
              <p className="text-xs text-muted">
                Expected CTC: {(Number(dev.expectedSalary) / 100000).toFixed(1).replace(/\.0$/, '')} LPA
              </p>
            )}
            {dev.freelanceRate ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <IndianRupee size={10} />{dev.freelanceRate}/hr
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Rate negotiable
              </span>
            )}
          </div>
        </div>

        {/* Contact */}
        {dev.phone && (
          <div className="rounded-xl overflow-hidden border border-teal-200 flex">
            <a href={`tel:${dev.phone}`}
              className="flex-1 flex items-center gap-2.5 text-xs px-3 py-2 bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 transition-colors group">
              <span className="w-6 h-6 rounded-lg bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center shrink-0 transition-colors">
                <Phone size={11} className="text-teal-600" />
              </span>
              <span className="font-medium">{dev.phone}</span>
            </a>
            <a
              href={`https://wa.me/${dev.phone.replace(/\D/g, '')}?text=${encodeURIComponent("Hi, I seen your profile on ShareMyApps portal, I would like to connect with you.")}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              className="flex items-center justify-center px-3 border-l border-teal-200 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="15" height="15" fill="#25D366">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.848L.057 23.885a.75.75 0 0 0 .921.921l6.086-1.461A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.524-5.205-1.433l-.374-.223-3.865.928.944-3.77-.245-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
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

export default function FreelanceDevelopers() {
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
        const params = new URLSearchParams({ page, freelance: 'true' });
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

  const GROUP = 10;
  const getPageGroup = () => {
    const groupStart = Math.floor((page - 1) / GROUP) * GROUP + 1;
    const groupEnd = Math.min(groupStart + GROUP - 1, totalPages);
    return { groupStart, groupEnd, hasPrev: groupStart > 1, hasNext: groupEnd < totalPages };
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-teal-50/60 via-white to-emerald-50/40 relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

      {/* Hero banner */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-md shrink-0">
              <Briefcase size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-text tracking-tight">Freelance Developers</h1>
              <p className="text-xs text-muted mt-0.5">Available for your project right now</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by name…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-2 sm:px-4 py-8">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : developers.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-20 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-muted" />
            </div>
            <p className="font-semibold text-text text-lg">No freelance developers found</p>
            {debouncedSearch && (
              <button onClick={() => setSearch('')} className="text-sm text-accent hover:underline mt-2">
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-xs text-muted mb-5">{developers.length} freelance developer{developers.length !== 1 ? 's' : ''} available</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((dev, i) => <DeveloperCard key={dev._id} dev={dev} idx={i} />)}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (() => {
          const { groupStart, groupEnd, hasPrev, hasNext } = getPageGroup();
          return (
            <div className="flex items-center justify-center gap-1.5 mt-12 flex-wrap">
              <button onClick={() => goPage(page - 1)} disabled={page === 1}
                className="p-2 rounded-xl border border-border text-muted hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">
                <ChevronLeft size={16} />
              </button>
              {hasPrev && (
                <button onClick={() => goPage(groupStart - GROUP)}
                  className="w-9 h-9 rounded-xl border border-border bg-white text-muted hover:border-teal-500 hover:text-teal-600 transition-colors shadow-sm text-sm font-bold">«</button>
              )}
              {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(n => (
                <button key={n} onClick={() => goPage(n)}
                  className={`w-9 h-9 rounded-xl border text-xs font-semibold transition-all shadow-sm ${
                    n === page ? 'bg-teal-600 border-teal-600 text-white shadow-teal-300 shadow-md' : 'bg-white border-border text-muted hover:border-teal-500 hover:text-teal-600'
                  }`}>
                  {n}
                </button>
              ))}
              {hasNext && (
                <button onClick={() => goPage(groupEnd + 1)}
                  className="w-9 h-9 rounded-xl border border-border bg-white text-muted hover:border-teal-500 hover:text-teal-600 transition-colors shadow-sm text-sm font-bold">»</button>
              )}
              <button onClick={() => goPage(page + 1)} disabled={page === totalPages}
                className="p-2 rounded-xl border border-border text-muted hover:border-teal-500 hover:text-teal-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors bg-white shadow-sm">
                <ChevronRight size={16} />
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
