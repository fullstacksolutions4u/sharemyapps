import { useEffect, useState } from 'react';
import { Briefcase, Copy, Check, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied' : 'Copy'}
      className={`inline-flex items-center justify-center p-1.5 rounded-lg transition-colors shrink-0 ${
        copied ? 'bg-green-100 text-green-700' : 'bg-[#F3F0EB] text-[#6B7280] hover:bg-[#E5E1DA] hover:text-[#1A1A1A]'
      }`}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

function getTodaysAlerts(alerts) {
  const now = new Date();
  const sameDay = d =>
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  const todays = alerts.filter(a => sameDay(new Date(a.scheduledAt || a.createdAt)));
  return todays.length > 0 ? todays : null;
}

function dayCount(eligibleSince) {
  if (!eligibleSince) return 1;
  const diff = Date.now() - new Date(eligibleSince).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
}

const STATUSES = ['Sent', 'Send Failed', 'Response Mail', 'Task Assigned', 'Interview Call', 'Interview Scheduled', 'Offer Received', 'Offer Rejected'];

const STATUS_STYLE = {
  'Sent':                 'bg-blue-50 text-blue-700 border-blue-200',
  'Send Failed':          'bg-red-50 text-red-600 border-red-200',
  'Response Mail':        'bg-amber-50 text-amber-700 border-amber-200',
  'Task Assigned':        'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Interview Call':       'bg-purple-50 text-purple-700 border-purple-200',
  'Interview Scheduled':  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Offer Received':       'bg-teal-50 text-teal-700 border-teal-200',
  'Offer Rejected':       'bg-slate-50 text-slate-700 border-slate-200',
};


// ── Mini Calendar ────────────────────────────────────────────────────────────
function MiniCalendar({ alerts, companyStatuses, getStatusKey, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  // Collect dates that have alerts
  const alertDates = new Set(
    alerts.map(a => {
      const d = new Date(a.scheduledAt || a.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );

  const hasAlert = (day) => alertDates.has(`${viewYear}-${viewMonth}-${day}`);

  const getDayStats = (day) => {
    const dayAlerts = alerts.filter(a => {
      const d = new Date(a.scheduledAt || a.createdAt);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day;
    });
    
    let received = 0;
    let failed = 0;
    
    dayAlerts.forEach(a => {
      (a.jobs || []).forEach(j => {
        received++;
        const status = companyStatuses[getStatusKey(a._id, j.emailId)];
        if (status === 'Send Failed') failed++;
      });
    });
    
    return { received, sent: received - failed, failed };
  };

  const isSelected = (day) =>
    selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  const isToday = (day) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Mo','Tu','We','Th','Fr'];

  const cells = [];
  const blanks = (firstDay === 0 || firstDay === 6) ? 0 : firstDay - 1;
  for (let i = 0; i < blanks; i++) cells.push(null);

  for (let d = 1; d <= daysInMonth; d++) {
    const wd = new Date(viewYear, viewMonth, d).getDay();
    if (wd >= 1 && wd <= 5) {
      cells.push(d);
    }
  }

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-[#F3F0EB] transition-colors text-[#6B7280]">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-[#374151]">{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-[#F3F0EB] transition-colors text-[#6B7280]">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-5 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-[#9CA3AF] py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-5 gap-y-0.5">
        {cells.map((day, idx) => (
          <div key={idx} className="flex items-center justify-center">
            {day ? (
              <button
                onClick={() => onSelectDate(day === null ? null : new Date(viewYear, viewMonth, day))}
                title={hasAlert(day) ? (() => {
                  const s = getDayStats(day);
                  return `Received: ${s.received}\nSent: ${s.sent}\nFailed: ${s.failed}`;
                })() : ''}
                className={`relative w-8 h-8 rounded-full text-xs font-medium transition-colors
                  ${isSelected(day) ? 'bg-[#0a7373] text-white' : isToday(day) ? 'bg-[#E6F7F5] text-[#0a7373] font-bold' : 'text-[#374151] hover:bg-[#F3F0EB]'}
                `}
              >
                {day}
                {hasAlert(day) && !isSelected(day) && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#0a7373]" />
                )}
              </button>
            ) : <span />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Alerts Chart ─────────────────────────────────────────────────────────────
function AlertsChart({ alerts, companyStatuses, getStatusKey }) {
  const dataMap = {
    1: { name: 'Mon', Received: 0, Sent: 0, Failed: 0, id: 1 },
    2: { name: 'Tue', Received: 0, Sent: 0, Failed: 0, id: 2 },
    3: { name: 'Wed', Received: 0, Sent: 0, Failed: 0, id: 3 },
    4: { name: 'Thu', Received: 0, Sent: 0, Failed: 0, id: 4 },
    5: { name: 'Fri', Received: 0, Sent: 0, Failed: 0, id: 5 },
  };

  alerts.forEach(a => {
    if (!a.jobs || a.jobs.length === 0) return;
    const d = new Date(a.scheduledAt || a.createdAt);
    const wd = d.getDay();
    
    // Only aggregate Mon-Fri
    if (wd >= 1 && wd <= 5) {
      const entry = dataMap[wd];
      a.jobs.forEach(j => {
        entry.Received++;
        const status = companyStatuses[getStatusKey(a._id, j.emailId)];
        if (status === 'Send Failed') {
          entry.Failed++;
        } else {
          entry.Sent++;
        }
      });
    }
  });

  const data = Object.values(dataMap).sort((a, b) => a.id - b.id);

  return (
    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-[#1A1A1A]">Application Statistics</h3>
      </div>
      <div className="h-[250px] w-full">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#9CA3AF]">
            <Briefcase size={28} className="mb-2 opacity-30" />
            <p className="text-sm">No data available for chart</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F0EB" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E1DA', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                labelStyle={{ display: 'none' }}
                cursor={{ fill: '#F9FAFB' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="Sent" stackId="a" fill="#3B82F6" maxBarSize={40} />
              <Bar dataKey="Failed" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [eligibleSince, setEligibleSince] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [companyStatuses, setCompanyStatuses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobAlertStatuses') || '{}'); }
    catch { return {}; }
  });
  const [companyComments, setCompanyComments] = useState(() => {
    try { return JSON.parse(localStorage.getItem('jobAlertComments') || '{}'); }
    catch { return {}; }
  });

  const getStatusKey = (alertId, company) => `${alertId}::${company}`;

  const setStatus = (alertId, company, status) => {
    const key = getStatusKey(alertId, company);
    const comment = companyComments[key] || '';
    setCompanyStatuses(prev => {
      const next = { ...prev, [key]: status };
      localStorage.setItem('jobAlertStatuses', JSON.stringify(next));
      return next;
    });
    api.put('/premium-services/job-alerts/status', { alertId, company, status, comment }).catch(console.error);
  };

  const setComment = (alertId, company, comment) => {
    const key = getStatusKey(alertId, company);
    const status = companyStatuses[key] || 'Sent';
    setCompanyComments(prev => {
      const next = { ...prev, [key]: comment };
      localStorage.setItem('jobAlertComments', JSON.stringify(next));
      return next;
    });
    api.put('/premium-services/job-alerts/status', { alertId, company, status, comment }).catch(console.error);
  };


  useEffect(() => {
    api.get('/premium-services/job-alerts')
      .then(res => {
        setAlerts(res.data.alerts || []);
        setEligibleSince(res.data.eligibleSince || null);
        
        if (res.data.statuses && res.data.statuses.length > 0) {
          const newStatuses = {};
          const newComments = {};
          res.data.statuses.forEach(s => {
            const key = getStatusKey(s.alertId, s.company);
            newStatuses[key] = s.status || 'Sent';
            if (s.comment) newComments[key] = s.comment;
          });
          setCompanyStatuses(prev => {
            const next = { ...prev, ...newStatuses };
            localStorage.setItem('jobAlertStatuses', JSON.stringify(next));
            return next;
          });
          setCompanyComments(prev => {
            const next = { ...prev, ...newComments };
            localStorage.setItem('jobAlertComments', JSON.stringify(next));
            return next;
          });
        }
      })
      .catch(err => { if (err.response?.status === 403) setForbidden(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 pb-10">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#E5E1DA] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-16 text-center">
        <Briefcase size={32} className="text-[#9CA3AF] mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-[#1A1A1A] mb-1">Job Alerts not available yet</h1>
        <p className="text-sm text-[#6B7280]">
          Job alerts unlock when you have premium placement access. Contact support if you believe this is an error.
        </p>
      </div>
    );
  }

  const todaysAlerts = getTodaysAlerts(alerts);

  // Alerts for the calendar-selected day
  const selectedAlerts = selectedDate
    ? alerts.filter(a => {
        const d = new Date(a.scheduledAt || a.createdAt);
        return d.getFullYear() === selectedDate.getFullYear() &&
               d.getMonth() === selectedDate.getMonth() &&
               d.getDate() === selectedDate.getDate();
      })
    : [];



  // Flat list of { alertId, name } for selected day
  const selectedCompanyRows = selectedAlerts.flatMap(a =>
    (a.jobs || []).map(j => ({ alertId: a._id, name: j.emailId }))
  );

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 pb-10 space-y-6">

      {/* ── Today's Alerts ─────────────────────────────────────────── */}
      {!todaysAlerts ? (
        <div className="text-center py-20">
          <Briefcase size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No job alerts for today yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {todaysAlerts.map((alert, sessionIndex) => {
            const jobs = alert.jobs || [];
            const links = alert.careerLinks || [];
            if (jobs.length === 0 && links.length === 0) return null;

            const half = Math.ceil(jobs.length / 2);
            const leftJobs = jobs.slice(0, half);
            const rightJobs = jobs.slice(half);

            return (
              <div key={alert._id || sessionIndex} className="bg-[#F9FAFB] border border-[#E5E1DA] rounded-3xl p-5 shadow-sm space-y-4">

                {/* Date + Day badge */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[#374151]">
                    {new Date(alert.scheduledAt || alert.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </h2>
                  <div className="flex flex-col items-center justify-center bg-[#0a7373] text-white rounded-xl px-3 py-1 leading-none shrink-0 shadow-sm">
                    <span className="text-[8px] font-bold tracking-[0.2em] uppercase opacity-80">Day</span>
                    <span className="text-lg font-bold font-mono tabular-nums">{dayCount(eligibleSince)}</span>
                  </div>
                </div>

                {/* Company + Email — split into two columns */}
                {jobs.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left half */}
                    <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-[#9CA3AF] border-b border-[#F3F0EB]">
                            <th className="py-2 pr-3 font-medium w-8 text-center">#</th>
                            <th className="py-2 pr-3 font-medium text-left">Company</th>
                            <th className="py-2 font-medium text-left">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leftJobs.map((job, i) => (
                            <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                              <td className="py-2.5 pr-3 text-[#6B7280] text-center">{i + 1}</td>
                              <td className="py-2.5 pr-3 align-middle">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#1A1A1A] font-medium truncate">{job.subject}</span>
                                  <CopyButton text={job.subject} />
                                </div>
                              </td>
                              <td className="py-2.5 align-middle">
                                <div className="flex items-center gap-2">
                                  <span className="text-[#374151] truncate">{job.emailId}</span>
                                  <CopyButton text={job.emailId} />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right half */}
                    {rightJobs.length > 0 && (
                      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-[#9CA3AF] border-b border-[#F3F0EB]">
                              <th className="py-2 pr-3 font-medium w-8 text-center">#</th>
                              <th className="py-2 pr-3 font-medium text-left">Company</th>
                              <th className="py-2 font-medium text-left">Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rightJobs.map((job, i) => (
                              <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                                <td className="py-2.5 pr-3 text-[#6B7280] text-center">{half + i + 1}</td>
                                <td className="py-2.5 pr-3 align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#1A1A1A] font-medium truncate">{job.subject}</span>
                                    <CopyButton text={job.subject} />
                                  </div>
                                </td>
                                <td className="py-2.5 align-middle">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[#374151] truncate">{job.emailId}</span>
                                    <CopyButton text={job.emailId} />
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Career page links */}
                {links.length > 0 && (
                  <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4">
                    <p className="text-xs text-[#9CA3AF] font-medium border-b border-[#F3F0EB] pb-2 mb-2">
                      Apply Directly — Upload Your Resume Through Career Page
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                      {links.map((link, i) => (
                        <li key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-[#F3F0EB] last:border-0 sm:last:border-0">
                          <span className="text-sm text-[#1A1A1A] font-medium truncate">{link.company}</span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#00A693] hover:text-[#007D6F] border border-[#00A693]/30 hover:bg-[#F0FBF9] px-3 py-1.5 rounded-lg transition-colors shrink-0"
                          >
                            <ExternalLink size={12} /> Upload Resume
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Calendar + Day companies ────────────────────────────────── */}
      <div className="mt-2">
        <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-base font-bold text-[#1A1A1A]">📅 Job Alert Calender</h2>
            <span className="text-xs text-[#6B7280] font-normal hidden sm:inline">(select a date to view job alerts)</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column: Calendar + Chart */}
          <div className="flex flex-col gap-4">
            <MiniCalendar
              alerts={alerts}
              companyStatuses={companyStatuses}
              getStatusKey={getStatusKey}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <AlertsChart 
              alerts={alerts} 
              companyStatuses={companyStatuses} 
              getStatusKey={getStatusKey} 
            />
          </div>

          {/* Right: Companies for selected day with status */}
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-4 flex flex-col h-full overflow-hidden min-h-[450px]">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-[#9CA3AF]">
                <Briefcase size={28} className="mb-2 opacity-40" />
                <p className="text-sm">Select a day to see companies</p>
              </div>
            ) : selectedCompanyRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center text-[#9CA3AF]">
                <Briefcase size={28} className="mb-2 opacity-40" />
                <p className="text-sm">No alerts on {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden pt-2">
                <ul className="space-y-1 overflow-y-auto flex-1 pr-1 pb-1">
                  {selectedCompanyRows.map(({ alertId, name }, i) => {
                    const key = getStatusKey(alertId, name);
                    const status = companyStatuses[key] || 'Sent';
                    const comment = companyComments[key] || '';
                    return (
                      <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 py-1.5 border-b border-[#F3F0EB] last:border-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xs text-[#6B7280] w-5 text-right shrink-0">{i + 1}.</span>
                          <span className="text-sm text-[#1A1A1A] font-medium flex-1 truncate">{name}</span>
                        </div>
                        <div className="flex items-center gap-2 pl-7 sm:pl-0 shrink-0 w-full sm:w-auto">
                          <select
                            value={status}
                            onChange={e => setStatus(alertId, name, e.target.value)}
                            className={`text-[11px] font-semibold border rounded-lg px-2 py-1 outline-none cursor-pointer transition-colors shrink-0 w-[140px] ${STATUS_STYLE[status] || 'bg-gray-50 text-gray-600 border-gray-200'}`}
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <input 
                            type="text" 
                            placeholder="Add comment..." 
                            value={comment}
                            onChange={e => setComment(alertId, name, e.target.value)}
                            className="text-[11px] border border-gray-200 rounded-lg px-2 py-1 flex-1 sm:w-[150px] outline-none focus:border-[#0a7373]"
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
