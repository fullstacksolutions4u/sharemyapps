import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80';

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

export default function ProjectCard({ project }) {
  const { _id, title, description, liveUrl, bannerImage, techTags = [], owner } = project;

  return (
    <div className="group bg-white border border-[#E5E1DA] rounded-xl overflow-hidden hover:shadow-md hover:border-[#00A693]/30 transition-all duration-200 flex flex-col">
      {/* Banner */}
      <Link to={`/project/${_id}`} className="block overflow-hidden">
        <img
          src={bannerImage || PLACEHOLDER}
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

        {techTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techTags.slice(0, 4).map(tag => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColor(tag)}`}>{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-[#E5E1DA] flex items-center justify-between">
          {owner && (
            <div className="flex items-center gap-2">
              {owner.avatar
                ? <img src={owner.avatar} alt={owner.name} className="w-6 h-6 rounded-full object-cover" />
                : <span className="w-6 h-6 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium">{owner.name[0].toUpperCase()}</span>
              }
              <span className="text-xs text-[#6B7280]">{owner.name}</span>
            </div>
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
  );
}
