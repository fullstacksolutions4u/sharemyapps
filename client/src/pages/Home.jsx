import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Brain, ShoppingBag, Hammer, Share2, CircleDollarSign, Briefcase } from 'lucide-react';
import _Lottie from 'lottie-react';
const Lottie = _Lottie.default ?? _Lottie;
import spinnerData from '../assets/spinner.json';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import DeveloperCard from '../components/recruiter/DeveloperCard';
import { useAuth } from '../context/AuthContext';
import { optimizeImage } from '../utils/image';

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
              width: 38,
              height: 38,
              borderRadius: '50%',
              objectFit: 'cover',
              display: 'block',
              border: '2px solid rgba(255,255,255,0.85)',
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

export default function Home() {
  const { user: authUser } = useAuth();
  const [networkUsers, setNetworkUsers] = useState(PLACEHOLDER_USERS);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [showcaseProjects, setShowcaseProjects] = useState([]);
  const [showcaseDevs, setShowcaseDevs] = useState([]);
  const [showcaseMentors, setShowcaseMentors] = useState([]);

  useEffect(() => {
    api.get('/users/recent?limit=100')
      .then(res => setNetworkUsers(res.data))
      .catch(() => {})
      .finally(() => setNetworkLoading(false));
    api.get('/projects/showcase?skip=99&limit=4')
      .then(res => setShowcaseProjects(res.data.slice(0, 4)))
      .catch(() => {});
    api.get('/users/showcase-devs?skip=0&limit=12')
      .then(res => setShowcaseDevs(res.data))
      .catch(() => {});
    api.get('/users/mentors')
      .then(res => setShowcaseMentors(res.data.slice(0, 12)))
      .catch(() => {});
  }, []);

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
        style={{ minHeight: 600, background: '#e0fafa' }}
      >
        <NetworkGraph users={graphUsers} networkLoading={networkLoading} />

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center relative z-10 pointer-events-none">
          {/* frosted backdrop behind text */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(224,250,250,0.82) 40%, transparent 100%)',
            pointerEvents: 'none', zIndex: -1,
          }} />
          {authUser && (
            <div className="flex flex-col items-center mb-3 pointer-events-auto">
              {authUser.avatar ? (
                <img src={optimizeImage(authUser.avatar, 150)} alt={authUser.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-accent text-white font-bold flex items-center justify-center text-base border-2 border-white shadow-md">
                  {authUser.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}
          <div className="inline-flex items-center gap-5 bg-white/60 backdrop-blur-sm text-accent text-sm font-semibold px-5 py-2 rounded-full mb-6 pointer-events-auto">
            <span className="flex items-center gap-1.5"><Hammer size={15} className="text-violet-500" /> Build</span>
            <span className="text-accent/40">•</span>
            <span className="flex items-center gap-1.5"><Share2 size={15} className="text-blue-500" /> Share</span>
            <span className="text-accent/40">•</span>
            <span className="flex items-center gap-1.5"><CircleDollarSign size={15} className="text-amber-500" /> Earn</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-text tracking-tight leading-tight mb-10" style={{ fontFamily: "'Caveat', cursive" }}>
            Be part of the developers community to unlock{" "}
            <span className="text-accent">hiring</span>,{" "}
            <span className="text-[#6366F1]">freelance</span>{" "}
            and{" "}
            <span className="text-[#F59E0B]">mentorship</span>{" "}
            opportunities
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto">
            <Link
              to="/explore"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Explore all projects <ArrowRight size={16} />
            </Link>
            <Link
              to="/find-developers"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Browse our developers <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      </div>

      {/* How it works */}
      <section className="border-y border-border bg-white">
        <div className="max-w-[1500px] mx-auto px-3 sm:px-4 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent text-center mb-8">How it works</p>
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
          <div className="relative w-full overflow-hidden group py-2" style={{ maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)' }}>
            <div className="flex animate-marquee-half gap-5 pr-5 w-max group-hover:[animation-play-state:paused]">
              {[...showcaseDevs, ...showcaseDevs].map((dev, idx) => (
                <div key={`${dev._id}-${idx}`} className="w-[300px] sm:w-[320px] flex-shrink-0">
                  <DeveloperCard dev={dev} stagger={{ ready: true, delay: (idx % showcaseDevs.length) * 50 }} hideContact />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Showcase: mentors */}
      {showcaseMentors.length > 0 && (
        <section className="max-w-[1500px] mx-auto px-3 sm:px-4 pb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-text tracking-tight">Registered Mentors</h2>
            <Link to="/mentors" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 font-medium">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="relative w-full overflow-hidden group py-2" style={{ maskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black 2%, black 98%, transparent)' }}>
            <div className="flex animate-marquee-half gap-5 pr-5 w-max group-hover:[animation-play-state:paused]" style={{ animationDirection: 'reverse' }}>
              {[...showcaseMentors, ...showcaseMentors].map((dev, idx) => (
                <div key={`${dev._id}-${idx}`} className="w-[300px] sm:w-[320px] flex-shrink-0">
                  <DeveloperCard dev={dev} stagger={{ ready: true, delay: (idx % showcaseMentors.length) * 50 }} hideContact />
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
