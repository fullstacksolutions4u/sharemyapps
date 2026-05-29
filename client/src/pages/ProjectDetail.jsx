import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Mail, ArrowLeft, ChevronLeft, ChevronRight, Pencil, Trash2, EyeOff } from 'lucide-react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/>
  </svg>
);
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';

const TAG_COLORS = ['bg-blue-50 text-blue-700','bg-green-50 text-green-700','bg-purple-50 text-purple-700','bg-yellow-50 text-yellow-700','bg-pink-50 text-pink-700','bg-[#E6F7F5] text-[#00A693]'];
function tagColor(tag) {
  let h = 0; for (let i = 0; i < tag.length; i++) h += tag.charCodeAt(i);
  return TAG_COLORS[h % TAG_COLORS.length];
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(res => setProject(res.data))
      .catch(() => navigate('/explore'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  const { title, description, liveUrl, bannerImage, screenshots = [], techTags = [], owner, createdAt, githubUrl, githubVisible } = project;
  const images = [bannerImage || PLACEHOLDER, ...screenshots].filter(Boolean);
  const isOwner = user && owner && user._id === owner._id;

  const handleDelete = async () => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${id}`);
      toast.success('Project deleted');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to delete project');
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      {/* Image carousel */}
      <div className="relative rounded-2xl overflow-hidden mb-8 bg-[#F3F0EB]">
        <img
          src={images[imgIdx]}
          alt={`${title} screenshot ${imgIdx + 1}`}
          className="w-full h-72 sm:h-96 object-cover"
          onError={e => { e.target.src = PLACEHOLDER; }}
        />
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setImgIdx(i => (i + 1) % images.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight leading-tight">{title}</h1>
              {isOwner && (
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/dashboard/edit/${id}`}
                    className="flex items-center gap-1 text-xs text-[#6B7280] hover:text-[#00A693] border border-[#E5E1DA] px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil size={12} /> Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              )}
            </div>
            <p className="text-[#1A1A1A] leading-relaxed">{description}</p>
          </div>

          {techTags.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-2">Tech Stack</h3>
              <div className="flex flex-wrap gap-2">
                {techTags.map(tag => (
                  <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tagColor(tag)}`}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-[#6B7280]">
            Listed on {new Date(createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#00A693] hover:bg-[#007D6F] text-white px-5 py-3 rounded-xl font-medium text-sm transition-colors"
          >
            <ExternalLink size={15} /> Visit Live Project
          </a>

          {githubUrl && (isOwner || githubVisible) && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] px-5 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              <GithubIcon />
              View on GitHub
              {isOwner && !githubVisible && (
                <span className="ml-auto flex items-center gap-1 text-xs text-[#9CA3AF]">
                  <EyeOff size={11} /> hidden
                </span>
              )}
            </a>
          )}

          {owner && (
            <div className="bg-white border border-[#E5E1DA] rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Built by</h3>
              <div className="flex items-center gap-3">
                {owner.avatar
                  ? <img src={owner.avatar} alt={owner.name} className="w-10 h-10 rounded-full object-cover" />
                  : <span className="w-10 h-10 rounded-full bg-[#00A693] text-white font-medium flex items-center justify-center">{owner.name[0].toUpperCase()}</span>
                }
                <div>
                  <p className="font-medium text-sm text-[#1A1A1A]">{owner.name}</p>
                  <p className="text-xs text-[#6B7280]">Developer</p>
                </div>
              </div>
              <a
                href={`mailto:${owner.email}`}
                className="flex items-center gap-2 w-full border border-[#E5E1DA] hover:border-[#00A693] text-[#1A1A1A] hover:text-[#00A693] px-4 py-2.5 rounded-lg text-sm transition-colors font-medium"
              >
                <Mail size={14} /> {owner.email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
