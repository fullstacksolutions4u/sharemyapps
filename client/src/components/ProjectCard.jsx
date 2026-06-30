import { memo } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Star, Eye, Zap, Sparkles, Sprout, Monitor, Smartphone, Crown } from 'lucide-react';

const BADGE_CFG = {
  new_member: { label: 'New Member',    Icon: Sprout, cls: 'text-emerald-500' },
  active:     { label: 'Active Member', Icon: Zap,    cls: 'text-blue-500' },
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

const APP_TYPE_CFG = {
  mobile: { label: 'Mobile App', Icon: Smartphone, cls: 'bg-violet-500/90 text-white' },
  web:    { label: 'Web App',    Icon: Monitor,    cls: 'bg-sky-500/90 text-white' },
};

const ProjectCard = memo(function ProjectCard({ project }) {
  const { _id, title, description, liveUrl, bannerImage, owner, likes = [], ratings = [], viewCount = 0, featured, appType, category, collaborators = [], forSale, salePrice } = project;
  const appTypeCfg = APP_TYPE_CFG[appType] || APP_TYPE_CFG.web;
  const avg = avgRating(ratings);

  return (
    <div className="group bg-white border border-accent/30 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-accent/60 transition-all duration-200 flex flex-col">
      {/* Banner */}
      <Link to={`/project/${_id}`} className="block overflow-hidden relative">
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
          {featured && (
            <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow">
              <Sparkles size={9} /> Featured for feedback
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1 bg-violet-500/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow backdrop-blur-sm">
              {category}
            </span>
          )}
        </div>
        <span className={`absolute top-2 right-2 z-10 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full shadow backdrop-blur-sm ${appTypeCfg.cls}`}>
          <appTypeCfg.Icon size={9} /> {appTypeCfg.label}
        </span>
        <img
          src={getbanner(bannerImage, liveUrl)}
          alt={title}
          loading="lazy"
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
          <div className="flex items-center gap-2 min-w-0 flex-1">
          {owner && (
            <div className="flex items-center gap-2 min-w-0">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                : <span className={`w-6 h-6 rounded-full ${avatarColor(owner.name)} text-white text-xs flex items-center justify-center font-medium shrink-0`}>{owner.name?.[0]?.toUpperCase() || '?'}</span>
              }
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs text-muted truncate leading-tight min-w-0">{owner.name}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {owner.premiumServices?.length > 0 ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-600 leading-tight">
                      <Crown size={10} /> Premium Member
                    </span>
                  ) : BADGE_CFG[owner.badge] && (() => {
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
          {collaborators.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-[#9CA3AF]">with</span>
              <div className="flex items-center gap-1">
                {collaborators.slice(0, 2).map(c => (
                  <div key={c._id} className="flex items-center gap-1">
                    {c.avatar
                      ? <img src={c.avatar} alt={c.name} className="w-4 h-4 rounded-full object-cover ring-1 ring-white shrink-0" />
                      : <span className={`w-4 h-4 rounded-full ${avatarColor(c.name)} text-white text-[7px] flex items-center justify-center font-semibold ring-1 ring-white shrink-0`}>{c.name?.[0]?.toUpperCase()}</span>
                    }
                    <span className="text-[10px] text-muted truncate max-w-13">{c.name.split(' ')[0]}</span>
                  </div>
                ))}
                {collaborators.length > 2 && (
                  <span className="text-[10px] text-muted">+{collaborators.length - 2}</span>
                )}
              </div>
            </div>
          )}
          </div>
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
            <div className="flex flex-col items-end gap-0.5">
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-accent hover:text-accent-hover font-medium transition-colors"
              >
                Visit <ExternalLink size={12} />
              </a>
              {forSale && salePrice && (
                <span className="text-[10px] font-semibold text-amber-500 leading-none">₹{Number(salePrice).toLocaleString('en-IN')}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectCard;
