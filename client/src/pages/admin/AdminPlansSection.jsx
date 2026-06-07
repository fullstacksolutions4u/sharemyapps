import { useEffect, useState } from 'react';
import { Settings, Zap, IndianRupee, ToggleLeft, ToggleRight, Save } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminPlansSection() {
  const [config, setConfig] = useState(null);
  const [form, setForm]     = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/admin/config')
      .then(r => { setConfig(r.data); setForm(r.data); })
      .catch(() => toast.error('Failed to load config.'));
  }, []);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/admin/config', {
        jdFreeLimit:      Number(form.jdFreeLimit),
        jdPaidPackSize:   Number(form.jdPaidPackSize),
        jdPackPricePaise: Math.round(Number(form.jdPackPriceRupees) * 100),
        jdFeatureEnabled: form.jdFeatureEnabled,
      });
      setConfig(res.data);
      setForm(res.data);
      toast.success('Settings saved.');
    } catch {
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {[0,1,2].map(i => <div key={i} className="h-20 bg-white border border-border rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const priceRupees = form.jdPackPriceRupees ?? (form.jdPackPricePaise / 100);
  const dirty = JSON.stringify(form) !== JSON.stringify(config);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-text">Plans & Pricing</h2>
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          {saving
            ? <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="space-y-4">

        {/* Feature toggle */}
        <div className="bg-white border border-border rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
              <Settings size={15} className="text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">JD Analysis Feature</p>
              <p className="text-xs text-muted">Enable or disable the feature for all recruiters</p>
            </div>
          </div>
          <button
            onClick={() => handleChange('jdFeatureEnabled', !form.jdFeatureEnabled)}
            className="text-accent transition-colors"
          >
            {form.jdFeatureEnabled
              ? <ToggleRight size={32} />
              : <ToggleLeft size={32} className="text-muted" />}
          </button>
        </div>

        {/* Free quota */}
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Zap size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Free Quota</p>
              <p className="text-xs text-muted">Analyses each recruiter gets free per calendar month</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              max={100}
              value={form.jdFreeLimit}
              onChange={e => handleChange('jdFreeLimit', e.target.value)}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
            />
            <span className="text-sm text-muted">analyses / month</span>
          </div>
        </div>

        {/* Paid pack */}
        <div className="bg-white border border-border rounded-2xl px-5 py-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
              <IndianRupee size={15} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">Paid Pack</p>
              <p className="text-xs text-muted">Analyses per paid pack and the price charged</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={form.jdPaidPackSize}
                onChange={e => handleChange('jdPaidPackSize', e.target.value)}
                className="w-20 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
              />
              <span className="text-sm text-muted">analyses</span>
            </div>
            <span className="text-muted text-sm">for</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted">₹</span>
              <input
                type="number"
                min={1}
                value={priceRupees}
                onChange={e => handleChange('jdPackPriceRupees', e.target.value)}
                className="w-24 border border-border rounded-xl px-3 py-2 text-sm font-semibold text-text focus:outline-none focus:border-accent"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted mt-3">
            Current: {form.jdPaidPackSize} analyses for ₹{(form.jdPackPricePaise / 100).toLocaleString('en-IN')}
          </p>
        </div>

        {/* Preview */}
        <div className="bg-bg border border-border rounded-2xl px-5 py-4">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-3">Recruiter sees</p>
          <div className="flex items-center gap-2 text-sm text-text">
            <Zap size={13} className="text-accent" />
            <span>
              <span className="font-semibold">{form.jdFreeLimit}</span> free analyses/month →
              then <span className="font-semibold">{form.jdPaidPackSize} analyses</span> for{' '}
              <span className="font-semibold text-accent">₹{priceRupees}</span>
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
