import { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PlacementPaymentModal({ plan, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data: order } = await api.post('/payments/placement/create-order', { planId: plan._id });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ShareMyApps',
        description: `Placement Support – ${order.planName} Plan`,
        order_id: order.orderId,
        handler: async (response) => {
          try {
            await api.post('/payments/placement/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              planId: plan._id,
            });
            toast.success(`Payment successful! Our HR team will reach out shortly.`);
            onSuccess();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        prefill: {},
        theme: { color: '#B45309' },
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">

        {/* Close button */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4 text-center">
            <p className="text-3xl font-bold text-amber-700">₹{Number(plan.price).toLocaleString('en-IN')}</p>
            <p className="text-sm text-amber-800/60 mt-1">one-time payment</p>
          </div>

          <ul className="space-y-2.5">
            {plan.features.map((f, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text">
                <Check size={13} className="text-amber-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            Secured by Razorpay · UPI, Cards, Net Banking accepted
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <Sparkles size={14} />}
            {loading ? 'Opening payment…' : `Pay ₹${Number(plan.price).toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
