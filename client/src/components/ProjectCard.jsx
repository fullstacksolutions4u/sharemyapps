import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Star } from 'lucide-react';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500', 'bg-amber-500',
  'bg-emerald-500', 'bg-cyan-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-orange-500', 'bg-teal-500',
];
const avatarColor = (name = '') => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const getbanner = (bannerImage, liveUrl) => bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=800`;

function avgRating(ratings = []) {
  if (!ratings.length) return null;
  return (ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1);
}

export default function ProjectCard({ project }) {
  const { _id, title, description, liveUrl, bannerImage, owner, likes = [], ratings = [] } = project;
  const avg = avgRating(ratings);

  return (
    <div className="group bg-white border border-accent/30 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-accent/60 transition-all duration-200 flex flex-col">
      {/* Banner */}
      <Link to={`/project/${_id}`} className="block overflow-hidden">
        <img
          src={getbanner(bannerImage, liveUrl)}
          alt={title}
          className="w-full h-44 object-cover group-hover:scale-[1.02] transition-transform duration-300"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
      </Link>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div>
          <Link to={`/project/${_id}`}>
            <h3 className="font-semibold text-[#1A1A1A] hover:text-[#00A693] transition-colors leading-tight mb-1">{title}</h3>
          </Link>
          <p className="text-sm text-[#6B7280] line-clamp-2 leading-relaxed">{description}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-[#E5E1DA] flex items-center justify-between gap-2">
          {owner && (
            <div className="flex items-center gap-2 min-w-0">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                : <span className={`w-6 h-6 rounded-full ${avatarColor(owner.name)} text-white text-xs flex items-center justify-center font-medium shrink-0`}>{owner.name?.[0]?.toUpperCase() || '?'}</span>
              }
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted truncate leading-tight">{owner.name}</span>
                {owner.projectCount > 0 && (
                  <span className="text-[10px] text-[#9CA3AF] leading-tight">{owner.projectCount} project{owner.projectCount !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {avg && (
              <span className="flex items-center gap-0.5 text-xs text-[#F59E0B] font-medium">
                <Star size={11} className="fill-[#F59E0B]" /> {avg}
              </span>
            )}
            {likes.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-red-500">
                <Heart size={11} className="fill-red-500" /> {likes.length}
              </span>
            )}
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
            >
              Visit <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
