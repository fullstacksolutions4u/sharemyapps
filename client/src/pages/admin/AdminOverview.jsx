import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, ArrowRight, Users } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LabelList, PieChart, Pie, Cell, Rectangle,
} from 'recharts';
import api from '../../api/axios';

const PIE_COLORS = ['#f59e0b', '#10b981', '#f43f5e'];
const BAR_COLORS = ['#6366f1','#10b981','#f59e0b','#f43f5e','#3b82f6','#a855f7','#14b8a6','#f97316','#ec4899','#84cc16','#06b6d4','#eab308','#8b5cf6','#22c55e'];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-text">{payload[0].name}</p>
      <p className="text-muted">{payload[0].value} projects</p>
    </div>
  );
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl px-3 py-2 shadow-sm text-xs">
      <p className="font-semibold text-text mb-0.5">{label}</p>
      <p className="text-indigo-600">{payload[0].value} new user{payload[0].value !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default function AdminOverview({ stats, onNavigate }) {
  const [growth, setGrowth] = useState([]);
  const [growthDays, setGrowthDays] = useState(7);
  const [growthLoading, setGrowthLoading] = useState(true);

  useEffect(() => {
    setGrowthLoading(true);
    api.get(`/admin/user-growth?days=${growthDays}`)
      .then(res => setGrowth(res.data))
      .catch(() => {})
      .finally(() => setGrowthLoading(false));
  }, [growthDays]);

  if (!stats) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted">Loading overview…</p>
      </div>
    </div>
  );

  const pieData = [
    { name: 'Pending',  value: stats.pending  || 0 },
    { name: 'Approved', value: stats.approved || 0 },
    { name: 'Rejected', value: stats.rejected || 0 },
  ].filter(d => d.value > 0);

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

      {/* Key stat cards — approved projects + total users */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-border rounded-xl p-5">
          <div className="w-9 h-9 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center mb-3">
            <CheckCircle size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-text tracking-tight">{stats.approved ?? '—'}</p>
          <p className="text-sm font-medium text-text mt-1">Approved Projects</p>
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

      {/* Project Status donut */}
      <div className="bg-white border border-border rounded-xl p-5">
        <p className="text-sm font-semibold text-text mb-4">Project Status Distribution</p>
        {pieData.length > 0 ? (
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3 flex-1">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i] }} />
                    <span className="text-sm text-text">{d.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-text">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-sm text-muted">No project data yet</div>
        )}
      </div>

    </div>
  );
}
