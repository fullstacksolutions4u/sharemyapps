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
