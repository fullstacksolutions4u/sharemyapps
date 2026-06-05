import { Link } from 'react-router-dom';
import { FileText, GitBranch, Globe, Link2, Mail, MapPin, Phone } from 'lucide-react';

const toAbs = (url) =>
  !url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`;

function Avatar({ dev }) {
  const initials =
    dev.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return dev.avatar ? (
    <img src={dev.avatar} alt={dev.name} className="w-11 h-11 rounded-full object-cover shrink-0" />
  ) : (
    <span className="w-11 h-11 rounded-full bg-accent text-white text-sm font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  );
}

function CircularScore({ pct }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <svg width="56" height="56" className="shrink-0" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="#E5E1DA" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke="#00A693" strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.7s cubic-bezier(0.22,1,0.36,1)' }}
      />
      <text
        x="28" y="28"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#1A1A1A"
        style={{
          transform: 'rotate(90deg)',
          transformOrigin: '28px 28px',
          fontSize: '11px',
          fontWeight: 700,
        }}
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function DeveloperCard({ dev, pct, stagger }) {
  const role = dev.designations?.[0] || dev.resumeData?.experience?.[0]?.role || null;

  const skills = [
    ...(Array.isArray(dev.mentorshipTech) ? dev.mentorshipTech : []),
    ...(Array.isArray(dev.resumeData?.skills) ? dev.resumeData.skills : []),
  ].filter((v, i, a) => v && a.indexOf(v) === i); // dedupe

  const visibleSkills = skills.slice(0, 5);
  const extraCount = skills.length - visibleSkills.length;

  const cardCls = [
    'bg-white border border-border rounded-2xl p-4 flex flex-col gap-3',
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
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="font-bold text-sm text-text truncate">{dev.name}</p>
            {role && (
              <span className="inline-block shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20">
                {role}
              </span>
            )}
          </div>
          <Link
            to={`/portfolio/${dev._id}`}
            className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-bg border border-border text-muted hover:text-accent hover:border-accent/30 transition-colors"
          >
            {dev.projectCount} project{dev.projectCount !== 1 ? 's' : ''}
          </Link>
        </div>
        <CircularScore pct={pct} />
      </div>

      {/* Skills */}
      {visibleSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleSkills.map(skill => (
            <span
              key={skill}
              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted"
            >
              {skill}
            </span>
          ))}
          {extraCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-bg border border-border text-muted">
              +{extraCount}
            </span>
          )}
        </div>
      )}

      {/* Email + Phone/WhatsApp on same row */}
      <div className="flex items-center gap-2 min-w-0">
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
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5 border-t border-border mt-auto">
        <Link
          to={`/portfolio/${dev._id}`}
          className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition-colors"
        >
          <Globe size={9} /> Portfolio
        </Link>
        {dev.linkedinUrl && (
          <a
            href={toAbs(dev.linkedinUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[#EEF4FF] text-[#0A66C2] border border-[#0A66C2]/20 hover:bg-[#0A66C2] hover:text-white transition-colors"
          >
            <Link2 size={9} /> LinkedIn
          </a>
        )}
        {dev.githubUrl && (
          <a
            href={toAbs(dev.githubUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-gray-900 text-white border border-gray-900 hover:bg-gray-700 transition-colors"
          >
            <GitBranch size={9} /> GitHub
          </a>
        )}
        {dev.cvUrl && (
          <a
            href={toAbs(dev.cvUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-accent text-white border border-accent hover:bg-accent-hover transition-colors"
          >
            <FileText size={9} /> Resume
          </a>
        )}
        {(() => {
          const loc = (dev.preferredLocations || [])
            .find(l => !/^remote$/i.test(l.trim()));
          return loc ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg bg-bg border border-border text-muted ml-auto">
              <MapPin size={9} className="shrink-0" /> {loc}
            </span>
          ) : null;
        })()}
      </div>
    </div>
  );
}
