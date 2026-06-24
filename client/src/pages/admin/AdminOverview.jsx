import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ArrowRight, Users, IndianRupee, ExternalLink } from 'lucide-react';
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

function packLabel(p) {
  if (p.pack && p.pack.startsWith('placement_')) {
    return p.pack.replace('placement_', '').replace(/\b\w/g, c => c.toUpperCase());
  }
  return `${p.analysesGranted} JD ${p.analysesGranted === 1 ? 'analysis' : 'analyses'}`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
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

      {/* Header */}
      <div className="flex justify-end">
        <span className="hidden sm:inline text-xs text-muted px-3 py-1.5 rounded-full border border-border bg-white">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      {/* Pending alert */}
      {stats.pending > 0 && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              {stats.pending} project{stats.pending !== 1 ? 's' : ''} waiting for review
            </p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="flex items-center gap-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Review <ArrowRight size={12} />
          </button>
        </div>
      )}

      {/* Key stat cards — 3 in one row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-text tracking-tight">{stats.approved ?? '—'}</p>
          <p className="text-sm font-medium text-text mt-1">Total Projects</p>
          <p className="text-xs text-muted mt-0.5">Live on platform</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-9 h-9 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center mb-3">
            <Users size={16} className="text-indigo-600" />
          </div>
          <p className="text-3xl font-bold text-text tracking-tight">{stats.users ?? '—'}</p>
          <p className="text-sm font-medium text-text mt-1">Total Users</p>
          <p className="text-xs text-muted mt-0.5">{stats.developers ?? 0} devs · {stats.clients ?? 0} clients</p>
        </div>
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center mb-3">
            <IndianRupee size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-text tracking-tight">
            {payments ? fmt(payments.totalRevenuePaise) : '—'}
          </p>
          <p className="text-sm font-medium text-text mt-1">Total Revenue</p>
          <p className="text-xs text-muted mt-0.5">All successful payments</p>
        </div>
      </div>

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
            <p className="text-sm font-semibold text-text">Recent Payments</p>
            <button
              onClick={() => onNavigate('payments')}
              className="flex items-center gap-1 text-xs text-accent hover:underline font-medium"
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {payments.payments.slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center justify-between px-5 py-3 hover:bg-bg transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text truncate">{p.user?.name || '—'}</p>
                  <p className="text-[11px] text-muted truncate">{p.user?.email || ''}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-accent/10 text-accent hidden sm:inline">
                    {packLabel(p)}
                  </span>
                  <p className="text-sm font-semibold text-text">{fmt(p.amountPaise)}</p>
                  <a
                    href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted hover:text-accent transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                  <p className="text-[11px] text-muted w-16 text-right">{timeAgo(p.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
