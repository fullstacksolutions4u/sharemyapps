import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Layers, AlertCircle, Mail, Phone, Monitor, Smartphone, FileText, Camera } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iNDUwIiB2aWV3Qm94PSIwIDAgODAwIDQ1MCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2YxZjVmOSIgLz48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0MDAsMjEwKSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjOTRhM2I4IiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iLTM1IiB5PSItNDUiIHdpZHRoPSI3MCIgaGVpZ2h0PSI1MCIgcng9IjQiIC8+PGxpbmUgeDE9Ii0xNSIgeTE9IjUiIHgyPSIxNSIgeTI9IjUiIC8+PGxpbmUgeDE9Ii01IiB5MT0iNSIgeDI9Ii0xMCIgeTI9IjE1IiAvPjxsaW5lIHgxPSI1IiB5MT0iNSIgeDI9IjEwIiB5Mj0iMTUiIC8+PGxpbmUgeDE9Ii0yMCIgeTE9IjE1IiB4Mj0iMjAiIHkyPSIxNSIgLz48L2c+PHRleHQgeD0iNTAlIiB5PSIyNzUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIC1hcHBsZS1zeXN0ZW0sIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IiM2NDc0OGIiPlByZXZpZXcgR2VuZXJhdGluZy4uLjwvdGV4dD48L3N2Zz4=';

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
const getbanner = (bannerImage) => bannerImage || PLACEHOLDER;

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

  const visitFired = useRef(false);
  useEffect(() => {
    if (authUser && authUser.userType === 'recruiter' && authUser._id !== userId && !visitFired.current) {
      visitFired.current = true;
      api.post(`/users/${userId}/portfolio-visit`).catch(() => {});
    }
  }, [authUser, userId]);

  if (loading) return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-5">
        <div className="h-40 bg-white border border-border rounded-3xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-56 bg-white border border-border rounded-xl animate-pulse" />)}
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <AlertCircle size={44} className="text-[#D1CBC0] mx-auto mb-3" />
        <p className="text-text font-semibold text-lg">{error}</p>
        <Link to="/explore" className="text-sm text-accent hover:underline mt-2 inline-block">Browse all projects →</Link>
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
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Profile Card */}
        <div className="relative bg-white border border-border rounded-2xl mb-8 shadow-sm overflow-hidden">

          {/* Gradient banner */}
          <div className={`${techStack.length > 0 ? 'h-28' : 'h-20'} bg-linear-to-r from-accent/20 via-teal-100/40 to-violet-100/40 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            {techStack.length > 0 && (
              <div className="absolute top-3 left-5 right-5 grid grid-cols-6 gap-x-4 gap-y-2 justify-items-center">
                {techStack.map((tag, i) => {
                  const palette = PILL_PALETTE[i % PILL_PALETTE.length];
                  const iconUrl = getIconUrl(tag, palette.hex);
                  return (
                    <span key={tag} className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap overflow-hidden ${palette.bg} ${palette.text} ${palette.border}`}>
                      {iconUrl && <img src={iconUrl} alt={tag} className="w-3.5 h-3.5 object-contain shrink-0" onError={e => { e.target.style.display = 'none'; }} />}
                      <span className="truncate">{tag}</span>
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
                  <img src={user.avatar} alt={user.name} loading="lazy"
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
              <div className="pb-1 flex flex-row items-center gap-3">
                <h1 style={{ fontFamily: "'Fredoka One', cursive", letterSpacing: '0.05em', lineHeight: 1 }}
                  className="text-4xl">
                  {user.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ').split('').map((ch, i) => {
                    const colors = ['#E53935','#FB8C00','#FDD835','#43A047','#1E88E5','#5C6BC0','#EC407A'];
                    return ch === ' '
                      ? <span key={i}>&nbsp;</span>
                      : <span key={i} style={{ color: colors[i % colors.length] }}>{ch}</span>;
                  })}
                </h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-accent-light text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
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
                <div className="inline-flex items-center rounded-full border border-teal-200 overflow-hidden hover:scale-105 transition-all">
                  <a href={`tel:${user.phone}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors">
                    <Phone size={11} className="shrink-0" />
                    {user.phone}
                  </a>
                  <a
                    href={`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent("Hi, I seen your profile on ShareMyApps portal, I would like to connect with you.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Chat on WhatsApp"
                    className="flex items-center justify-center px-2.5 py-1.5 border-l border-teal-200 bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="#25D366">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.848L.057 23.885a.75.75 0 0 0 .921.921l6.086-1.461A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.524-5.205-1.433l-.374-.223-3.865.928.944-3.77-.245-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                  </a>
                </div>
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
          <h2 className="text-sm font-semibold text-text">Deployed Projects</h2>
          <span className="text-xs text-muted">{approvedCount} total</span>
        </div>

        {projects.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-16 text-center">
            <Layers size={36} className="text-[#D1CBC0] mx-auto mb-3" />
            <p className="font-semibold text-text">No approved projects yet</p>
            <p className="text-sm text-muted mt-1">Check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(project => (
              <div key={project._id} className="bg-white border border-border rounded-xl overflow-hidden hover:border-accent/40 hover:shadow-md transition-all flex flex-col group">
                {/* Banner */}
                <div className="relative h-40 bg-[#F3F0EB] overflow-hidden">
                  <img
                    src={getbanner(project.bannerImage, project.liveUrl)}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={e => { e.target.src = PLACEHOLDER; }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-accent px-2 py-0.5 rounded-full border border-accent/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" /> Live
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
                  <h3 className="font-semibold text-text truncate">{project.title}</h3>
                  <p className="text-xs text-muted mt-1 line-clamp-2 leading-relaxed">{project.description}</p>

                  {project.techTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {project.techTags.slice(0, 4).map(t => (
                        <span key={t} className="text-xs bg-[#F3F0EB] text-muted px-2 py-0.5 rounded-full">{t}</span>
                      ))}
                      {project.techTags.length > 4 && (
                        <span className="text-xs text-muted px-1">+{project.techTags.length - 4}</span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-3 flex items-center gap-2">
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-accent hover:bg-accent-hover text-white rounded-lg px-3 py-2 font-medium transition-colors"
                    >
                      <ExternalLink size={12} /> Visit Live
                    </a>
                    <Link
                      to={`/project/${project._id}`}
                      className="flex items-center justify-center gap-1.5 text-xs border border-border text-muted hover:border-accent/40 hover:text-accent rounded-lg px-3 py-2 transition-colors"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
