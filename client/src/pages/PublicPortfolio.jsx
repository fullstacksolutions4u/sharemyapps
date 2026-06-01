import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Layers, AlertCircle, Mail, Phone, Monitor, Smartphone, FileText, Camera } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';

// Rotating color palette for tech pills
const PILL_PALETTE = [
  { bg: 'bg-sky-50',     text: 'text-sky-600',     border: 'border-sky-200',     hex: '0284C7' },
  { bg: 'bg-violet-50',  text: 'text-violet-600',  border: 'border-violet-200',  hex: '7C3AED' },
  { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', hex: '059669' },
  { bg: 'bg-amber-50',   text: 'text-amber-600',   border: 'border-amber-200',   hex: 'D97706' },
  { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-200',    hex: 'E11D48' },
  { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-200',    hex: '2563EB' },
  { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-200',    hex: 'DB2777' },
  { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-200',    hex: '0D9488' },
  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-200',  hex: 'EA580C' },
  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-200',  hex: '4338CA' },
];

// Simple Icons slug map for common tech tags
const ICON_SLUG = {
  'react': 'react',
  'vue': 'vuedotjs',
  'angular': 'angular',
  'svelte': 'svelte',
  'nextjs': 'nextdotjs',
  'next.js': 'nextdotjs',
  'nuxt': 'nuxtdotjs',
  'node': 'nodedotjs',
  'nodejs': 'nodedotjs',
  'node.js': 'nodedotjs',
  'express': 'express',
  'fastapi': 'fastapi',
  'django': 'django',
  'flask': 'flask',
  'laravel': 'laravel',
  'spring': 'spring',
  'mongodb': 'mongodb',
  'postgresql': 'postgresql',
  'postgres': 'postgresql',
  'mysql': 'mysql',
  'sqlite': 'sqlite',
  'redis': 'redis',
  'firebase': 'firebase',
  'supabase': 'supabase',
  'prisma': 'prisma',
  'graphql': 'graphql',
  'typescript': 'typescript',
  'javascript': 'javascript',
  'python': 'python',
  'java': 'java',
  'kotlin': 'kotlin',
  'swift': 'swift',
  'dart': 'dart',
  'flutter': 'flutter',
  'c#': 'csharp',
  'dotnet': 'dotnet',
  '.net': 'dotnet',
  'php': 'php',
  'go': 'go',
  'rust': 'rust',
  'tailwind': 'tailwindcss',
  'tailwindcss': 'tailwindcss',
  'bootstrap': 'bootstrap',
  'sass': 'sass',
  'redux': 'redux',
  'docker': 'docker',
  'kubernetes': 'kubernetes',
  'aws': 'amazonaws',
  'vercel': 'vercel',
  'netlify': 'netlify',
  'git': 'git',
  'github': 'github',
  'figma': 'figma',
  'vite': 'vite',
  'webpack': 'webpack',
  'stripe': 'stripe',
  'tensorflow': 'tensorflow',
  'pytorch': 'pytorch',
  'socket.io': 'socketdotio',
  'three.js': 'threedotjs',
  'nginx': 'nginx',
  'linux': 'linux',
  'electron': 'electron',
  'expo': 'expo',
  'react native': 'react',
};

function getIconUrl(tag, hex = '374151') {
  const slug = ICON_SLUG[tag.toLowerCase()];
  return slug ? `https://cdn.simpleicons.org/${slug}/${hex}` : null;
}

const APP_TYPE_CFG = {
  mobile: { label: 'Mobile App', Icon: Smartphone, cls: 'bg-violet-500/90 text-white' },
  web:    { label: 'Web App',    Icon: Monitor,    cls: 'bg-sky-500/90 text-white' },
};
const getbanner = (bannerImage, liveUrl) =>
  bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=400`;

const toAbsoluteUrl = (url) => {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};

function SocialPill({ href, label, colorClass, dotClass }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:scale-105 ${colorClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
      {label}
    </a>
  );
}

export default function PublicPortfolio() {
  const { userId } = useParams();
  const { user: authUser, setUser } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef(null);

  const isOwner = authUser?._id === userId;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    setUploadingAvatar(true);
    try {
      const res = await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setData(prev => ({ ...prev, user: { ...prev.user, avatar: res.data.user.avatar } }));
      setUser(res.data.user);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Failed to update photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    api.get(`/projects/user/${userId}`)
      .then(res => setData(res.data))
      .catch(() => setError('Portfolio not found.'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-5">
        <div className="h-40 bg-white border border-[#E5E1DA] rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={44} className="text-[#D1CBC0] mx-auto mb-3" />
        <p className="text-[#1A1A1A] font-semibold text-lg">{error}</p>
        <Link to="/explore" className="text-sm text-[#00A693] hover:underline mt-2 inline-block">Browse all projects →</Link>
      </div>
    </div>
  );

  const { user, projects } = data;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const approvedCount = projects.length;
  const hasContact = user.email || user.phone;
  const hasSocial = user.linkedinUrl || user.githubUrl || user.leetcodeUrl || user.cvUrl;

  // Aggregate unique tech tags from all projects (max 12)
  const techStack = [...new Set(projects.flatMap(p => p.techTags || []))].slice(0, 12); // hard cap at 12

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Profile Card */}
        <div className="relative bg-white border border-border rounded-2xl mb-8 shadow-sm overflow-hidden">

          {/* Gradient banner */}
          <div className={`${techStack.length > 0 ? 'h-28' : 'h-20'} bg-linear-to-r from-accent/20 via-teal-100/40 to-violet-100/40 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {techStack.length > 0 && (
              <div className="absolute top-3 left-5 right-5 grid grid-cols-6 gap-x-6 gap-y-2 justify-items-center">
                {techStack.map((tag, i) => {
                  const palette = PILL_PALETTE[i % PILL_PALETTE.length];
                  const iconUrl = getIconUrl(tag, palette.hex);
                  return (
                    <span key={tag} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${palette.bg} ${palette.text} ${palette.border}`}>
                      {iconUrl && <img src={iconUrl} alt={tag} className="w-3.5 h-3.5 object-contain shrink-0" onError={e => { e.target.style.display = 'none'; }} />}
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 pb-6">
            {/* Avatar row — overlaps banner */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
              <div className="shrink-0 relative group/avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-accent/30 to-teal-200 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-accent">{initials}</span>
                  </div>
                )}
                {isOwner && (
                  <>
                    <button
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                    >
                      {uploadingAvatar
                        ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        : <Camera size={20} className="text-white" />
                      }
                    </button>
                    <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-2xl font-extrabold leading-tight bg-gradient-to-r from-slate-700 via-slate-500 to-slate-400 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-accent-light text-accent px-2.5 py-0.5 rounded-full mt-1 border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  {approvedCount} deployed project{approvedCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Contact + Social row */}
            <div className="flex flex-wrap items-center justify-center gap-3">

              {user.email && (
                <a href={`mailto:${user.email}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400 hover:scale-105 transition-all">
                  <Mail size={11} className="shrink-0" />
                  {user.email}
                </a>
              )}
              {user.phone && (
                <a href={`tel:${user.phone}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 hover:border-teal-400 hover:scale-105 transition-all">
                  <Phone size={11} className="shrink-0" />
                  {user.phone}
                </a>
              )}

              {/* Divider */}
              {(hasContact && hasSocial) && (
                <div className="hidden sm:block w-px h-6 bg-border" />
              )}

              {hasSocial && (
                <div className="flex items-center gap-2 flex-wrap">
                  <SocialPill
                    href={toAbsoluteUrl(user.linkedinUrl)}
                    label="LinkedIn"
                    colorClass="bg-[#EEF4FF] text-[#0A66C2] border-[#0A66C2]/20 hover:border-[#0A66C2]/50 hover:shadow-sm"
                    dotClass="bg-[#0A66C2]"
                  />
                  <SocialPill
                    href={toAbsoluteUrl(user.githubUrl)}
                    label="GitHub"
                    colorClass="bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400 hover:shadow-sm"
                    dotClass="bg-slate-700"
                  />
                  <SocialPill
                    href={toAbsoluteUrl(user.leetcodeUrl)}
                    label="LeetCode"
                    colorClass="bg-[#FFF7ED] text-[#EA580C] border-[#EA580C]/20 hover:border-[#EA580C]/50 hover:shadow-sm"
                    dotClass="bg-[#EA580C]"
                  />
                  {user.cvUrl && (
                    <a
                      href={toAbsoluteUrl(user.cvUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400 hover:scale-105 transition-all"
                    >
                      <FileText size={11} /> View Resume
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Projects section */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Deployed Projects</h2>
          <span className="text-xs text-[#6B7280]">{approvedCount} total</span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
            <Layers size={36} className="text-[#D1CBC0] mx-auto mb-3" />
            <p className="font-semibold text-[#1A1A1A]">No approved projects yet</p>
            <p className="text-sm text-[#6B7280] mt-1">Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <div key={project._id} className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden hover:border-[#00A693]/40 hover:shadow-md transition-all flex flex-col group">
                {/* Banner */}
                <div className="relative h-40 bg-[#F3F0EB] overflow-hidden">
                  <img
                    src={getbanner(project.bannerImage, project.liveUrl)}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-[#00A693] px-2 py-0.5 rounded-full border border-[#00A693]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A693] animate-pulse" /> Live
                    </span>
                  </div>
                  {(() => {
                    const cfg = APP_TYPE_CFG[project.appType] || APP_TYPE_CFG.web;
                    return (
                      <span className={`absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow backdrop-blur-sm ${cfg.cls}`}>
                        <cfg.Icon size={9} /> {cfg.label}
                      </span>
                    );
                  })()}
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-[#1A1A1A] truncate">{project.title}</h3>
                  <p className="text-xs text-[#6B7280] mt-1 line-clamp-2 leading-relaxed">{project.description}</p>

                  {project.techTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {project.techTags.slice(0, 4).map(t => (
                        <span key={t} className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {project.techTags.length > 4 && (
                        <span className="text-xs text-[#6B7280] px-1">+{project.techTags.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[#00A693] hover:bg-[#007D6F] text-white rounded-lg px-3 py-2 font-medium transition-colors"
                    >
                      <ExternalLink size={12} /> Visit Live
                    </a>
                    <Link
                      to={`/project/${project._id}`}
                      className="flex items-center justify-center gap-1.5 text-xs border border-[#E5E1DA] text-[#6B7280] hover:border-[#00A693]/40 hover:text-[#00A693] rounded-lg px-3 py-2 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-[#B0A99F] mt-10">
          Powered by <a href="/" className="text-[#00A693] hover:underline font-medium">ShareMyApps</a>
        </p>
      </div>
    </div>
  );
}
