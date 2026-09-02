import { useEffect, useState } from 'react';
import { Banknote, Folder, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, Rectangle,
} from 'recharts';
import api from '../../api/axios';

const BAR_COLORS = [
  '#5C60F5', '#00B386', '#F59E0B', '#EF4444',
  '#3B82F6', '#9333EA', '#10B981', '#F97316',
  '#EC4899', '#06B6D4', '#8B5CF6', '#14B8A6'
];

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-md text-xs">
      <p className="font-semibold text-text mb-0.5">{label}</p>
      <p className="text-indigo-600 font-medium">{payload[0].value} new user{payload[0].value !== 1 ? 's' : ''}</p>
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
  return `${p.analysesGranted || 1} JD ${p.analysesGranted === 1 ? 'analysis' : 'analyses'}`;
}

export default function AdminOverview({ stats, onNavigate }) {
  const [growth, setGrowth] = useState([]);
  const [growthDays, setGrowthDays] = useState(7);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [payments, setPayments] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const url = growthDays === 'monthly' ? '/admin/user-growth?mode=monthly' : `/admin/user-growth?days=${growthDays}`;
    api.get(url)
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

  const chartData = growth.map(d => {
    const label = d.date.length === 7
      ? new Date(d.date + '-02T00:00:00').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
      : new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    return { ...d, label };
  });

  return (
    <div className="space-y-6">

      {/* Top 3 Metric Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#00A693] flex items-center justify-center">
            <Banknote size={20} className="stroke-[2.2]" />
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL REVENUE</p>
              <p className="text-2xl sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {payments ? fmt(payments.totalRevenuePaise) : '₹0.00'}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[11px] font-bold text-[#00A693] mb-1">+3.2% vs last week</span>
              <svg viewBox="0 0 100 28" className="w-24 h-7 overflow-visible">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00A693" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#00A693" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 20 Q 25 8, 50 16 T 100 4 L 100 28 L 0 28 Z" fill="url(#revGrad)" />
                <path d="M0 20 Q 25 8, 50 16 T 100 4" fill="none" stroke="#00A693" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="w-10 h-10 rounded-xl bg-[#E8F8F0] text-[#00A693] flex items-center justify-center">
            <Folder size={20} className="stroke-[2.2]" />
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL PROJECTS</p>
              <p className="text-2xl sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {stats.approved ?? '0'}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[11px] font-medium text-gray-500 mb-1.5">{stats.projectsToday ?? 5} completed today</span>
              <div className="flex items-end justify-end gap-1 h-6">
                {[10, 18, 12, 16, 11, 15, 22].map((h, i) => (
                  <div key={i} style={{ height: `${h}px` }} className="w-1.5 bg-[#00A693] rounded-t-xs" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Total Users */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[145px]">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#6366F1] flex items-center justify-center">
            <Users size={20} className="stroke-[2.2]" />
          </div>
          <div className="flex items-end justify-between mt-3">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">TOTAL USERS</p>
              <p className="text-2xl sm:text-[26px] font-extrabold text-[#111827] tracking-tight">
                {stats.users ?? '0'}
              </p>
            </div>
            <div className="flex flex-col items-end shrink-0 pl-2">
              <span className="text-[11px] font-semibold text-[#4F46E5] mb-1">{stats.usersToday ?? 129} new today</span>
              <svg viewBox="0 0 100 28" className="w-24 h-7 overflow-visible">
                <defs>
                  <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0 22 Q 30 14, 55 18 T 100 6 L 100 28 L 0 28 Z" fill="url(#userGrad)" />
                <path d="M0 22 Q 30 14, 55 18 T 100 6" fill="none" stroke="#6366F1" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>

      </div>

      {/* Main Content Grid: Daily Registrations + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Card: Daily Registrations Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {growthDays === 'monthly' ? 'Monthly' : 'Daily'} Registrations
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {totalGrowthUsers} new users in last {growthDays === 'monthly' ? '12 months' : `${growthDays} days`}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {[7, 14, 30, 'monthly'].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    setGrowthLoading(true);
                    setGrowthDays(d);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    growthDays === d
                      ? 'bg-[#4338CA] text-white shadow-xs'
                      : 'border border-gray-200 text-gray-600 hover:text-gray-900 bg-white'
                  }`}
                >
                  {d === 'monthly' ? 'Monthly' : `${d}d`}
                </button>
              ))}
            </div>
          </div>

          {growthLoading ? (
            <div className="h-56 flex items-center justify-center">
              <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="w-full h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 24, right: 8, left: -24, bottom: 0 }} barSize={growthDays === 7 ? 36 : (growthDays === 14 || growthDays === 'monthly') ? 22 : 14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={6}
                    interval={growthDays === 7 || growthDays === 'monthly' ? 0 : growthDays === 14 ? 1 : 4}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomAreaTooltip />} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} shape={(props) => {
                    const color = BAR_COLORS[props.index % BAR_COLORS.length];
                    return <Rectangle {...props} fill={color} />;
                  }}>
                    <LabelList dataKey="count" position="top" style={{ fontSize: 11, fontWeight: 700, fill: '#374151' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right Card: Recent Payments */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Recent Payments</h3>
              <button
                onClick={() => onNavigate('payments')}
                className="text-xs font-bold text-[#00A693] uppercase tracking-wider hover:opacity-80 transition-opacity cursor-pointer"
              >
                VIEW ALL
              </button>
            </div>
            
            <div className="divide-y divide-gray-100">
              {payments?.payments?.length > 0 ? (
                payments.payments.slice(0, 4).map(p => (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/70 transition-colors">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold text-xs flex items-center justify-center shrink-0">
                        {getInitials(p.user?.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.user?.name || '—'}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate flex items-center gap-1">
                          {packLabel(p)} · <span className="text-[#00A693] font-medium">Success</span>
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 ml-3 text-right">
                      <p className="text-sm font-bold text-gray-900">{fmt(p.amountPaise)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-xs text-muted">
                  No recent payments found
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

