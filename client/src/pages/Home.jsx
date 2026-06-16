import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Star, ShoppingBag, Hammer, Share2, CircleDollarSign } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const AVATAR_PALETTE = ['#F87171','#FB923C','#FBBF24','#34D399','#38BDF8','#818CF8','#E879F9','#F472B6','#00A693'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const defaultAvatar = name => {
  const bg = avatarBg(name).replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${bg}'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%231a1a1a' opacity='.85'/%3E%3Cellipse cx='20' cy='35' rx='12' ry='9' fill='%231a1a1a' opacity='.85'/%3E%3C/svg%3E`;
};


function FloatingBubbles({ users, currentUserId }) {
  const COLS = 20;
  const SIZE = 28;

  // Per-element dead zones in the centre column — gaps between elements are left open
  const DEAD_ZONES = [
    { l: 18, r: 82, t: 10, b: 50 }, // badge + headline
    { l: 18, r: 82, t: 55, b: 65 }, // subtitle sentence
    { l: 18, r: 82, t: 68, b: 82 }, // buttons row
  ];
  const inDead = (l, t) => DEAD_ZONES.some(z => l > z.l && l < z.r && t > z.t && t < z.b);

  const bubbles = useMemo(() => {
    const rows = Math.ceil(users.length / COLS);
    const result = [];
    let placed = 0;
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (u._id === currentUserId) continue; // rendered separately as orbit bubble
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const cellW = 100 / COLS;
      const cellH = 100 / rows;
      const jL = ((i * 7 + col * 3) % (cellW * 0.6)) - cellW * 0.3;
      const jT = ((i * 11 + row * 5) % (cellH * 0.6)) - cellH * 0.3;
      const lPct = col * cellW + cellW / 2 + jL;
      const tPct = row * cellH + cellH / 2 + jT;
      if (inDead(lPct, tPct)) continue;
      result.push({
        user: u,
        left: `${lPct}%`,
        top:  `${tPct}%`,
        duration: `${14 + (placed % 8) * 2}s`,
        delay:    `${-(placed * 0.37) % 20}s`,
      });
      placed++;
    }
    return result;
  }, [users, currentUserId]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="false">
      {bubbles.map(({ user, left, top, duration, delay }, i) => (
        <BubbleAvatar key={user._id || i} user={user} left={left} top={top} size={SIZE} duration={duration} delay={delay} isMe={user._id === currentUserId} />
      ))}
    </div>
  );
}

function BubbleAvatar({ user, left, top, size, duration, delay, isMe }) {
  const [failed, setFailed] = useState(false);
  const src = (!user.avatar || failed) ? defaultAvatar(user.name) : user.avatar;

  return (
    <div
      className="absolute"
      style={{ left, top, animation: `floatBubble ${duration} ease-in-out ${delay} infinite` }}
    >
      <div
        className="bubble-tip"
        style={{ width: isMe ? size + 8 : size, height: isMe ? size + 8 : size, transform: 'translate(-50%, -50%)', pointerEvents: 'auto', position: 'relative' }}
      >
        <img
          src={src}
          alt={user.name}
          className="w-full h-full rounded-full object-cover shadow-sm"
          style={{
            opacity: isMe ? 1 : 0.55,
            border: isMe ? '2.5px solid #00A693' : '1px solid rgba(255,255,255,0.6)',
            boxShadow: isMe ? '0 0 0 3px rgba(0,166,147,0.35)' : undefined,
          }}
          onError={() => setFailed(true)}
        />
        <span className="bubble-tip-label">{isMe ? `You (${user.name})` : user.name}</span>
        {isMe && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-[#00A693] text-white px-1 rounded-sm leading-tight whitespace-nowrap">
            You
          </span>
        )}
      </div>
    </div>
  );
}



function YouOrbitBubble({ user }) {
  const [failed, setFailed] = useState(false);
  const src = (!user.avatar || failed) ? defaultAvatar(user.name) : user.avatar;
  const SIZE = 36;
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 95,
        animation: 'orbitBadge 12s linear infinite',
        zIndex: 6,
        pointerEvents: 'auto',
      }}
    >
      <div className="bubble-tip" style={{ width: SIZE, height: SIZE, transform: 'translate(-50%, -50%)', position: 'relative' }}>
        <img
          src={src}
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
          style={{ border: '2.5px solid #00A693', boxShadow: '0 0 0 3px rgba(0,166,147,0.35)', opacity: 1 }}
          onError={() => setFailed(true)}
        />
        <span className="bubble-tip-label">You ({user.name})</span>
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-bold bg-[#00A693] text-white px-1 rounded-sm leading-tight whitespace-nowrap">
          You
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user: currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bubbleUsers, setBubbleUsers] = useState([]);

  useEffect(() => {
    api.get('/projects?page=1')
      .then(res => setProjects(res.data.projects.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/users/recent?limit=400')
      .then(res => setBubbleUsers(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: 600 }}>
        {bubbleUsers.length > 0 && <FloatingBubbles users={bubbleUsers} currentUserId={currentUser?._id} />}
        {currentUser && <YouOrbitBubble user={currentUser} />}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center relative z-10 pointer-events-none">
        <div className="inline-flex items-center gap-5 bg-[#E6F7F5] text-[#00A693] text-sm font-semibold px-5 py-2 rounded-full mb-6 pointer-events-auto">
          <span className="flex items-center gap-1.5"><Hammer size={15} className="text-violet-500" /> Build</span>
          <span className="flex items-center gap-1.5"><Share2 size={15} className="text-blue-500" /> Share</span>
          <span className="flex items-center gap-1.5"><CircleDollarSign size={15} className="text-amber-500" /> Earn</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-tight mb-6">
          Turning side projects into<br />
          <span className="text-[#00A693]">opportunities and connections</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-10" style={{ fontFamily: "'Caveat', cursive", fontSize: "1.35rem" }}>
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
            className="flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
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
      <section className="border-y border-[#E5E1DA] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent text-center mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              {
                step: '01',
                icon: LayoutGrid,
                title: 'List your projects',
                desc: 'Complete your profile & Showcase live projects.',
              },
              {
                step: '02',
                icon: Users,
                title: 'Get discovered',
                desc: 'Recruiters, clients, and mentors browse your projects and portfolio and reach out directly.',
              },
              {
                step: '03',
                icon: ShoppingBag,
                title: 'Sell your apps',
                desc: 'Monetize your side projects by listing them for sale directly on the platform.',
              },
              {
                step: '04',
                icon: MessageCircle,
                title: 'Connect with devs',
                desc: 'Meet fellow developers, share ideas, and grow your network.',
              },
              {
                step: '05',
                icon: Star,
                title: 'Explore & give feedback',
                desc: 'Discover inspiring projects and leave ratings to help creators improve.',
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col gap-4 p-5 rounded-2xl border border-border hover:border-accent/40 hover:shadow-sm transition-all bg-[#FAFAF8]">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 bg-accent-light rounded-xl flex items-center justify-center">
                    <Icon size={19} className="text-accent" />
                  </div>
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
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Latest projects</h2>
          <Link to="/explore" className="text-sm text-[#00A693] hover:text-[#007D6F] flex items-center gap-1 font-medium">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)
            : projects.length > 0
              ? projects.map(p => <ProjectCard key={p._id} project={p} />)
              : (
                <div className="col-span-3 text-center py-16 text-[#6B7280]">
                  <p className="text-sm">No projects yet. <Link to="/register" className="text-[#00A693] hover:underline">Be the first to list one!</Link></p>
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
            className="inline-flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Get started — it's free <ArrowRight size={16} />
          </Link>
        </div>
      </section>

    </div>
  );
}
