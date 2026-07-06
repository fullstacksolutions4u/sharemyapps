import { useEffect, useState } from 'react';
import { Briefcase, Copy, Check } from 'lucide-react';
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

function dayNumber(alertDate, sinceDate) {
  const since = new Date(sinceDate);
  since.setHours(0, 0, 0, 0);
  const day = new Date(alertDate);
  day.setHours(0, 0, 0, 0);
  return Math.round((day - since) / 86400000) + 1;
}

function groupByDay(alerts) {
  const map = new Map();
  for (const alert of alerts) {
    const d = new Date(alert.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!map.has(key)) map.set(key, { date: alert.createdAt, jobs: [] });
    map.get(key).jobs.push(...alert.jobs);
  }
  return [...map.values()].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export default function JobAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [eligibleSince, setEligibleSince] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    api.get('/premium-services/job-alerts')
      .then(res => {
        setAlerts(res.data.alerts || []);
        setEligibleSince(res.data.eligibleSince || null);
      })
      .catch(err => { if (err.response?.status === 403) setForbidden(true); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Briefcase size={32} className="text-[#9CA3AF] mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-[#1A1A1A] mb-1">Job Alerts not available yet</h1>
        <p className="text-sm text-[#6B7280]">
          This page unlocks once our team has sent you your ATS-optimized resume and cover letter.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {alerts.length === 0 ? (
        <div className="text-center py-20">
          <Briefcase size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No job alerts yet. Check back soon.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groupByDay(alerts).map(group => (
            <div key={group.date} className="bg-white border border-[#E5E1DA] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-4">
                <p className="text-sm font-semibold text-[#1A1A1A]">
                  {new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                {eligibleSince && (
                  <div className="flex flex-col items-center justify-center bg-[#0a7373] text-white rounded-xl px-4 py-1.5 leading-none shrink-0 shadow-sm">
                    <span className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-80">Day</span>
                    <span className="text-2xl font-bold font-mono tabular-nums">{dayNumber(group.date, eligibleSince)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[#9CA3AF] border-b border-[#F3F0EB]">
                      <th className="py-2 pr-3 font-medium w-12 text-center whitespace-nowrap">Sl No</th>
                      <th className="py-2 pr-3 font-medium text-left w-1/2">Company Name</th>
                      <th className="py-2 font-medium text-left">Email Id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.jobs.map((job, i) => (
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
