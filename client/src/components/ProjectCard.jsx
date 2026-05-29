import { Link } from 'react-router-dom';
import { ExternalLink, Heart, Star } from 'lucide-react';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80';
const getbanner = (bannerImage, liveUrl) => bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=800`;

const TAG_COLORS = [
  'bg-blue-50 text-blue-700',
  'bg-green-50 text-green-700',
  'bg-purple-50 text-purple-700',
  'bg-yellow-50 text-yellow-700',
  'bg-pink-50 text-pink-700',
  'bg-[#E6F7F5] text-[#00A693]',
];

function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash += tag.charCodeAt(i);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function avgRating(ratings = []) {
  if (!ratings.length) return null;
  return (ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1);
}

export default function ProjectCard({ project }) {
  const { _id, title, description, liveUrl, bannerImage, techTags = [], owner, likes = [], ratings = [] } = project;
  const avg = avgRating(ratings);

  return (
    <div className="group bg-white border border-[#E5E1DA] rounded-xl overflow-hidden hover:shadow-md hover:border-[#00A693]/30 transition-all duration-200 flex flex-col">
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
                : <span className="w-6 h-6 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{owner.name[0].toUpperCase()}</span>
              }
              <span className="text-xs text-[#6B7280] truncate">{owner.name}</span>
            </div>
          )}
          <div className="flex items-center gap-3 shrink-0">
            {avg && (
              <span className="flex items-center gap-0.5 text-xs text-[#F59E0B] font-medium">
                <Star size={11} className="fill-[#F59E0B]" /> {avg}
              </span>
            )}
            {likes.length > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-[#9CA3AF]">
                <Heart size={11} /> {likes.length}
              </span>
            )}
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#00A693] hover:text-[#007D6F] font-medium transition-colors"
            >
              Visit <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
