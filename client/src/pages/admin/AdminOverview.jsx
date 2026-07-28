import { useEffect, useState } from 'react';
import { Banknote, Folder, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Rectangle,
} from 'recharts';
import api from '../../api/axios';

const BAR_COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#14b8a6','#f97316','#ec4899','#84cc16','#06b6d4','#eab308','#8b5cf6','#22c55e'];

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-text mb-0.5">{label}</p>
      <p className="text-indigo-600">{payload[0].value} new user{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

function fmt(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function getInitials(name) {
  if (!name) return '—';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function packLabel(p) {
  if (p.pack && p.pack.startsWith('placement_')) return 'Premium';
  return `${p.analysesGranted} JD ${p.analysesGranted === 1 ? 'analysis' : 'analyses'}`;
}



export default function AdminOverview({ stats, onNavigate }) {

  const [growth, setGrowth] = useState([]);
  const [growthDays, setGrowthDays] = useState(7);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [payments, setPayments] = useState(null);



  useEffect(() => {
    let cancelled = false;
    api.get(`/admin/user-growth?days=${growthDays}`)
      .then(res => { if (!cancelled) { setGrowth(res.data); setGrowthLoading(false); } })
      .catch(() => { if (!cancelled) setGrowthLoading(false); });
    return () => { cancelled = true; };
  }, [growthDays]);

  useEffect(() => {
    api.get('/admin/payments?page=1').then(r => setPayments(r.data)).catch(() => {});
  }, []);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading overview…</p>
      </div>
    </div>
  );

  const totalGrowthUsers = growth.reduce((s, d) => s + d.count, 0);

  const chartData = growth.map(d => ({
    ...d,
    label: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  return (
    <div className="space-y-6">



      {/* Key stat cards — 3 in one row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Total Revenue */}
        <div className="bg-white border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="w-11 h-11 bg-[#ebf5ef] rounded-xl flex items-center justify-center mb-5">
            <Banknote size={22} className="text-[#0c8c8c]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-text tracking-tight">
              {payments ? fmt(payments.totalRevenuePaise) : '—'}
            </p>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-white border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="w-11 h-11 bg-[#ebf5ef] rounded-xl flex items-center justify-center mb-5">
            <Folder size={22} className="text-[#0c8c8c]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Total Projects</p>
            <p className="text-3xl font-bold text-text tracking-tight">{stats.approved ?? '—'}</p>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white border border-border rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div className="w-11 h-11 bg-[#f0f0fa] rounded-xl flex items-center justify-center mb-5">
            <Users size={22} className="text-[#5b5fd8]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-1">Total Users</p>
            <p className="text-3xl font-bold text-text tracking-tight">{stats.users ?? '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
        {/* Daily User Registrations */}
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-text">Daily Registrations</p>
              <p className="text-xs text-muted mt-0.5">
                {totalGrowthUsers} new user{totalGrowthUsers !== 1 ? 's' : ''} in last {growthDays} days
              </p>
            </div>
            <div className="flex gap-1">
              {[7, 14, 30].map(d => (
                <button
                  key={d}
                  onClick={() => setGrowthDays(d)}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                    growthDays === d
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-muted hover:text-text border border-border'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {growthLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 24, right: 4, left: -20, bottom: 0 }} barSize={growthDays === 7 ? 32 : growthDays === 14 ? 20 : 12}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F0EB" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#aaa' }}
                  axisLine={false}
                  tickLine={false}
                  interval={growthDays === 7 ? 0 : growthDays === 14 ? 1 : 4}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#aaa' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomAreaTooltip />} cursor={{ fill: '#F3F0EB' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} shape={(props) => {
                  const color = BAR_COLORS[props.index % BAR_COLORS.length];
                  return <Rectangle {...props} fill={color} />;
                }}>
                  <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 600, fill: '#555' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Payments */}
        {payments?.payments?.length > 0 && (
          <div className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-[15px] font-semibold text-[#1a2b29]">Recent Payments</p>
              <button
                onClick={() => onNavigate('payments')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0c8c8c] uppercase tracking-wider hover:opacity-80 transition-opacity"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-border">
              {payments.payments.slice(0, 5).map(p => (
                <div key={p._id} className="flex items-center justify-between px-5 py-[14px] hover:bg-bg transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#f0f0fa] text-[#5b5fd8] flex items-center justify-center font-bold text-[13px] shrink-0">
                      {getInitials(p.user?.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1a2b29] truncate">{p.user?.name || '—'}</p>
                      <p className="text-[11px] text-muted mt-0.5 truncate flex items-center gap-1">
                        {packLabel(p)} <span className="text-[14px] leading-none opacity-50">·</span> <span className="text-[#0c8c8c]">Success</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <p className="text-[14px] font-bold text-[#1a2b29]">{fmt(p.amountPaise)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
