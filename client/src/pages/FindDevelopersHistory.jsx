import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users, Search, X, FileText, GitBranch, Globe, Link2, MapPin, ChevronDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { toAbs } from '../components/recruiter/developerUtils';

const PAGE_SIZE = 20;

const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

const EXP_RANGES = [
  { label: 'Any experience', value: '' },
  { label: '0 – 1 yr', value: '0-1' },
  { label: '1 – 3 yrs', value: '1-3' },
  { label: '3 – 5 yrs', value: '3-5' },
  { label: '5+ yrs', value: '5+' },
];

function getYears(dev) {
  const exp = Array.isArray(dev.resumeData?.experience) ? dev.resumeData.experience : [];
  let months = 0;
  for (const e of exp) {
    try {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end = e.endDate ? new Date(e.endDate) : new Date();
      if (start && !isNaN(start)) months += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
    } catch {}
  }
  return months > 0 ? months / 12 : exp.length * 1.5;
}

function Avatar({ dev }) {
  const initials = dev.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return dev.avatar ? (
    <img src={dev.avatar} alt={dev.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <span className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  );
}

export default function Candidates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [designation, setDesignation] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [skill, setSkill] = useState('');
  const [expRange, setExpRange] = useState('');
  const [gender, setGender] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'recruiter') {
      navigate('/find-developers', { replace: true });
      return;
    }
    api.get('/users/candidates')
      .then(r => setCandidates(r.data))
      .catch(() => toast.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [designation, stateFilter, skill, expRange, gender]);

  const filtered = useMemo(() => {
    let list = candidates;

    if (designation.trim()) {
      const q = designation.toLowerCase();
      list = list.filter(d =>
        d.designations?.some(des => des.toLowerCase().includes(q))
      );
    }

    if (stateFilter.trim()) {
      const q = stateFilter.toLowerCase();
      list = list.filter(d =>
        d.preferredLocations?.some(l => l.toLowerCase().includes(q))
      );
    }

    if (skill.trim()) {
      const q = skill.toLowerCase();
      list = list.filter(d => {
        const skills = Array.isArray(d.resumeData?.skills) ? d.resumeData.skills : [];
        return skills.some(s => s.toLowerCase().includes(q));
      });
    }

    if (expRange) {
      list = list.filter(d => {
        const yrs = getYears(d);
        if (expRange === '0-1') return yrs < 1;
        if (expRange === '1-3') return yrs >= 1 && yrs < 3;
        if (expRange === '3-5') return yrs >= 3 && yrs < 5;
        if (expRange === '5+') return yrs >= 5;
        return true;
      });
    }

    if (gender) {
      list = list.filter(d => d.gender === gender);
    }

    return list;
  }, [candidates, designation, stateFilter, skill, expRange, gender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = designation || stateFilter || skill || expRange || gender;

  const clearFilters = () => {
    setDesignation('');
    setStateFilter('');
    setSkill('');
    setExpRange('');
    setGender('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Users size={16} className="text-accent" />
        </div>
        <h1 className="text-xl font-bold text-text">Candidates</h1>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-44">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Designation…"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent"
            />
          </div>
          <div className="relative flex-1 min-w-40">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="w-full appearance-none pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              <option value="">All States</option>
              {INDIA_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-36">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Skill…"
              value={skill}
              onChange={e => setSkill(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent"
            />
          </div>
          <div className="relative min-w-36">
            <select
              value={expRange}
              onChange={e => setExpRange(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              {EXP_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-xs text-muted hover:text-text px-3 py-2 rounded-lg border border-border hover:border-text transition-colors"
            >
              <X size={11} /> Clear
            </button>
          )}
        </div>

        {/* Gender chips */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs text-muted font-medium mr-1">Gender:</span>
          {[
            { label: 'All', value: '' },
            { label: 'Male', value: 'male' },
            { label: 'Female', value: 'female' },
            { label: 'Other', value: 'other' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setGender(opt.value)}
              className={`text-xs px-3 py-1 rounded-full border font-medium transition-colors
                ${gender === opt.value
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white text-muted border-border hover:border-accent hover:text-accent'
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Loading…
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-20 text-center">
          <Users size={36} className="text-muted mx-auto mb-4" />
          <p className="text-sm font-semibold text-text mb-1">
            {hasFilters ? 'No candidates match your filters' : 'No candidates yet'}
          </p>
          <p className="text-xs text-muted">
            {hasFilters
              ? 'Try adjusting the search or filter criteria.'
              : 'Candidates appear here once developers upload at least 1 approved project and add a resume link.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 text-sm text-accent hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-bg">
                  {[
                    { label: '#', cls: 'w-10' },
                    { label: 'Developer', cls: 'w-44' },
                    { label: 'Designation', cls: 'w-36' },
                    { label: 'Skills', cls: 'w-48 hidden md:table-cell' },
                    { label: 'State', cls: 'w-32 hidden lg:table-cell' },
                    { label: 'Links', cls: 'w-40' },
                    { label: 'Resume', cls: 'w-24' },
                  ].map(({ label, cls }) => (
                    <th
                      key={label}
                      className={`text-left px-4 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide whitespace-nowrap ${cls}`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F0EB]">
                {paginated.map((dev, idx) => {
                  const globalIdx = (page - 1) * PAGE_SIZE + idx + 1;
                  const role = dev.designations?.[0] || dev.resumeData?.experience?.[0]?.role || null;
                  const skills = Array.isArray(dev.resumeData?.skills) ? dev.resumeData.skills.slice(0, 4) : [];
                  const locations = (dev.preferredLocations || []).slice(0, 2);

                  return (
                    <tr key={dev._id} className="hover:bg-[#FAFAF9] transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-muted">{globalIdx}</td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar dev={dev} />
                          <div className="min-w-0">
                            <p className="font-semibold text-text text-xs truncate">{dev.name}</p>
                            <Link
                              to={`/portfolio/${dev._id}`}
                              className="inline-block mt-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white transition-colors"
                            >
                              {dev.projectCount} project{dev.projectCount !== 1 ? 's' : ''}
                            </Link>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="text-xs text-text">
                          {role ?? <span className="text-muted">—</span>}
                        </span>
                      </td>

                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {skills.length > 0 ? skills.map(s => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-bg border border-border text-muted font-medium">
                              {s}
                            </span>
                          )) : <span className="text-xs text-muted">—</span>}
                        </div>
                      </td>

                      <td className="px-4 py-3 hidden lg:table-cell">
                        {locations.length > 0 ? (
                          <div className="space-y-0.5">
                            {locations.map(l => (
                              <p key={l} className="text-xs text-text flex items-center gap-1">
                                <MapPin size={9} className="text-muted shrink-0" /> {l}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Link
                            to={`/portfolio/${dev._id}`}
                            className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
                          >
                            <Globe size={9} /> Portfolio
                          </Link>
                          {dev.linkedinUrl && (
                            <a
                              href={toAbs(dev.linkedinUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-[#EEF4FF] text-[#0A66C2] border border-[#0A66C2]/20 hover:bg-[#0A66C2] hover:text-white transition-colors"
                            >
                              <Link2 size={9} /> LinkedIn
                            </a>
                          )}
                          {dev.githubUrl && (
                            <a
                              href={toAbs(dev.githubUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-900 text-white border border-gray-900 hover:bg-gray-700 transition-colors"
                            >
                              <GitBranch size={9} /> GitHub
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <a
                          href={toAbs(dev.cvUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white transition-colors"
                        >
                          <FileText size={10} /> Resume
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (() => {
            const batch = Math.floor((page - 1) / 10);
            const batchStart = batch * 10 + 1;
            const batchEnd = Math.min(batchStart + 9, totalPages);
            const hasPrevBatch = batch > 0;
            const hasNextBatch = batchEnd < totalPages;

            return (
              <div className="px-4 py-4 border-t border-border flex justify-center">
                <div className="flex items-center gap-1">
                  {hasPrevBatch && (
                    <button
                      onClick={() => setPage(batchStart - 1)}
                      className="flex items-center gap-0.5 px-2.5 h-7 text-xs rounded-lg border border-border text-muted hover:text-text hover:border-text transition-colors font-medium"
                    >
                      <ChevronLeft size={13} /> Prev
                    </button>
                  )}

                  {Array.from({ length: batchEnd - batchStart + 1 }, (_, i) => batchStart + i).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-7 h-7 text-xs rounded-lg border transition-colors font-medium
                        ${page === p
                          ? 'bg-accent text-white border-accent'
                          : 'border-border text-muted hover:text-text hover:border-text'
                        }`}
                    >
                      {p}
                    </button>
                  ))}

                  {hasNextBatch && (
                    <button
                      onClick={() => setPage(batchEnd + 1)}
                      className="flex items-center gap-0.5 px-2.5 h-7 text-xs rounded-lg border border-border text-muted hover:text-text hover:border-text transition-colors font-medium"
                    >
                      Next <ChevronRight size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
