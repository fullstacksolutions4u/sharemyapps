import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Brain, ShoppingBag, Briefcase, Heart, MessageSquare, Send, Plus, X, Trash2, ChevronUp } from 'lucide-react';
import _Lottie from 'lottie-react';
const Lottie = _Lottie.default ?? _Lottie;
import spinnerData from '../assets/spinner.json';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import DeveloperCard from '../components/recruiter/DeveloperCard';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/image';
import toast from 'react-hot-toast';

const AVATAR_PALETTE = ['#F87171','#FB923C','#FBBF24','#34D399','#38BDF8','#818CF8','#E879F9','#F472B6','#00A693'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const defaultAvatar = name => {
  const bg = avatarBg(name).replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${bg}'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%231a1a1a' opacity='.85'/%3E%3Cellipse cx='20' cy='35' rx='12' ry='9' fill='%231a1a1a' opacity='.85'/%3E%3C/svg%3E`;
};

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const PLACEHOLDER_USERS = Array.from({ length: 100 }, (_, i) => ({
  _id: `ph-${i}`,
  name: LETTERS[i % LETTERS.length],
  avatar: null,
}));

// Seeded PRNG — same seed → same positions every render, no grid shape
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildLayout(users) {
  const n = users.length;
  if (!n) return { nodes: [] };
  const rand = mulberry32(0xA3F1C2);
  const placed = [];
  for (let i = 0; i < n; i++) {
    let x, y, tries = 0;
    do {
      x = rand() * 98 + 1;   // 1–99% horizontal
      y = rand() * 96 + 2;   // 2–98% vertical
      tries++;
      // min distance check: scale y by 0.5 because banner is ~2× wider than tall
    } while (tries < 50 && placed.some(p => {
      const dx = p.x - x;
      const dy = (p.y - y) * 0.5;
      return dx * dx + dy * dy < 14; // ~3.7% min spacing
    }));
    placed.push({ id: i, user: users[i], x, y });
  }
  return { nodes: placed };
}

// Connect all nodes into a single network using a Minimum Spanning Tree,
// then add extra edges for an organic web look.
function buildEdges(nodes) {
  if (nodes.length < 2) return [];
  const edgesSet = new Set();
  
  // 1. Prim's algorithm for Minimum Spanning Trees
  const inTree = new Set([0]);
  const minDist = new Array(nodes.length).fill(Infinity);
  const closestNode = new Array(nodes.length).fill(-1);
  
  for (let j = 1; j < nodes.length; j++) {
    const dx = nodes[0].x - nodes[j].x;
    const dy = nodes[0].y - nodes[j].y;
    minDist[j] = dx * dx + dy * dy;
    closestNode[j] = 0;
  }
  
  while (inTree.size < nodes.length) {
    let minD2 = Infinity;
    let bestJ = -1;
    
    for (let j = 1; j < nodes.length; j++) {
      if (!inTree.has(j) && minDist[j] < minD2) {
        minD2 = minDist[j];
        bestJ = j;
      }
    }
    
    if (bestJ === -1) break;
    
    inTree.add(bestJ);
    const a = Math.min(bestJ, closestNode[bestJ]);
    const b = Math.max(bestJ, closestNode[bestJ]);
    edgesSet.add(`${a}-${b}`);
    
    for (let j = 1; j < nodes.length; j++) {
      if (!inTree.has(j)) {
        const dx = nodes[bestJ].x - nodes[j].x;
        const dy = nodes[bestJ].y - nodes[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < minDist[j]) {
          minDist[j] = d2;
          closestNode[j] = bestJ;
        }
      }
    }
  }

  // 2. Add extra organic edges
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 110 && (i * 7 + j * 3) % 5 === 0) {
        edgesSet.add(`${i}-${j}`);
      }
    }
  }
  
  return Array.from(edgesSet).map(e => e.split('-').map(Number));
}

// Fixed pseudo-random positions for loading spinners
const SPINNER_POSITIONS = [
  { x:  8, y: 12, size: 90  },
  { x: 28, y:  6, size: 70  },
  { x: 52, y: 10, size: 110 },
  { x: 75, y:  5, size: 80  },
  { x: 92, y: 14, size: 95  },
  { x:  5, y: 45, size: 75  },
  { x: 20, y: 60, size: 100 },
  { x: 42, y: 55, size: 85  },
  { x: 65, y: 50, size: 105 },
  { x: 88, y: 48, size: 78  },
  { x: 12, y: 82, size: 95  },
  { x: 35, y: 88, size: 70  },
  { x: 58, y: 80, size: 90  },
  { x: 80, y: 85, size: 80  },
  { x: 95, y: 75, size: 100 },
];

function NetworkGraph({ users, networkLoading }) {
  if (networkLoading) {
    return (
      <div className="absolute inset-0 overflow-hidden select-none" aria-hidden="true">
        {SPINNER_POSITIONS.map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: 'translate(-50%, -50%)',
            opacity: 0.55,
            pointerEvents: 'none',
          }}>
            <Lottie animationData={spinnerData} loop style={{ width: pos.size, height: pos.size }} />
          </div>
        ))}
      </div>
    );
  }

  if (!users.length) return null;

  const { nodes } = buildLayout(users);
  const edges = buildEdges(nodes);

  return (
    <div className="absolute inset-0 overflow-hidden select-none" aria-hidden="true">
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 1, pointerEvents: 'none' }}
      >
        {edges.map(([a, b], i) => (
          <line
            key={i}
            x1={`${nodes[a].x}%`} y1={`${nodes[a].y}%`}
            x2={`${nodes[b].x}%`} y2={`${nodes[b].y}%`}
            stroke="rgba(100,180,220,0.75)"
            strokeWidth="2"
            strokeDasharray="1 6"
            strokeLinecap="round"
          />
        ))}
      </svg>
      {nodes.map(node => (
        <NetworkNode key={node.id} user={node.user} x={node.x} y={node.y} />
      ))}
    </div>
  );
}

function NetworkNode({ user, x, y }) {
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const src = (!user.avatar || failed) ? defaultAvatar(user.name) : optimizeImage(user.avatar, 150);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: hovered ? 20 : 2,
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <>
          <img
            src={src}
            alt={user.name}
            style={{
              width: 25,
              height: 25,
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              border: '1.5px solid rgba(255,255,255,0.85)',
              boxShadow: hovered ? '0 3px 14px rgba(0,100,90,0.35)' : '0 1px 4px rgba(0,0,0,0.1)',
              filter: hovered ? 'none' : 'blur(0.7px)',
              opacity: hovered ? 1 : 0.72,
              transition: 'filter 0.18s, opacity 0.18s, box-shadow 0.18s',
            }}
            onError={() => setFailed(true)}
          />
          {hovered && (
            <div style={{
              position: 'absolute',
              ...(y < 15 ? { top: 'calc(100% + 5px)' } : { bottom: 'calc(100% + 5px)' }),
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15,35,33,0.88)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 600,
              padding: '3px 8px',
              borderRadius: '5px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '0.01em',
            }}>
              {user.name}
            </div>
          )}
      </>
    </div>
  );
}

const NOTE_COLORS = [
  { bg: 'bg-[#FEF9C3]', border: 'border-[#FEF08A]', text: 'text-amber-950', secondary: 'text-amber-700/80', borderTop: 'border-t-black/10' },
  { bg: 'bg-[#DBEAFE]', border: 'border-[#BFDBFE]', text: 'text-blue-950', secondary: 'text-blue-700/80', borderTop: 'border-t-black/10' },
  { bg: 'bg-[#DCFCE7]', border: 'border-[#BBF7D0]', text: 'text-emerald-950', secondary: 'text-emerald-700/80', borderTop: 'border-t-black/10' },
  { bg: 'bg-[#FFE4E6]', border: 'border-[#FECDD3]', text: 'text-rose-950', secondary: 'text-rose-700/80', borderTop: 'border-t-black/10' },
  { bg: 'bg-[#F3E8FF]', border: 'border-[#E9D5FF]', text: 'text-purple-950', secondary: 'text-purple-700/80', borderTop: 'border-t-black/10' },
  { bg: 'bg-[#FFEDD5]', border: 'border-[#FED7AA]', text: 'text-orange-950', secondary: 'text-orange-700/80', borderTop: 'border-t-black/10' },
];

const STATUS_COLORS = [
  { name: 'text-violet-700', time: 'text-violet-400/80', content: 'text-violet-900/80', border: 'border-violet-100/60', accent: 'text-violet-500/80' },
  { name: 'text-emerald-700', time: 'text-emerald-400/80', content: 'text-emerald-900/80', border: 'border-emerald-100/60', accent: 'text-emerald-500/80' },
  { name: 'text-rose-700',    time: 'text-rose-400/80',    content: 'text-rose-900/80',    border: 'border-rose-100/60',    accent: 'text-rose-500/80'    },
  { name: 'text-amber-700',   time: 'text-amber-400/80',   content: 'text-amber-900/80',   border: 'border-amber-100/60',   accent: 'text-amber-500/80'   },
  { name: 'text-sky-700',     time: 'text-sky-400/80',     content: 'text-sky-900/80',     border: 'border-sky-100/60',     accent: 'text-sky-500/80'     },
  { name: 'text-fuchsia-700', time: 'text-fuchsia-400/80', content: 'text-fuchsia-900/80', border: 'border-fuchsia-100/60', accent: 'text-fuchsia-500/80' },
];

const ROTATE_CLASSES = ['-rotate-3', 'rotate-6 translate-x-4', '-rotate-2 -translate-x-2', 'rotate-3', '-rotate-6 -translate-x-4', 'rotate-2 translate-x-2'];

const linkify = (text, customClass = "") => {
  if (!text) return "";
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 transition-opacity cursor-pointer ${customClass}`}
          onClick={e => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

function buildCommunityCards(posts) {
  return [...posts]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map((p, idx) => ({
      id: p._id,
      authorName: p.author?.name || 'Community Member',
      authorTitle: p.category === 'interview' ? 'Interview Exp' : 'General Update',
      avatar: p.author?.avatar,
      initials: p.author?.name === 'Community Member' ? 'CM' : (p.author?.name?.charAt(0).toUpperCase() || '?'),
      color: NOTE_COLORS[idx % NOTE_COLORS.length],
      rotateClass: ROTATE_CLASSES[idx % ROTATE_CLASSES.length],
      content: p.content,
      likes: p.likes?.length || 0,
      commentsCount: p.comments?.length || 0,
      createdAt: p.createdAt,
      rawPost: p,
      isMyPost: p.isMyPost,
      isAnonymous: !!p.anonymous,
      authorId: p.author?._id,
      linkedinUrl: p.author?.linkedinUrl,
    }));
}

const MOCK_STATUS_POSTS = [
  {
    _id: 'mock-1',
    author: { name: 'Aarav Mehta', avatar: null },
    content: 'Just finished the technical interview at Microsoft. Focus heavily on DSA and system design.',
    category: 'interview',
    likes: ['user-1'],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-2',
    author: { name: 'Priya Sharma', avatar: null },
    content: 'Joined a startup as Lead React Developer! ShareMyApps helped me connect with founders.',
    category: 'general',
    likes: ['user-2'],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-3',
    author: { name: 'Karan Singh', avatar: null },
    content: 'Active job hunter in Pune, 4+ years of fullstack experience. Let me know if any teams are hiring!',
    category: 'job-hunt',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-4',
    author: { name: 'Neha Gupta', avatar: null },
    content: 'Struggling with Amazon online assessment? Practicing medium Leetcode recursion questions helps.',
    category: 'interview',
    likes: ['user-3', 'user-4'],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-5',
    author: { name: 'Vikram Malhotra', avatar: null },
    content: 'Figma to React conversion is so smooth with Tailwind CSS. Spent the day rebuilding dashboards.',
    category: 'general',
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    _id: 'mock-6',
    author: { name: 'Simran Kaur', avatar: null },
    content: 'Got a referral for a Senior Frontend Developer role at Flipkart. Fingers crossed!',
    category: 'job-hunt',
    likes: ['user-5'],
    comments: [],
    createdAt: new Date().toISOString()
  }
];

function CommunityBlogPreview() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quickStatusText, setQuickStatusText] = useState('');
  const [quickAnonymous, setQuickAnonymous] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [expandedStatusId, setExpandedStatusId] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [addingComment, setAddingComment] = useState(null);

  const fetchPosts = () => {
    api.get('/community-posts?limit=100')
      .then(res => setPosts(res.data?.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleQuickSubmit = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to share your status'); return; }
    if (!quickStatusText.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/community-posts', { content: quickStatusText, category: 'general', anonymous: quickAnonymous });
      toast.success('Status shared!');
      setQuickStatusText('');
      setQuickAnonymous(false);
      fetchPosts();
    } catch { toast.error('Failed to share'); }
    finally { setSubmitting(false); }
  };

  const handleDetailSubmit = async (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/community-posts', { content: newContent, category: 'interview', anonymous: newAnonymous });
      toast.success('Experience shared!');
      setNewContent('');
      setNewAnonymous(false);
      setIsModalOpen(false);
      fetchPosts();
    } catch { toast.error('Failed to share'); }
    finally { setSubmitting(false); }
  };

  const handleLike = async (postId) => {
    if (!user) { toast.error('Please login to like posts'); return; }
    try {
      await api.post(`/community-posts/${postId}/like`);
      fetchPosts();
    } catch { toast.error('Failed to update like'); }
  };

  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;
    setAddingComment(postId);
    try {
      await api.post(`/community-posts/${postId}/comments`, { content: commentText });
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      fetchPosts();
    } catch { toast.error('Failed to add comment'); }
    finally { setAddingComment(null); }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.delete(`/community-posts/${postId}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch { toast.error('Failed to delete'); }
  };

  const handleEditPost = async (postId, newText, category, anonymous) => {
    if (!newText || !newText.trim()) return;
    try {
      await api.put(`/community-posts/${postId}`, {
        content: newText.trim(),
        category,
        anonymous
      });
      toast.success('Post updated!');
      fetchPosts();
    } catch {
      toast.error('Failed to update post');
    }
  };

  const allPosts = (loading || posts.length > 0) ? posts : MOCK_STATUS_POSTS;
  const allCards = buildCommunityCards(allPosts);
  const experiencePosts = allCards.filter(c => c.rawPost.category === 'interview' || c.rawPost.category === 'job-hunt');
  const statusPosts = allCards.filter(c => c.rawPost.category === 'general');

  const isLeftExpanded = experiencePosts.slice(0, 3).some(c => c.id === expandedCardId);
  const isRightExpanded = experiencePosts.slice(3, 6).some(c => c.id === expandedCardId);

  const renderCard = (card, idx, isGrid = false, position = 'left') => {
    const isExpanded = expandedCardId === card.id;
    let expandClasses = '';
    if (isExpanded) {
      if (position === 'left') expandClasses = 'rotate-0 scale-[1.02] z-50 shadow-lg xl:w-[560px]';
      else if (position === 'right') expandClasses = 'rotate-0 scale-[1.02] z-50 shadow-lg xl:w-[560px] xl:-translate-x-[240px]';
      else expandClasses = 'rotate-0 scale-[1.02] z-50 shadow-lg';
    }
    return (
      <div
        key={card.id || idx}
        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
        className={`p-4 pt-5 rounded-2xl border border-t-[8px] shadow-xs transition-all duration-500 ease-in-out transform cursor-pointer relative flex flex-col justify-between ${
          isExpanded ? expandClasses : `min-h-[175px] ${isGrid ? 'rotate-0 translate-x-0 z-10' : `${card.rotateClass} z-10`}`
        } ${card.color.borderTop} ${card.color.bg} ${card.color.border} ${card.color.text}`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {card.avatar ? (
              <img src={card.avatar} alt={card.authorName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/40 border border-white/10 flex items-center justify-center font-bold text-xs">{card.initials}</div>
            )}
             <div>
              <div className="flex items-center gap-1.5 leading-none">
                {!card.isAnonymous && card.authorId && card.authorId !== 'anonymous' ? (
                  <Link
                    to={`/portfolio/${card.authorId}`}
                    className="text-xs font-bold hover:underline cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  >
                    {card.authorName}
                  </Link>
                ) : (
                  <p className="text-xs font-bold">{card.authorName}</p>
                )}
                {!card.isAnonymous && card.linkedinUrl && (
                  <a
                    href={card.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center"
                    title="LinkedIn Profile"
                  >
                    <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                  </a>
                )}
              </div>
              <p className={`text-[9px] font-bold mt-1 ${card.color.secondary}`}>{card.authorTitle}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            {card.createdAt && (
              <>
                <span className={`text-[9px] font-semibold ${card.color.secondary} opacity-80`}>
                  {new Date(card.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className={`text-[9px] font-semibold ${card.color.secondary} opacity-70`}>
                  {new Date(card.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isExpanded && (
              <span
                onClick={(e) => { e.stopPropagation(); setExpandedCardId(null); }}
                className="inline-flex items-center gap-1 text-[9.5px] font-bold hover:opacity-85 transition-opacity cursor-pointer px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 border border-black/5"
              >
                <ChevronUp size={10} />
                Show less
              </span>
            )}
            {card.isMyPost && (
              <button onClick={e => { e.stopPropagation(); handleDeletePost(card.id); }} className="p-1 opacity-60 hover:opacity-100 rounded hover:bg-black/5 transition-colors cursor-pointer" title="Delete">
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>

        {card.isMyPost ? (
          <p
            contentEditable={true}
            suppressContentEditableWarning={true}
            onClick={e => e.stopPropagation()}
            onBlur={e => handleEditPost(card.id, e.target.innerText, card.rawPost.category, card.rawPost.anonymous)}
            className={`text-[11px] leading-relaxed font-medium opacity-90 whitespace-pre-wrap flex-1 mt-2 mb-2 outline-hidden focus:bg-black/5 px-1 rounded transition-all cursor-text ${isExpanded ? '' : 'line-clamp-3'}`}
            title="Click to edit content"
          >
            {card.content}
          </p>
        ) : (
          <p className={`text-[11px] leading-relaxed font-medium opacity-90 whitespace-pre-wrap flex-1 mt-2 mb-2 ${isExpanded ? '' : 'line-clamp-3'}`}>
            {linkify(card.content)}
          </p>
        )}

        <div className={`flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 text-[9.5px] ${card.color.secondary} font-bold`}>
          <div className="flex items-center gap-3">
            <button onClick={e => { e.stopPropagation(); handleLike(card.id); }} className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Heart size={10} className={`text-rose-500 ${user && card.rawPost.likes?.includes(user._id) ? 'fill-rose-500' : ''}`} />
              <span>{card.likes}</span>
            </button>
            <div className="flex items-center gap-1"><MessageSquare size={10} /><span>{card.commentsCount || 0}</span></div>
          </div>
          {!isExpanded && <span className="hover:underline">Read more...</span>}
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-black/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {card.rawPost.comments?.length > 0 ? card.rawPost.comments.map(comment => (
                <div key={comment._id} className="flex items-start justify-between gap-1.5 bg-white/40 p-2 rounded-xl border border-black/5">
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-md bg-white/60 flex items-center justify-center font-bold text-[9px]">
                      {comment.author?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="text-[9px] font-bold leading-none">{comment.author?.name}</h6>
                      <p className="text-[10px] mt-0.5 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </div>
              )) : <p className="text-[10px] opacity-60 italic text-center py-2">No comments yet.</p>}
            </div>
            {user ? (
              <form onSubmit={e => { e.stopPropagation(); handleAddComment(e, card.id); }} onClick={e => e.stopPropagation()} className="flex gap-1.5">
                <input type="text" placeholder="Write a comment..." value={commentInputs[card.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [card.id]: e.target.value }))} className="flex-1 bg-white/60 border border-black/10 rounded-lg px-2.5 py-1 text-[10px] outline-hidden focus:border-black/25 placeholder-black/40 text-black font-medium" />
                <button type="submit" disabled={addingComment === card.id} className="bg-gray-900 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold hover:bg-gray-800 disabled:opacity-50 cursor-pointer"><Send size={9} /></button>
              </form>
            ) : <p className="text-[9px] opacity-65 italic text-center">Login to comment</p>}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      className="pb-0"
      style={{
        background: 'linear-gradient(to bottom, #F5F9FF 92%, #ffffff 100%)'
      }}
    >
      <div className="relative pt-10 pb-1 px-4 sm:px-6 lg:px-8">

        {/* Left floating cards */}
        <div className={`hidden xl:block absolute left-4 top-12 w-80 space-y-12 select-none opacity-85 transition-all duration-300 ${isLeftExpanded ? 'z-40' : 'z-10'}`}>
          {experiencePosts.slice(0, 3).map((card, idx) => renderCard(card, idx, false, 'left'))}
        </div>

        {/* Right floating cards */}
        <div className={`hidden xl:block absolute right-4 top-12 w-80 space-y-12 select-none opacity-85 transition-all duration-300 ${isRightExpanded ? 'z-40' : 'z-10'}`}>
          {experiencePosts.slice(3, 6).map((card, idx) => renderCard(card, idx, false, 'right'))}
        </div>

        {/* Section title */}
        <p 
          className="text-center text-3xl sm:text-4xl text-gray-800 mb-4 whitespace-nowrap relative z-10"
          style={{ fontFamily: "'Cookie', cursive" }}
        >
          Share your <span className="text-orange-500">career</span> &amp; <span className="text-[#F59E0B]">job hunting</span> journey with community
        </p>

        {/* Center hero block — Glass Card on top of scrollable container */}
        <div className="max-w-2xl mx-auto text-center relative z-10 mt-4">
          <div className="relative">

            {/* Glass Card (Frosted Form) positioned absolute on top with cool vibrant border */}
            <div
              className="absolute top-0 left-0 right-0 z-20 rounded-2xl px-5 py-4 border-2 border-indigo-200/90 hover:border-indigo-300 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(240,246,255,0.85) 50%, rgba(246,240,255,0.82) 100%)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 12px 36px -4px rgba(79,70,229,0.18), 0 4px 16px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.95)',
              }}
            >
              {/* Quick status form */}
              <form onSubmit={handleQuickSubmit} className="space-y-2.5">
                {/* Top row: anon toggle + add experience button */}
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      id="home-quick-anon"
                      checked={quickAnonymous}
                      onChange={e => setQuickAnonymous(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                      quickAnonymous 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs' 
                        : 'border-indigo-200 bg-white group-hover:border-indigo-400'
                    }`}>
                      {quickAnonymous && (
                        <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                          <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 font-semibold select-none group-hover:text-gray-700 transition-colors">Post anonymously</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => { if (!user) { toast.error('Please login'); return; } setNewContent(''); setNewAnonymous(false); setIsModalOpen(true); }}
                    className="inline-flex items-center gap-1 bg-[#FFDD00] hover:bg-[#FFE53B] text-black font-extrabold text-[10px] px-4 py-1.5 rounded-full transition-all cursor-pointer shrink-0 shadow-xs hover:shadow-sm active:scale-95 border border-amber-300/60"
                  >
                    <Plus size={11} className="stroke-[3]" /> Add Job Hunting Experience
                  </button>
                </div>

                {/* Input + Share row with cool border */}
                <div className="flex gap-2 items-center bg-white/95 border-2 border-indigo-100 hover:border-indigo-200/90 focus-within:border-indigo-500 focus-within:ring-3 focus-within:ring-indigo-500/15 rounded-xl px-3.5 py-1.5 shadow-xs transition-all duration-200">
                  <input
                    type="text"
                    placeholder="What's on your mind?"
                    value={quickStatusText}
                    onChange={e => setQuickStatusText(e.target.value)}
                    className="flex-1 bg-transparent text-[11.5px] font-medium placeholder-gray-400 text-gray-800 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !quickStatusText.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 transform active:scale-95 shadow-xs hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    Share
                  </button>
                </div>
              </form>
            </div>

            {/* Scrollable Status Feed behind the Glass Card */}
            {statusPosts.length > 0 && (
              <div
                className="max-h-[760px] overflow-y-auto scrollbar-none rounded-2xl border border-white/40 pt-[115px] text-left"
                style={{
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <div className="divide-y divide-white/30">
                  {statusPosts.map((card, idx) => {
                    const sc = STATUS_COLORS[idx % STATUS_COLORS.length];
                    return (
                      <div key={card.id || idx} className="px-4 py-3 hover:bg-white/20 transition-colors">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {!card.isAnonymous && card.authorId && card.authorId !== 'anonymous' ? (
                            <Link
                              to={`/portfolio/${card.authorId}`}
                              className={`text-[10.5px] font-black hover:underline cursor-pointer ${sc.name}`}
                              onClick={e => e.stopPropagation()}
                            >
                              {card.authorName}
                            </Link>
                          ) : (
                            <span className={`text-[10.5px] font-black ${sc.name}`}>{card.authorName}</span>
                          )}
                          {!card.isAnonymous && card.linkedinUrl && (
                            <a
                              href={card.linkedinUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-blue-600 hover:text-blue-800 transition-colors cursor-pointer flex items-center"
                              title="LinkedIn Profile"
                            >
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                              </svg>
                            </a>
                          )}
                          {card.createdAt && (
                            <span className={`text-[9px] font-semibold ${sc.time} ml-0.5`}>
                              {new Date(card.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                        {card.isMyPost ? (
                          <p
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => handleEditPost(card.id, e.target.innerText, card.rawPost.category, card.rawPost.anonymous)}
                            className={`text-[11px] font-medium leading-relaxed outline-hidden focus:bg-white/40 px-1 rounded transition-all cursor-text ${sc.content}`}
                            title="Click to edit content"
                          >
                            {card.content}
                          </p>
                        ) : (
                          <p className={`text-[11px] font-medium leading-relaxed ${sc.content}`}>{linkify(card.content)}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1.5">
                          <button type="button" onClick={() => handleLike(card.id)} className="flex items-center gap-1 text-rose-500 hover:opacity-70 transition-opacity cursor-pointer">
                            <Heart size={9} className={user && card.rawPost?.likes?.includes(user._id) ? 'fill-rose-500' : ''} />
                            <span className={`text-[9px] font-bold ${sc.accent}`}>{card.likes || 0}</span>
                          </button>
                          <button type="button" onClick={() => setExpandedStatusId(expandedStatusId === card.id ? null : card.id)} className={`flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer ${sc.accent}`}>
                            <MessageSquare size={9} />
                            <span className="text-[9px] font-bold">{card.commentsCount || 0}</span>
                          </button>
                        </div>
                        {expandedStatusId === card.id && (
                          <div className="mt-2 pt-2 border-t border-white/30 space-y-2 animate-in fade-in duration-200">
                            <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                              {card.rawPost?.comments?.length > 0 ? card.rawPost.comments.map(comment => (
                                <div key={comment._id} className="flex gap-1.5 bg-white/40 p-1.5 rounded-lg">
                                  <div className="w-4 h-4 rounded bg-white/70 flex items-center justify-center font-bold text-[8px] text-gray-600 shrink-0">{comment.author?.name?.charAt(0).toUpperCase()}</div>
                                  <div><p className="text-[9px] font-bold text-gray-700">{comment.author?.name}</p><p className="text-[9.5px] text-gray-600 leading-relaxed">{comment.content}</p></div>
                                </div>
                              )) : <p className="text-[9px] opacity-50 italic text-center py-1">No comments yet.</p>}
                            </div>
                            {user ? (
                              <form onSubmit={e => { e.preventDefault(); handleAddComment(e, card.id); }} className="flex gap-1.5">
                                <input type="text" placeholder="Write a comment..." value={commentInputs[card.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [card.id]: e.target.value }))} className="flex-1 bg-white/50 border border-white/40 rounded-lg px-2.5 py-1 text-[9.5px] outline-none placeholder-gray-400 text-gray-800 font-medium" />
                                <button type="submit" disabled={addingComment === card.id} className="bg-gray-800 text-white px-2 py-1 rounded-lg text-[9px] font-bold hover:bg-gray-700 disabled:opacity-50 cursor-pointer"><Send size={8} /></button>
                              </form>
                            ) : <p className="text-[9px] opacity-60 italic text-center">Login to comment</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile grid of experience cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6 xl:hidden text-left max-w-2xl mx-auto relative z-10">
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 animate-pulse h-36" />
          )) : experiencePosts.length > 0 ? experiencePosts.slice(0, 6).map((card, idx) => renderCard(card, idx, true, 'grid')) : null}
        </div>
      </div>

      {/* "View full community" CTA */}
      <div className="w-full text-right px-4 sm:px-6 lg:px-8 mt-1 relative z-10">
        <Link to="/community-blog" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-500 hover:text-accent transition-colors">
          View full community blog <ArrowRight size={12} />
        </Link>
      </div>



      {/* Experience post modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 bg-white">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all z-10">
              <X size={16} />
            </button>
            <form onSubmit={handleDetailSubmit} className="px-6 pb-6 pt-7 space-y-5">
              <h3 className="block text-sm font-black text-[#164E44] uppercase tracking-wider text-center">What's on your mind?</h3>
              <textarea required placeholder="Share a status update, interview question, or daily job hunting experience..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={6} className="w-full border-2 border-[#164E44] bg-white rounded-2xl p-4 text-[12px] font-medium outline-hidden focus:ring-1 focus:ring-[#164E44]/30 resize-none placeholder-gray-400 text-gray-800" />
              <label className="flex items-center gap-2 px-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="home-modal-anon"
                  checked={newAnonymous}
                  onChange={e => setNewAnonymous(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                  newAnonymous 
                    ? 'bg-[#164E44] border-[#164E44] text-white' 
                    : 'border-gray-300 bg-white hover:border-[#164E44]'
                }`}>
                  {newAnonymous && (
                    <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  )}
                </div>
                <span className="text-[12px] text-gray-700 font-bold select-none">Post anonymously as Community Member</span>
              </label>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 border-2 border-[#164E44] bg-white rounded-xl text-xs font-bold text-[#164E44] hover:bg-gray-50 transition-all cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting || !newContent.trim()} className="px-5 py-2 bg-[#164E44] hover:bg-[#0E3A32] disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer">
                  {submitting ? 'Saving...' : 'Share Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const { user: authUser } = useAuth();
  const [networkUsers, setNetworkUsers] = useState(PLACEHOLDER_USERS);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [showcaseProjects, setShowcaseProjects] = useState([]);
  const [showcaseDevs, setShowcaseDevs] = useState([]);
  const [targetCount, setTargetCount] = useState(4960);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    api.get('/users/recent?limit=100')
      .then(res => setNetworkUsers(res.data))
      .catch(() => {})
      .finally(() => setNetworkLoading(false));
    api.get('/projects/showcase?skip=99&limit=4')
      .then(res => setShowcaseProjects(res.data.slice(0, 4)))
      .catch(() => {});
    api.get('/users/showcase-devs?skip=0&limit=12')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setShowcaseDevs(res.data);
        } else {
          api.get('/users/developers?page=1')
            .then(devRes => {
              if (Array.isArray(devRes.data?.developers)) {
                setShowcaseDevs(devRes.data.developers.slice(0, 12));
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => {
        api.get('/users/developers?page=1')
          .then(devRes => {
            if (Array.isArray(devRes.data?.developers)) {
              setShowcaseDevs(devRes.data.developers.slice(0, 12));
            }
          })
          .catch(() => {});
      });
    api.get('/users/count')
      .then(res => {
        if (res.data && typeof res.data.count === 'number') {
          setTargetCount(res.data.count);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!targetCount) return;
    let startTimestamp = null;
    const duration = 5500; // 5.5s relaxed, smooth pace
    let animationFrame;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Gentle sinusoidal easeInOut curve (starts smoothly, counts steadily, gently settles)
      const easeInOut = 0.5 * (1 - Math.cos(Math.PI * progress));
      const current = Math.floor(targetCount * easeInOut);
      setDisplayCount(current);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(step);
      } else {
        setDisplayCount(targetCount);
      }
    };

    animationFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrame);
  }, [targetCount]);

  const graphUsers = useMemo(() => {
    if (!authUser || networkLoading) return networkUsers;
    const alreadyIn = networkUsers.some(u => u._id === authUser._id);
    if (alreadyIn) return networkUsers;
    return [{ _id: authUser._id, name: authUser.name, avatar: authUser.avatar || null }, ...networkUsers];
  }, [authUser, networkUsers, networkLoading]);

  return (
    <div className="min-h-screen">
      <style>{`
        @keyframes marquee-half {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-half {
          animation: marquee-half 40s linear infinite;
        }
      `}</style>
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 300, background: '#e0fafa' }}
      >
        <NetworkGraph users={graphUsers} networkLoading={networkLoading} />

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 text-center relative z-10 pointer-events-none">
          {/* frosted backdrop behind text */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(224,250,250,0.82) 40%, transparent 100%)',
            pointerEvents: 'none', zIndex: -1,
          }} />


          <h1 className="text-5xl sm:text-6xl font-bold text-text tracking-tight leading-tight mb-4" style={{ fontFamily: "'Caveat', cursive" }}>
            Be part of the developers community to unlock{" "}
            <span className="text-accent">hiring</span>,{" "}
            <span className="text-[#6366F1]">freelance</span>{" "}
            and{" "}
            <span className="text-[#F59E0B]">mentorship</span>{" "}
            opportunities
          </h1>

          <div className="inline-flex flex-col items-center justify-center bg-[#EBF2FC]/80 border border-[#D0E2FA]/50 px-6 py-2.5 rounded-full mb-10 pointer-events-auto select-none shadow-xs">
            <div className="flex -space-x-2 justify-center mb-1.5">
              {networkUsers.slice(6, 12).map((dev, idx) => (
                <img
                  key={dev._id || idx}
                  className="inline-block h-7 w-7 rounded-full ring-2 ring-white object-cover bg-white cursor-pointer"
                  src={dev.avatar || defaultAvatar(dev.name)}
                  alt={dev.name || 'Developer'}
                  title={dev.name || 'Developer'}
                />
              ))}
            </div>
            <span className="text-[12.5px] font-extrabold text-[#1E3A8A] tracking-wide">
              Community with {Number(displayCount).toLocaleString()} software developers
            </span>
          </div>

        </section>
      </div>

      {/* Community Blog Preview */}
      <CommunityBlogPreview />

      {/* How it works */}
      <section className="border-b border-border bg-white">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent text-center mb-8">HOW PORTAL WORKS</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { step: '01', icon: LayoutGrid,     title: 'List your projects',      desc: 'Complete your profile & Showcase live projects.' },
              { step: '02', icon: Briefcase,       title: 'Job Applications',        desc: 'There are 2 ways to apply for jobs - direct jobs listed, and applying through job posts shared by our community members.' },
              { step: '03', icon: Users,           title: 'Get discovered',          desc: 'Recruiters, clients, and mentors browse your projects and portfolio and reach out directly.' },
              { step: '04', icon: ShoppingBag,     title: 'Sell your apps',          desc: 'Monetize your side projects by listing them for sale directly on the platform.' },
              { step: '05', icon: MessageCircle,   title: 'Connect with devs',       desc: 'Meet fellow developers, share ideas, and grow your network.' },
              { step: '06', icon: Brain,           title: 'Quiz Zone',               desc: 'Test your skills with topic-based quizzes, climb the leaderboard, and prove your expertise to recruiters.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col items-center text-center gap-4 p-5 rounded-2xl border border-border hover:border-accent/40 hover:shadow-sm transition-all bg-[#FAFAF8]">
                <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
                  <Icon size={19} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-text text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase: developers #100–103 */}
      {showcaseDevs.length > 0 && (
        <section className="max-w-[1500px] mx-auto px-3 sm:px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text tracking-tight">Registered Developers</h2>
            <Link to="/portfolios" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 font-medium">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full overflow-hidden group py-2 flex" style={{ maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)' }}>
            <div className="flex animate-marquee shrink-0 gap-5 pr-5 min-w-full group-hover:[animation-play-state:paused]" style={{ display: 'flex', animationDuration: '60s' }}>
              {showcaseDevs.map((dev, idx) => (
                <div key={dev._id} className="w-[300px] sm:w-[320px] flex-shrink-0 flex flex-col">
                  <DeveloperCard dev={dev} stagger={{ ready: true, delay: (idx % showcaseDevs.length) * 50 }} hideContact hideGithub hidePortfolio />
                </div>
              ))}
            </div>
            <div className="flex animate-marquee shrink-0 gap-5 pr-5 min-w-full group-hover:[animation-play-state:paused]" style={{ display: 'flex', animationDuration: '60s' }} aria-hidden="true">
              {showcaseDevs.map((dev, idx) => (
                <div key={`dup-${dev._id}`} className="w-[300px] sm:w-[320px] flex-shrink-0 flex flex-col">
                  <DeveloperCard dev={dev} stagger={{ ready: true, delay: (idx % showcaseDevs.length) * 50 }} hideContact hideGithub hidePortfolio />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}



      {/* Showcase: projects #100–103 */}
      {showcaseProjects.length > 0 && (
        <section className="max-w-[1500px] mx-auto px-3 sm:px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text tracking-tight">Projects</h2>
            <Link to="/explore" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 font-medium">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {showcaseProjects.map(p => <ProjectCard key={p._id} project={p} />)}
          </div>
        </section>
      )}

    </div>
  );
}
