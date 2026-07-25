import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, MessageCircle, Heart, Star, TrendingUp, Briefcase, ChevronRight, UserPlus, Crown, Share2 } from 'lucide-react';
import _Lottie from 'lottie-react';
import feedAnimation from '../assets/feed.json';
import FeedProjectCard from '../components/FeedProjectCard';
import { useAuth } from '../context/AuthContext';
import ReportVacancyModal from '../components/ReportVacancyModal';

const Lottie = _Lottie.default ?? _Lottie;

export default function Feed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  
  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const observer = useRef();
  const lastActivityElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // Initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [feedRes, leaderRes, oppRes] = await Promise.all([
          axios.get('/feed?page=1'),
          axios.get('/learning-progress/leaderboard'),
          axios.get('/vacancies').catch(() => ({ data: [] })),
          new Promise(resolve => setTimeout(resolve, 2000)) // ensure spinner shows for at least 2 seconds
        ]);
        if (feedRes.data.success) {
          setActivities(feedRes.data.data);
          setHasMore(feedRes.data.hasMore);
        }
        if (leaderRes.data.success) {
          setLeaderboard(leaderRes.data.leaderboard);
        }
        if (oppRes.data) {
          const rawOpps = Array.isArray(oppRes.data) ? oppRes.data : oppRes.data.data || [];
          setOpportunities(rawOpps.filter(job => job.status === 'active'));
        }
      } catch (err) {
        console.error('Failed to load feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Load more data when page changes
  useEffect(() => {
    if (page === 1) return; // handled by initial load
    
    const fetchMoreData = async () => {
      setLoadingMore(true);
      try {
        const feedRes = await axios.get(`/feed?page=${page}`);
        if (feedRes.data.success) {
          setActivities(prev => [...prev, ...feedRes.data.data]);
          setHasMore(feedRes.data.hasMore);
        }
      } catch (err) {
        console.error('Failed to load more feed data', err);
      } finally {
        setLoadingMore(false);
      }
    };
    fetchMoreData();
  }, [page]);

  if (loading) return (
    <div className="flex justify-center items-center h-[70vh] w-full">
      <Lottie animationData={feedAnimation} loop={true} className="w-40 h-40" />
    </div>
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-accent/10 via-white to-violet-50 relative">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #00A693 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative max-w-7xl mx-auto px-[10px] py-4 w-full flex flex-col md:flex-row gap-4">
      {/* LEFT: Activity Stream */}
      <div className="flex-[2] md:max-w-[70%]">
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-border">
            <p className="text-muted">No activity yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map((activity, index) => {
              if (activities.length === index + 1) {
                return (
                  <div ref={lastActivityElementRef} key={activity._id}>
                    <ActivityCard activity={activity} index={index} />
                  </div>
                );
              } else {
                return <ActivityCard key={activity._id} activity={activity} index={index} />;
              }
            })}
            
            {loadingMore && (
              <div className="flex justify-center py-2">
                <Lottie animationData={feedAnimation} loop={true} className="w-16 h-16" />
              </div>
            )}
            {!hasMore && activities.length > 0 && (
              <div className="text-center py-6 text-muted text-sm">
                You've reached the end of the feed!
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT: Leaderboard & Opportunities */}
      <div className="flex-1 md:max-w-[30%] flex flex-col gap-6 sticky top-20 max-h-[calc(100vh-100px)] overflow-y-auto custom-scrollbar pb-4 pr-1">
        
        {/* LEADERBOARD (Top 5) */}
        <div className="bg-linear-to-br from-violet-50/80 to-purple-50/50 rounded-xl shadow-sm border border-black/5 overflow-hidden shrink-0 flex flex-col h-[360px]">
          <div className="p-4 border-b border-black/5 bg-transparent flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg text-text">
              <Trophy size={20} className="text-violet-600" />
              Leaderboard
            </div>
            <Link 
              to="/quiz-zone" 
              className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              Quiz Zone
            </Link>
          </div>
          
          <div className="p-0 flex-1 overflow-y-auto custom-scrollbar">
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center text-muted">No data available</div>
            ) : (
              <div className="divide-y divide-black/5">
                {leaderboard.slice(0, 5).map((user, idx) => (
                  <Link 
                    key={user.userId} 
                    to={`/portfolio/${user.userId}`}
                    className="flex items-center gap-3 p-3 hover:bg-violet-100/50 transition"
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-bg text-muted'
                    }`}>
                      {idx === 0 ? <Crown size={12} className="fill-yellow-500 text-yellow-600" /> : idx + 1}
                    </div>
                    
                    <img 
                      src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{user.name}</p>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-primary">{user.points}</span>
                      <span className="text-[10px] text-muted">pts</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* REPORT VACANCY BUTTON */}
        {user && (
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-gradient-to-r from-[#00A693] to-[#007D6F] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2.5 transition-all w-full shrink-0 shadow-[0_4px_14px_0_rgba(0,166,147,0.39)] hover:shadow-[0_6px_20px_rgba(0,166,147,0.23)] hover:-translate-y-0.5"
          >
            <Share2 size={18} className="drop-shadow-sm" />
            Share Vacancy
          </button>
        )}

        {/* OPPORTUNITIES (Jobs) */}
        <div className="bg-linear-to-br from-amber-50/80 to-yellow-50/50 rounded-xl shadow-sm border border-black/5 flex flex-col overflow-hidden shrink-0 h-[360px]">
          
          <div className="p-4 border-b border-black/5 bg-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-bold text-lg text-text">
              <TrendingUp size={20} className="text-primary" />
              Active Job Opportunities
            </div>
            <Link 
              to="/vacancies" 
              className="text-xs bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 relative z-10"
            >
              View All
            </Link>
          </div>
          <div className="p-0 flex-1 overflow-y-auto custom-scrollbar relative">
            {opportunities.length === 0 ? (
               <div className="p-10 flex flex-col items-center justify-center text-muted">
                 <Briefcase size={32} className="opacity-20 mb-3" />
                 <p className="text-sm">No active opportunities</p>
               </div>
            ) : (
               <div className="divide-y divide-black/5">
                 {opportunities.slice(0, 5).map(job => (
                    <Link 
                      key={job._id} 
                      to="/vacancies" 
                      className="group flex items-center justify-between p-4 hover:bg-black/5 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="flex items-start gap-3 relative z-10 w-full pr-6">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors shadow-sm">
                          <Briefcase size={16} className="text-primary" />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0 justify-center">
                          <p className="text-sm font-medium text-text line-clamp-2 group-hover:text-primary transition-colors leading-snug">{job.title}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-primary opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 absolute right-4 z-10" />
                    </Link>
                 ))}
               </div>
            )}
          </div>
        </div>

      </div>
      </div>

      <ReportVacancyModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
        user={user} 
      />
    </div>
  );
}

// Sub-component for individual activity feed items
function ActivityCard({ activity, index = 0 }) {
  const { user: currentUser } = useAuth();
  const { type, user, project, module, createdAt, meta, _id } = activity;
  
  const [likes, setLikes] = useState(activity.likes || []);
  const [comments, setComments] = useState(activity.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const hasLiked = currentUser && likes.includes(currentUser._id);

  const handleLike = async () => {
    if (!currentUser) return;
    try {
      const res = await axios.post(`/feed/${_id}/like`);
      if (res.data.success) setLikes(res.data.likes);
    } catch (err) { console.error(err); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !currentUser || submitting) return;
    setSubmitting(true);
    try {
      const res = await axios.post(`/feed/${_id}/comment`, { text: commentText });
      if (res.data.success) {
        setComments([...comments, res.data.comment]);
        setCommentText('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  if (!user) return null;

  const displayUser = (type === 'PROJECT_LIKED' || type === 'PROJECT_RATED') && project?.owner 
    ? project.owner 
    : user;

  const designation = displayUser.designations && displayUser.designations.length > 0 ? displayUser.designations[0] : 'Developer';
  const avatarUrl = displayUser.profileImage || displayUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayUser.name)}&background=random`;
  
  let innerContent = null;
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
  
  let wrapperClass = `sticky-curly ${rotClass} p-4 transition-transform hover:scale-[1.01] hover:z-10 mb-8`;
  
  if (type === 'PROJECT_APPROVED' && project) {
    return <FeedProjectCard activity={activity} index={index} />;
  }
  else if (type === 'MODULE_STARTED' && module) {
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-blue-100 text-blue-600 p-1.5 rounded-full shrink-0">
          <TrendingUp size={16} />
        </div>
        <p className="text-sm text-black font-medium">
          Started learning the quiz zone module: <span className="font-semibold text-primary">{module.title}</span>.
        </p>
      </div>
    );
  }
  else if (type === 'MODULE_COMPLETED' && module) {
    wrapperClass = "bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-4 transition hover:shadow-md mb-4";
    innerContent = (
      <div className="mt-3">
        <div className="flex items-start gap-3">
          <div className="bg-yellow-400 text-white p-1.5 rounded-full shrink-0">
            <Trophy size={16} />
          </div>
          <p className="text-sm text-black font-medium">
            Successfully completed the quiz zone module: <span className="font-semibold text-primary">{module.title}</span>! 🎉
          </p>
        </div>
        
        {(meta?.score !== undefined || meta?.rank) && (
          <div className="mt-3 ml-9 flex items-center gap-4 text-sm font-medium">
            {meta?.score !== undefined && (
              <div className="bg-white px-3 py-1 rounded-full text-primary shadow-sm border border-border">
                Score: {meta.score} pts
              </div>
            )}
            {meta?.rank && (
              <div className="bg-white px-3 py-1 rounded-full text-accent shadow-sm border border-border">
                Current Rank: #{meta.rank}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  else if (type === 'PROJECT_LIKED' && project) {
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-red-50 text-red-500 p-1.5 rounded-full shrink-0">
          <Heart size={16} fill="currentColor" />
        </div>
        <p className="text-sm text-black font-medium">
          Project <Link to={`/project/${project._id}`} className="text-blue-500 hover:underline transition">{project.title}</Link> received a new <span className="font-semibold text-rose-500">like</span> from a community member!
        </p>
      </div>
    );
  }
  else if (type === 'PROJECT_COMMENTED' && project) {
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-gray-100 text-gray-600 p-1.5 rounded-full shrink-0">
          <MessageCircle size={16} />
        </div>
        <p className="text-sm text-black font-medium">
          Commented on the application <Link to={`/project/${project._id}`} className="text-blue-500 hover:underline transition">{project.title}</Link>.
        </p>
      </div>
    );
  }
  else if (type === 'PROJECT_RATED' && project) {
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-yellow-50 text-yellow-500 p-1.5 rounded-full shrink-0">
          <Star size={16} fill="currentColor" />
        </div>
        <p className="text-sm text-black font-medium">
          Project <Link to={`/project/${project._id}`} className="text-blue-500 hover:underline transition">{project.title}</Link> received a new <span className="font-semibold text-amber-500">rating</span> from a community member!
        </p>
      </div>
    );
  }
  else if (type === 'USER_JOINED') {
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-full shrink-0">
          <UserPlus size={16} />
        </div>
        <p className="text-sm text-black font-medium">
          Glad you're here, <span className="font-semibold">{displayUser.name}</span>! Welcome to ShareMyApps community as {designation ? <span className="font-medium text-slate-700">{designation}</span> : 'a member'}.
        </p>
      </div>
    );
  }
  else if (type === 'LEADERBOARD_TOP') {
    wrapperClass = "bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100 rounded-xl shadow border border-yellow-300 p-4 transition-transform hover:scale-[1.01] hover:z-10 mb-8";
    innerContent = (
      <div className="mt-4">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 text-white p-2 rounded-full shadow-inner">
            <Crown size={24} />
          </div>
          <p className="text-base text-black font-semibold">
            Just reached <span className="text-yellow-600 font-bold">#1</span> on the Global Leaderboard! 🎉
          </p>
        </div>
        {meta?.score !== undefined && (
          <div className="mt-3 ml-12 inline-flex bg-white px-4 py-1.5 rounded-full text-sm font-bold text-yellow-700 shadow-sm border border-yellow-200">
            {meta.score} Points
          </div>
        )}
      </div>
    );
  }
  
  if (!innerContent) return null;

  return (
    <div className={wrapperClass} style={{ '--sticky-bg': colorObj.bg, '--sticky-fold': colorObj.fold }}>
      <div className="flex items-center gap-3">
        <Link to={`/portfolio/${displayUser._id || displayUser}`}>
          <img src={avatarUrl} alt={displayUser.name} className="w-10 h-10 rounded-full object-cover border border-border" />
        </Link>
        <div className="flex flex-col">
          <Link to={`/portfolio/${displayUser._id || displayUser}`} className="font-bold text-sm text-black hover:text-primary transition">
            {displayUser.name}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-900 mt-0.5">
            <span className="font-medium text-gray-900">{designation}</span>
            <span>•</span>
            <span>{timeAgo}</span>
          </div>
        </div>
      </div>
      {innerContent}
      
      {type === 'LEADERBOARD_TOP' && (
        <div className="mt-4 ml-12 border-t border-black/10 pt-3">
          <div className="flex items-center gap-4 text-sm font-medium">
            <button 
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-colors ${hasLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'}`}
            >
              <Heart size={16} className={hasLiked ? 'fill-current' : ''} />
              <span>{likes.length}</span>
            </button>
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-1.5 text-gray-500 hover:text-blue-500 transition-colors"
            >
              <MessageCircle size={16} />
              <span>{comments.length}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-3">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <img src={c.user?.profileImage || c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}`} alt="" className="w-6 h-6 rounded-full border border-border" />
                  <div className="bg-white/60 rounded-xl px-3 py-1.5 text-sm flex-1">
                    <span className="font-semibold text-xs mr-2">{c.user?.name}</span>
                    <span className="text-gray-800">{c.text}</span>
                  </div>
                </div>
              ))}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 mt-2">
                <input 
                  type="text" 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Congratulate them..." 
                  className="flex-1 bg-white border border-black/10 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:border-blue-300"
                  disabled={submitting}
                />
                <button 
                  type="submit" 
                  disabled={submitting || !commentText.trim()} 
                  className="text-blue-600 font-semibold text-sm px-2 disabled:opacity-50"
                >
                  Post
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
