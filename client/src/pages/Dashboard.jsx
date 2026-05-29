import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ExternalLink, LayoutDashboard } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects/my')
      .then(res => setProjects(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(p => p.filter(x => x._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-[#6B7280] text-sm mb-1">
            <LayoutDashboard size={14} /> Dashboard
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Link
          to="/dashboard/add"
          className="flex items-center gap-2 bg-[#E8734A] hover:bg-[#D4612F] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={15} /> Add project
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <div className="w-12 h-12 bg-[#FDF0EB] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={22} className="text-[#E8734A]" />
          </div>
          <h3 className="font-semibold text-[#1A1A1A] mb-1">No projects yet</h3>
          <p className="text-sm text-[#6B7280] mb-5">List your first side project and share it with the world.</p>
          <Link
            to="/dashboard/add"
            className="inline-flex items-center gap-2 bg-[#E8734A] hover:bg-[#D4612F] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={14} /> Add your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project._id} className="bg-white border border-[#E5E1DA] rounded-xl p-4 flex items-center gap-4 hover:border-[#E8734A]/30 transition-colors">
              <img
                src={project.bannerImage || PLACEHOLDER}
                alt={project.title}
                className="w-14 h-14 rounded-lg object-cover shrink-0"
                onError={e => { e.target.src = PLACEHOLDER; }}
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-[#1A1A1A] truncate">{project.title}</h3>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{project.description}</p>
                {project.techTags?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {project.techTags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6B7280] hover:text-[#E8734A] transition-colors"
                  title="Visit live"
                >
                  <ExternalLink size={15} />
                </a>
                <Link
                  to={`/dashboard/edit/${project._id}`}
                  className="text-[#6B7280] hover:text-[#E8734A] transition-colors"
                  title="Edit"
                >
                  <Pencil size={15} />
                </Link>
                <button
                  onClick={() => handleDelete(project._id, project.title)}
                  className="text-[#6B7280] hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
