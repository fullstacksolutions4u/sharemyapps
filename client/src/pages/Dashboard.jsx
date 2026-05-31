import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle, Share2, Copy, Check, X } from 'lucide-react';
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

function ShareModal({ userId, onClose }) {
  const link = `${window.location.origin}/portfolio/${userId}`;
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#1A1A1A]">Share your portfolio</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">Anyone with this link can view all your approved projects.</p>
          </div>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#1A1A1A] transition-colors p-1 -mr-1 -mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-[#F3F0EB] border border-[#E5E1DA] rounded-xl px-3 py-2.5">
          <span className="flex-1 text-xs text-[#1A1A1A] truncate font-mono select-all">{link}</span>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-[#00A693] hover:bg-[#007D6F] text-white'
            }`}
          >
            {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
          </button>
        </div>

        <p className="text-xs text-[#6B7280] mt-3">
          Great for sharing with recruiters — they'll see your live projects without needing an account.
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showShare, setShowShare] = useState(false);

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
          <h1 className="text-2xl font-bold text-[#1A1A1A] tracking-tight">
            Hey, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} listed</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShare(true)}
            className="flex items-center gap-2 border border-[#E5E1DA] hover:border-[#00A693]/50 text-[#6B7280] hover:text-[#00A693] px-4 py-2.5 rounded-xl font-medium text-sm transition-colors bg-white"
          >
            <Share2 size={15} /> Share all your projects in 1 click
          </button>
          <Link
            to="/dashboard/add"
            className="flex items-center gap-2 bg-[#00A693] hover:bg-[#007D6F] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            <Plus size={15} /> Add project
          </Link>
        </div>
      </div>

      {showShare && <ShareModal userId={user?._id} onClose={() => setShowShare(false)} />}

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
              {/* Thumbnail */}
              <div className="w-28 h-20 rounded-lg overflow-hidden bg-[#F3F0EB] shrink-0">
                <img
                  src={getbanner(project.bannerImage, project.liveUrl)}
                  alt={project.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.src = PLACEHOLDER; }}
                />
              </div>

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
                {project.adminNote && project.status === 'rejected' && (
                  <div className="flex items-start gap-1.5 mt-2 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5">
                    <AlertCircle size={12} className="text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700"><span className="font-medium">Admin note:</span> {project.adminNote}</p>
                  </div>
                )}
                {project.adminNote && project.status === 'approved' && (
                  <div className="flex items-start gap-1.5 mt-2 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
                    <CheckCircle size={12} className="text-green-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-green-700"><span className="font-medium">Admin tip:</span> {project.adminNote}</p>
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

              {/* Vertical action buttons */}
              <div className="flex flex-col gap-1.5 shrink-0">
                  <a
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-accent-light text-accent hover:bg-accent hover:text-white transition-colors"
                    title="Visit live"
                  >
                    <ExternalLink size={13} />
                  </a>
                  <Link
                    to={`/dashboard/edit/${project._id}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white transition-colors"
                    title="Edit"
                  >
                    <Pencil size={13} />
                  </Link>
                  <button
                    onClick={() => handleDelete(project._id, project.title)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
