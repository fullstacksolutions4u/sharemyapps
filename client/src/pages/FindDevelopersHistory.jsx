import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, X, MapPin, ChevronDown,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DeveloperCard from '../components/recruiter/DeveloperCard';

const PAGE_SIZE = 20;

const PRESET_DESIGNATIONS = [
  'MERN Stack Developer', 'MEAN Stack Developer', 'MEVN Stack Developer', 'PERN Stack Developer',
  'Python Full Stack Developer',
  'Next.js Developer', 'Vue.js Developer',
  'PHP Developer', 'Laravel Developer',
  'Flutter Developer', 'React Native Developer', 'Android Developer', 'iOS Developer',
  'Data Scientist', 'Machine Learning Engineer', 'DevOps Engineer', 'UI/UX Developer',
  'Java Full Stack Developer', '.NET Developer', 'Spring Boot Developer', 'Others',
];

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

const SALARY_RANGES = [
  { label: 'Any salary', value: '' },
  { label: 'Up to 3 LPA', value: '0-3' },
  { label: '3 – 6 LPA', value: '3-6' },
  { label: '6 – 10 LPA', value: '6-10' },
  { label: '10 – 15 LPA', value: '10-15' },
  { label: '15+ LPA', value: '15+' },
];

const JOIN_OPTIONS = [
  { label: 'Any availability', value: '' },
  { label: 'Immediately', value: 'Immediately' },
  { label: '15 days', value: '15 days' },
  { label: '1 month', value: '1 month' },
  { label: '2 months', value: '2 months' },
  { label: '3 months', value: '3 months' },
  { label: '3+ months', value: '3+ months' },
];

function getYears(dev) {
  const exp = Array.isArray(dev.resumeData?.experience) ? dev.resumeData.experience : [];
  let months = 0;
  for (const e of exp) {
    try {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end = e.endDate ? new Date(e.endDate) : new Date();
      if (start && !isNaN(start)) months += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
    } catch { /* ignore */ }
  }
  return months > 0 ? months / 12 : exp.length * 1.5;
}

function SkillMultiSelect({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggle = skill => {
    onChange(selected.includes(skill) ? selected.filter(s => s !== skill) : [...selected, skill]);
  };

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative flex-1 min-w-44">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center gap-2 pl-3 pr-8 py-2 text-sm border rounded-lg bg-bg focus:outline-none transition-colors text-left ${
          open ? 'border-accent' : 'border-border'
        }`}
      >
        <Search size={13} className="text-muted shrink-0" />
        {selected.length === 0 ? (
          <span className="text-muted">Skill…</span>
        ) : (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.map(s => (
              <span key={s} className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-medium">
                {s}
                <X size={9} className="cursor-pointer" onClick={e => { e.stopPropagation(); toggle(s); }} />
              </span>
            ))}
          </div>
        )}
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border">
            <input
              autoFocus
              type="text"
              placeholder="Search skills…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-border rounded-lg focus:outline-none focus:border-accent bg-bg"
            />
          </div>
          <div className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted text-center py-3">No skills found</p>
            ) : filtered.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-bg transition-colors ${
                  selected.includes(opt) ? 'text-accent font-semibold' : 'text-text'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                  selected.includes(opt) ? 'bg-accent border-accent' : 'border-border'
                }`}>
                  {selected.includes(opt) && <X size={8} className="text-white" />}
                </span>
                {opt}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-border p-2">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-muted hover:text-red-500 transition-colors w-full text-center"
              >
                Clear all skills
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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
  const [skills, setSkills] = useState([]);
  const [expRange, setExpRange] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [joinFilter, setJoinFilter] = useState('');
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

  const allSkillOptions = useMemo(() => {
    const set = new Set();
    for (const dev of candidates) {
      const s = Array.isArray(dev.resumeData?.skills) ? dev.resumeData.skills : [];
      const t = Array.isArray(dev.mentorshipTech) ? dev.mentorshipTech : [];
      [...s, ...t].forEach(sk => sk && set.add(sk.trim()));
    }
    return [...set].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [candidates]);

  const filtered = useMemo(() => {
    let list = candidates;

    if (designation.trim()) {
      const q = designation.toLowerCase();
      list = list.filter(d =>
        d.designations?.some(des => des.toLowerCase() === q)
      );
    }

    if (stateFilter.trim()) {
      const q = stateFilter.toLowerCase();
      list = list.filter(d =>
        d.preferredLocations?.some(l => l.toLowerCase().includes(q))
      );
    }

    if (skills.length > 0) {
      list = list.filter(d => {
        const devSkills = [
          ...(Array.isArray(d.resumeData?.skills) ? d.resumeData.skills : []),
          ...(Array.isArray(d.mentorshipTech) ? d.mentorshipTech : []),
        ].map(s => s.toLowerCase());
        return skills.every(sel => devSkills.some(s => s.includes(sel.toLowerCase())));
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

    if (salaryRange) {
      list = list.filter(d => {
        if (!d.expectedSalary) return false;
        const lpa = Number(d.expectedSalary) / 100000;
        if (salaryRange === '0-3') return lpa <= 3;
        if (salaryRange === '3-6') return lpa > 3 && lpa <= 6;
        if (salaryRange === '6-10') return lpa > 6 && lpa <= 10;
        if (salaryRange === '10-15') return lpa > 10 && lpa <= 15;
        if (salaryRange === '15+') return lpa > 15;
        return true;
      });
    }

    if (joinFilter) {
      list = list.filter(d => d.joiningAvailability === joinFilter);
    }

    if (gender) {
      list = list.filter(d => d.gender === gender);
    }

    return list;
  }, [candidates, designation, stateFilter, skills, expRange, salaryRange, joinFilter, gender]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasFilters = designation || stateFilter || skills.length > 0 || expRange || salaryRange || joinFilter || gender;

  const clearFilters = () => {
    setDesignation('');
    setStateFilter('');
    setSkills([]);
    setExpRange('');
    setSalaryRange('');
    setJoinFilter('');
    setGender('');
    setPage(1);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      {/* Filter bar */}
      <div className="bg-white border border-border rounded-xl p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-44">
            <select
              value={designation}
              onChange={e => { setDesignation(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              <option value="">All Designations</option>
              {PRESET_DESIGNATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative flex-1 min-w-40">
            <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <select
              value={stateFilter}
              onChange={e => { setStateFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              <option value="">All States</option>
              {INDIA_STATES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <SkillMultiSelect
            options={allSkillOptions}
            selected={skills}
            onChange={v => { setSkills(v); setPage(1); }}
          />
          <div className="relative min-w-36">
            <select
              value={expRange}
              onChange={e => { setExpRange(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              {EXP_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative min-w-36">
            <select
              value={salaryRange}
              onChange={e => { setSalaryRange(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              {SALARY_RANGES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          </div>
          <div className="relative min-w-36">
            <select
              value={joinFilter}
              onChange={e => { setJoinFilter(e.target.value); setPage(1); }}
              className="w-full appearance-none pl-3 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
            >
              {JOIN_OPTIONS.map(r => (
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
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setGender(opt.value); setPage(1); }}
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
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {paginated.map((dev, idx) => (
              <DeveloperCard
                key={dev._id}
                dev={dev}
                stagger={{ ready: true, delay: idx * 70 }}
              />
            ))}
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (() => {
            const batch = Math.floor((page - 1) / 10);
            const batchStart = batch * 10 + 1;
            const batchEnd = Math.min(batchStart + 9, totalPages);
            const hasPrevBatch = batch > 0;
            const hasNextBatch = batchEnd < totalPages;

            return (
              <div className="py-6 flex justify-center">
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
