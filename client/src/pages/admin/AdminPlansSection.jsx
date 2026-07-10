import { useEffect, useMemo, useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Save, IndianRupee, Gift, Crown, UserPlus, X } from 'lucide-react';
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
  const [allUsers, setAllUsers]   = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [granted, setGranted]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [busyId, setBusyId]       = useState(null);
  const [selected, setSelected]   = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');
  const [granting, setGranting]   = useState(false);

  const loadGranted = () => {
    api.get('/admin/premium-services/free-access')
      .then(r => setGranted(r.data.users || []))
      .catch(() => toast.error('Failed to load free-access users.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGranted();
    api.get('/admin/premium-services/search-users')
      .then(r => setAllUsers(r.data.users || []))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setLoadingUsers(false));
    api.get('/admin/email/templates')
      .then(r => setTemplates(r.data.templates || []))
      .catch(() => {});
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(u =>
      (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
    );
  }, [allUsers, query]);

  const selectableFiltered = filteredUsers.filter(u => !u.hasPremium && !u.hasOffer && !u.hasGrant);
  const allFilteredSelected = selectableFiltered.length > 0 && selectableFiltered.every(u => selected.some(s => s._id === u._id));

  const isSelected = (id) => selected.some(s => s._id === id);

  const toggleSelect = (u) => {
    setSelected(prev => isSelected(u._id) ? prev.filter(s => s._id !== u._id) : [...prev, u]);
  };

  const toggleAllFiltered = () => {
    setSelected(prev => {
      if (allFilteredSelected) {
        const ids = new Set(selectableFiltered.map(u => u._id));
        return prev.filter(s => !ids.has(s._id));
      }
      const existing = new Set(prev.map(s => s._id));
      return [...prev, ...selectableFiltered.filter(u => !existing.has(u._id))];
    });
  };

  const confirmGrant = async () => {
    setGranting(true);
    const grantedIds = [];
    const failedNames = [];
    for (const u of selected) {
      try {
        await api.post(`/admin/premium-services/${u._id}/grant-free`);
        grantedIds.push(u._id);
      } catch {
        failedNames.push(u.name);
      }
    }

    let emailFailed = false;
    if (templateId && grantedIds.length > 0) {
      try {
        await api.post('/admin/email/send', { templateId, userIds: grantedIds });
      } catch {
        emailFailed = true;
      }
    }

    if (grantedIds.length > 0) {
      toast.success(
        `Free premium access granted to ${grantedIds.length} user${grantedIds.length === 1 ? '' : 's'}` +
        (templateId && !emailFailed ? ' and email sent.' : '.')
      );
    }
    if (emailFailed) toast.error('Access granted, but the email failed to send.');
    if (failedNames.length > 0) toast.error(`Failed to grant: ${failedNames.join(', ')}`);

    setGranting(false);
    setModalOpen(false);
    setSelected([]);
    setQuery('');
    const grantedSet = new Set(grantedIds);
    setAllUsers(prev => prev.map(u => grantedSet.has(u._id) ? { ...u, hasGrant: true } : u));
    loadGranted();
  };

  const handleRevoke = async (u) => {
    if (!window.confirm(`Revoke free premium access from ${u.name}?`)) return;
    setBusyId(u._id);
    try {
      await api.delete(`/admin/premium-services/${u._id}/revoke-free`);
      toast.success(`Access revoked for ${u.name}.`);
      setGranted(prev => prev.filter(g => g._id !== u._id));
      setAllUsers(prev => prev.map(x => x._id === u._id ? { ...x, hasPremium: false, hasOffer: false, hasGrant: false } : x));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revoke access.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden mb-8">
      {/* Grant confirmation modal with optional email template */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md border border-border shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <p className="text-sm font-semibold text-text">
                Grant Free Premium Access ({selected.length} user{selected.length === 1 ? '' : 's'})
              </p>
              <button onClick={() => setModalOpen(false)} className="text-muted hover:text-text transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="max-h-44 overflow-y-auto divide-y divide-border border border-border rounded-xl">
                {selected.map(u => (
                  <div key={u._id} className="flex items-center gap-3 px-3 py-2">
                    <Avatar user={u} size={28} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{u.name}</p>
                      <p className="text-[11px] text-muted truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => toggleSelect(u)}
                      className="text-muted hover:text-red-500 transition-colors shrink-0"
                      title="Remove from selection"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted leading-relaxed">
                These users will see an Apply button for free premium services on the Premium page.
                After they apply, activate them in Placement Applicants to unlock services and the
                Premium Member tag. Optionally pick an email template to notify them now.
              </p>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">Email notification</label>
                <select
                  value={templateId}
                  onChange={e => setTemplateId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text"
                >
                  <option value="">Don't send an email</option>
                  {templates.map(t => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p className="text-[11px] text-muted mt-1.5">
                    No templates yet — create them in the Email section to notify users from here.
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold border border-border rounded-lg text-muted hover:text-text transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmGrant}
                  disabled={granting || selected.length === 0}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  {granting
                    ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <UserPlus size={12} />}
                  {templateId ? 'Grant & Send Email' : 'Grant Access'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 py-4 border-b border-border flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
          <Crown size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text">Free Premium Access</p>
          <p className="text-xs text-muted">
            Selected users get an Apply button for free premium services. Once they apply, activate them in Placement Applicants to unlock services and the Premium Member tag.
          </p>
        </div>
      </div>

      <div className="p-5">
        {/* User list with checkboxes */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-56 max-w-md">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search users by name or email…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm border border-border rounded-lg bg-bg focus:outline-none focus:border-accent text-text placeholder:text-muted"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {selected.length > 0 && (
            <>
              <button
                onClick={() => { setTemplateId(''); setModalOpen(true); }}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors"
              >
                <UserPlus size={12} />
                Grant Free Access ({selected.length})
              </button>
              <button
                onClick={() => setSelected([])}
                className="text-xs text-muted hover:text-text transition-colors"
              >
                Clear selection
              </button>
            </>
          )}
        </div>

        {loadingUsers ? (
          <div className="mt-3 space-y-2">
            {[0, 1, 2].map(i => <div key={i} className="h-10 bg-bg rounded-xl animate-pulse" />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="mt-3 text-xs text-muted text-center py-6">No users found.</p>
        ) : (
          <>
            {selectableFiltered.length > 0 && (
              <button
                onClick={toggleAllFiltered}
                className="mt-3 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {allFilteredSelected ? 'Deselect all' : 'Select all'} ({selectableFiltered.length})
              </button>
            )}
            <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-border border border-border rounded-xl">
              {filteredUsers.map(u => {
                const blocked = u.hasPremium || u.hasOffer || u.hasGrant;
                return (
                  <label
                    key={u._id}
                    className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                      blocked ? 'opacity-60' : 'hover:bg-bg cursor-pointer'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected(u._id)}
                      disabled={blocked}
                      onChange={() => toggleSelect(u)}
                      className="accent-accent w-4 h-4 shrink-0"
                    />
                    <Avatar user={u} size={30} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-text truncate">{u.name}</p>
                      <p className="text-[11px] text-muted truncate">{u.email}</p>
                    </div>
                    {u.hasPremium ? (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                        Has access
                      </span>
                    ) : u.hasGrant ? (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 shrink-0">
                        Granted
                      </span>
                    ) : u.hasOffer ? (
                      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 shrink-0">
                        Applicant
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </>
        )}

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
                  {u.stage === 'activated' ? (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      Activated
                    </span>
                  ) : u.stage === 'applied' ? (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      Applied — pending activation
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                      Invited — not applied yet
                    </span>
                  )}
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

  useEffect(() => {
    api.get('/admin/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Failed to load config.'))
      .finally(() => setLoadingConfig(false));
    api.get('/admin/payments?page=1')
      .then(r => setPaymentsData(r.data))
      .catch(() => {});
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
    </div>
  );
}
