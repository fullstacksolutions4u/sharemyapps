import { useEffect, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ExternalLink, Mail, ArrowLeft, ChevronLeft, ChevronRight, Pencil, Trash2, EyeOff, Heart, Star, Send, Trash, MessageSquare, X, Eye, UserCircle2, Zap, Award, Trophy } from 'lucide-react';

const BADGE_CFG = {
  new_member: { label: 'New Member',         Icon: UserCircle2, cls: 'bg-[#F3F0EB] text-muted border-border' },
  active:     { label: 'Active Member',      Icon: Zap,         cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  top:        { label: 'Top Contributor',    Icon: Award,       cls: 'bg-amber-50 text-amber-600 border-amber-200' },
  champion:   { label: 'Community Champion', Icon: Trophy,      cls: 'bg-purple-50 text-purple-600 border-purple-200' },
};

const GithubIcon = ({ size = 15 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.2 22 16.447 22 12.021 22 6.484 17.522 2 12 2z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const LeetCodeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/>
  </svg>
);

import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80';
const toAbsUrl = (url) => url && !/^https?:\/\//i.test(url) ? `https://${url}` : url;
const getbanner = (bannerImage, liveUrl) => bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=1200`;

const TAG_COLORS = ['bg-blue-50 text-blue-700','bg-green-50 text-green-700','bg-purple-50 text-purple-700','bg-yellow-50 text-yellow-700','bg-pink-50 text-pink-700','bg-[#E6F7F5] text-[#00A693]'];
function tagColor(tag) {
  let h = 0; for (let i = 0; i < tag.length; i++) h += tag.charCodeAt(i);
  return TAG_COLORS[h % TAG_COLORS.length];
}

function StarPicker({ value, onChange, disabled }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
        >
          <Star
            size={20}
            className={`transition-colors ${(hovered || value) >= n ? 'text-[#F59E0B] fill-[#F59E0B]' : 'text-[#D1D5DB]'}`}
          />
        </button>
      ))}
    </div>
  );
}

function timeAgo(date) {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return 'just now';
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function DescriptionBlock({ text }) {
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el) setClamped(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`text-[#374151] leading-relaxed text-sm ${!expanded ? 'line-clamp-5' : ''}`}
      >
        {text}
      </p>
      {(clamped || expanded) && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="mt-1.5 text-xs font-medium text-[#00A693] hover:text-[#007D6F] transition-colors"
        >
          {expanded ? 'Read less' : 'Read more'}
        </button>
      )}
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [msgOpen, setMsgOpen] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSending, setMsgSending] = useState(false);

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [rating, setRating] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [otherProjects, setOtherProjects] = useState([]);

  const [viewCount, setViewCount] = useState(0);

  const [following, setFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    api.get(`/projects/${id}`)
      .then(res => {
        const p = res.data;
        setProject(p);
        setLikeCount(p.likes?.length || 0);
        setViewCount(p.viewCount || 0);
        if (user) setLiked(p.likes?.some(l => (l._id || l) === user._id) || false);
        if (p.ratings?.length) {
          const avg = p.ratings.reduce((s, r) => s + r.value, 0) / p.ratings.length;
          setAvgRating(Math.round(avg * 10) / 10);
          setRatingCount(p.ratings.length);
          if (user) {
            const mine = p.ratings.find(r => (r.user?._id || r.user) === user._id);
            if (mine) setUserRating(mine.value);
          }
        }
        // follow state
        const ownerFollowers = p.owner?.followers || [];
        setFollowersCount(ownerFollowers.length);
        if (user) setFollowing(ownerFollowers.some(f => (f._id || f).toString() === user._id));
        if (p.owner?._id) {
          api.get(`/projects/user/${p.owner._id}`)
            .then(r => setOtherProjects((r.data.projects || []).filter(op => op._id !== id)))
            .catch(() => {});
        }
      })
      .catch(() => navigate('/explore'))
      .finally(() => setLoading(false));

    api.get(`/projects/${id}/comments`)
      .then(res => setComments(res.data))
      .catch(() => {});

    // record view once per session per project
    const key = `viewed_${id}`;
    if (!sessionStorage.getItem(key)) {
      sessionStorage.setItem(key, '1');
      api.post(`/projects/${id}/view`)
        .then(res => setViewCount(res.data.viewCount))
        .catch(() => {});
    }
  }, [id, navigate, user]);

  const handleLike = async () => {
    if (!user) { toast.error('Sign in to like projects'); return; }
    setLiking(true);
    try {
      const res = await api.post(`/projects/${id}/like`);
      setLiked(res.data.liked);
      setLikeCount(res.data.likes);
    } catch { toast.error('Failed to like'); }
    finally { setLiking(false); }
  };

  const handleFollow = async () => {
    if (!user) { toast.error('Sign in to follow developers'); return; }
    setFollowLoading(true);
    try {
      const res = await api.post(`/users/${owner?._id}/follow`);
      setFollowing(res.data.following);
      setFollowersCount(res.data.followersCount);
      toast.success(res.data.following ? `Following ${owner?.name}` : 'Unfollowed');
    } catch { toast.error('Failed to follow'); }
    finally { setFollowLoading(false); }
  };

  const handleRate = async (value) => {
    if (!user) { toast.error('Sign in to rate projects'); return; }
    setRating(true);
    try {
      const res = await api.post(`/projects/${id}/rate`, { value });
      setUserRating(res.data.userRating);
      setAvgRating(res.data.avg);
      setRatingCount(res.data.count);
      toast.success('Rating saved!');
    } catch { toast.error('Failed to rate'); }
    finally { setRating(false); }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to comment'); return; }
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/projects/${id}/comments`, { text: commentText });
      setComments(prev => [res.data, ...prev]);
      setCommentText('');
    } catch { toast.error('Failed to post comment'); }
    finally { setSubmitting(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await api.delete(`/projects/${id}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
    } catch { toast.error('Failed to delete comment'); }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!project) return null;

  const { title, description, liveUrl, bannerImage, screenshots = [], techTags = [], owner, githubUrl, githubUrls = [], githubVisible } = project;
  const images = [getbanner(bannerImage, liveUrl), ...screenshots].filter(Boolean);
  const isOwner = user && owner && user._id === owner._id;
  const allGithubUrls = githubUrls.length ? githubUrls : (githubUrl ? [githubUrl] : []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to send messages'); return; }
    if (!msgText.trim()) return;
    setMsgSending(true);
    try {
      await api.post(`/projects/${id}/message`, { text: msgText });
      toast.success('Message sent to developer!');
      setMsgText('');
      setMsgOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setMsgSending(false);
    }
  };

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link to="/explore" className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1A1A1A] mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Explore
      </Link>

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

        {/* LEFT — Image carousel */}
        <div className="lg:sticky lg:top-8">
          <div className="relative rounded-2xl overflow-hidden bg-[#F3F0EB] aspect-video">
            <img
              src={images[imgIdx]}
              alt={`${title} screenshot ${imgIdx + 1}`}
              className="w-full h-full object-cover"
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

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-[#00A693]' : 'border-transparent opacity-60 hover:opacity-100'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" onError={e => { e.target.src = PLACEHOLDER; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT — Project info */}
        <div className="flex flex-col">
          {/* Title + owner actions */}
          <div className="shrink-0 mb-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight leading-tight">{title}</h1>
              {isOwner && (
                <div className="flex items-center gap-2 shrink-0 mt-0.5">
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
          </div>

          {/* Description — grows to fill remaining space */}
          <div className="flex-1 min-h-0 mb-3">
            <DescriptionBlock text={description} />
          </div>

          {/* Tech stack tags — pinned to bottom */}
          {techTags.length > 0 && (
            <div className="shrink-0 flex flex-wrap gap-1.5">
              {techTags.map(tag => (
                <span key={tag} className={`text-xs px-2.5 py-1 rounded-full font-medium ${tagColor(tag)}`}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Likes left · Visit Live center · GitHub right */}
      <div className="grid grid-cols-3 items-center gap-4 py-4 mt-6 border-y border-[#E5E1DA]">
        {/* Left — likes, views & rating */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            disabled={liking}
            className={`flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 ${liked ? 'text-red-500' : 'text-[#6B7280] hover:text-red-400'}`}
          >
            <Heart size={17} className={liked ? 'fill-red-500' : ''} />
            <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          </button>

          <div className="w-px h-4 bg-[#E5E1DA]" />

          <span className="flex items-center gap-1.5 text-sm text-[#6B7280]">
            <Eye size={15} />
            {viewCount.toLocaleString()} {viewCount === 1 ? 'view' : 'views'}
          </span>

          <div className="w-px h-4 bg-[#E5E1DA]" />

          <div className="flex items-center gap-2">
            <StarPicker value={userRating} onChange={handleRate} disabled={rating} />
            <span className="text-sm text-[#6B7280]">
              {ratingCount > 0 ? (
                <>
                  <span className="font-semibold text-[#1A1A1A]">{avgRating}</span>
                  <span className="text-[#9CA3AF]"> / 5</span>
                </>
              ) : (
                <span className="text-[#9CA3AF] text-xs">No ratings</span>
              )}
            </span>
          </div>
        </div>

        {/* Center — Visit Live */}
        <div className="flex justify-center">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <ExternalLink size={15} /> Visit Live Project
          </a>
        </div>

        {/* Right — GitHub */}
        <div className="flex items-center gap-2 justify-end">
          {allGithubUrls.length > 0 && (isOwner || githubVisible) ? (
            <>
              <a
                href={toAbsUrl(allGithubUrls[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border border-[#E5E1DA] hover:border-[#1A1A1A] text-[#1A1A1A] px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
              >
                <GithubIcon /> GitHub
                {isOwner && !githubVisible && (
                  <span className="flex items-center gap-1 text-xs text-[#9CA3AF]">
                    <EyeOff size={11} /> hidden
                  </span>
                )}
              </a>
              {allGithubUrls.length > 1 && (
                <span className="flex items-center px-3 py-2.5 text-xs font-medium text-[#6B7280] border border-[#E5E1DA] rounded-xl whitespace-nowrap">
                  {allGithubUrls.length - 1} more git {allGithubUrls.length - 1 === 1 ? 'repo' : 'repos'}
                </span>
              )}
            </>
          ) : <span />}
        </div>
      </div>

      {/* Comments + Developer details side by side */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Comments — left (2/3) */}
        <div className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-5">
            Comments <span className="text-[#9CA3AF] font-normal">({comments.length})</span>
          </h3>

          <form onSubmit={handleComment} className="flex gap-3 mb-6">
            {user ? (
              user.avatar
                ? <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                : <span className="w-8 h-8 rounded-full bg-[#00A693] text-white text-xs flex items-center justify-center font-medium shrink-0">{user.name[0].toUpperCase()}</span>
            ) : (
              <span className="w-8 h-8 rounded-full bg-[#E5E1DA] shrink-0" />
            )}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                placeholder={user ? 'Write a comment…' : 'Sign in to comment'}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={!user || submitting}
                className="flex-1 px-4 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!user || !commentText.trim() || submitting}
                className="w-10 h-10 bg-[#00A693] hover:bg-[#007D6F] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                <Send size={15} />
              </button>
            </div>
          </form>

          {comments.length === 0 ? (
            <p className="text-sm text-[#9CA3AF] text-center py-8">No comments yet. Be the first!</p>
          ) : (
            <div className="space-y-4">
              {comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  {c.user?.avatar
                    ? <img src={c.user.avatar} alt={c.user.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    : <span className="w-8 h-8 rounded-full bg-[#E5E1DA] text-[#6B7280] text-xs flex items-center justify-center font-medium shrink-0">
                        {c.user?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#1A1A1A]">{c.user?.name}</span>
                      <span className="text-xs text-[#9CA3AF]">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-[#374151] leading-relaxed break-words">{c.text}</p>
                  </div>
                  {user && (user._id === (c.user?._id || c.user) || user.isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(c._id)}
                      className="text-[#D1D5DB] hover:text-red-400 transition-colors shrink-0 mt-1"
                    >
                      <Trash size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Developer card — right (1/3) */}
        {owner && (
          <div className="rounded-2xl overflow-hidden border border-[#E5E1DA] bg-white shadow-sm">
            {/* Header band */}
            <div className="h-16 bg-gradient-to-r from-[#00A693]/20 to-[#00A693]/5" />

            {/* Avatar + identity */}
            <div className="px-5 pb-5">
              <div className="flex items-end justify-between -mt-7 mb-4">
                <div className="relative">
                  {owner.avatar
                    ? <img src={owner.avatar} alt={owner.name} className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white shadow" />
                    : <span className="w-14 h-14 rounded-2xl bg-[#00A693] text-white text-xl font-bold flex items-center justify-center ring-4 ring-white shadow">{owner.name[0].toUpperCase()}</span>
                  }
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full ring-2 ring-white" />
                </div>
                {/* Follow button */}
                {!isOwner && (
                  <button
                    onClick={handleFollow}
                    disabled={followLoading}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-all disabled:opacity-50 ${
                      following
                        ? 'bg-[#F3F0EB] text-[#6B7280] hover:bg-red-50 hover:text-red-500'
                        : 'bg-[#00A693] text-white hover:bg-[#007D6F]'
                    }`}
                  >
                    {followLoading ? '…' : following ? 'Following' : '+ Follow'}
                  </button>
                )}
              </div>

              <p className="font-bold text-[#1A1A1A] text-base leading-tight">{owner.name}</p>
              <div className="flex items-center gap-2 mt-0.5 mb-3">
                <span className="text-xs text-muted">Developer</span>
                {BADGE_CFG[owner.badge] ? (() => {
                  const { label, Icon, cls } = BADGE_CFG[owner.badge];
                  return (
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium border ${cls}`}>
                      <Icon size={11} /> {label}
                    </span>
                  );
                })() : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-[#F3F0EB] text-muted border border-border">
                    Member
                  </span>
                )}
              </div>

              {/* Followers count */}
              <div className="flex items-center gap-1 mb-4">
                <span className="text-sm font-bold text-[#1A1A1A]">{followersCount}</span>
                <span className="text-xs text-[#9CA3AF]">{followersCount === 1 ? 'follower' : 'followers'}</span>
              </div>

              {/* Social links */}
              <div className="space-y-2 border-t border-[#F3F0EB] pt-4">
                <a
                  href={`mailto:${owner.email}`}
                  className="flex items-center gap-2.5 w-full text-[#374151] hover:text-[#00A693] px-3 py-2 rounded-xl hover:bg-[#E6F7F5] text-sm transition-colors"
                >
                  <Mail size={14} className="shrink-0 text-[#9CA3AF]" />
                  <span className="truncate">{owner.email}</span>
                </a>
                {owner.linkedinUrl && (
                  <a href={toAbsUrl(owner.linkedinUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full text-[#374151] hover:text-[#0A66C2] px-3 py-2 rounded-xl hover:bg-blue-50 text-sm transition-colors">
                    <LinkedInIcon /> LinkedIn Profile
                  </a>
                )}
                {owner.githubUrl && (
                  <a href={toAbsUrl(owner.githubUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full text-[#374151] hover:text-[#1A1A1A] px-3 py-2 rounded-xl hover:bg-[#F3F0EB] text-sm transition-colors">
                    <GithubIcon size={14} /> GitHub Profile
                  </a>
                )}
                {owner.leetcodeUrl && (
                  <a href={toAbsUrl(owner.leetcodeUrl)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2.5 w-full text-[#374151] hover:text-[#F89F1B] px-3 py-2 rounded-xl hover:bg-yellow-50 text-sm transition-colors">
                    <LeetCodeIcon /> LeetCode Profile
                  </a>
                )}
              </div>

              {/* Message button — only available after following */}
              {!isOwner && (
                <button
                  onClick={() => {
                    if (!user) { toast.error('Sign in to send messages'); return; }
                    if (!following) { toast.error('Follow the developer to send a message'); return; }
                    setMsgOpen(true);
                  }}
                  disabled={!following}
                  className={`mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    following
                      ? 'bg-[#00A693] hover:bg-[#007D6F] text-white'
                      : 'bg-[#F3F0EB] text-[#9CA3AF] cursor-not-allowed'
                  }`}
                >
                  <MessageSquare size={14} />
                  {following ? 'Message Developer' : 'Follow to Message'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* More projects by this developer */}
      {otherProjects.length > 0 && (
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-base font-semibold text-[#1A1A1A] whitespace-nowrap">
              More by {owner?.name}
            </h2>
            <div className="flex-1 h-px bg-[#E5E1DA]" />
            <Link to={`/developer/${owner?._id}`} className="text-xs text-[#00A693] hover:underline whitespace-nowrap">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {otherProjects.slice(0, 4).map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {msgOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1DA]">
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Message Developer</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Send a message to {owner?.name}</p>
              </div>
              <button onClick={() => setMsgOpen(false)} className="text-[#9CA3AF] hover:text-[#1A1A1A] transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="p-5 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-[#F3F0EB]">
                <div className="w-8 h-8 rounded-full bg-[#E6F7F5] flex items-center justify-center text-xs font-semibold text-[#00A693] shrink-0">
                  {title[0].toUpperCase()}
                </div>
                <div className="text-sm text-[#6B7280]">
                  Re: <span className="font-medium text-[#1A1A1A]">{title}</span>
                </div>
              </div>
              <textarea
                value={msgText}
                onChange={e => setMsgText(e.target.value)}
                placeholder="Write your message here…"
                rows={5}
                className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition resize-none"
              />
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setMsgOpen(false)}
                  className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E1DA] rounded-lg hover:bg-[#F3F0EB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!msgText.trim() || msgSending}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-[#00A693] hover:bg-[#007D6F] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={13} /> {msgSending ? 'Sending…' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
