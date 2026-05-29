import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Layers, Globe, Mail } from 'lucide-react';
import api from '../api/axios';
import ProjectCard from '../components/ProjectCard';
import ProjectSkeleton from '../components/ProjectSkeleton';

export default function Home() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects?page=1')
      .then(res => setProjects(res.data.projects.slice(0, 6)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#FDF0EB] text-[#E8734A] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-[#E8734A] rounded-full animate-pulse" />
          Discover developer side projects
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-tight mb-6">
          Find apps built by<br />
          <span className="text-[#E8734A]">real developers</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-10">
          A curated showcase of side projects. Browse live apps, explore what developers are building,
          and connect with creators directly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/explore"
            className="flex items-center gap-2 bg-[#E8734A] hover:bg-[#D4612F] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Explore projects <ArrowRight size={16} />
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-2 bg-white hover:bg-[#FAF9F6] text-[#1A1A1A] border border-[#E5E1DA] px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            List your project
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-[#E5E1DA] bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { icon: Layers, title: 'List your project', desc: 'Share your side project with title, description, live URL, and screenshots.' },
            { icon: Globe, title: 'Reach visitors', desc: 'Anyone can browse and visit your live project directly from the listing.' },
            { icon: Mail, title: 'Get contacted', desc: 'Interested clients see your email and can reach you right from the project page.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-3">
              <div className="w-10 h-10 bg-[#FDF0EB] rounded-xl flex items-center justify-center">
                <Icon size={20} className="text-[#E8734A]" />
              </div>
              <h3 className="font-semibold text-[#1A1A1A] text-sm">{title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">Latest projects</h2>
          <Link to="/explore" className="text-sm text-[#E8734A] hover:text-[#D4612F] flex items-center gap-1 font-medium">
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
                  <p className="text-sm">No projects yet. <Link to="/register" className="text-[#E8734A] hover:underline">Be the first to list one!</Link></p>
                </div>
              )
          }
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Built something cool?</h2>
          <p className="text-[#9CA3AF] text-sm mb-6 max-w-md mx-auto">
            List your side project for free and let the world discover it.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#E8734A] hover:bg-[#D4612F] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
          >
            Get started — it's free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
