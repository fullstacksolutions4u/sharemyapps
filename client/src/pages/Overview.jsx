import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, ExternalLink, GraduationCap, Coins, 
  Loader2 
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Overview() {
  const { user } = useAuth();
  const [filter, setFilter] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['overviewStats'],
    queryFn: async () => {
      const res = await api.get('/users/overview-stats');
      return res.data;
    },
    staleTime: 1000 * 60 * 5, // cache for 5 minutes
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#00A693]" />
      </div>
    );
  }

  const appCount = stats?.applicationsCount || 0;
  const clickCount = stats?.jobPostLinksCount || 0;

  // Construct chart data based on filter selection
  const getChartData = () => {
    if (filter === 'daily') {
      return [
        { label: 'Mon', apps: Math.round(appCount * 0.1), clicks: Math.round(clickCount * 0.1) },
        { label: 'Tue', apps: Math.round(appCount * 0.2), clicks: Math.round(clickCount * 0.15) },
        { label: 'Wed', apps: Math.round(appCount * 0.15), clicks: Math.round(clickCount * 0.2) },
        { label: 'Thu', apps: Math.round(appCount * 0.25), clicks: Math.round(clickCount * 0.25) },
        { label: 'Fri', apps: Math.round(appCount * 0.1), clicks: Math.round(clickCount * 0.1) },
        { label: 'Sat', apps: Math.round(appCount * 0.05), clicks: Math.round(clickCount * 0.05) },
        { label: 'Sun', apps: Math.round(appCount * 0.15), clicks: Math.round(clickCount * 0.15) },
      ].map(item => ({
        ...item,
        apps: item.apps || (appCount > 0 && item.label === 'Thu' ? appCount : 0),
        clicks: item.clicks || (clickCount > 0 && item.label === 'Thu' ? clickCount : 0),
      }));
    }
    if (filter === 'weekly') {
      return [
        { label: 'Week 1', apps: Math.round(appCount * 0.2), clicks: Math.round(clickCount * 0.2) },
        { label: 'Week 2', apps: Math.round(appCount * 0.3), clicks: Math.round(clickCount * 0.25) },
        { label: 'Week 3', apps: Math.round(appCount * 0.4), clicks: Math.round(clickCount * 0.35) },
        { label: 'Week 4', apps: Math.round(appCount * 0.1), clicks: Math.round(clickCount * 0.2) },
      ].map(item => ({
        ...item,
        apps: item.apps || (appCount > 0 && item.label === 'Week 3' ? appCount : 0),
        clicks: item.clicks || (clickCount > 0 && item.label === 'Week 3' ? clickCount : 0),
      }));
    }
    // Monthly
    return [
      { label: 'Mar', apps: Math.round(appCount * 0.1), clicks: Math.round(clickCount * 0.1) },
      { label: 'Apr', apps: Math.round(appCount * 0.15), clicks: Math.round(clickCount * 0.12) },
      { label: 'May', apps: Math.round(appCount * 0.2), clicks: Math.round(clickCount * 0.18) },
      { label: 'Jun', apps: Math.round(appCount * 0.25), clicks: Math.round(clickCount * 0.22) },
      { label: 'Jul', apps: Math.round(appCount * 0.3), clicks: Math.round(clickCount * 0.38) },
      { label: 'Aug', apps: Math.round(appCount * 0.0), clicks: Math.round(clickCount * 0.0) },
    ].map(item => ({
      ...item,
      apps: item.apps || (appCount > 0 && item.label === 'Jul' ? appCount : 0),
      clicks: item.clicks || (clickCount > 0 && item.label === 'Jul' ? clickCount : 0),
    }));
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map(d => d.apps + d.clicks), 4);

  const statCards = [
    {
      title: 'Applications',
      value: appCount,
      badge: '',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      description: '',
      icon: FileText,
      iconColor: 'bg-blue-50 text-blue-600 border border-blue-100'
    },
    {
      title: 'Apply through Job Post Links',
      value: clickCount,
      badge: '',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      description: '',
      icon: ExternalLink,
      iconColor: 'bg-cyan-50 text-cyan-600 border border-cyan-100'
    },
    {
      title: 'MODULES COMPLETED',
      value: stats?.modulesCount || 0,
      badge: '2 Pending',
      badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
      description: '',
      icon: GraduationCap,
      iconColor: 'bg-purple-50 text-purple-600 border border-purple-100'
    },
    {
      title: 'COINS EARNED',
      value: (stats?.coins || 0).toLocaleString(),
      badge: '',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 cursor-pointer hover:bg-amber-100',
      description: 'Redeem once reach 500',
      icon: Coins,
      iconColor: 'bg-amber-50 text-amber-600 border border-amber-100'
    }
  ];

  const skillsList = stats?.skillPathStats || [];

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-[#E5E1DA] rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-xl ${card.iconColor}`}>
                  <Icon size={18} />
                </div>
                {card.badge && (
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-[#8C8C8C] uppercase tracking-wider">{card.title}</p>
              <h3 className="text-2xl font-bold text-[#1A1A1A] mt-1">{card.value}</h3>
              {card.description && <p className="text-xs text-[#8C8C8C] mt-1">{card.description}</p>}
            </div>
          );
        })}
      </div>

      {/* Row 2: Application Activity (Bar Diagram) & Skill Path */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Card: Application Activity Bar Chart */}
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 shadow-sm lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-[#1A1A1A] text-sm">Application Activity</h3>
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['daily', 'weekly', 'monthly'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                    filter === f 
                      ? 'bg-white text-[#0052CC] shadow-sm' 
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-end min-h-[180px]">
            <div className="flex items-end justify-between h-[150px] relative px-2">
              {/* Y-axis grid lines background */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="w-full border-t border-dashed border-[#FAF7F2] h-0" />
                ))}
              </div>

              {/* Bars mapping */}
              {chartData.map((item, i) => {
                const totalVal = item.apps + item.clicks;
                const barHeight = totalVal > 0 ? (totalVal / maxVal) * 100 : 0;
                const appPercent = totalVal > 0 ? (item.apps / totalVal) * 100 : 0;
                const clickPercent = totalVal > 0 ? (item.clicks / totalVal) * 100 : 0;

                return (
                  <div key={i} className="flex flex-col items-center flex-1 group">
                    <div className="w-full flex items-end justify-center h-[120px] relative">
                      {totalVal > 0 ? (
                        <div 
                          style={{ height: `${barHeight}%` }}
                          className="w-3.5 sm:w-4 flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-500 relative group/bar cursor-pointer"
                        >
                          {/* Apps Segment (Blue) */}
                          {item.apps > 0 && (
                            <div 
                              style={{ height: `${appPercent}%` }}
                              className="w-full bg-[#0052CC]"
                            />
                          )}
                          
                          {/* Clicks Segment (Emerald) */}
                          {item.clicks > 0 && (
                            <div 
                              style={{ height: `${clickPercent}%` }}
                              className="w-full bg-[#00A693]"
                            />
                          )}

                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#1A1A1A] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                            {item.apps} Applied, {item.clicks} Clicks
                          </div>
                        </div>
                      ) : (
                        <div className="h-1 w-3.5 sm:w-4 bg-gray-100 rounded-t-lg" />
                      )}
                    </div>

                    <span className="text-[10px] font-bold text-gray-400 mt-2 block">
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend block at bottom */}
            <div className="flex items-center gap-4 justify-center mt-6 pt-4 border-t border-[#F3F0EB]">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#0052CC]" />
                <span>Applications Applied</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                <span className="w-2 h-2 rounded-full bg-[#00A693]" />
                <span>Job Post Links</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Skill Path Progress */}
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 shadow-sm lg:col-span-5 flex flex-col justify-between">
          <div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {skillsList.map((skill, i) => {
                const skillColors = [
                  'bg-[#0052CC]', 'bg-[#9B51E0]', 'bg-[#00A693]', 
                  'bg-amber-500', 'bg-red-500', 'bg-indigo-500', 
                  'bg-pink-500', 'bg-teal-500', 'bg-cyan-500'
                ];
                const isLast = i === skillsList.length - 1;
                return (
                  <div key={i} className={`space-y-1.5 ${isLast ? 'sm:col-span-2' : ''}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-[#4A4A4A]">
                      <span>{skill.name}</span>
                      <span className="text-[10px] text-gray-400 font-bold">{skill.completedTopics}/{skill.totalTopics} Topics</span>
                    </div>
                    <div className="w-full h-2 bg-[#F3F0EB] rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          skillColors[i % skillColors.length]
                        }`}
                        style={{ width: `${skill.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            to="/quiz-zone"
            className="w-full flex items-center justify-center gap-2 bg-[#0052CC] hover:bg-[#0747A6] text-white py-3 rounded-xl font-semibold text-sm transition-colors mt-6 shadow-sm"
          >
            Continue Learning
          </Link>
        </div>

      </div>

    </div>
  );
}
