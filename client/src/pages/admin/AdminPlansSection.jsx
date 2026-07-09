import { useEffect, useRef, useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Save, IndianRupee, Gift, ExternalLink, ChevronLeft, ChevronRight, Crown, UserPlus, X } from 'lucide-react';
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
  const [dueDate, setDueDate] = useState(config?.freeOfferDueDate ? config.freeOfferDueDate.slice(0, 10) : '');
  const [saving, setSaving]   = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/config', {
        freeOfferEnabled: enabled,
        premiumServicePricePaise: Math.round(Number(price) * 100),
        freeOfferDueDate: dueDate ? new Date(dueDate).toISOString() : null,
      });
      toast.success('Placement service settings saved.');
      onSaved(res.data);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const isExpired = dueDate && new Date(dueDate) < new Date(new Date().toDateString());

  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Gift size={18} className="text-emerald-600" />
        </div>
        <p className="text-sm font-semibold text-text">Placement Service</p>
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
              disabled={enabled}
              className="w-full border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-bg"
            />
          </div>
        </div>

        {/* Free offer due date */}
        {enabled && (
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Free Offer Due Date (optional)</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  className="text-xs font-medium text-muted hover:text-red-500 transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            {isExpired && (
              <p className="text-[11px] text-red-500 mt-1.5">
                This date is in the past — the free offer will show as expired to users even with Free enabled. Clear it or pick a future date.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ── Free Premium Access card ───────────────────────────────── */
const FREE_ACCESS_NOTE = 'Free access granted by admin';

function Avatar({ user, size = 32 }) {
  return user?.avatar ? (
    <img src={user.avatar} alt="" style={{ width: size, height: size }} className="rounded-full object-cover shrink-0" />
  ) : (
    <div
      style={{ width: size, height: size }}
      className="rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0"
    >
      {user?.name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

function FreeAccessCard() {
  const [query, setQuery]         = useState('');
  const [results, setResults]     = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen]           = useState(false);
  const [granted, setGranted]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState(null);
  const boxRef = useRef(null);
  const searchTimer = useRef(null);

  const loadGranted = () => {
    api.get('/admin/premium-services/free-access')
      .then(r => setGranted(r.data.users || []))
      .catch(() => toast.error('Failed to load free-access users.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadGranted, []);

  // Close the search dropdown on outside click
  useEffect(() => {
    const handler = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Clear any pending search on unmount
  useEffect(() => () => clearTimeout(searchTimer.current), []);

  // Debounced user search, driven from the input's change handler
  const handleQueryChange = (value) => {
    setQuery(value);
    clearTimeout(searchTimer.current);
    if (!value.trim()) { setResults([]); setSearching(false); setOpen(false); return; }
    setSearching(true);
    setOpen(true);
    searchTimer.current = setTimeout(() => {
      api.get(`/admin/premium-services/search-users?q=${encodeURIComponent(value.trim())}`)
        .then(r => setResults(r.data.users || []))
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
  };

  const handleGrant = async (u) => {
    setBusyId(u._id);
    try {
      await api.post(`/admin/premium-services/${u._id}/unlock`, {
        key: 'placement_session',
        notes: FREE_ACCESS_NOTE,
      });
      toast.success(`Free premium access granted to ${u.name}.`);
      setQuery('');
      setResults([]);
      setOpen(false);
      loadGranted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant access.');
    } finally {
      setBusyId(null);
    }
  };

  const handleRevoke = async (u) => {
    if (!window.confirm(`Revoke free premium access from ${u.name}?`)) return;
    setBusyId(u._id);
    try {
      await api.delete(`/admin/premium-services/${u._id}/revoke/placement_session`);
      toast.success(`Access revoked for ${u.name}.`);
      setGranted(prev => prev.filter(g => g._id !== u._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke access.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Crown size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Free Premium Access</p>
          <p className="text-xs text-muted">Selected users get all premium services for free.</p>
        </div>
      </div>

      <div className="p-5">
        {/* User search */}
        <div ref={boxRef} className="relative max-w-md">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search users by name or email…"
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            onFocus={() => { if (results.length) setOpen(true); }}
            className="w-full pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text placeholder:text-muted"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {open && query.trim() && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
              {searching ? (
                <p className="text-xs text-muted text-center py-3">Searching…</p>
              ) : results.length === 0 ? (
                <p className="text-xs text-muted text-center py-3">No users found</p>
              ) : (
                <div className="max-h-64 overflow-y-auto divide-y divide-border">
                  {results.map(u => (
                    <div key={u._id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-bg transition-colors">
                      <Avatar user={u} size={30} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{u.name}</p>
                        <p className="text-[11px] text-muted truncate">{u.email}</p>
                      </div>
                      {u.hasPremium ? (
                        <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                          Has access
                        </span>
                      ) : (
                        <button
                          onClick={() => handleGrant(u)}
                          disabled={busyId === u._id}
                          className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 text-white transition-colors shrink-0"
                        >
                          {busyId === u._id
                            ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            : <UserPlus size={11} />}
                          Grant Free
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Granted users */}
        <div className="mt-5">
          {loading ? (
            <div className="space-y-2">
              {[0, 1].map(i => <div key={i} className="h-11 bg-bg rounded-xl animate-pulse" />)}
            </div>
          ) : granted.length === 0 ? (
            <p className="text-xs text-muted">No users have been granted free access yet. Search above to add someone.</p>
          ) : (
            <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
              {granted.map(u => (
                <div key={u._id} className="flex items-center gap-3 px-4 py-2.5 bg-white">
                  <Avatar user={u} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text truncate">{u.name}</p>
                    <p className="text-[11px] text-muted truncate">{u.email}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                    Free access
                  </span>
                  {u.grantedAt && (
                    <span className="text-[11px] text-muted shrink-0 hidden sm:block">{timeAgo(u.grantedAt)}</span>
                  )}
                  <button
                    onClick={() => handleRevoke(u)}
                    disabled={busyId === u._id}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-border text-muted hover:text-red-600 hover:border-red-300 disabled:opacity-40 transition-colors shrink-0"
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
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
  const [config, setConfig]         = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [paymentsData, setPaymentsData] = useState(null);
  const [page, setPage]             = useState(1);
  const [loadingPay, setLoadingPay] = useState(true);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Failed to load config.'))
      .finally(() => setLoadingConfig(false));
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
        {loadingConfig
          ? <div className="bg-white border border-border rounded-2xl px-5 py-4 h-40 animate-pulse" />
          : <JdAnalysisCard key={config?._id ?? 'jd'} config={config} onSaved={setConfig} />}
        {loadingConfig
          ? <div className="bg-white border border-border rounded-2xl px-5 py-4 h-40 animate-pulse" />
          : <FreeOfferCard key={config?._id ?? 'offer'} config={config} onSaved={setConfig} />}

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

      {/* Free premium access for selected users */}
      <FreeAccessCard />

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
