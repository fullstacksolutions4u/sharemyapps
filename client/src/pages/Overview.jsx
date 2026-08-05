import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, ExternalLink, GraduationCap, Coins, Bell,
  Loader2 
} from 'lucide-react';
import api from '../api/axios';
export default function Overview() {
  const [filter, setFilter] = useState('daily'); // 'daily' | 'monthly'
  
  const { data: stats, isLoading: loading } = useQuery({
    queryKey: ['overviewStats'],
    queryFn: async () => {
      const res = await api.get('/users/overview-stats');
      return res.data;
    },
    staleTime: 0,
    gcTime: 0,
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
  const alertCount = stats?.jobAlertCount || 0;
  const isJobAlertEligible = !!stats?.isJobAlertEligible;

  const chartData = filter === 'daily'
    ? (stats?.dailyActivity || [])
    : (stats?.monthlyActivity || []);
  const maxVal = Math.max(...chartData.map(d => d.apps + d.clicks + (isJobAlertEligible ? d.alerts : 0)), 4);

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
    ...(isJobAlertEligible ? [{
      title: 'Job Alerts Received',
      value: alertCount,
      badge: 'Premium',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      description: '',
      icon: Bell,
      iconColor: 'bg-amber-50 text-amber-600 border border-amber-100'
    }] : []),
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
      
      {/* Top Stats Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isJobAlertEligible ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-4`}>
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
              {['daily', 'monthly'].map(f => (
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
            <div className="flex h-[150px] relative px-2">
              {/* Y-axis Labels */}
              <div className="flex flex-col justify-between text-[10px] font-bold text-gray-400 pb-6 text-right pr-2.5 select-none w-7">
                <span>{Math.round(maxVal)}</span>
                <span>{Math.round(maxVal * 0.67)}</span>
                <span>{Math.round(maxVal * 0.33)}</span>
                <span>0</span>
              </div>

              {/* Chart Grid and Bars */}
              <div className="flex-1 flex items-end justify-between relative h-full">
                {/* Y-axis grid lines background */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="w-full border-t border-dashed border-[#FAF7F2] h-0" />
                  ))}
                </div>

                {/* Bars mapping */}
                {chartData.map((item, i) => {
                  const effectiveAlerts = isJobAlertEligible ? item.alerts : 0;
                  const totalVal = item.apps + item.clicks + effectiveAlerts;
                  const barHeight = totalVal > 0 ? (totalVal / maxVal) * 100 : 0;
                  const appPercent = totalVal > 0 ? (item.apps / totalVal) * 100 : 0;
                  const clickPercent = totalVal > 0 ? (item.clicks / totalVal) * 100 : 0;
                  const alertPercent = totalVal > 0 ? (effectiveAlerts / totalVal) * 100 : 0;

                  return (
                    <div key={i} className="flex flex-col items-center flex-1 group">
                      <div className="w-full flex items-end justify-center h-[120px] relative">
                        {totalVal > 0 ? (
                          <>
                            <div 
                              style={{ height: `${barHeight}%` }}
                              className="w-7 sm:w-8 flex flex-col-reverse rounded-t-lg overflow-hidden transition-all duration-500"
                            >
                              {/* Apps Segment (Blue) */}
                              {item.apps > 0 && (
                                <div
                                  style={{ height: `${appPercent}%` }}
                                  className="w-full bg-[#0052CC] flex items-center justify-center overflow-hidden"
                                >
                                  {appPercent >= 18 && (
                                    <span className="text-white font-extrabold select-none" style={{ fontSize: '9px', lineHeight: 1 }}>
                                      {item.apps}
                                    </span>
                                  )}
                                </div>
                              )}
                              
                              {/* Clicks Segment (Emerald) */}
                              {item.clicks > 0 && (
                                <div
                                  style={{ height: `${clickPercent}%` }}
                                  className="w-full bg-[#00A693] flex items-center justify-center overflow-hidden"
                                >
                                  {clickPercent >= 18 && (
                                    <span className="text-white font-extrabold select-none" style={{ fontSize: '9px', lineHeight: 1 }}>
                                      {item.clicks}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Job Alerts Segment (Amber) — only for eligible users */}
                              {isJobAlertEligible && effectiveAlerts > 0 && (
                                <div
                                  style={{ height: `${alertPercent}%` }}
                                  className="w-full bg-amber-500 flex items-center justify-center overflow-hidden"
                                >
                                  {alertPercent >= 18 && (
                                    <span className="text-white font-extrabold select-none" style={{ fontSize: '9px', lineHeight: 1 }}>
                                      {effectiveAlerts}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="h-1 w-7 sm:w-8 bg-gray-100 rounded-t-lg" />
                        )}
                      </div>

                      <span className="text-[10px] font-bold text-gray-400 mt-2 block">
                        {item.label}
                      </span>
                    </div>
                  );
                })}
              </div>
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
              {isJobAlertEligible && (
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Job Alerts</span>
                </div>
              )}
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
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#FAF6F0] to-[#EAE3D2] border border-white text-[#4A2E1B] py-3 rounded-full font-bold text-sm transition-all duration-300 mt-6 shadow-[0_14px_30px_rgba(139,115,85,0.32),_0_4px_8px_rgba(139,115,85,0.15),_inset_0_4px_10px_rgba(255,255,255,0.95)] active:scale-[0.98]"
          >
            Continue Learning
          </Link>
        </div>

      </div>

    </div>
  );
}
