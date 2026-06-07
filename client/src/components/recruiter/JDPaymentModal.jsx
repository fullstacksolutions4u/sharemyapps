import { useState } from 'react';
import { X, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function JDPaymentModal({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data: order } = await api.post('/payments/jd-pack/create-order');

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'ShareMyApps',
        description: '5 JD Analysis Pack',
        order_id: order.orderId,
        handler: async (response) => {
          try {
            const { data } = await api.post('/payments/jd-pack/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success('Payment successful! 5 analyses added.');
            onSuccess(data.paidRemaining);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: '#00A693' },
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center">
              <Zap size={15} className="text-accent" />
            </div>
            <p className="font-bold text-text">Upgrade Your Pack</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted hover:text-text hover:bg-bg transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          <div className="bg-accent/5 border border-accent/20 rounded-2xl px-4 py-4 text-center">
            <p className="text-3xl font-bold text-accent">₹499</p>
            <p className="text-sm text-muted mt-1">for 5 JD Analyses</p>
          </div>

          <ul className="space-y-2.5">
            {[
              'AI-powered developer matching',
              'Full candidate profiles & contacts',
              'Export shortlist to Excel',
              'No expiry — use anytime',
            ].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-text">
                <Sparkles size={13} className="text-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            Secured by Razorpay · UPI, Cards, Net Banking accepted
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Zap size={14} />
            )}
            {loading ? 'Opening payment…' : 'Pay ₹499'}
          </button>
        </div>
      </div>
    </div>
  );
}
