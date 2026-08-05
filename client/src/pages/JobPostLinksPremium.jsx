import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, ExternalLink, IndianRupee, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const FEATURES = [
  'Unlimited Apply Now on every Job Post Link',
  'No weekly 2-apply limit',
  'Skip contribute-to-unlock — apply without sharing posts',
  'Instant access after payment',
];

export default function JobPostLinksPremium() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [payModal, setPayModal] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      api.get('/plans/job-link-unlimited'),
      user ? api.get('/job-links/apply-eligibility') : Promise.resolve(null),
      user ? api.get('/payments/placement/my-purchases') : Promise.resolve(null),
    ]).then(([planRes, eligRes, purchasesRes]) => {
      if (planRes.status === 'fulfilled') setPlan(planRes.value.data);
      if (eligRes?.status === 'fulfilled' && eligRes.value?.data?.data?.isPremium) {
        setHasAccess(true);
      }
      if (purchasesRes?.status === 'fulfilled') {
        const bought = (purchasesRes.value.data || []).some((p) => p.pack === 'placement_joblinkunlimited');
        if (bought) setHasAccess(true);
      }
    }).finally(() => setLoading(false));
  }, [user]);

  const priceAmount = plan ? Number(plan.price).toLocaleString('en-IN') : '399';
  const priceLabel = `${priceAmount}/-`;

  const handlePay = () => {
    if (!user) {
      navigate('/login', { state: { from: '/job-post-links-premium' } });
      return;
    }
    if (!plan) {
      toast.error('Could not load plan. Please try again.');
      return;
    }
    setPayModal({ ...plan, features: FEATURES });
  };

  return (
    <>
      {payModal && (
        <PlacementPaymentModal
          plan={payModal}
          user={user}
          onClose={() => setPayModal(null)}
          onSuccess={() => {
            setPayModal(null);
            setHasAccess(true);
            toast.success('Payment successful! Unlimited applies are now unlocked.');
          }}
          description="Job Post Links — Unlimited Applies"
          successToast="Payment successful! Unlimited applies are now unlocked."
          variant="white"
        />
      )}

      <div className="min-h-[calc(100vh-64px)] bg-bg flex flex-col items-center justify-center px-4 py-12 font-[Manrope,system-ui,sans-serif]">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-amber-300 overflow-hidden">
          <div className="px-6 py-8 text-center border-b border-amber-200 bg-white">
            <div className="inline-flex items-center gap-1.5 bg-white border border-amber-300 rounded-full px-3 py-1 text-[11px] font-semibold text-gray-700 mb-4">
              <Crown size={12} className="text-amber-500" /> Premium Service
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Unlimited Applies with Premium</h1>
            <p className="text-gray-500 text-sm mt-2 max-w-sm mx-auto">
              Apply to every job opening shared on Job Post Links — no weekly limits, no sharing required.
            </p>
            <div className="mt-6 inline-block rounded-xl border border-amber-300 bg-white px-6 py-3 text-center">
              <div className="inline-flex items-center justify-center gap-1">
                <IndianRupee size={28} className="text-gray-900 shrink-0" strokeWidth={2.5} />
                <p className="text-4xl font-bold text-gray-900">{loading ? '…' : priceLabel}</p>
              </div>
              <p className="text-gray-500 text-xs mt-1">one-time payment</p>
            </div>
          </div>

          <div className="px-6 py-6 space-y-4 bg-white">
            <ul className="space-y-3">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <Check size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheck size={12} className="text-amber-500 shrink-0" />
              Secured by Razorpay · UPI, Cards, Net Banking
            </div>

            {hasAccess ? (
              <div className="rounded-xl bg-white border border-amber-300 px-4 py-4 text-center">
                <p className="text-sm font-bold text-gray-900">Unlimited applies unlocked 🎉</p>
                <p className="text-xs text-gray-500 mt-1">Head back to Job Post Links and apply freely.</p>
                <Link
                  to="/opportunities?tab=job-links"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900"
                >
                  <ExternalLink size={12} className="text-amber-500" /> Go to Job Post Links
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || !plan}
                className="w-full flex items-center justify-center gap-2 bg-white border border-amber-400 hover:border-amber-500 hover:bg-amber-50/30 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
                ) : (
                  <Sparkles size={14} className="text-amber-500" />
                )}
                {loading ? 'Loading…' : (
                  <>
                    Get Unlimited Applies with Premium —
                    <span className="inline-flex items-center gap-0.5">
                      <IndianRupee size={13} className="text-gray-900" />
                      {priceLabel}
                    </span>
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[11px] text-gray-500">
              Looking for full job hunting support?{' '}
              <Link to="/placement-services" className="text-gray-700 font-semibold hover:underline inline-flex items-center gap-1">
                <Crown size={10} className="text-amber-500" /> Job Assistance Services
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
