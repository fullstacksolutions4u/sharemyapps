import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Star, Eye, Zap, Award, Trophy, Sparkles, Sprout } from 'lucide-react';

const BADGE_CFG = {
  active:   { label: 'Active Member',      Icon: Zap,    cls: 'text-blue-500' },
  top:      { label: 'Top Contributor',    Icon: Award,  cls: 'text-amber-500' },
  champion: { label: 'Community Champion', Icon: Trophy, cls: 'text-purple-500' },
};

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
  const { _id, title, description, liveUrl, bannerImage, owner, likes = [], ratings = [], viewCount = 0, featured } = project;
  const avg = avgRating(ratings);

  return (
    <div className="group bg-white border border-accent/30 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-accent/60 transition-all duration-200 flex flex-col">
      {/* Banner */}
      <Link to={`/project/${_id}`} className="block overflow-hidden relative">
        {featured && (
          <span className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
            <Sparkles size={9} /> Featured for feedback
          </span>
        )}
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
            <h3 className="font-semibold text-text hover:text-accent transition-colors leading-tight mb-1">{title}</h3>
          </Link>
          <p className="text-sm text-muted line-clamp-2 leading-relaxed">{description}</p>
        </div>

        <div className="mt-auto pt-3 border-t border-border flex items-center justify-between gap-2">
          {owner && (
            <div className="flex items-center gap-2 min-w-0">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                : <span className={`w-6 h-6 rounded-full ${avatarColor(owner.name)} text-white text-xs flex items-center justify-center font-medium shrink-0`}>{owner.name?.[0]?.toUpperCase() || '?'}</span>
              }
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-muted truncate leading-tight min-w-0">{owner.name}</span>
                  {owner.badge === 'new_member' && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 leading-tight shrink-0">
                      <Sprout size={10} /> New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {owner.badge !== 'new_member' && BADGE_CFG[owner.badge] && (() => {
                    const { label, Icon, cls } = BADGE_CFG[owner.badge];
                    return (
                      <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium leading-tight ${cls}`}>
                        <Icon size={10} /> {label}
                      </span>
                    );
                  })()}
                  {owner.projectCount > 0 && (
                    <span className="text-[10px] text-[#9CA3AF] leading-tight">{owner.projectCount} project{owner.projectCount !== 1 ? 's' : ''}</span>
                  )}
                </div>
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
            {viewCount > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF]">
                <Eye size={11} /> {viewCount >= 1000 ? `${(viewCount / 1000).toFixed(1)}k` : viewCount}
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
