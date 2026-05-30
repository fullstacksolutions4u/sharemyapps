import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Layers, FileText, Phone, Mail, Save, ArrowLeft, ChevronRight } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'company',      label: 'Company',      icon: Building2 },
  { key: 'requirements', label: 'Requirements',  icon: FileText },
  { key: 'contact',      label: 'Contact',       icon: Phone },
];

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance & Banking', 'E-Commerce', 'Education',
  'Real Estate', 'Marketing & Advertising', 'Legal', 'Manufacturing', 'Logistics',
  'Media & Entertainment', 'Non-Profit', 'Other',
];

function Field({ icon, label, name, value, onChange, placeholder, type = 'text', hint, readOnly }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text mb-1.5">{label}</label>
      {hint && <p className="text-xs text-[#9CA3AF] mb-1.5">{hint}</p>}
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]">{icon}</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition ${readOnly ? 'bg-[#F9F8F6] cursor-not-allowed text-[#9CA3AF]' : 'bg-white'}`}
        />
      </div>
    </div>
  );
}

export default function ClientProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const isSetup = !user?.companyName;

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    companyName: user?.companyName || '',
    companyWebsite: user?.companyWebsite || '',
    industry: user?.industry || '',
    requirements: user?.requirements || '',
  });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) { toast.error('Company name is required'); return; }
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data.user);
      toast.success(isSetup ? 'Profile set up! Welcome aboard.' : 'Profile updated!');
      if (isSetup) navigate('/explore');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
      {!isSetup && (
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1 bg-[#F3F0EB] rounded-xl p-1 mb-6">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-accent shadow-sm'
                : 'text-muted hover:text-text'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company tab */}
        {activeTab === 'company' && (
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text">Company Information</h2>

            <Field
              icon={<Building2 size={15} />}
              label="Company name"
              name="companyName"
              value={form.companyName}
              onChange={handle}
              placeholder="Acme Inc."
            />

            <Field
              icon={<Globe size={15} />}
              label={<>Company website <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>}
              name="companyWebsite"
              value={form.companyWebsite}
              onChange={handle}
              placeholder="acme.com"
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Industry <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><Layers size={15} /></span>
                <select
                  name="industry"
                  value={form.industry}
                  onChange={handle}
                  className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text bg-white focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition appearance-none"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Requirements tab */}
        {activeTab === 'requirements' && (
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-text">What are you looking for?</h2>
              <p className="text-xs text-[#9CA3AF] mt-0.5">Describe your hiring needs, project requirements, or the kind of developers you want to connect with.</p>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-[#9CA3AF]"><FileText size={15} /></span>
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handle}
                placeholder="e.g. We're looking for full-stack developers experienced in React and Node.js to build a SaaS platform. Open to freelancers and full-time hires."
                rows={7}
                className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm text-text placeholder-[#9CA3AF] focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition resize-none"
              />
            </div>
          </div>
        )}

        {/* Contact tab */}
        {activeTab === 'contact' && (
          <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text">Contact Details</h2>
            <Field
              icon={<Mail size={15} />}
              label="Email"
              name="email"
              value={user?.email || ''}
              readOnly
              hint="Email cannot be changed"
            />
            <Field
              icon={<Phone size={15} />}
              label={<>Phone <span className="text-xs text-[#9CA3AF] font-normal">(optional)</span></>}
              name="phone"
              value={form.phone}
              onChange={handle}
              placeholder="+1 234 567 8900"
              type="tel"
            />
          </div>
        )}

        <div className="flex gap-3">
          {activeTab !== 'contact' && (
            <button
              type="button"
              onClick={() => {
                const idx = TABS.findIndex(t => t.key === activeTab);
                setActiveTab(TABS[idx + 1].key);
              }}
              className="flex-1 flex items-center justify-center gap-2 border border-border bg-white hover:border-accent hover:text-accent text-muted py-3 rounded-xl font-medium text-sm transition-colors"
            >
              Next <ChevronRight size={14} />
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-medium text-sm transition-colors disabled:opacity-60"
          >
            <Save size={14} />
            {saving ? 'Saving…' : isSetup ? 'Complete setup' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
