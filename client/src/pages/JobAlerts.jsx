import { useEffect, useState } from 'react';
import { Briefcase, Copy, Check, ExternalLink } from 'lucide-react';
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

// Only today's latest alert is shown — yesterday's alerts disappear automatically
function latestTodaysAlert(alerts) {
  const now = new Date();
  const sameDay = d =>
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
  return alerts
    .filter(a => sameDay(new Date(a.scheduledAt || a.createdAt)))
    .sort((a, b) => new Date(b.scheduledAt || b.createdAt) - new Date(a.scheduledAt || a.createdAt))[0] || null;
}

// Day 1 = the day the user's resume/cover letter was delivered (service activated)
function dayCount(eligibleSince) {
  if (!eligibleSince) return 1;
  const diff = Date.now() - new Date(eligibleSince).getTime();
  return Math.max(1, Math.floor(diff / 86400000) + 1);
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-10">
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
          This page unlocks once our team has sent you your ATS-optimized resume and cover letter.
        </p>
      </div>
    );
  }

  const todaysAlert = latestTodaysAlert(alerts);
  const jobs = todaysAlert?.jobs || [];
  const links = todaysAlert?.careerLinks || [];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-10">
      {!todaysAlert ? (
        <div className="text-center py-20">
          <Briefcase size={32} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No job alerts for today yet. Check back soon.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-lg font-semibold text-[#1A1A1A]">Job Alerts</h1>
            <div className="flex flex-col items-center justify-center bg-[#0a7373] text-white rounded-xl px-4 py-1.5 leading-none shrink-0 shadow-sm">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase opacity-80">Day</span>
              <span className="text-2xl font-bold font-mono tabular-nums">{dayCount(eligibleSince)}</span>
            </div>
          </div>

          <div className={`grid grid-cols-1 gap-4 items-start ${jobs.length > 0 && links.length > 0 ? 'md:grid-cols-5' : ''}`}>
            {jobs.length > 0 && (
              <div className={`bg-white border border-[#E5E1DA] rounded-2xl p-5 overflow-x-auto ${links.length > 0 ? 'md:col-span-3' : ''}`}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-[#9CA3AF] border-b border-[#F3F0EB]">
                      <th className="py-2 pr-3 font-medium w-12 text-center whitespace-nowrap">Sl No</th>
                      <th className="py-2 pr-3 font-medium text-left w-1/2">Company Name</th>
                      <th className="py-2 font-medium text-left">Email Id</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job, i) => (
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
            )}

            {links.length > 0 && (
              <div className={`bg-white border border-[#E5E1DA] rounded-2xl p-5 ${jobs.length > 0 ? 'md:col-span-2' : ''}`}>
                <p className="text-xs text-[#9CA3AF] font-medium border-b border-[#F3F0EB] pb-2 mb-1">
                  Apply Directly — Upload Your Resume Through Career Page
                </p>
                <ul>
                  {links.map((link, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 py-2.5 border-b border-[#F3F0EB] last:border-0">
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
        </>
      )}
    </div>
  );
}
