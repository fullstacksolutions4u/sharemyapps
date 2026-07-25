import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Globe, Link2, GitBranch, Users, Phone, Mail, Clock } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_SHORT = { Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat', Sunday: 'Sun' };

const fmtTime = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
};
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { optimizeImage } from '../utils/image';

const toAbs = (url) => (!url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`);

function Avatar({ mentor }) {
  const initials = mentor.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return mentor.avatar
    ? <img src={optimizeImage(mentor.avatar, 150)} alt={mentor.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow" />
    : <span className="w-16 h-16 rounded-full bg-accent text-white text-xl font-bold flex items-center justify-center ring-2 ring-white shadow">{initials}</span>;
}

function MentorCard({ mentor }) {
  const [expanded, setExpanded] = useState(false);
  const designation = mentor.designations?.[0] || null;
  const LIMIT = 6;
  const flatTags = (mentor.mentorshipTech || []).flatMap(t => t.split(',').map(s => s.trim())).filter(Boolean);
  const visibleTags = expanded ? flatTags : flatTags.slice(0, LIMIT);
  const extraCount = flatTags.length - LIMIT;

  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Top: avatar + name + designation + rate */}
      <div className="flex items-start gap-3">
        <Avatar mentor={mentor} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-text text-sm leading-tight truncate">{mentor.name}</p>
          {designation && (
            <p className="text-xs text-muted mt-0.5 truncate">{designation}</p>
          )}
          <div className="mt-1.5">
            {mentor.mentorshipRate ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                ₹{mentor.mentorshipRate}/hr
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                Free
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {mentor.bio && (
        <p className="text-xs text-muted leading-relaxed line-clamp-2">{mentor.bio}</p>
      )}

      {/* Expertise tags */}
      {flatTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleTags.map((tag, i) => (
            <span key={tag} className="text-[11px] text-muted">
              {tag}{i < visibleTags.length - 1 ? ',' : ''}
            </span>
          ))}
          {!expanded && extraCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg text-muted border border-border hover:bg-border transition-colors"
            >
              +{extraCount} more
            </button>
          )}
          {expanded && extraCount > 0 && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-bg text-muted border border-border hover:bg-border transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}

      {/* Contact */}
      {(mentor.phone || mentor.email) && (
        <div className="flex flex-col gap-1">
          {mentor.phone && (
            <a href={`tel:${mentor.phone}`} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors">
              <Phone size={11} className="shrink-0" />{mentor.phone}
            </a>
          )}
          {mentor.email && (
            <a href={`mailto:${mentor.email}`} className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors truncate">
              <Mail size={11} className="shrink-0" />{mentor.email}
            </a>
          )}
        </div>
      )}

      {/* Languages */}
      {mentor.languagePreference?.length > 0 && (
        <p className="text-[11px] text-muted">
          Teaches in: <span className="text-text font-medium">{mentor.languagePreference.join(', ')}</span>
        </p>
      )}

      {/* Weekly availability */}
      {mentor.mentorshipSchedule && Object.keys(mentor.mentorshipSchedule).length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium text-text flex items-center gap-1">
            <Clock size={10} className="text-purple-500" /> Availability
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {DAYS.filter(d => mentor.mentorshipSchedule[d]).map(day => {
              const slot = mentor.mentorshipSchedule[day];
              return (
                <span key={day} className="text-[11px] text-muted">
                  <span className="font-medium text-purple-700">{DAY_SHORT[day]}</span> {fmtTime(slot.from)}–{fmtTime(slot.to)}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: links */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border mt-auto flex-wrap">
        <Link
          to={`/portfolio/${mentor._id}`}
          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
        >
          <Globe size={10} /> Projects
          {mentor.projectCount > 0 && <span className="ml-0.5 text-muted">({mentor.projectCount})</span>}
        </Link>
        {mentor.linkedinUrl && (
          <a href={toAbs(mentor.linkedinUrl)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-[#EEF4FF] text-[#0A66C2] border border-[#0A66C2]/20 hover:bg-[#0A66C2] hover:text-white transition-colors">
            <Link2 size={10} /> LinkedIn
          </a>
        )}
        {mentor.githubUrl && (
          <a href={toAbs(mentor.githubUrl)} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg bg-gray-900 text-white border border-gray-900 hover:bg-gray-700 transition-colors">
            <GitBranch size={10} /> GitHub
          </a>
        )}
      </div>
    </div>
  );
}

export default function Mentors() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    if (user.userType !== 'mentee') {
      navigate('/', { replace: true });
      return;
    }
    api.get('/users/mentors')
      .then(r => setMentors(r.data))
      .catch(() => toast.error('Failed to load mentors'))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const filtered = mentors.filter(m =>
    !search.trim() ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.mentorshipTech?.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
    m.designations?.[0]?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
            <BookOpen size={20} className="text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text">Find a Mentor</h1>
            <p className="text-xs text-muted mt-0.5">Developers available for 1-on-1 mentorship</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or skill…"
            className="w-full pl-8 pr-4 py-2 text-sm border border-border rounded-xl bg-white text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-2 text-sm text-muted">
            <div className="w-4 h-4 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            Loading mentors…
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-20 text-center">
          <Users size={36} className="text-muted mx-auto mb-4" />
          <p className="text-sm font-semibold text-text mb-1">
            {search ? 'No mentors match your search' : 'No mentors available yet'}
          </p>
          <p className="text-xs text-muted">Check back soon — developers are joining as mentors.</p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted mb-4">{filtered.length} mentor{filtered.length !== 1 ? 's' : ''} available</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(mentor => (
              <MentorCard key={mentor._id} mentor={mentor} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
