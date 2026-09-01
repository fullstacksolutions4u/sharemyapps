import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, MessageCircle, Heart, Star, TrendingUp, UserPlus, Crown, Sparkles, MapPin, Laptop, ExternalLink, Clock, Calendar, Briefcase } from 'lucide-react';
import _Lottie from 'lottie-react';
import feedAnimation from '../assets/feed.json';
import easyApplyBanner from '../assets/easyapply.png';
import FeedProjectCard from '../components/FeedProjectCard';
import { useAuth } from '../context/AuthContext';
import ReportVacancyModal from '../components/ReportVacancyModal';
import { optimizeImage } from '../utils/image';

const Lottie = _Lottie.default ?? _Lottie;

const LinkedInIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const starsData = [...Array(6)].map(() => ({
  top: `${Math.random() * 80 + 10}%`,
  left: `${Math.random() * 80 + 10}%`,
  animationDelay: `${Math.random() * 4}s`,
  size: `${Math.random() * 12 + 10}px`
}));

const TwinklingStars = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
    {starsData.map((star, i) => (
      <Sparkles
        key={i}
        className="absolute text-yellow-500 opacity-0"
        style={{
          top: star.top,
          left: star.left,
          animation: `twinkle 4s ease-in-out infinite ${star.animationDelay}`,
          width: star.size,
          height: star.size,
        }}
      />
    ))}
    <style>{`
      @keyframes twinkle {
        0%, 100% { opacity: 0; transform: scale(0.5) rotate(0deg); }
        50% { opacity: 0.8; transform: scale(1.2) rotate(45deg); }
      }
    `}</style>
  </div>
);

const getDesignationStyle = (title) => {
  if (!title) return 'text-gray-500';
  const t = title.toLowerCase();
  if (t.includes('mern') || t.includes('mongo') || t.includes('express')) {
    return 'text-emerald-600';
  }
  if (t.includes('react') || t.includes('next') || t.includes('frontend') || t.includes('front-end') || t.includes('web')) {
    return 'text-cyan-600';
  }
  if (t.includes('full stack') || t.includes('fullstack')) {
    return 'text-blue-600';
  }
  if (t.includes('python') || t.includes('django') || t.includes('ml') || t.includes('ai')) {
    return 'text-indigo-600';
  }
  if (t.includes('java') || t.includes('spring')) {
    return 'text-rose-600';
  }
  if (t.includes('node') || t.includes('backend') || t.includes('back-end')) {
    return 'text-violet-600';
  }
  if (t.includes('ui') || t.includes('ux') || t.includes('design')) {
    return 'text-pink-600';
  }
  const colors = [
    'text-blue-600',
    'text-purple-600',
    'text-emerald-600',
    'text-amber-600',
    'text-rose-600',
    'text-cyan-600'
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash += title.charCodeAt(i);
  }
  return colors[hash % colors.length];
};





const parsePostedDate = (dateStr, createdAt) => {
  if (!dateStr) return new Date(createdAt || 0).getTime();
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.getTime();
  const lower = dateStr.toLowerCase();
  const now = new Date().getTime();
  if (lower.includes('today') || lower.includes('just now')) return now;
  if (lower.includes('yesterday')) return now - 86400000;
  const match = lower.match(/(\d+)\s*(day|week|month|year)s?\s*ago/);
  if (match) {
    const amount = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'day') return now - amount * 86400000;
    if (unit === 'week') return now - amount * 7 * 86400000;
    if (unit === 'month') return now - amount * 30 * 86400000;
    if (unit === 'year') return now - amount * 365 * 86400000;
  }
  return new Date(createdAt || 0).getTime();
};

export default function Feed() {
  const { user } = useAuth();
  const [activities, setActivities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [jobLinks, setJobLinks] = useState([]);
  const navigate = useNavigate();
  const [applyEligibility, setApplyEligibility] = useState(null);
  
  const isPremium = applyEligibility?.isPremium;
  const canApplyMore = !user || applyEligibility?.canApplyMore !== false;
  const [clickedLinks, setClickedLinks] = useState(() => {
    try {
      const saved = localStorage.getItem('clicked_job_links');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedbackGiven, setFeedbackGiven] = useState(() => {
    try {
      const saved = localStorage.getItem('jobLinkFeedback');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleLinkClick = (id) => {
    if (!clickedLinks.includes(id)) {
      const updated = [...clickedLinks, id];
      setClickedLinks(updated);
      try {
        localStorage.setItem('clicked_job_links', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFeedback = async (id, heardBack) => {
    try {
      if (!user) {
        import('react-hot-toast').then(t => t.default.error('Please log in to submit feedback'));
        return;
      }
      await axios.post(`/job-links/${id}/feedback`, { heardBack });
      const updated = { ...feedbackGiven, [id]: heardBack ? 'yes' : 'no' };
      setFeedbackGiven(updated);
      try {
        localStorage.setItem('jobLinkFeedback', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      import('react-hot-toast').then(t => t.default.success('Thank you for your feedback!'));
    } catch (error) {
      console.error(error);
      import('react-hot-toast').then(t => t.default.error('Failed to submit feedback'));
    }
  };
  
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
        const [feedRes, leaderRes, oppRes, jobLinksRes, applyEligRes] = await Promise.all([
          axios.get('/feed?page=1'),
          axios.get('/learning-progress/leaderboard'),
          axios.get('/vacancies').catch(() => ({ data: [] })),
          axios.get('/job-links').catch(() => ({ data: { success: false } })),
          user ? axios.get('/job-links/apply-eligibility').catch(() => null) : Promise.resolve(null),
          new Promise(resolve => setTimeout(resolve, 2000))
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
        if (jobLinksRes.data && jobLinksRes.data.success) {
          setJobLinks(jobLinksRes.data.data);
        }
        if (applyEligRes && applyEligRes.data && applyEligRes.data.success) {
          setApplyEligibility(applyEligRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [user]);

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



  const filteredJobLinks = [...jobLinks].sort((a, b) => parsePostedDate(b.postedDate, b.createdAt) - parsePostedDate(a.postedDate, a.createdAt));

  return (
    <div className="h-[calc(100vh-64px)] bg-white relative overflow-hidden">
      <div className="relative max-w-[1600px] mx-auto px-2 lg:px-4 py-4 w-full h-full flex flex-col lg:flex-row gap-4">
      
      {/* LEFT: Shared Job Links */}
      <div className="w-full lg:max-w-[25%] flex flex-col h-full">
        <div className="bg-white rounded-xl shadow-sm border border-[#5a788b] flex flex-col h-full relative overflow-hidden">
          {/* Abstract wavy background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-50 flex items-end">
            <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
              <path fill="#008b74" fillOpacity="0.08" d="M0,192L48,181.3C96,171,192,149,288,144C384,139,480,149,576,165.3C672,181,768,203,864,197.3C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#008b74" fillOpacity="0.12" d="M0,256L48,250.7C96,245,192,235,288,213.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,234.7C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="shrink-0 overflow-hidden border-b border-black/5">
            <img
              src={easyApplyBanner}
              alt="Stop Easy Apply — Start to apply through job posts"
              className="w-full h-auto block rounded-t-xl"
            />
          </div>


          <div className="overflow-y-auto custom-scrollbar px-2 pt-2 pb-1 flex-1">
            {filteredJobLinks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No job links match this filter.</p>
            ) : (
              <div className="space-y-1">
                {filteredJobLinks.slice(0, 4).map(link => {
                  const isApplied = clickedLinks.includes(link._id);
                  return (
                    <div 
                      key={link._id} 
                      className={`block pl-3 pr-2 py-2.5 rounded-lg border transition group ${
                        isApplied ? 'bg-[#006994]/5 border-[#006994]/30' : 'hover:bg-blue-50/50 border-transparent hover:border-blue-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                          <div className="flex mt-0.5 max-w-full overflow-hidden">
                            <span className={`text-[9px] font-bold uppercase tracking-wider truncate ${getDesignationStyle(link.title)}`}>
                              {link.title || 'Job Opportunity'}
                            </span>
                          </div>

                          
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-0.5">
                            {link.experience && (
                              <div className="flex items-center gap-1">
                                <Clock size={12} />
                                <span className="whitespace-nowrap">{link.experience}</span>
                              </div>
                            )}
                            {link.workMode && (
                              <div className="flex items-center gap-1">
                                <Laptop size={12} />
                                <span className="whitespace-nowrap truncate max-w-[160px]">
                                  {link.workMode}{link.location ? `, ${link.location}` : ''}
                                </span>
                              </div>
                            )}
                            {!link.workMode && link.location && (
                              <div className="flex items-center gap-1">
                                <MapPin size={12} />
                                <span className="whitespace-nowrap truncate max-w-[160px]">
                                  {link.location}
                                </span>
                              </div>
                            )}
                          </div>
                          {link.postedDate && (
                            <div className="flex items-center gap-1 text-xs text-emerald-700 font-medium mt-1.5">
                              <Calendar size={12} />
                              <span className="whitespace-nowrap">Posted: {link.postedDate}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {!user ? (
                            <Link
                              to="/login"
                              className="py-1 px-3 rounded text-[11px] font-bold uppercase tracking-wider transition-colors border flex items-center gap-1.5 shrink-0 bg-[#006994] text-white border-[#006994] hover:bg-[#005578]"
                            >
                              Sign in to apply
                            </Link>
                          ) : !isApplied && !canApplyMore && !isPremium ? (
                            <div className="relative group/unlock z-10">
                              <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); navigate('/job-post-links-premium'); }}
                                className="py-1 px-2 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 border-b-2 border-amber-300 transition-all shadow-sm"
                              >
                                <span>Upgrade</span>
                                <Crown size={10} />
                              </button>
                            </div>
                          ) : (
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              onClick={() => handleLinkClick(link._id)}
                              className={`flex items-center justify-center shrink-0 px-2 py-1 rounded-md transition-colors border text-[10px] font-bold uppercase gap-1 ${
                              isApplied 
                                ? 'bg-white text-[#006994] border-[#006994]' 
                                : 'bg-[#006994] text-white border-[#006994] hover:bg-[#005578]'
                            }`}>
                              {isApplied ? 'Visited' : 'Apply'} <ExternalLink size={10} />
                            </a>
                          )}
                          
                          {isApplied && (
                            <div className="text-[10px] text-gray-500 flex flex-col items-end gap-1 mt-1">
                              <span>Heard back?</span>
                              <div className="flex gap-1">
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFeedback(link._id, true); }} 
                                  className={`px-1.5 py-0.5 rounded border transition-colors ${feedbackGiven[link._id] === 'yes' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 font-medium' : 'border-gray-200 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                >
                                  Yes
                                </button>
                                <button 
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleFeedback(link._id, false); }} 
                                  className={`px-1.5 py-0.5 rounded border transition-colors ${feedbackGiven[link._id] === 'no' ? 'bg-red-50 text-red-600 border-red-200 font-medium' : 'border-gray-200 hover:bg-red-50 hover:text-red-600'}`}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredJobLinks.length > 0 && (
                  <Link
                    to="/opportunities?tab=job-links"
                    className="mt-6 flex items-center justify-center w-full bg-white border border-[#5a788b]/20 shadow-sm text-[#008b74] font-extrabold text-[12px] py-2 rounded-xl hover:bg-gray-50 transition-all uppercase tracking-wide"
                  >
                    View All Job Links
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

      {/* MIDDLE: Activity Stream */}
      <div className="w-full lg:max-w-[50%] flex-1 overflow-y-auto custom-scrollbar pb-10 h-full px-2 lg:px-3">
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
      <div className="w-full lg:max-w-[25%] flex-1 flex flex-col gap-4 h-full pr-1 overflow-hidden pb-4">
        
        {/* LEADERBOARD (Top 5) */}
        <div className="bg-white rounded-xl shadow-sm border border-[#5a788b] overflow-hidden shrink flex flex-col flex-1 min-h-0 relative">
          {/* Abstract wavy background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-50 flex items-end">
            <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
              <path fill="#008b74" fillOpacity="0.08" d="M0,192L48,181.3C96,171,192,149,288,144C384,139,480,149,576,165.3C672,181,768,203,864,197.3C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#008b74" fillOpacity="0.12" d="M0,256L48,250.7C96,245,192,235,288,213.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,234.7C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          <div className="relative z-10 flex flex-col h-full overflow-hidden">
          <div className="p-4 border-b border-black/5 bg-transparent flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg text-text">
              <Trophy size={20} className="text-violet-600" />
              Leaderboard
            </div>
            <Link 
              to="/quiz-zone" 
              className="bg-[#fbfcfa] border border-[#D4AF37] px-3 py-1.5 rounded-[12px] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center justify-center group"
            >
              <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-wide drop-shadow-sm">Quiz Zone</span>
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
                    className="flex items-center gap-2 px-3 py-2 hover:bg-violet-100/50 transition"
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
                      src={optimizeImage(user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`, 150)}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{user.name}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100/50 shadow-[0_2px_8px_rgba(245,158,11,0.1)] shrink-0 transition-transform group-hover:scale-105">
                      <span className="text-[13px] font-extrabold text-amber-600">{user.points}</span>
                      <span className="text-[10px] font-bold text-amber-500 uppercase">pts</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* REPORT VACANCY BUTTON */}
        {user && (
          <button
            onClick={() => setShowReportModal(true)}
            className="bg-[#fbfcfa] border border-[#5a788b] p-4 rounded-[18px] flex items-center justify-center transition-all w-full shrink-0 shadow-sm hover:shadow-md hover:-translate-y-0.5 group"
          >
            <span className="text-[14px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 tracking-wide drop-shadow-sm">Report your company vacancy &gt;</span>
          </button>
        )}

        <div className="bg-white rounded-xl p-4 flex flex-col relative overflow-hidden shrink shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-[#5a788b] w-full min-h-0">
          {/* Abstract wavy background at the bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none opacity-50 flex items-end">
            <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full object-cover" preserveAspectRatio="none">
              <path fill="#008b74" fillOpacity="0.08" d="M0,192L48,181.3C96,171,192,149,288,144C384,139,480,149,576,165.3C672,181,768,203,864,197.3C960,192,1056,160,1152,149.3C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              <path fill="#008b74" fillOpacity="0.12" d="M0,256L48,250.7C96,245,192,235,288,213.3C384,192,480,160,576,149.3C672,139,768,149,864,170.7C960,192,1056,224,1152,234.7C1248,245,1344,235,1392,229.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col gap-6">
            {/* OPPORTUNITIES (Jobs) */}
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-center px-1 mb-1">
                <span className="text-[15px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#008b74] to-[#5a788b] tracking-wider drop-shadow-sm text-center uppercase">Active Job Opportunities</span>
              </div>
              
              <div className="flex flex-col gap-2.5">
                {opportunities.length === 0 ? (
                   <div className="py-6 flex flex-col items-center justify-center text-slate-400 bg-[#fbfcfa] rounded-2xl border border-gray-100/60 shadow-sm">
                     <p className="text-xs font-medium">No active opportunities</p>
                   </div>
                ) : (
                  opportunities.slice(0, 3).map(job => (
                    <Link 
                      key={job._id} 
                      to="/vacancies" 
                      className="bg-[#fbfcfa] border border-gray-100/60 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center group"
                    >
                      <span className="text-[13.5px] font-semibold text-slate-800 text-center line-clamp-2 leading-tight tracking-wide drop-shadow-sm">{job.title}</span>
                    </Link>
                  ))
                )}
              </div>
              <Link 
                to="/vacancies" 
                className="mt-3 text-[12.5px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#008b74] to-teal-600 hover:opacity-80 text-center tracking-wider uppercase transition-opacity drop-shadow-sm"
              >
                View All
              </Link>
            </div>
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
  
  let wrapperClass = `sticky-curly ${rotClass} p-4 mb-8`;
  
  if (type === 'PROJECT_APPROVED' && project) {
    return <FeedProjectCard activity={activity} index={index} />;
  }
  else if (type === 'COMMUNITY_POST_CREATED' && activity.communityPost) {
    const post = activity.communityPost;
    const isAnonymous = post.anonymous;
    const categoryIcons = {
      'general': <TrendingUp size={16} />,
      'job-hunt': <Briefcase size={16} />,
      'interview': <MessageCircle size={16} />
    };
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-[#00A693]/10 text-[#00A693] p-1.5 rounded-full shrink-0">
          {categoryIcons[post.category] || <TrendingUp size={16} />}
        </div>
        <p className="text-sm text-black font-medium leading-relaxed">
          {isAnonymous ? (
            <>Community member update the status on <Link to="/community-blog" className="text-[#00A693] hover:underline font-bold transition">community blog page</Link>.</>
          ) : (
            <><span className="font-bold">{user.name}</span> added a new posts at <Link to="/community-blog" className="text-[#00A693] hover:underline font-bold transition">community blog page</Link>. read and share your opinion ....</>
          )}
        </p>
      </div>
    );
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
    const SHARE_COLORS = ['text-pink-500', 'text-orange-500', 'text-[#ad8ee8]'];
    const shareColor = SHARE_COLORS[index % SHARE_COLORS.length];
    innerContent = (
      <div className="mt-3 flex items-start gap-3">
        <div className="bg-emerald-50 text-emerald-500 p-1.5 rounded-full shrink-0">
          <UserPlus size={16} />
        </div>
        <p className="text-sm text-black font-medium">
          Glad you're here, <span className="font-semibold text-blue-600">{displayUser.name}</span>! Welcome to <span className={`font-bold ${shareColor}`}>ShareMyApps</span> community.
        </p>
      </div>
    );
  }
  else if (type === 'LEADERBOARD_TOP') {
    wrapperClass = "relative bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-100 rounded-xl shadow border border-yellow-300 p-4 transition-transform hover:scale-[1.01] hover:z-10 mb-8";
    innerContent = (
      <>
        <TwinklingStars />
        <div className="mt-4 relative z-10">
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
      </>
    );
  }
  
  if (!innerContent) return null;

  return (
    <div className={wrapperClass} style={{ '--sticky-bg': colorObj.bg, '--sticky-fold': colorObj.fold }}>
      <div className="flex items-center gap-3">
        <Link to={`/portfolio/${displayUser._id || displayUser}`}>
          <img src={optimizeImage(avatarUrl, 150)} alt={displayUser.name} className="w-10 h-10 rounded-full object-cover border border-border" />
        </Link>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Link to={`/portfolio/${displayUser._id || displayUser}`} className="font-bold text-sm text-black hover:text-primary transition">
              {displayUser.name}
            </Link>
            {displayUser.linkedinUrl && (
              <a 
                href={displayUser.linkedinUrl.startsWith('http') ? displayUser.linkedinUrl : `https://${displayUser.linkedinUrl}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:text-blue-600 transition" 
                onClick={e => e.stopPropagation()}
              >
                <LinkedInIcon size={14} />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs mt-1.5">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${getDesignationStyle(designation)}`}>
              {designation}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-[#648c98] font-medium">{timeAgo}</span>
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
                  <img src={optimizeImage(c.user?.profileImage || c.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.user?.name || 'User')}`, 150)} alt="" className="w-6 h-6 rounded-full border border-border" />
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
