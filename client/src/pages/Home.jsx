import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Star, ShoppingBag } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

const AVATAR_PALETTE = ['#F87171','#FB923C','#FBBF24','#34D399','#38BDF8','#818CF8','#E879F9','#F472B6','#00A693'];
const avatarBg = name => AVATAR_PALETTE[(name?.charCodeAt(0) ?? 0) % AVATAR_PALETTE.length];
const defaultAvatar = name => {
  const bg = avatarBg(name).replace('#', '%23');
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='${bg}'/%3E%3Ccircle cx='20' cy='15' r='7' fill='%231a1a1a' opacity='.85'/%3E%3Cellipse cx='20' cy='35' rx='12' ry='9' fill='%231a1a1a' opacity='.85'/%3E%3C/svg%3E`;
};

function DevAvatar({ dev }) {
  const [failed, setFailed] = useState(false);
  if (!dev.avatar || failed)
    return <img src={defaultAvatar(dev.name)} alt={dev.name} title={dev.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" />;
  return <img src={dev.avatar} alt={dev.name} title={dev.name} className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-sm" onError={() => setFailed(true)} />;
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [devAvatars, setDevAvatars] = useState([]);
  const [devsLoading, setDevsLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/projects?page=1')
      .then(res => setProjects(res.data.projects.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
    api.get('/users/recent?limit=25')
      .then(res => {
        setDevAvatars(res.data.slice(-5));
      })
      .catch(() => {})
      .finally(() => setDevsLoading(false));
    api.get('/users/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-4 bg-[#E6F7F5] text-[#00A693] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span>• Build</span><span>• Share</span><span>• Earn</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-tight mb-6">
          Turning side projects into<br />
          <span className="text-[#00A693]">opportunities and connections</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-10" style={{ fontFamily: "'Caveat', cursive", fontSize: "1.35rem" }}>
          Be active in this platform for{" "}
          <span className="text-accent font-semibold">hiring</span>,{" "}
          <span className="text-[#6366F1] font-semibold">freelance projects</span>{" "}
          and{" "}
          <span className="text-[#F59E0B] font-semibold">mentorship</span>{" "}
          Opportunities
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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

        {/* Social proof */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <div className="flex -space-x-2">
            {devsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 animate-pulse shadow-sm block" />
                ))
              : devAvatars.map((dev, i) => <DevAvatar key={i} dev={dev} />)
            }
          </div>
          {stats !== null
            ? <p className="text-sm text-muted">
                <span className="font-semibold text-text">{stats.developerCount.toLocaleString()}</span> developers,{" "}
                <span className="font-semibold text-text">{(stats.recruiterCount + 15).toLocaleString()}</span> clients,{" "}
                <span className="font-semibold text-text">{(stats.menteeCount + 20).toLocaleString()}</span> students registered with us so far
              </p>
            : <span className="h-4 w-72 bg-gray-200 animate-pulse rounded-full block" />
          }
        </div>
      </section>

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
                  <span className="text-2xl font-bold text-border">{step}</span>
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
