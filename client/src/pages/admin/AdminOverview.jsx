import { FolderOpen, Clock, CheckCircle, XCircle, ArrowRight, AlertCircle, TrendingUp, Briefcase } from 'lucide-react';

const STAT_CARDS = (stats) => [
  {
    label: 'Total Projects',
    value: stats.total,
    icon: FolderOpen,
    gradient: 'from-slate-600 to-slate-800',
    iconBg: 'bg-white/20',
    sub: 'All submitted projects',
  },
  {
    label: 'Pending Review',
    value: stats.pending,
    icon: Clock,
    gradient: 'from-amber-400 to-orange-500',
    iconBg: 'bg-white/20',
    sub: 'Awaiting moderation',
    pulse: stats.pending > 0,
  },
  {
    label: 'Approved',
    value: stats.approved,
    icon: CheckCircle,
    gradient: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-white/20',
    sub: 'Live on platform',
  },
  {
    label: 'Rejected',
    value: stats.rejected,
    icon: XCircle,
    gradient: 'from-rose-400 to-pink-600',
    iconBg: 'bg-white/20',
    sub: 'Not published',
  },
  {
    label: 'Developers',
    value: stats.developers,
    icon: TrendingUp,
    gradient: 'from-violet-500 to-purple-700',
    iconBg: 'bg-white/20',
    sub: 'Registered developers',
  },
  {
    label: 'Clients',
    value: stats.clients,
    icon: Briefcase,
    gradient: 'from-sky-400 to-blue-600',
    iconBg: 'bg-white/20',
    sub: 'Business accounts',
  },
];

export default function AdminOverview({ stats, onNavigate }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading overview…</p>
      </div>
    </div>
  );

  const approvalRate = stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0;

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Dashboard Overview</h2>
          <p className="text-sm text-muted mt-1">Platform health and key metrics at a glance</p>
        </div>
        <div className="hidden sm:flex flex-col items-end gap-1">
          <span className="text-xs font-medium text-muted bg-[#F3F0EB] px-3 py-1.5 rounded-full border border-border">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="relative overflow-hidden bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5">
          <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-amber-400 to-orange-500 rounded-l-2xl" />
          <div className="flex items-center justify-between gap-4 pl-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 text-sm">
                  {stats.pending} project{stats.pending !== 1 ? 's' : ''} waiting for review
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Review and approve or reject user submissions to keep the platform fresh.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('projects')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-colors shrink-0"
            >
              Review Now <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {STAT_CARDS(stats).map(({ label, value, icon: Icon, gradient, iconBg, sub, pulse }) => (
          <div
            key={label}
            className={`relative overflow-hidden bg-linear-to-br ${gradient} rounded-2xl p-5 text-white shadow-sm`}
          >
            {pulse && (
              <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
            )}
            <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -right-2 -bottom-8 w-16 h-16 rounded-full bg-white/10" />
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-4`}>
              <Icon size={18} className="text-white" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{value ?? '—'}</p>
            <p className="text-sm font-semibold mt-0.5 opacity-95">{label}</p>
            <p className="text-xs mt-0.5 opacity-70">{sub}</p>
          </div>
        ))}
      </div>

      {/* Bottom row: approval rate + quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Approval rate */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text">Approval Rate</p>
            <span className="text-sm font-bold text-accent">{approvalRate}%</span>
          </div>
          <div className="w-full bg-[#F3F0EB] rounded-full h-2.5 overflow-hidden">
            <div
              className="h-2.5 rounded-full bg-linear-to-r from-accent to-emerald-400 transition-all duration-700"
              style={{ width: `${approvalRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted pt-1">
            <span>{stats.approved} approved</span>
            <span>{stats.rejected} rejected</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold text-text">Quick Actions</p>
          <div className="space-y-2">
            {[
              { label: 'Review Pending Projects', key: 'projects', badge: stats.pending, color: 'text-amber-600 bg-amber-50 border-amber-200' },
              { label: 'Manage Users',             key: 'users',    badge: stats.users,   color: 'text-violet-600 bg-violet-50 border-violet-200' },
              { label: 'Manage Opportunities',     key: 'opportunities', badge: null,     color: 'text-accent bg-accent-light border-accent/20' },
            ].map(({ label, key, badge, color }) => (
              <button
                key={key}
                onClick={() => onNavigate(key)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-border hover:border-accent/30 hover:bg-accent/5 transition-all text-sm text-text group"
              >
                <span className="font-medium">{label}</span>
                <div className="flex items-center gap-2">
                  {badge > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{badge}</span>
                  )}
                  <ArrowRight size={14} className="text-muted group-hover:text-accent transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
