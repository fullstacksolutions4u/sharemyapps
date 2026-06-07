import { useEffect, useState } from 'react';
import {
  Search, ChevronRight, ToggleLeft, ToggleRight,
  Save, ArrowLeft, Zap, IndianRupee, Users,
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
  // Future services can be added here
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

/* ── Services list ───────────────────────────────────────── */
function ServicesList({ config, onSelect }) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-xl font-bold text-text mb-6">Plans & Pricing</h2>

      <div className="space-y-3">
        {SERVICES.map(svc => {
          const Icon = svc.icon;
          const enabled = config?.[`${svc.key.replace('jdAnalysis', 'jd')}FeatureEnabled`]
            ?? config?.jdFeatureEnabled
            ?? true;

          return (
            <button
              key={svc.key}
              onClick={() => onSelect(svc.key)}
              className="w-full bg-white border border-border hover:border-accent/40 hover:shadow-sm rounded-2xl px-5 py-4 flex items-center gap-4 transition-all group text-left"
            >
              <div className={`w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0`}>
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

        {/* Coming soon placeholder */}
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
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!config) return;
    const initial = {};
    svc.fields.forEach(f => {
      if (f.type === 'rupees') {
        initial[f.key] = config[f.key] / 100;
      } else {
        initial[f.key] = config[f.key];
      }
    });
    setForm(initial);
  }, [config, svc]);

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
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl border border-border text-muted hover:text-text hover:bg-bg transition-colors"
        >
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

      {/* Fields */}
      <div className="space-y-3">
        {svc.fields.map(field => (
          <div key={field.key} className="bg-white border border-border rounded-2xl px-5 py-4">
            {field.type === 'toggle' ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-text">{field.label}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {form[field.key] ? 'Feature is live for all recruiters' : 'Feature is hidden from all recruiters'}
                  </p>
                </div>
                <button
                  onClick={() => setForm(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                  className="text-accent"
                >
                  {form[field.key]
                    ? <ToggleRight size={32} />
                    : <ToggleLeft size={32} className="text-muted" />}
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

        {/* Live preview */}
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
  const [config, setConfig]       = useState(null);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => setConfig(r.data))
      .catch(() => toast.error('Failed to load config.'));
  }, []);

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

  return <ServicesList config={config} onSelect={setSelected} />;
}
