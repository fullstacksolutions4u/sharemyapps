import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Crown, ExternalLink, IndianRupee } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const FEATURES = [
  'Unlimited job post applies',
  'No weekly 2-apply limit',
  'ATS Compatible Resume & Cover letter Optimization',
  'One time payment',
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
            toast.success('Payment successful! Unlimited job post applies are now unlocked.');
          }}
          description="Job Post Links — Unlimited Job Post Applies"
          successToast="Payment successful! Unlimited job post applies are now unlocked."
          variant="premium-orange"
        />
      )}

      <div className="min-h-[calc(100vh-64px)] bg-[#f4f4f5] flex flex-col items-center justify-center px-4 py-8 font-[Manrope,system-ui,sans-serif]">
        <div className="w-full max-w-[520px] bg-white rounded-[24px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="px-10 pt-7 pb-4 text-center">
            <div className="inline-flex items-center gap-1.5 bg-orange-50 rounded-full px-3 py-1 mb-3">
              <Crown size={12} className="text-orange-500" strokeWidth={2.5} />
              <span className="text-[10px] font-bold tracking-wide text-orange-500 uppercase">Premium</span>
            </div>

            <h1 className="text-[24px] font-bold tracking-tight text-[#1a1a2e] leading-tight">
              Unlimited Job Post Applies
            </h1>
            <p className="text-sm text-gray-500 mt-1">For lifetime access</p>

            <div className="mt-4 flex items-center justify-center gap-1">
              <IndianRupee size={28} className="text-[#1a1a2e] shrink-0" strokeWidth={2.5} />
              <span className="text-[44px] font-bold text-orange-500 leading-none tracking-tight">
                {loading ? '…' : priceAmount}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100">
            {FEATURES.map((feature, i) => (
              <div
                key={feature}
                className={`flex items-center gap-3 px-10 py-3 ${i < FEATURES.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </span>
                <span className="text-[14px] text-[#2d3748] leading-snug">{feature}</span>
              </div>
            ))}
          </div>

          <div className="px-10 pt-4 pb-7">
            {hasAccess ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-4 py-4 text-center">
                <p className="text-sm font-bold text-emerald-800">Premium unlocked 🎉</p>
                <p className="text-xs text-emerald-700/80 mt-1">You have unlimited job post applies.</p>
                <Link
                  to="/opportunities?tab=job-links"
                  className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600"
                >
                  <ExternalLink size={14} /> Go to Job Post Links
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePay}
                disabled={loading || !plan}
                className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition-colors text-[15px] shadow-[0_8px_20px_-4px_rgba(249,115,22,0.45)]"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Get Premium
                    <span className="text-white/70">•</span>
                    <span className="inline-flex items-center gap-0.5">
                      <IndianRupee size={15} strokeWidth={2.5} />
                      {priceAmount}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
