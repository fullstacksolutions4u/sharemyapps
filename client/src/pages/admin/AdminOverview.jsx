import { FolderOpen, Clock, CheckCircle, Users, AlertCircle, ChevronRight } from 'lucide-react';

export default function AdminOverview({ stats, onNavigate }) {
  if (!stats) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-5 h-5 border-2 border-[#00A693] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Overview</h2>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        {[
          { label: 'Total Projects', value: stats.total,      icon: FolderOpen,  iconCls: 'text-[#6B7280]',  bg: 'bg-[#F3F0EB]' },
          { label: 'Pending',        value: stats.pending,    icon: Clock,        iconCls: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved',       value: stats.approved,   icon: CheckCircle,  iconCls: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Developers',     value: stats.developers, icon: Users,        iconCls: 'text-[#00A693]',  bg: 'bg-[#E6F7F5]' },
          { label: 'Clients',        value: stats.clients,    icon: Users,        iconCls: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ label, value, icon: Icon, iconCls, bg }) => (
          <div key={label} className="bg-white border border-[#E5E1DA] rounded-2xl p-5">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon size={16} className={iconCls} />
            </div>
            <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
            <p className="text-xs text-[#6B7280] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {stats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">
                {stats.pending} project{stats.pending !== 1 ? 's' : ''} waiting for review
              </p>
              <p className="text-xs text-yellow-700 mt-0.5">Review and approve or reject user submissions.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1 text-xs font-semibold text-yellow-700 hover:text-yellow-900 shrink-0 transition-colors"
          >
            Review <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
