import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Star, CheckCircle, Code, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import toast from 'react-hot-toast';

export default function FeedProjectCard({ activity }) {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-border p-5 mb-6 transition hover:shadow-md">
      {/* 2-Column Layout */}
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Left Side: Info & Actions */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            {/* User Header */}
            <div className="flex items-center gap-3 mb-4">
              <img src={avatarUrl} alt={activityUser.name} className="w-10 h-10 rounded-full object-cover shrink-0 border border-border" />
              <div className="flex flex-col">
                <Link to={`/portfolio/${activityUser._id}`} className="font-bold text-text hover:text-primary transition leading-tight">
                  {activityUser.name}
                </Link>
                <span className="text-xs text-muted">
                  {designation} • {timeAgo}
                </span>
              </div>
            </div>
            
            {/* Activity Text */}
            <div className="flex items-start gap-2 mb-2 text-sm text-text">
              <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
              <p>
                Published a new application:{' '}
                <Link to={`/project/${project._id}`} className="text-blue-500 hover:underline transition">
                  {project.title}
                </Link>
              </p>
            </div>
            {project.description && (
              <p className="text-sm text-muted line-clamp-2 pl-6">
                {project.description}
              </p>
            )}
          </div>
          
          {/* Inline Action Bar */}
          <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border pl-6 relative">
            <button 
              disabled={liking}
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm font-medium transition ${isLiked ? 'text-rose-500' : 'text-muted hover:text-rose-500'}`}
            >
              <Heart size={18} className={isLiked ? 'fill-current' : ''} />
              {likes.length}
            </button>
            
            <button 
              onClick={toggleComments}
              className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-primary transition"
            >
              <MessageCircle size={18} />
              {commentsLoaded ? comments.length : 'Comment'}
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setShowRating(!showRating)}
                className={`flex items-center gap-1.5 text-sm font-medium transition ${userRating ? 'text-amber-500' : 'text-muted hover:text-amber-500'}`}
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
        <div className="w-full md:w-64 shrink-0">
          <Link to={`/project/${project._id}`} className="block group rounded-lg overflow-hidden border border-border shadow-sm">
            {project.bannerImage ? (
              <img src={project.bannerImage} alt={project.title} className="w-full h-32 md:h-full min-h-[140px] object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="w-full h-32 md:h-full min-h-[140px] bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center group-hover:scale-105 transition duration-300">
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
              <div className="text-center text-sm text-muted py-4">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="text-center text-sm text-muted py-4">No comments yet. Be the first!</div>
            ) : (
              comments.map(c => (
                <div key={c._id} className="flex gap-3">
                  <img src={c.user?.profileImage || c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}&background=random`} className="w-8 h-8 rounded-full border border-border shrink-0" />
                  <div className="bg-bg rounded-2xl rounded-tl-none p-3 flex-1">
                    <p className="text-xs font-bold text-text mb-0.5">{c.user?.name}</p>
                    <p className="text-sm text-text whitespace-pre-wrap leading-relaxed">{c.text}</p>
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
