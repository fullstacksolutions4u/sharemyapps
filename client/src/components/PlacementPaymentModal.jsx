import { useState } from 'react';
import { X, ShieldCheck, Check, IndianRupee } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PlacementPaymentModal({
  plan,
  user,
  onClose,
  onSuccess,
  description,
  successToast,
  themeColor = '#B45309',
  variant = 'amber',
}) {
  const isPremiumOrange = variant === 'premium-orange' || variant === 'white';
  const [loading, setLoading] = useState(false);
  const priceStr = Number(plan.price).toLocaleString('en-IN');

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data: order } = await api.post('/payments/placement/create-order', { planId: plan._id });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ShareMyApps',
        description: description || `Placement Support – ${order.planName} Plan`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/placement/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId: plan._id,
            });
            toast.success(successToast || `Payment successful! Our HR team will reach out shortly.`);
            onSuccess();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: { color: isPremiumOrange ? '#f97316' : themeColor },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not initiate payment.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-[24px] shadow-xl w-full max-w-md overflow-hidden">

        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-5">
          {isPremiumOrange ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <IndianRupee size={28} className="text-[#1a1a2e] shrink-0" strokeWidth={2.5} />
                <span className="text-4xl font-bold text-orange-500">{priceStr}</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">One-time payment</p>
            </div>
          ) : (
            <div className="rounded-2xl px-4 py-4 text-center border bg-amber-50 border-amber-200">
              <p className="text-3xl font-bold text-amber-700">₹{priceStr}</p>
              <p className="text-sm mt-1 text-amber-800/60">one-time payment</p>
            </div>
          )}

          <ul className={isPremiumOrange ? 'border-t border-gray-100 divide-y divide-gray-100' : 'space-y-2.5'}>
            {plan.features.map((f, i) => (
              <li
                key={i}
                className={
                  isPremiumOrange
                    ? 'flex items-center gap-3 py-3.5 text-[14px] text-[#2d3748]'
                    : 'flex items-start gap-2.5 text-sm text-text'
                }
              >
                {isPremiumOrange ? (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </span>
                ) : (
                  <Check size={13} className="text-amber-500 shrink-0 mt-0.5" />
                )}
                {f}
              </li>
            ))}
          </ul>

          {!isPremiumOrange && (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
              <ShieldCheck size={12} className="text-amber-500 shrink-0" />
              Secured by Razorpay · UPI, Cards, Net Banking accepted
            </div>
          )}
        </div>

        <div className="px-6 pb-6 pt-2">
          <button
            onClick={handlePay}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed font-bold py-3.5 rounded-2xl transition-colors text-sm ${
              isPremiumOrange
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-[0_8px_20px_-4px_rgba(249,115,22,0.45)]'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Opening payment…
              </>
            ) : isPremiumOrange ? (
              <>
                Get Premium
                <span className="text-white/70">•</span>
                <span className="inline-flex items-center gap-0.5">
                  <IndianRupee size={14} strokeWidth={2.5} />
                  {priceStr}
                </span>
              </>
            ) : (
              `Pay ₹${priceStr}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
