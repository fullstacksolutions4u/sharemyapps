import { useState, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminResumesSection() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/resumes')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Failed to load resumes'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-[#1A1A1A]">User Resumes</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="pl-8 pr-4 py-2 text-sm border border-[#E5E1DA] rounded-xl bg-white focus:outline-none focus:border-[#00A693] w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-[#E5E1DA] p-4 animate-pulse flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#F3F0EB] shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#F3F0EB] rounded w-40" />
                <div className="h-3 bg-[#F3F0EB] rounded w-56" />
              </div>
              <div className="h-8 w-28 bg-[#F3F0EB] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-16 text-center">
          <FileText size={32} className="text-[#D1D5DB] mx-auto mb-3" />
          <p className="text-sm font-medium text-muted">
            {search ? 'No matching users found' : 'No resumes uploaded yet'}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1">Users upload their CV link from the Profile page.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E5E1DA] bg-[#FAF9F6]">
            <span className="text-xs font-semibold text-muted uppercase tracking-wide">
              {filtered.length} resume{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-[#F3F0EB]">
            {filtered.map(u => (
              <div key={u._id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAF9F6] transition-colors">
                {u.avatar
                  ? <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                  : <span className="w-10 h-10 rounded-full bg-accent-light text-accent font-bold text-sm flex items-center justify-center shrink-0">
                      {u.name[0].toUpperCase()}
                    </span>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#1A1A1A]">{u.name}</span>
                    {u.regNumber && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent border border-accent/20 font-medium">
                        D{u.regNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 truncate">{u.email}</p>
                </div>
                <a
                  href={u.cvUrl.startsWith('http') ? u.cvUrl : `https://${u.cvUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-hover bg-accent-light hover:bg-[#C7EDE9] border border-accent/20 px-4 py-2 rounded-xl transition-colors shrink-0"
                >
                  <FileText size={14} /> View Resume
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
