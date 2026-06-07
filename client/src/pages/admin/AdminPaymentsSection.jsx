import { useEffect, useState } from 'react';
import { IndianRupee, TrendingUp, CreditCard, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import api from '../../api/axios';

function fmt(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminPaymentsSection() {
  const [data, setData]     = useState(null);
  const [page, setPage]     = useState(1);
  const [loading, setLoading] = useState(true);

  const load = (p) => {
    setLoading(true);
    api.get(`/admin/payments?page=${p}`)
      .then(r => { setData(r.data); setPage(p); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/admin/payments?page=1')
      .then(r => { setData(r.data); setPage(1); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-xl font-bold text-text mb-6">Payments</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data ? fmt(data.totalRevenuePaise) : '—'}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Transactions</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data ? data.totalTransactions : '—'}
          </p>
        </div>
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-accent" />
            <p className="text-xs font-semibold text-muted uppercase tracking-wide">Avg per Sale</p>
          </div>
          <p className="text-2xl font-bold text-text">
            {data && data.totalTransactions > 0
              ? fmt(Math.round(data.totalRevenuePaise / data.totalTransactions))
              : '—'}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-text">Transaction History</p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[0,1,2,3,4].map(i => (
              <div key={i} className="h-12 bg-bg rounded-xl animate-pulse" />
            ))}
          </div>
        ) : !data?.payments?.length ? (
          <div className="p-12 text-center text-muted text-sm">No payments yet.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-[11px] font-semibold text-muted uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Recruiter</th>
                    <th className="text-left px-5 py-3">Pack</th>
                    <th className="text-left px-5 py-3">Amount</th>
                    <th className="text-left px-5 py-3">Payment ID</th>
                    <th className="text-left px-5 py-3">Date</th>
                    <th className="text-left px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.payments.map(p => (
                    <tr key={p._id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-text">{p.user?.name || '—'}</p>
                        <p className="text-[11px] text-muted">{p.user?.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent/10 text-accent">
                          {p.analysesGranted} JD analyses
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-text">
                        {fmt(p.amountPaise)}
                      </td>
                      <td className="px-5 py-3.5">
                        <a
                          href={`https://dashboard.razorpay.com/app/payments/${p.razorpayPaymentId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-accent hover:underline font-mono"
                        >
                          {p.razorpayPaymentId.slice(0, 16)}…
                          <ExternalLink size={10} />
                        </a>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{timeAgo(p.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                          Success
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted">
                  Page {data.page} of {data.pages} · {data.total} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => load(page - 1)}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => load(page + 1)}
                    disabled={page === data.pages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
