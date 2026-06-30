import { useEffect, useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Save, IndianRupee, Gift, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

function fmt(paise) {
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

/* ── JD Analysis card ───────────────────────────────────────── */
function JdAnalysisCard({ config, onSaved }) {
  const [paymentEnabled, setPaymentEnabled] = useState(config?.jdFeatureEnabled ?? true);
  const [dailyLimit, setDailyLimit]         = useState(config?.jdFreeLimit ?? 5);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/config', {
        jdFeatureEnabled: paymentEnabled,
        jdFreeLimit: Number(dailyLimit),
      });
      toast.success('JD Analysis settings saved.');
      onSaved(res.data);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
          <Search size={18} className="text-accent" />
        </div>
        <p className="text-sm font-semibold text-text">JD Analysis</p>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        {/* Payment toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text">Enable Payment</p>
          <button onClick={() => setPaymentEnabled(v => !v)} className="text-accent shrink-0">
            {paymentEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted" />}
          </button>
        </div>

        {/* Daily limit */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted mb-1.5">Daily Limit</label>
            <input
              type="number"
              min={0}
              max={999}
              value={dailyLimit}
              onChange={e => setDailyLimit(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0 self-end"
          >
            {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Free Offer card ────────────────────────────────────────── */
function FreeOfferCard({ config, onSaved }) {
  const [enabled, setEnabled] = useState(config?.freeOfferEnabled ?? true);
  const [price, setPrice]     = useState((config?.premiumServicePricePaise ?? 99900) / 100);
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/config', {
        freeOfferEnabled: enabled,
        premiumServicePricePaise: Math.round(Number(price) * 100),
      });
      toast.success('Premium service settings saved.');
      onSaved(res.data);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Gift size={18} className="text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-text">Premium Service</p>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        {/* Free toggle */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-text">Free</p>
          <button onClick={() => setEnabled(v => !v)} className="text-accent">
            {enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-muted" />}
          </button>
        </div>

        {/* Rate input */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-muted mb-1.5">Rate (₹)</label>
            <input
              type="number"
              min={0}
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0 self-end"
          >
            {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
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

/* ── Main ───────────────────────────────────────────────────── */
export default function AdminPlansSection() {
  const [config, setConfig]   = useState(null);
  const [paymentsData, setPaymentsData] = useState(null);
  const [page, setPage]       = useState(1);
  const [loadingPay, setLoadingPay] = useState(true);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Failed to load config.'));
  }, []);

  const loadPayments = (p) => {
    setLoadingPay(true);
    api.get(`/admin/payments?page=${p}`)
      .then(r => { setPaymentsData(r.data); setPage(p); })
      .catch(() => {})
      .finally(() => setLoadingPay(false));
  };

  useEffect(() => {
    api.get('/admin/payments?page=1')
      .then(r => { setPaymentsData(r.data); setPage(1); })
      .catch(() => {})
      .finally(() => setLoadingPay(false));
  }, []);

  return (
    <div className="max-w-5xl">
      {/* Top row — three cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <JdAnalysisCard key={config?._id ?? 'jd'}   config={config} onSaved={setConfig} />
        <FreeOfferCard  key={config?._id ?? 'offer'} config={config} onSaved={setConfig} />

        {/* Total Revenue */}
        <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
              <IndianRupee size={18} className="text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-text">Total Revenue</p>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-2xl font-bold text-text">
              {paymentsData ? fmt(paymentsData.totalRevenuePaise) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Transactions table */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <p className="text-sm font-semibold text-text">Transaction History</p>
        </div>

        {loadingPay ? (
          <div className="p-8 space-y-3">
            {[0,1,2,3,4].map(i => <div key={i} className="h-12 bg-bg rounded-xl animate-pulse" />)}
          </div>
        ) : !paymentsData?.payments?.length ? (
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
                  {paymentsData.payments.map(p => (
                    <tr key={p._id} className="hover:bg-bg transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-text">{p.user?.name || '—'}</p>
                        <p className="text-[11px] text-muted">{p.user?.email || ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-accent/10 text-accent">
                          {packLabel(p)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-text">{fmt(p.amountPaise)}</td>
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

            {paymentsData.pages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-border">
                <p className="text-xs text-muted">
                  Page {paymentsData.page} of {paymentsData.pages} · {paymentsData.total} transactions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPayments(page - 1)}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-border text-muted hover:text-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <button
                    onClick={() => loadPayments(page + 1)}
                    disabled={page === paymentsData.pages}
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
