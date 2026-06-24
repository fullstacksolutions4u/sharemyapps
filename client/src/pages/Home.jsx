import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Star, ShoppingBag, Hammer, Share2, CircleDollarSign } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const AVATAR_PALETTE = ['#F87171','#FB923C','#FBBF24','#34D399','#38BDF8','#818CF8','#E879F9','#F472B6','#00A693'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const defaultAvatar = name => {
  const bg = avatarBg(name).replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${bg}'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%231a1a1a' opacity='.85'/%3E%3Cellipse cx='20' cy='35' rx='12' ry='9' fill='%231a1a1a' opacity='.85'/%3E%3C/svg%3E`;
};

const COLS = 34;
const ROWS = 17;

function buildNodes(users) {
  const nodes = [];
  let idx = 0;
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // small deterministic jitter so it doesn't look like a rigid grid
      const jX = ((col * 7 + row * 13) % 9) - 4;
      const jY = ((row * 11 + col * 7) % 9) - 4;
      const x = (col / (COLS - 1)) * 94 + 3 + jX * 0.25;
      const y = (row / (ROWS - 1)) * 88 + 6 + jY * 0.25;
      nodes.push({
        id: idx,
        user: users[idx % users.length],
        x: Math.min(97, Math.max(2, x)),
        y: Math.min(96, Math.max(3, y)),
      });
      idx++;
    }
  }
  return nodes;
}

function buildEdges() {
  const edges = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      // only wire up every ~3rd node so lines are sparse
      if ((row + col) % 3 !== 0) continue;
      const curr = row * COLS + col;
      if (col < COLS - 1) edges.push([curr, curr + 1]);
      if (row < ROWS - 1) edges.push([curr, curr + COLS]);
      if (col < COLS - 1 && row < ROWS - 1 && (row * col) % 7 === 0) {
        edges.push([curr, curr + COLS + 1]);
      }
    }
  }
  return edges;
}

function NetworkGraph({ users }) {
  const pool = users.length ? users : [];
  if (!pool.length) return null;

  const nodes = buildNodes(pool);
  const edges = buildEdges();

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
  const src = (!user.avatar || failed) ? defaultAvatar(user.name) : user.avatar;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        zIndex: hovered ? 20 : 2,
        pointerEvents: 'auto',
        cursor: 'default',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={user.name}
        style={{
          width: 26,
          height: 26,
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
          bottom: 'calc(100% + 5px)',
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
    </div>
  );
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [networkUsers, setNetworkUsers] = useState([]);

  useEffect(() => {
    api.get('/projects?page=1')
      .then(res => setProjects(res.data.projects.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/users/recent?limit=700')
      .then(res => setNetworkUsers(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ minHeight: 600, background: '#e0fafa' }}
      >
        {networkUsers.length > 0 && <NetworkGraph users={networkUsers} />}

        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center relative z-10 pointer-events-none">
          {/* frosted backdrop behind text */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 70% 80% at 50% 50%, rgba(224,250,250,0.82) 40%, transparent 100%)',
            pointerEvents: 'none', zIndex: -1,
          }} />
          <div className="inline-flex items-center gap-5 bg-white/60 backdrop-blur-sm text-accent text-sm font-semibold px-5 py-2 rounded-full mb-6 pointer-events-auto">
            <span className="flex items-center gap-1.5"><Hammer size={15} className="text-violet-500" /> Build</span>
            <span className="text-accent/40">•</span>
            <span className="flex items-center gap-1.5"><Share2 size={15} className="text-blue-500" /> Share</span>
            <span className="text-accent/40">•</span>
            <span className="flex items-center gap-1.5"><CircleDollarSign size={15} className="text-amber-500" /> Earn</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-text tracking-tight leading-tight mb-6">
            Turning side projects into<br />
            <span className="text-accent">opportunities and connections</span>
          </h1>
          <p className="text-lg text-[#3d6b64] max-w-2xl mx-auto leading-relaxed mb-10" style={{ fontFamily: "'Caveat', cursive", fontSize: "1.35rem" }}>
            Be part of the developers community to unlock{" "}
            <span className="text-accent font-semibold">hiring</span>,{" "}
            <span className="text-[#6366F1] font-semibold">freelance</span>{" "}
            and{" "}
            <span className="text-[#F59E0B] font-semibold">mentorship</span>{" "}
            opportunities
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pointer-events-auto">
            <Link
              to="/explore"
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Explore registered projects <ArrowRight size={16} />
            </Link>
            <Link
              to="/register"
              className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              List your projects for opportunities
            </Link>
          </div>
        </section>
      </div>

      {/* How it works */}
      <section className="border-y border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent text-center mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { step: '01', icon: LayoutGrid,     title: 'List your projects',      desc: 'Complete your profile & Showcase live projects.' },
              { step: '02', icon: Users,           title: 'Get discovered',          desc: 'Recruiters, clients, and mentors browse your projects and portfolio and reach out directly.' },
              { step: '03', icon: ShoppingBag,     title: 'Sell your apps',          desc: 'Monetize your side projects by listing them for sale directly on the platform.' },
              { step: '04', icon: MessageCircle,   title: 'Connect with devs',       desc: 'Meet fellow developers, share ideas, and grow your network.' },
              { step: '05', icon: Star,            title: 'Explore & give feedback', desc: 'Discover inspiring projects and leave ratings to help creators improve.' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col gap-4 p-5 rounded-2xl border border-border hover:border-accent/40 hover:shadow-sm transition-all bg-[#FAFAF8]">
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

      {/* Featured Projects */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-text tracking-tight">Latest projects</h2>
          <Link to="/explore" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1 font-medium">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
            : projects.length > 0
              ? projects.map(p => <ProjectCard key={p._id} project={p} />)
              : (
                <div className="col-span-3 text-center py-16 text-muted">
                  <p className="text-sm">No projects yet. <Link to="/register" className="text-accent hover:underline">Be the first to list one!</Link></p>
                </div>
              )
          }
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Built something cool?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            List your side project for free and let the world discover it.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Get started — it's free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
