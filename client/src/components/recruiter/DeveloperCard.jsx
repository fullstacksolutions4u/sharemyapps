import { GitBranch, Globe, Link2, Mail, MapPin, Phone, Home } from 'lucide-react';
import { optimizeImage } from '../../utils/image';

const SKILL_PALETTES = [
  { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' }, // blue
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' }, // green
  { bg: '#FEF9C3', border: '#FDE68A', text: '#92400E' }, // yellow
  { bg: '#FDF4FF', border: '#E9D5FF', text: '#7E22CE' }, // purple
  { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' }, // orange
  { bg: '#F0F9FF', border: '#BAE6FD', text: '#0369A1' }, // sky
  { bg: '#FDF2F8', border: '#FBCFE8', text: '#BE185D' }, // pink
  { bg: '#F0FDFA', border: '#99F6E4', text: '#0F766E' }, // teal
  { bg: '#FFF1F2', border: '#FECDD3', text: '#BE123C' }, // rose
  { bg: '#ECFDF5', border: '#A7F3D0', text: '#065F46' }, // emerald
];

const skillColor = skill => SKILL_PALETTES[
  Math.abs(skill.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0)) % SKILL_PALETTES.length
];

const toAbs = (url) =>
  !url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`;

function Avatar({ dev }) {
  const initials =
    dev.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return dev.avatar ? (
    <img src={optimizeImage(dev.avatar, 150)} alt={dev.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
  ) : (
    <span className="w-11 h-11 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  );
}

function ResumePdfIcon({ url }) {
  const inner = (
    <div className="flex flex-col items-center gap-0.5 shrink-0 group cursor-pointer">
      <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* page body */}
        <path d="M4 0H26L40 14V44C40 46.2 38.2 48 36 48H4C1.8 48 0 46.2 0 44V4C0 1.8 1.8 0 4 0Z" className="fill-red-50 group-hover:fill-red-100 transition-colors" />
        {/* folded corner */}
        <path d="M26 0L40 14H30C27.8 14 26 12.2 26 10V0Z" className="fill-red-200 group-hover:fill-red-300 transition-colors" />
        {/* lines */}
        <rect x="8" y="22" width="24" height="2" rx="1" className="fill-red-300" />
        <rect x="8" y="28" width="18" height="2" rx="1" className="fill-red-200" />
        <rect x="8" y="34" width="21" height="2" rx="1" className="fill-red-200" />
      </svg>
      <span className="text-[10px] font-bold text-red-500 leading-none tracking-wide">Resume</span>
    </div>
  );
  if (!url) return <div className="opacity-30 pointer-events-none">{inner}</div>;
  return (
    <a href={/^https?:\/\//i.test(url) ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" title="View Resume">
      {inner}
    </a>
  );
}

function MatchBadge({ jdMatch }) {
  if (!jdMatch || jdMatch.matchPercent == null) return null;
  const pct = jdMatch.matchPercent;
  const color = pct >= 70 ? 'bg-green-50 text-green-700 border-green-200'
              : pct >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200'
              :             'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${color}`}>
      {pct}% match
    </span>
  );
}

export default function DeveloperCard({ dev, stagger, hideContact = false }) {
  const role = dev.designations?.[0] || dev.resumeData?.experience?.[0]?.role || null;
  const jdMatch = dev.jdMatch || null;
  const matchedSet = new Set((jdMatch?.matchedSkills || []).map(s => s.toLowerCase()));

  const skills = [
    ...(Array.isArray(dev.mentorshipTech) ? dev.mentorshipTech : []),
    ...(Array.isArray(dev.resumeData?.skills) ? dev.resumeData.skills : []),
  ].filter((v, i, a) => v && a.indexOf(v) === i); // dedupe

  const visibleSkills = skills.slice(0, 5);
  const extraCount = skills.length - visibleSkills.length;

  const cardCls = [
    'bg-white border border-border rounded-2xl p-4 flex flex-col gap-3 h-full',
    'hover:shadow-md transition-all duration-200',
    stagger ? (stagger.ready ? 'animate-fade-slide-up' : 'opacity-0') : '',
  ].join(' ');

  const cardStyle = stagger ? { animationDelay: `${stagger.delay}ms` } : undefined;

  return (
    <div className={cardCls} style={cardStyle}>
      {/* Top row: avatar + info + score */}
      <div className="flex items-start gap-3">
        <Avatar dev={dev} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <p className="font-bold text-sm text-text truncate">{dev.name}</p>
            {role && (
              <span className="inline-block shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                {role}
              </span>
            )}
            <MatchBadge jdMatch={jdMatch} />
          </div>
          {dev.expectedSalary && (
            <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
              Expected CTC: {(Number(dev.expectedSalary) / 100000).toFixed(1).replace(/\.0$/, '')} LPA
            </span>
          )}
        </div>
        {!hideContact && (dev.joiningAvailability || dev.yearsOfExperience) && (
          <div className="flex flex-col items-end gap-0.5 shrink-0 self-end mb-1 mr-1">
            {dev.joiningAvailability && (
              <span className="text-[10px] text-muted/70 leading-tight">
                <span className="font-medium">Joining</span> {dev.joiningAvailability}
              </span>
            )}
            {dev.yearsOfExperience && (
              <span className="text-[10px] text-muted/70 leading-tight">
                <span className="font-medium">Exp</span> {dev.yearsOfExperience} yrs
              </span>
            )}
          </div>
        )}
        {!hideContact && <ResumePdfIcon url={dev.cvUrl} />}
      </div>

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map(skill => {
            const matched = matchedSet.has(skill.toLowerCase());
            const c = skillColor(skill);
            return (
              <span
                key={skill}
                className="text-[10px] font-medium px-2 py-0.5 rounded-md border"
                style={matched
                  ? { background: '#F0FDF4', borderColor: '#BBF7D0', color: '#15803D' }
                  : { background: c.bg, borderColor: c.border, color: c.text }}
              >
                {skill}
              </span>
            );
          })}
          {extraCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Missing skills from JD */}
      {jdMatch?.missingSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-muted font-semibold self-center">Missing:</span>
          {jdMatch.missingSkills.slice(0, 4).map(skill => (
            <span key={skill} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 border border-red-200 text-red-500">
              {skill}
            </span>
          ))}
          {jdMatch.missingSkills.length > 4 && (
            <span className="text-[10px] text-muted">+{jdMatch.missingSkills.length - 4} more</span>
          )}
        </div>
      )}

      {/* Email + Phone/WhatsApp on same row */}
      {!hideContact && <div className="flex items-center gap-2 min-w-0">
        {dev.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted flex-1 min-w-0">
            <Mail size={10} className="shrink-0" />
            <span className="truncate">{dev.email}</span>
          </div>
        )}
        {dev.phone && (
          <div className="flex items-center rounded-lg overflow-hidden border border-teal-200 shrink-0">
            <a
              href={`tel:${dev.phone}`}
              className="flex items-center gap-1.5 px-2 py-1 bg-linear-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 transition-colors text-[10px] font-medium"
            >
              <Phone size={9} className="text-teal-600 shrink-0" />
              {dev.phone}
            </a>
            <a
              href={`https://wa.me/${dev.phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I seen your profile on ShareMyApps portal, I would like to connect with you.')}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              className="flex items-center justify-center px-2 py-1 border-l border-teal-200 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="12" height="12" fill="#25D366">
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.848L.057 23.885a.75.75 0 0 0 .921.921l6.086-1.461A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.524-5.205-1.433l-.374-.223-3.865.928.944-3.77-.245-.388A9.96 9.96 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
            </a>
          </div>
        )}
      </div>}

      {/* Action buttons */}
      <div className="grid grid-cols-4 gap-1.5 pt-0.5 border-t border-border mt-auto">
        <span className="inline-flex items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 text-center">
          {!hideContact && <Globe size={9} className="mr-1" />} Portfolio
        </span>
        {dev.linkedinUrl && (hideContact ? (
          <span className="inline-flex items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#EEF4FF] text-[#0A66C2] border border-[#0A66C2]/20 text-center">
            LinkedIn
          </span>
        ) : (
          <a
            href={toAbs(dev.linkedinUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-[#EEF4FF] text-[#0A66C2] border border-[#0A66C2]/20 hover:bg-[#0A66C2] hover:text-white transition-colors"
          >
            <Link2 size={9} className="mr-1" /> LinkedIn
          </a>
        ))}
        {dev.githubUrl && (hideContact ? (
          <span className="inline-flex items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-900 text-white border border-gray-900 text-center">
            GitHub
          </span>
        ) : (
          <a
            href={toAbs(dev.githubUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center text-[10px] font-semibold px-2 py-1 rounded-lg bg-gray-900 text-white border border-gray-900 hover:bg-gray-700 transition-colors"
          >
            <GitBranch size={9} className="mr-1" /> GitHub
          </a>
        ))}
        {(() => {
          let loc = '';
          if (dev.place || dev.district) {
            loc = [dev.place, dev.district].filter(Boolean).join(', ');
          } else if (dev.state) {
            loc = dev.state;
          } else if (dev.country) {
            loc = dev.country;
          }
          return loc ? (
            <span className="inline-flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-bg border border-border text-muted text-center">
              {loc?.toLowerCase() === 'remote' ? <Home size={9} className="shrink-0" /> : <MapPin size={9} className="shrink-0" />} {loc}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}
