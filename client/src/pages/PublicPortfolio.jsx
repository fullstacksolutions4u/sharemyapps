import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Layers, AlertCircle, Mail, Phone } from 'lucide-react';
import api from '../api/axios';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
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
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  const hasSocial = user.linkedinUrl || user.githubUrl || user.leetcodeUrl;

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Profile Card */}
        <div className="relative bg-white border border-border rounded-2xl mb-8 shadow-sm overflow-hidden">

          {/* Gradient banner */}
          <div className="h-20 bg-linear-to-r from-accent/20 via-teal-100/40 to-violet-100/40 relative">
            <div className="absolute inset-0 opacity-20"
              style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          </div>

          <div className="px-6 pb-6">
            {/* Avatar row — overlaps banner */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-5">
              <div className="shrink-0">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name}
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-accent/30 to-teal-200 flex items-center justify-center border-4 border-white shadow-md">
                    <span className="text-2xl font-bold text-accent">{initials}</span>
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-extrabold text-text leading-tight">{user.name}</h1>
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-accent-light text-accent px-2.5 py-0.5 rounded-full mt-1 border border-accent/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  {approvedCount} deployed project{approvedCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Contact + Social row */}
            <div className="flex flex-wrap items-center gap-3">

              {/* Contact chips */}
              {user.email && (
                <a href={`mailto:${user.email}`}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200 transition-all hover:shadow-sm group">
                  <span className="w-6 h-6 rounded-lg bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center shrink-0 transition-colors">
                    <Mail size={12} className="text-teal-600" />
                  </span>
                  {user.email}
                </a>
              )}
              {user.phone && (
                <a href={`tel:${user.phone}`}
                  className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200 transition-all hover:shadow-sm group">
                  <span className="w-6 h-6 rounded-lg bg-teal-100 group-hover:bg-teal-200 flex items-center justify-center shrink-0 transition-colors">
                    <Phone size={12} className="text-teal-600" />
                  </span>
                  {user.phone}
                </a>
              )}

              {/* Divider */}
              {(hasContact && hasSocial) && (
                <div className="hidden sm:block w-px h-6 bg-border" />
              )}

              {/* Social pills */}
              {hasSocial && (
                <div className="flex flex-wrap gap-2">
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
