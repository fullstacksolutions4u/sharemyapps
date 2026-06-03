import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LayoutGrid, Users, MessageCircle, Star } from 'lucide-react';
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
        <div className="inline-flex items-center gap-2 bg-[#E6F7F5] text-[#00A693] text-xs font-medium px-3 py-1.5 rounded-full mb-6">
          <span className="w-1.5 h-1.5 bg-[#00A693] rounded-full animate-pulse" />
          Find inspiring apps crafted by real developers
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-[#1A1A1A] tracking-tight leading-tight mb-6">
          Turning side projects into<br />
          <span className="text-[#00A693]">opportunities and connections</span>
        </h1>
        <p className="text-lg text-[#6B7280] max-w-2xl mx-auto leading-relaxed mb-10">
          Build your professional presence by showcasing real projects and connecting with recruiters, potential clients, and fellow developers
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/explore"
            className="flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent text-center mb-8">How it works</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                icon: LayoutGrid,
                title: 'List your projects',
                desc: 'Showcase your work with a live URL and tech stack.',
              },
              {
                step: '02',
                icon: Users,
                title: 'Get discovered',
                desc: 'Recruiters and clients browse projects and reach out directly.',
              },
              {
                step: '03',
                icon: MessageCircle,
                title: 'Connect with devs',
                desc: 'Meet fellow developers, share ideas, and grow your network.',
              },
              {
                step: '04',
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
        <div className="bg-[#1A1A1A] rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Built something cool?</h2>
          <p className="text-[#9CA3AF] text-sm mb-6 max-w-md mx-auto">
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

      {/* Footer */}
      <footer className="border-t border-border py-5 text-center">
        <p className="text-xs text-[#9CA3AF]">
          Powered by <span className="font-semibold text-muted">Full Stack Solutions</span>
        </p>
      </footer>
    </div>
  );
}
