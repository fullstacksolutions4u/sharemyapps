import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ExternalLink, LayoutDashboard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&q=80';
const getbanner = (bannerImage, liveUrl) => bannerImage || `https://s0.wp.com/mshots/v1/${encodeURIComponent(liveUrl)}?w=400`;

const statusBadge = {
  pending:  { label: 'Pending review', icon: Clock,        cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  approved: { label: 'Approved',       icon: CheckCircle,  cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rejected',       icon: XCircle,      cls: 'bg-red-50 text-red-700 border-red-200' },
};

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
          className="flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
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
          <div className="w-12 h-12 bg-[#E6F7F5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus size={22} className="text-[#00A693]" />
          </div>
          <h3 className="font-semibold text-[#1A1A1A] mb-1">No projects yet</h3>
          <p className="text-sm text-[#6B7280] mb-5">List your first side project and share it with the world.</p>
          <Link
            to="/dashboard/add"
            className="inline-flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={14} /> Add your first project
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <div key={project._id} className="bg-white border border-[#E5E1DA] rounded-xl p-4 flex items-center gap-4 hover:border-[#00A693]/30 transition-colors">
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-[#1A1A1A] truncate">{project.title}</h3>
                  {(() => {
                    const s = statusBadge[project.status] || statusBadge.pending;
                    const Icon = s.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${s.cls}`}>
                        <Icon size={10} /> {s.label}
                      </span>
                    );
                  })()}
                </div>
                <p className="text-xs text-[#6B7280] truncate mt-0.5">{project.description}</p>
                {project.techTags?.length > 0 && (
                  <div className="flex gap-1 mt-1.5">
                    {project.techTags.slice(0, 3).map(t => (
                      <span key={t} className="text-xs bg-[#F3F0EB] text-[#6B7280] px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                )}
                {project.status === 'rejected' && project.adminNote && (
                  <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700"><span className="font-medium">Admin note:</span> {project.adminNote}</p>
                  </div>
                )}
                {project.status === 'rejected' && (
                  <Link
                    to={`/dashboard/edit/${project._id}`}
                    className="inline-flex items-center gap-1 text-xs text-[#00A693] hover:text-[#007D6F] font-medium mt-1.5 transition-colors"
                  >
                    <Pencil size={10} /> Edit and resubmit
                  </Link>
                )}
              </div>

              {/* Image with overlaid action buttons */}
              <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0">
                <img
                  src={getbanner(project.bannerImage, project.liveUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
                <div className="absolute inset-x-0 top-0 flex items-center justify-end gap-1 p-1 bg-gradient-to-b from-black/60 to-transparent">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                    title="Visit live"
                  >
                    <ExternalLink size={11} />
                  </a>
                  <Link
                    to={`/dashboard/edit/${project._id}`}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/20 hover:bg-white/40 text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil size={11} />
                  </Link>
                  <button
                    onClick={() => handleDelete(project._id, project.title)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-white/20 hover:bg-red-500/80 text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
