import { useState } from 'react';
import { X, ShieldCheck, Check, Sparkles } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function PlacementPaymentModal({ plan, user, onClose, onSuccess, description, successToast, themeColor = '#B45309', variant = 'amber' }) {
  const isWhite = variant === 'white';
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
        theme: { color: themeColor },
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
          <div className={`rounded-2xl px-4 py-4 text-center border ${
            isWhite ? 'bg-white border-amber-300' : 'bg-amber-50 border-amber-200'
          }`}>
            <p className={`text-3xl font-bold ${isWhite ? 'text-gray-900' : 'text-amber-700'}`}>
              ₹{Number(plan.price).toLocaleString('en-IN')}
            </p>
            <p className={`text-sm mt-1 ${isWhite ? 'text-gray-500' : 'text-amber-800/60'}`}>one-time payment</p>
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
            <ShieldCheck size={12} className="text-amber-500 shrink-0" />
            Secured by Razorpay · UPI, Cards, Net Banking accepted
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handlePay}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed font-semibold py-3 rounded-xl transition-colors text-sm ${
              isWhite
                ? 'bg-white border border-amber-400 hover:border-amber-500 hover:bg-amber-50/30 text-gray-900'
                : 'bg-amber-600 hover:bg-amber-700 text-white'
            }`}
          >
            {loading
              ? <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isWhite ? 'border-amber-300 border-t-amber-500' : 'border-white/40 border-t-white'}`} />
              : <Sparkles size={14} className={isWhite ? 'text-amber-500' : undefined} />}
            {loading ? 'Opening payment…' : `Pay ₹${Number(plan.price).toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
