import { useEffect, useState } from 'react';
import { Check, Sparkles, Mail, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const btnClass = {
  ghost:  'rounded-full border border-gray-200 text-amber-800 font-bold bg-white hover:bg-gray-50 hover:border-amber-300 transition-colors shadow-lg',
  accent: 'border border-amber-200 text-amber-800/60 bg-[#FAF7F0] hover:border-amber-400 hover:text-amber-700 transition-colors',
  dark:   'bg-[#00827F] text-white hover:bg-[#006B68] transition-colors',
};

function PlanCard({ plan, onSelect, purchased }) {
  return (
    <div className="relative flex flex-col h-full">
      {plan.badgeStyle === 'top-center' && plan.badge && (
        <div className="flex justify-center">
          <span className="bg-amber-700 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1 rounded-full -mb-3 relative z-10 shadow-sm">
            {plan.badge}
          </span>
        </div>
      )}

      <div className={`flex flex-col flex-1 rounded-2xl border p-5 shadow-sm ${
        plan.variant === 'ghost'  ? 'bg-white border-gray-200' :
        plan.variant === 'accent' ? 'bg-white border-amber-400' :
                                    'bg-white border-[#00827F]'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <p className={`text-xs font-semibold uppercase tracking-widest ${
            plan.variant === 'accent' ? 'text-amber-600' : 'text-black'
          }`}>
            {plan.name}
          </p>
          <div className="flex items-center gap-1.5">
            {purchased && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <Crown size={10} /> Active
              </span>
            )}
            {plan.badgeStyle === 'inline' && plan.badge && (
              <span className="text-[11px] font-semibold text-amber-700 border border-amber-300 bg-amber-50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">
                {plan.badge}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-3xl font-bold text-[#1a1a1a] tracking-tight">
            ₹{Number(plan.price).toLocaleString('en-IN')}
          </span>
          <span className="text-sm text-black">one-time payment</span>
        </div>

        <p className="text-sm text-black mb-3 leading-relaxed">{plan.description}</p>

        <div className="border-t border-amber-100 mb-3" />

        <ul className="flex flex-col gap-2 mb-4 flex-1">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-black">
              <Check size={12} className="mt-0.5 shrink-0 text-amber-500" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        {purchased ? (
          <div className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
            <Check size={14} /> Plan Active
          </div>
        ) : (
          <button
            onClick={() => onSelect(plan)}
            className={`w-full text-center text-sm font-semibold px-4 py-2.5 rounded-xl ${btnClass[plan.variant] || btnClass.ghost}`}
          >
            Get Started
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    api.get('/plans')
      .then(r => setPlans(r.data))
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

  return (
    <div className="h-[calc(100vh-64px)] bg-[#F8F4EE] px-6 sm:px-10 flex flex-col justify-start pt-6 overflow-hidden">
      <div className="max-w-6xl w-full mx-auto flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FAF7F0] border border-amber-200 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-[#1a1a1a]">Premium Plans</h1>
          </div>
          <a
            href="mailto:hello@sharemyapps.in"
            className="flex items-center gap-2 border border-amber-200 bg-[#FAF7F0] text-amber-700 text-sm font-medium px-4 py-2 rounded-full hover:bg-amber-100 hover:border-amber-300 transition-colors shrink-0"
          >
            <Mail size={14} />
            hello@sharemyapps.in
          </a>
        </div>

        {/* Plans */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 flex-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-amber-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
            {plans.map(plan => (
              <PlanCard
                key={plan._id}
                plan={plan}
                onSelect={handleSelect}
                purchased={purchases.some(p => p.pack === `placement_${plan.name.toLowerCase()}`)}
              />
            ))}
          </div>
        )}

      </div>

      {selectedPlan && (
        <PlacementPaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => {
            setSelectedPlan(null);
            api.get('/payments/placement/my-purchases')
              .then(r => setPurchases(r.data))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}
