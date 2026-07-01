import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Check } from 'lucide-react';

const WORK_MODE_LABEL = { remote: 'Remote', onsite: 'On-site', hybrid: 'Hybrid' };

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="inline-flex items-center justify-center w-6 h-6 rounded-md text-[#9CA3AF] hover:text-[#00A693] hover:bg-[#F3F0EB] transition-colors shrink-0"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

export default function JobRecommendations() {
  const [searchParams] = useSearchParams();

  const jobs = useMemo(() => {
    const d = searchParams.get('d');
    if (!d) return [];
    try {
      const base64 = d.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(base64).split('').map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0')).join(''));
      return JSON.parse(json);
    } catch {
      return [];
    }
  }, [searchParams]);

  const showLocation = jobs.some(j => j.workMode !== 'remote');

  return (
    <div className="min-h-screen bg-bg flex justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Job Recommendations</h1>
        <p className="text-sm text-[#6B7280] mb-6">Tap the copy icon to copy an email id or subject.</p>

        {jobs.length === 0 ? (
          <div className="bg-white border border-[#E5E1DA] rounded-2xl p-10 text-center text-sm text-[#9CA3AF]">
            No job data found for this link.
          </div>
        ) : (
          <div className="bg-white border border-[#E5E1DA] rounded-2xl overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E5E1DA]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Email ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Subject</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Mode</th>
                  {showLocation && <th className="text-left px-4 py-3 text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Location</th>}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={i} className="border-b border-[#F3F0EB] last:border-0">
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#0A7373] font-medium">{j.emailId}</span>
                        <CopyButton text={j.emailId} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-[#1A1A1A]">{j.subject}</span>
                        <CopyButton text={j.subject} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0A7373] whitespace-nowrap">
                      {WORK_MODE_LABEL[j.workMode] || j.workMode}
                    </td>
                    {showLocation && (
                      <td className="px-4 py-3 text-sm text-[#6B7280] whitespace-nowrap">{j.location || '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
