import { useEffect, useState } from 'react';
import {
  Search, ChevronRight, ToggleLeft, ToggleRight,
  Save, ArrowLeft, Zap, IndianRupee, Users,
  Sparkles, Plus, Trash2, GripVertical, Pencil, Gift,
} from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

/* ── Service definitions ─────────────────────────────────── */
const SERVICES = [
  {
    key: 'jdAnalysis',
    label: 'JD Analysis',
    description: 'AI-powered job description matching for recruiters',
    icon: Search,
    color: 'accent',
    fields: [
      { key: 'jdFeatureEnabled', label: 'Feature Enabled', type: 'toggle' },
      { key: 'jdFreeLimit',      label: 'Free Analyses / Month', type: 'number', min: 0, max: 100, suffix: 'analyses' },
      { key: 'jdPaidPackSize',   label: 'Paid Pack Size', type: 'number', min: 1, max: 200, suffix: 'analyses' },
      { key: 'jdPackPricePaise', label: 'Pack Price (₹)', type: 'rupees', min: 1 },
    ],
  },
];


/* ── Status badge ────────────────────────────────────────── */
function StatusBadge({ enabled }) {
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
    }`}>
      {enabled ? 'Active' : 'Disabled'}
    </span>
  );
}

/* ── Placement Plans Editor ─────────────────────────────── */
function PlacementPlansEditor({ onBack }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // plan id or 'new'
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/plans')
      .then(({ data }) => setPlans(data))
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  const openEdit = (plan) => {
    setForm({ name: plan.name, price: plan.price, active: plan.active });
    setEditing(plan._id);
  };

  const openNew = () => {
    setForm({ name: '', price: '', active: true });
    setEditing('new');
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.price === '') return toast.error('Name and price are required');
    setSaving(true);
    try {
      if (editing === 'new') {
        const { data } = await api.post('/admin/plans', { ...form, price: Number(form.price) });
        setPlans(prev => [...prev, data]);
        toast.success('Plan created');
      } else {
        const { data } = await api.put(`/admin/plans/${editing}`, { ...form, price: Number(form.price) });
        setPlans(prev => prev.map(p => p._id === editing ? data : p));
        toast.success('Plan updated');
      }
      setEditing(null);
    } catch {
      toast.error('Failed to save plan');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      await api.delete(`/admin/plans/${id}`);
      setPlans(prev => prev.filter(p => p._id !== id));
      toast.success('Plan deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (plan) => {
    try {
      const { data } = await api.put(`/admin/plans/${plan._id}`, { active: !plan.active });
      setPlans(prev => prev.map(p => p._id === plan._id ? data : p));
    } catch {
      toast.error('Failed to update');
    }
  };

  if (editing !== null) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setEditing(null)} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted hover:text-text hover:bg-bg transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Sparkles size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-text">{editing === 'new' ? 'New Plan' : 'Edit Plan'}</h2>
            <p className="text-xs text-muted">Placement Support Services</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="space-y-3">
          {/* Name & Price */}
          <div className="bg-white border border-border rounded-2xl px-5 py-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Plan Name</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Basic"
                className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1.5">Price (₹)</label>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center shrink-0">
                  <IndianRupee size={13} className="text-muted" />
                </div>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="499"
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Active toggle */}
          <div className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text">Visible on site</p>
              <p className="text-xs text-muted mt-0.5">Show this plan on the Placement Support Services page</p>
            </div>
            <button onClick={() => setForm(p => ({ ...p, active: !p.active }))} className="text-accent">
              {form.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted hover:text-text hover:bg-bg transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
          <Sparkles size={16} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-text">Placement Support Services</h2>
          <p className="text-xs text-muted">Manage pricing plans shown on the public page</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          <Plus size={14} /> Add Plan
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-bg rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map(plan => (
            <div key={plan._id} className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center gap-4">
              <GripVertical size={16} className="text-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-text">{plan.name}</p>
                  <StatusBadge enabled={plan.active} />
                  {plan.badge && (
                    <span className="text-[11px] border border-accent/40 text-accent px-2 py-0.5 rounded-full">{plan.badge}</span>
                  )}
                </div>
                <p className="text-xs text-muted">₹{plan.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActive(plan)} className="text-muted hover:text-accent transition-colors">
                  {plan.active ? <ToggleRight size={22} className="text-accent" /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => openEdit(plan)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted hover:text-accent hover:border-accent transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(plan._id)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-border text-muted hover:text-red-500 hover:border-red-300 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
          {plans.length === 0 && (
            <div className="text-center py-10 text-sm text-muted">No plans yet. Add your first plan.</div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Free Offer Card ─────────────────────────────────────── */
function FreeOfferCard({ config, onSaved }) {
  const [enabled, setEnabled] = useState(config?.freeOfferEnabled ?? true);
  const [dueDate, setDueDate] = useState(
    config?.freeOfferDueDate ? new Date(config.freeOfferDueDate).toISOString().slice(0, 10) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/config', {
        freeOfferEnabled: enabled,
        freeOfferDueDate: dueDate || null,
      });
      toast.success('Free offer settings saved.');
      onSaved(res.data);
    } catch {
      toast.error('Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border border-border rounded-2xl px-5 py-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
          <Gift size={18} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Free Premium Offer</p>
          <p className="text-xs text-muted">Show the free apply button on the Career Services page</p>
        </div>
        <button onClick={() => setEnabled(v => !v)} className="text-accent shrink-0">
          {enabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted" />}
        </button>
      </div>

      <div className="flex items-end gap-3 pt-1 border-t border-border">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-muted mb-1.5">Offer Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text focus:outline-none focus:border-accent"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shrink-0"
        >
          {saving ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/* ── Services list ───────────────────────────────────────── */
function ServicesList({ config, onSelect, onConfigSaved }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-text mb-6">Plans & Pricing</h2>

      <div className="space-y-3">
        {/* Placement Support Services card */}
        <button
          onClick={() => onSelect('placementPlans')}
          className="w-full bg-white border border-border hover:border-accent/40 hover:shadow-sm rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text mb-0.5">Placement Support Services</p>
            <p className="text-xs text-muted">Manage Basic & Premium HR placement plans</p>
          </div>
          <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors shrink-0" />
        </button>

        {SERVICES.map(svc => {
          const Icon = svc.icon;
          const enabled = config?.jdFeatureEnabled ?? true;

          return (
            <button
              key={svc.key}
              onClick={() => onSelect(svc.key)}
              className="w-full bg-white border border-border hover:border-accent/40 hover:shadow-sm rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                <Icon size={18} className="text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-text">{svc.label}</p>
                  <StatusBadge enabled={enabled} />
                </div>
                <p className="text-xs text-muted">{svc.description}</p>
              </div>
              {config && (
                <div className="hidden sm:flex items-center gap-6 text-xs text-muted shrink-0 mr-2">
                  <div className="text-center">
                    <p className="font-semibold text-text">{config.jdFreeLimit}</p>
                    <p>free/mo</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-text">{config.jdPaidPackSize}</p>
                    <p>per pack</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-accent">₹{(config.jdPackPricePaise / 100).toLocaleString('en-IN')}</p>
                    <p>price</p>
                  </div>
                </div>
              )}
              <ChevronRight size={16} className="text-muted group-hover:text-accent transition-colors shrink-0" />
            </button>
          );
        })}

        <FreeOfferCard key={config?._id ?? 'loading'} config={config} onSaved={onConfigSaved} />

        <div className="bg-white border border-dashed border-border rounded-2xl px-5 py-4 flex items-center gap-4 opacity-50">
          <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center shrink-0">
            <Users size={18} className="text-muted" />
          </div>
          <div>
            <p className="text-sm font-semibold text-muted">More services coming soon</p>
            <p className="text-xs text-muted">Mentorship, Freelance, Resume AI…</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Service detail ──────────────────────────────────────── */
function ServiceDetail({ serviceKey, config, onBack, onSaved }) {
  const svc = SERVICES.find(s => s.key === serviceKey);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => {
    if (!config) return null;
    return Object.fromEntries(
      svc.fields.map(f => [f.key, f.type === 'rupees' ? config[f.key] / 100 : config[f.key]])
    );
  });

  if (!form) return null;

  const dirty = svc.fields.some(f => {
    const orig = f.type === 'rupees' ? config[f.key] / 100 : config[f.key];
    return String(form[f.key]) !== String(orig);
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {};
      svc.fields.forEach(f => {
        if (f.type === 'rupees') {
          payload[f.key] = Math.round(Number(form[f.key]) * 100);
        } else if (f.type === 'number') {
          payload[f.key] = Number(form[f.key]);
        } else {
          payload[f.key] = form[f.key];
        }
      });
      const res = await api.put('/admin/config', payload);
      toast.success('Settings saved.');
      onSaved(res.data);
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const Icon = svc.icon;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted hover:text-text hover:bg-bg transition-colors">
          <ArrowLeft size={15} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Icon size={16} className="text-accent" />
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-text">{svc.label}</h2>
          <p className="text-xs text-muted">{svc.description}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {saving
            ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save size={14} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      <div className="space-y-3">
        {svc.fields.map(field => (
          <div key={field.key} className="bg-white border border-border rounded-2xl px-5 py-4">
            {field.type === 'toggle' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{field.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {form[field.key]
                      ? 'Paid quota active — free monthly limit + paid packs apply (15/day cap)'
                      : 'Free mode — unlimited access with no payment, 15 analyses/day cap'}
                  </p>
                </div>
                <button onClick={() => setForm(prev => ({ ...prev, [field.key]: !prev[field.key] }))} className="text-accent">
                  {form[field.key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-muted" />}
                </button>
              </div>
            ) : field.type === 'rupees' ? (
              <div>
                <p className="text-sm font-semibold text-text mb-3">{field.label}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center">
                    <IndianRupee size={13} className="text-muted" />
                  </div>
                  <input
                    type="number"
                    min={field.min}
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-28 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
                  />
                  <span className="text-sm text-muted">per pack</span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-text mb-3">{field.label}</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center">
                    <Zap size={13} className="text-muted" />
                  </div>
                  <input
                    type="number"
                    min={field.min}
                    max={field.max}
                    value={form[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-24 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
                  />
                  {field.suffix && <span className="text-sm text-muted">{field.suffix}</span>}
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="bg-bg border border-border rounded-2xl px-5 py-4">
          <p className="text-[11px] font-semibold text-muted uppercase tracking-wide mb-2">Recruiter sees</p>
          <div className="flex items-center gap-2 text-sm text-text">
            <Zap size={13} className="text-accent" />
            <span>
              <span className="font-semibold">{form.jdFreeLimit}</span> free analyses/month →
              then <span className="font-semibold">{form.jdPaidPackSize} analyses</span> for{' '}
              <span className="font-semibold text-accent">₹{Number(form.jdPackPricePaise ?? form.jdPackPriceRupees ?? 0).toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────── */
export default function AdminPlansSection() {
  const [config, setConfig]     = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Failed to load config.'));
  }, []);

  if (selected === 'placementPlans') {
    return <PlacementPlansEditor onBack={() => setSelected(null)} />;
  }

  if (selected) {
    return (
      <ServiceDetail
        serviceKey={selected}
        config={config}
        onBack={() => setSelected(null)}
        onSaved={updated => { setConfig(updated); setSelected(null); }}
      />
    );
  }

  return <ServicesList config={config} onSelect={setSelected} onConfigSaved={setConfig} />;
}
