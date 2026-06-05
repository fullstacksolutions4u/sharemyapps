import { Link } from 'react-router-dom';
import { FileText, GitBranch, Globe, Link2, Phone } from 'lucide-react';

export const toAbs = (url) =>
  !url ? '' : /^https?:\/\//i.test(url) ? url : `https://${url}`;

export function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export function vacancyTitle(h) {
  const level =
    h.extracted?.level && h.extracted.level !== 'any'
      ? h.extracted.level.charAt(0).toUpperCase() + h.extracted.level.slice(1)
      : '';
  const role = h.extracted?.roles?.[0] || '';
  if (level && role) return `${level} ${role}`;
  if (role) return role;
  if (level) return `${level} Developer`;
  return (h.jdSnippet?.split(' ').slice(0, 7).join(' ') || 'Search') + '…';
}

export function Avatar({ dev }) {
  const initials =
    dev.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return dev.avatar ? (
    <img src={dev.avatar} alt={dev.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
  ) : (
    <span className="w-8 h-8 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0">
      {initials}
    </span>
  );
}

export default function DevelopersTable({ developers, stagger }) {
  if (!developers?.length) {
    return (
      <p className="text-xs text-muted py-8 text-center">
        No candidates stored for this search.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <colgroup>
          <col className="w-10" />
          <col className="w-44" />
          <col className="w-44" />
          <col className="w-44" />
          <col className="w-52" />
          <col className="w-32" />
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-bg">
            {['#', 'Developer', 'Designation', 'Contact', 'Links', 'Resume'].map((h, i) => (
              <th
                key={h}
                className={`text-left px-3 py-3 text-[11px] font-semibold text-muted uppercase tracking-wide
                  ${i === 2 ? 'hidden md:table-cell' : ''}
                  ${i === 3 ? 'hidden lg:table-cell' : ''}`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F3F0EB]">
          {developers.map((dev, idx) => {
            const role =
              dev.designations?.[0] || dev.resumeData?.experience?.[0]?.role || null;
            const rowCls = stagger
              ? `hover:bg-[#FAFAF9] transition-all ${stagger.ready ? 'animate-fade-slide-up' : 'opacity-0'}`
              : 'hover:bg-[#FAFAF9] transition-colors';
            const rowStyle = stagger
              ? { animationDelay: `${stagger.baseDelay + idx * 60}ms` }
              : undefined;

            return (
              <tr key={dev._id || idx} className={rowCls} style={rowStyle}>
                {/* # */}
                <td className="px-3 py-3 text-xs font-bold text-muted">{idx + 1}</td>

                {/* Developer */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar dev={dev} />
                    <div className="min-w-0">
                      <p className="font-semibold text-text text-xs truncate">{dev.name}</p>
                      <Link
                        to={`/portfolio/${dev._id}`}
                        className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white transition-colors"
                      >
                        {dev.projectCount} project{dev.projectCount !== 1 ? 's' : ''}
                      </Link>
                    </div>
                  </div>
                </td>

                {/* Designation */}
                <td className="px-3 py-3 hidden md:table-cell">
                  <span className="text-xs text-text">
                    {role || <span className="text-muted">—</span>}
                  </span>
                </td>

                {/* Contact */}
                <td className="px-3 py-3 hidden lg:table-cell">
                  <div className="flex flex-col gap-0.5">
                    {dev.phone && (
                      <a
                        href={`tel:${dev.phone}`}
                        className="flex items-center gap-1 text-[11px] text-muted hover:text-text transition-colors"
                      >
                        <Phone size={9} /> {dev.phone}
                      </a>
                    )}
                    {dev.email && (
                      <span className="text-[11px] text-muted truncate max-w-36">
                        {dev.email}
                      </span>
                    )}
                  </div>
                </td>

                {/* Links */}
                <td className="px-3 py-3">
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

                {/* Resume */}
                <td className="px-3 py-3">
                  {dev.cvUrl ? (
                    <a
                      href={toAbs(dev.cvUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-md bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-white transition-colors"
                    >
                      <FileText size={10} /> Resume
                    </a>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
