import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, GitBranch, Link2, Globe, Layers, AlertCircle } from 'lucide-react';
import api from '../api/axios';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
const getbanner = (bannerImage, liveUrl) =>
  bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=400`;

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
    <div className="max-w-5xl mx-auto px-4 py-16 space-y-4">
      <div className="h-24 bg-white border border-[#E5E1DA] rounded-2xl animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-52 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto px-4 py-24 text-center">
      <AlertCircle size={40} className="text-[#6B7280] mx-auto mb-3" />
      <p className="text-[#1A1A1A] font-semibold text-lg">{error}</p>
      <Link to="/explore" className="text-sm text-[#00A693] hover:underline mt-2 inline-block">Browse all projects</Link>
    </div>
  );

  const { user, projects } = data;
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Profile header */}
      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full object-cover shrink-0 border-2 border-[#E5E1DA]" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[#E6F7F5] flex items-center justify-center shrink-0 border-2 border-[#E5E1DA]">
            <span className="text-2xl font-bold text-[#00A693]">{initials}</span>
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-[#1A1A1A]">{user.name}</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            {projects.length} deployed project{projects.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
            {user.linkedinUrl && (
              <a href={user.linkedinUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#0A66C2] hover:underline font-medium">
                <Link2 size={14} /> LinkedIn
              </a>
            )}
            {user.githubUrl && (
              <a href={user.githubUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-[#1A1A1A] hover:underline font-medium">
                <Github size={14} /> GitHub
              </a>
            )}
          </div>
        </div>
        <div className="shrink-0">
          <Link to="/explore"
            className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#00A693] border border-[#E5E1DA] rounded-lg px-3 py-1.5 transition-colors">
            <Globe size={12} /> Explore all projects
          </Link>
        </div>
      </div>

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <Layers size={36} className="text-[#D1CBC0] mx-auto mb-3" />
          <p className="font-semibold text-[#1A1A1A]">No approved projects yet</p>
          <p className="text-sm text-[#6B7280] mt-1">Check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map(project => (
            <div key={project._id} className="bg-white border border-[#E5E1DA] rounded-xl overflow-hidden hover:border-[#00A693]/40 hover:shadow-sm transition-all flex flex-col">
              {/* Banner */}
              <div className="relative h-36 bg-[#F3F0EB]">
                <img
                  src={getbanner(project.bannerImage, project.liveUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
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
        Powered by <a href="/" className="text-[#00A693] hover:underline">ShareMyApps</a>
      </p>
    </div>
  );
}
