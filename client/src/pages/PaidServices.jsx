import { useEffect, useState } from 'react';
import { Check, Crown, Mail, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const ALL_FEATURES = [
  'ATS Compatible Resume Optimization',
  'Job Portal Profile Optimization',
  'LinkedIn Profile Branding & Optimization',
  'Resume Circulation Across Hiring Network',
  'Direct Referrals via Our Developer Network',
  'Dedicated Placement Officer',
  'Technical Mock Interviews',
];

const PLAN_FEATURES = {
  Basic: [
    'ATS Compatible Resume Optimization',
    'Job Portal Profile Optimization',
    'LinkedIn Profile Branding & Optimization',
  ],
  Standard: [
    'ATS Compatible Resume Optimization',
    'Job Portal Profile Optimization',
    'LinkedIn Profile Branding & Optimization',
    'Resume Circulation Across Hiring Network',
    'Direct Referrals via Our Developer Network',
  ],
  Premium: [
    'ATS Compatible Resume Optimization',
    'Job Portal Profile Optimization',
    'LinkedIn Profile Branding & Optimization',
    'Resume Circulation Across Hiring Network',
    'Direct Referrals via Our Developer Network',
    'Dedicated Placement Officer',
    'Technical Mock Interviews',
  ],
};

const PLANS_CACHE_KEY = 'sma_plans_v1';
const PLANS_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCachedPlans() {
  try {
    const raw = localStorage.getItem(PLANS_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < PLANS_CACHE_TTL ? data : null;
  } catch { return null; }
}

function setCachedPlans(data) {
  try { localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(() => getCachedPlans() ?? []);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(() => !getCachedPlans());
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const cached = getCachedPlans();
    if (cached) return;
    api.get('/plans')
      .then(r => { setPlans(r.data); setCachedPlans(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/payments/placement/my-purchases')
      .then(r => setPurchases(r.data))
      .catch(() => {});
  }, [user]);

  const handleSelect = (plan) => {
    if (!user) {
      navigate('/login', { state: { from: '/career-services' } });
      return;
    }
    setSelectedPlan(plan);
  };

  const refreshPurchases = () => {
    api.get('/payments/placement/my-purchases')
      .then(r => setPurchases(r.data))
      .catch(() => {});
  };

  const planFeatures = (plan) => PLAN_FEATURES[plan.name] ?? [];

  const isPurchased = (plan) =>
    purchases.some(p => p.pack === `placement_${plan.name.toLowerCase()}`);

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8F4EE] px-6 sm:px-10 flex flex-col justify-start pt-6 overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FAF7F0] border border-amber-200 flex items-center justify-center shrink-0">
              <Crown size={16} className="text-amber-500" />
            </div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Premium Services</h1>
          </div>
          <a
            href="mailto:hello@sharemyapps.in"
            className="flex items-center gap-2 border border-amber-200 bg-[#FAF7F0] text-amber-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-amber-100 hover:border-amber-300 transition-colors shrink-0"
          >
            <Mail size={13} />
            Enquiries: hello@sharemyapps.in
          </a>
        </div>

        {/* Table */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 animate-pulse h-64" />
        ) : (
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th className="text-left px-6 py-5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 w-[38%] border-b border-gray-100 rounded-tl-2xl">
                    Features
                  </th>

                  {plans.map((plan, idx) => {
                    const dark = plan.variant === 'dark';
                    const isLast = idx === plans.length - 1;
                    return (
                      <th
                        key={plan._id}
                        className={`text-center px-5 py-5 relative border-b ${
                          dark ? 'bg-[#00827F] border-[#006B68]' : 'border-gray-100'
                        } ${isLast ? 'rounded-tr-2xl' : ''}`}
                      >
                        {plan.badge && plan.badgeStyle === 'top-center' && (
                          <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                            {plan.badge}
                          </span>
                        )}
                        <p className={`text-[11px] font-bold uppercase tracking-widest mb-1 ${dark ? 'text-white/70' : 'text-gray-400'}`}>
                          {plan.name}{dark ? ' ★' : ''}
                        </p>
                        <p className={`text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-[#1a1a1a]'}`}>
                          ₹{Number(plan.price).toLocaleString('en-IN')}
                        </p>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {ALL_FEATURES.map((feature, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3.5 text-sm text-gray-600 border-t border-gray-100">{feature}</td>
                    {plans.map(plan => {
                      const dark = plan.variant === 'dark';
                      const has = planFeatures(plan).includes(feature);
                      return (
                        <td key={plan._id} className={`text-center px-5 py-3.5 border-t ${dark ? 'bg-[#00827F] border-[#006B68]' : 'border-gray-100'}`}>
                          {has
                            ? <Check size={15} className={`mx-auto ${dark ? 'text-white' : 'text-accent'}`} strokeWidth={2.5} />
                            : <Minus size={15} className={`mx-auto ${dark ? 'text-white/30' : 'text-gray-300'}`} />
                          }
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* CTA row */}
                <tr>
                  <td className="px-6 py-4 border-t border-gray-100 rounded-bl-2xl" />
                  {plans.map((plan, idx) => {
                    const dark = plan.variant === 'dark';
                    const purchased = isPurchased(plan);
                    const isLast = idx === plans.length - 1;
                    return (
                      <td key={plan._id} className={`px-5 py-4 text-center border-t ${
                        dark ? 'bg-[#00827F] border-[#006B68]' : 'border-gray-100'
                      } ${isLast ? 'rounded-br-2xl' : ''}`}>
                        {purchased ? (
                          <div className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 w-full">
                            <Check size={13} /> Active
                          </div>
                        ) : (
                          <button
                            onClick={() => handleSelect(plan)}
                            className={`w-full text-sm font-semibold px-5 py-2 rounded-xl transition-colors ${
                              dark
                                ? 'bg-white text-[#00827F] hover:bg-gray-50'
                                : 'border border-gray-200 text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            Get Started
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-3">
          A one-time payment with no recurring charges — our support continues until you're placed.
        </p>
      </div>

      {selectedPlan && (
        <PlacementPaymentModal
          plan={{ ...selectedPlan, features: planFeatures(selectedPlan) }}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => { setSelectedPlan(null); refreshPurchases(); }}
        />
      )}
    </div>
  );
}
