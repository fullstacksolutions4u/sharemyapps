import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Star, CheckCircle, Code, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../utils/image';

const LinkedInIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const TAG_COLORS = [
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200'
];

export default function FeedProjectCard({ activity, index = 0 }) {
  const { user: activityUser, project, createdAt } = activity;
  const { user: authUser } = useAuth();
  
  const [likes, setLikes] = useState(project?.likes || []);
  const [liking, setLiking] = useState(false);
  const [ratings, setRatings] = useState(project?.ratings || []);
  const [ratingLoading, setRatingLoading] = useState(false);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showRating, setShowRating] = useState(false);

  if (!activityUser || !project) return null;

  // Computed
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  const designation = activityUser.designations?.[0] || 'Developer';
  const avatarUrl = activityUser.profileImage || activityUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activityUser.name)}&background=random`;
  
  const isLiked = authUser && likes.some(id => (id._id || id).toString() === authUser._id.toString());
  const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.value, 0) / ratings.length).toFixed(1) : null;
  const userRating = authUser ? ratings.find(r => (r.user?._id || r.user)?.toString() === authUser._id.toString())?.value : null;

  const handleLike = async () => {
    if (!authUser) return toast.error('Sign in to like projects');
    setLiking(true);
    try {
      const res = await axios.post(`/projects/${project._id}/like`);
      // Reconstruct likes array locally
      if (res.data.liked) {
        setLikes([...likes, authUser._id]);
      } else {
        setLikes(likes.filter(id => (id._id || id).toString() !== authUser._id.toString()));
      }
      
      if (res.data.awardedCoins) {
        toast.success(`You earned ${res.data.awardedCoins} coins!`, { icon: '🪙', duration: 2000 });
      }
    } catch {
      toast.error('Failed to like');
    } finally {
      setLiking(false);
    }
  };

  const handleRate = async (value) => {
    if (!authUser) return toast.error('Sign in to rate');
    setRatingLoading(true);
    try {
      const res = await axios.post(`/projects/${project._id}/rate`, { value });
      // Update local ratings
      const existing = ratings.findIndex(r => (r.user?._id || r.user)?.toString() === authUser._id.toString());
      const newRatings = [...ratings];
      if (existing >= 0) newRatings[existing].value = value;
      else newRatings.push({ user: authUser._id, value });
      setRatings(newRatings);
      setShowRating(false);
      
      if (res.data.awardedCoins) {
        toast.success(`Rating saved & earned ${res.data.awardedCoins} coins!`, { icon: '🪙', duration: 2000 });
      } else {
        toast.success('Rating saved!');
      }
    } catch {
      toast.error('Failed to rate');
    } finally {
      setRatingLoading(false);
    }
  };

  const toggleComments = async () => {
    setShowComments(!showComments);
    if (!showComments && !commentsLoaded) {
      try {
        const res = await axios.get(`/projects/${project._id}/comments`);
        setComments(res.data);
        setCommentsLoaded(true);
      } catch {
        toast.error('Failed to load comments');
      }
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!authUser) return toast.error('Sign in to comment');
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`/projects/${project._id}/comments`, { text: commentText });
      setComments([res.data, ...comments]);
      setCommentText('');
      
      if (res.data.awardedCoins) {
        toast.success(`You earned ${res.data.awardedCoins} coins!`, { icon: '🪙', duration: 2000 });
      }
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const STICKY_COLORS = [
    { bg: '#fdf7df', fold: '#e8dfb8' }, // Yellow
    { bg: '#dffdf0', fold: '#b8e8d5' }, // Emerald
    { bg: '#dfeafd', fold: '#b8cde8' }, // Blue
    { bg: '#fddfef', fold: '#e8b8d4' }, // Pink
    { bg: '#eedffd', fold: '#cdb8e8' }, // Purple
    { bg: '#fdf0df', fold: '#e8d2b8' }, // Orange
  ];
  const ROTATIONS = ['-rotate-1', 'rotate-1', 'rotate-0', '-rotate-1', 'rotate-1', 'rotate-0'];
  const colorObj = STICKY_COLORS[index % STICKY_COLORS.length];
  const rotClass = ROTATIONS[index % ROTATIONS.length];

  return (
    <div 
      className={`sticky-curly ${rotClass} p-5 mb-8 transition-transform hover:scale-[1.01] hover:z-10`}
      style={{ '--sticky-bg': colorObj.bg, '--sticky-fold': colorObj.fold }}
    >
      {/* 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Info & Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* User Header */}
            <div className="flex items-center gap-3 mb-4">
              <img src={optimizeImage(avatarUrl, 150)} alt={activityUser.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-black/5" />
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Link to={`/portfolio/${activityUser._id}`} className="font-bold text-black hover:text-primary transition leading-tight">
                    {activityUser.name}
                  </Link>
                  {activityUser.linkedinUrl && (
                    <a 
                      href={activityUser.linkedinUrl.startsWith('http') ? activityUser.linkedinUrl : `https://${activityUser.linkedinUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-500 hover:text-blue-600 transition" 
                      onClick={e => e.stopPropagation()}
                    >
                      <LinkedInIcon size={14} />
                    </a>
                  )}
                </div>
                <span className="text-xs font-medium text-gray-900">
                  {designation} • {timeAgo}
                </span>
              </div>
            </div>
            
            {/* Activity Text */}
            <div className="flex items-start gap-2 mb-2 text-sm text-black font-medium">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-gray-700">
                  Published a new application in <span className="font-semibold text-black capitalize">{project.category || 'General'}</span> category
                </span>
                <Link to={`/project/${project._id}`} className="text-blue-600 hover:underline transition font-bold text-[15px] mt-1.5">
                  {project.title}
                </Link>
              </div>
            </div>
            {project.techTags && project.techTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pl-6 mt-2">
                {project.techTags.slice(0, 5).map((tag, i) => (
                  <span key={i} className={`px-2 py-0.5 rounded-md text-[11px] font-bold border uppercase ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                    {tag}
                  </span>
                ))}
                {project.techTags.length > 5 && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[11px] font-medium border border-gray-200">
                    +{project.techTags.length - 5} more
                  </span>
                )}
              </div>
            )}

          </div>
          
          {/* Inline Action Bar */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border pl-6 relative">
            <button 
              disabled={liking}
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition ${isLiked ? 'text-rose-500' : 'text-gray-900 hover:text-rose-500'}`}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              {likes.length}
            </button>
            
            <button 
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-primary transition"
            >
              <MessageCircle size={18} />
              {commentsLoaded ? comments.length : 'Comment'}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowRating(!showRating)}
                className={`flex items-center gap-1.5 text-sm font-medium transition ${userRating ? 'text-amber-500' : 'text-gray-900 hover:text-amber-500'}`}
              >
                <Star size={18} className={userRating ? 'fill-amber-400 text-amber-400' : ''} />
                {avgRating || 'Rate'}
              </button>
              
              {showRating && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white border border-border rounded-lg shadow-lg p-2 flex gap-1 z-10">
                  {[1, 2, 3, 4, 5].map(v => (
                    <button
                      key={v}
                      disabled={ratingLoading}
                      onClick={() => handleRate(v)}
                      className="p-1 hover:scale-110 transition disabled:opacity-50"
                    >
                      <Star size={20} className={v <= (userRating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Side: Thumbnail */}
        <div className="w-full md:w-64 shrink-0 flex flex-col">
          <Link to={`/project/${project._id}`} className="block flex-1 group rounded-lg overflow-hidden border border-border shadow-sm">
            {project.bannerImage ? (
              <img src={optimizeImage(project.bannerImage, 800)} alt={project.title} className="w-full h-full min-h-[140px] object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="w-full h-full min-h-[140px] bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center group-hover:scale-105 transition duration-300">
                <Code size={40} className="text-gray-400" />
              </div>
            )}
          </Link>
        </div>
        
      </div>
      
      {/* Comments Dropdown */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border">
          <form onSubmit={submitComment} className="flex gap-2 mb-4">
            <input 
              type="text" 
              placeholder="Add a comment..." 
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              className="flex-1 bg-bg border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary transition"
            />
            <button 
              type="submit" 
              disabled={submitting || !commentText.trim()}
              className="bg-primary hover:bg-primary-hover text-white p-2 rounded-full transition disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </form>
          
          <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {!commentsLoaded ? (
              <div className="text-center text-sm text-slate-700 py-4">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-sm text-slate-700 py-4">No comments yet. Be the first!</div>
            ) : (
              comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <img src={optimizeImage(c.user?.profileImage || c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}&background=random`, 150)} className="w-8 h-8 rounded-full border border-border shrink-0" />
                  <div className="bg-bg rounded-2xl rounded-tl-none p-3 flex-1">
                    <p className="text-xs font-bold text-slate-900 mb-0.5">{c.user?.name}</p>
                    <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
