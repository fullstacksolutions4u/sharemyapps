import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import AppSpinner from '../components/AppSpinner';
import { formatDistanceToNow } from 'date-fns';
import { Trophy, CheckCircle, Code, MessageCircle, Heart, Star, Sparkles, TrendingUp } from 'lucide-react';

export default function Feed() {
  const [activities, setActivities] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [feedRes, leaderRes] = await Promise.all([
          axios.get('/feed'),
          axios.get('/learning-progress/leaderboard')
        ]);
        if (feedRes.data.success) {
          setActivities(feedRes.data.data);
        }
        if (leaderRes.data.success) {
          setLeaderboard(leaderRes.data.leaderboard);
        }
      } catch (err) {
        console.error('Failed to load feed', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <AppSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex flex-col md:flex-row gap-8">
      {/* LEFT: Activity Stream */}
      <div className="flex-[2] md:max-w-[70%]">
        {activities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-border">
            <p className="text-muted">No activity yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activities.map(activity => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Leaderboard */}
      <div className="flex-1 md:max-w-[30%]">
        <div className="sticky top-24 bg-white rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-white flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg text-text">
              <Trophy size={20} className="text-primary" />
              Leaderboard
            </div>
            <Link 
              to="/quiz-zone" 
              className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
            >
              Quiz Zone
            </Link>
          </div>
          
          <div className="p-0">
            {leaderboard.length === 0 ? (
              <div className="p-6 text-center text-muted">No data available</div>
            ) : (
              <div className="divide-y divide-border">
                {leaderboard.map((user, idx) => (
                  <Link 
                    key={user.userId} 
                    to={`/portfolio/${user.userId}`}
                    className="flex items-center gap-3 p-3 hover:bg-bg transition"
                  >
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                      idx === 1 ? 'bg-gray-200 text-gray-600' :
                      idx === 2 ? 'bg-orange-100 text-orange-600' :
                      'bg-bg text-muted'
                    }`}>
                      {idx + 1}
                    </div>
                    
                    <img 
                      src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover"
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
      </div>
    </div>
  );
}

// Sub-component for individual activity feed items
function ActivityCard({ activity }) {
  const { type, user, project, module, createdAt, meta } = activity;
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  let content = null;
  
  if (type === 'PROJECT_APPROVED' && project) {
    content = (
      <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden transition hover:shadow-md">
        <div className="p-4 flex items-start gap-4">
          <div className="bg-green-100 text-green-600 p-2 rounded-full mt-1 shrink-0">
            <CheckCircle size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text">
              Application <Link to={`/project/${project._id}`} className="font-semibold text-primary hover:underline transition">{project.title}</Link> by <Link to={`/portfolio/${project.owner?._id}`} className="font-medium text-accent hover:underline">{project.owner?.name}</Link> was published!
            </p>
            <p className="text-xs text-muted mt-1">{timeAgo}</p>
            
            <Link to={`/project/${project._id}`} className="mt-3 block group">
              <div className="rounded-lg border border-border overflow-hidden bg-bg group-hover:border-primary transition">
                {project.bannerImage ? (
                  <img src={project.bannerImage} alt={project.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-r from-gray-200 to-gray-300 flex items-center justify-center">
                    <Code size={40} className="text-gray-400" />
                  </div>
                )}
                <div className="p-3 bg-white">
                  <h3 className="font-bold text-text truncate group-hover:text-primary transition">{project.title}</h3>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  else if (type === 'MODULE_STARTED' && module) {
    content = (
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 flex gap-4 items-center transition hover:shadow-md">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full shrink-0">
          <TrendingUp size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text">
            Participation in quiz zone module <span className="font-semibold text-primary">{module.title}</span> started.
          </p>
          <p className="text-xs text-muted mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }
  else if (type === 'MODULE_COMPLETED' && module) {
    content = (
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-4 transition hover:shadow-md">
        <div className="flex gap-4">
          <div className="bg-yellow-400 text-white p-2 rounded-full shrink-0 h-10 w-10 flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text">
              Participation in quiz zone module <span className="font-semibold text-primary">{module.title}</span> was successfully completed! 🎉
            </p>
            <p className="text-xs text-muted mt-1">{timeAgo}</p>
            
            {(meta?.score !== undefined || meta?.rank) && (
              <div className="mt-3 flex items-center gap-4 text-sm font-medium">
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
        </div>
      </div>
    );
  }
  else if (type === 'PROJECT_LIKED' && project) {
    content = (
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 flex gap-4 items-center transition hover:shadow-md">
        <div className="bg-red-50 text-red-500 p-2 rounded-full shrink-0">
          <Heart size={20} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text">
            Application <Link to={`/project/${project._id}`} className="font-semibold text-primary hover:underline transition">{project.title}</Link> by <Link to={`/portfolio/${project.owner?._id}`} className="font-medium text-accent hover:underline">{project.owner?.name}</Link> got a like.
          </p>
          <p className="text-xs text-muted mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }
  else if (type === 'PROJECT_COMMENTED' && project) {
    content = (
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 flex gap-4 items-center transition hover:shadow-md">
        <div className="bg-gray-100 text-gray-600 p-2 rounded-full shrink-0">
          <MessageCircle size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text">
            Application <Link to={`/project/${project._id}`} className="font-semibold text-primary hover:underline transition">{project.title}</Link> by <Link to={`/portfolio/${project.owner?._id}`} className="font-medium text-accent hover:underline">{project.owner?.name}</Link> got a comment.
          </p>
          <p className="text-xs text-muted mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }
  else if (type === 'PROJECT_RATED' && project) {
    content = (
      <div className="bg-white rounded-xl shadow-sm border border-border p-4 flex gap-4 items-center transition hover:shadow-md">
        <div className="bg-yellow-50 text-yellow-500 p-2 rounded-full shrink-0">
          <Star size={20} fill="currentColor" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text">
            Application <Link to={`/project/${project._id}`} className="font-semibold text-primary hover:underline transition">{project.title}</Link> by <Link to={`/portfolio/${project.owner?._id}`} className="font-medium text-accent hover:underline">{project.owner?.name}</Link> got a rating {meta?.rating && <span className="font-bold">({meta.rating} stars)</span>}.
          </p>
          <p className="text-xs text-muted mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }
  
  return content;
}
