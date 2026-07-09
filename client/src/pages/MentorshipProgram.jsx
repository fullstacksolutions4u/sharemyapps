import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const MENTORSHIP_FEATURES = [
  '30 structured learning modules',
  '10-month program duration',
  'Tech review by experienced developers',
  'Placement support',
  '24×7 tech support',
  'Earn during the program with client freelance projects',
  'Experience certificate on completion',
];

export default function MentorshipProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payModal, setPayModal] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [checking, setChecking] = useState(user != null);

  useEffect(() => {
    if (!user) return;
    api.get('/payments/placement/my-purchases')
      .then(r => { if (r.data?.some(p => p.pack === 'placement_mentorship')) setPurchased(true); })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, [user]);

  const handleEnrollClick = async () => {
    if (!user) { navigate('/register'); return; }
    setPlanLoading(true);
    try {
      const res = await api.get('/plans');
      const plan = res.data?.find(p => p.name === 'Mentorship');
      if (!plan) { toast.error('Mentorship plan is unavailable right now. Please try again later.'); return; }
      setPayModal({ ...plan, features: MENTORSHIP_FEATURES });
    } catch {
      toast.error('Could not load plan. Please try again.');
    } finally {
      setPlanLoading(false);
    }
  };

  return (
    <>
      {payModal && (
        <PlacementPaymentModal
          plan={payModal}
          user={user}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); setPurchased(true); toast.success('Payment successful! Our team will reach out shortly.'); }}
        />
      )}
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        background: '#e9e6df',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}>
        <div style={{
          width: '100%',
          maxWidth: '520px',
          background: '#fbfcfb',
          border: '1px solid #e8edeb',
          borderRadius: '22px',
          boxShadow: '0 24px 60px -28px rgba(20,40,38,0.30)',
          overflow: 'hidden',
        }}>
          {/* Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #1c2b29 0%, #0a7373 100%)',
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            <h1 style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '28px', fontWeight: 600, color: '#f5efe2' }}>
              Mentorship Program
            </h1>
            <p style={{ margin: '8px 0 0', fontSize: '13.5px', color: '#bcd6d2' }}>
              Learn by doing — guided by experienced developers, all the way to placement.
            </p>
          </div>

          {/* Body */}
          <div style={{ padding: '30px 32px' }}>
            {purchased && !checking ? (
              <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
                <p style={{ fontSize: '34px', margin: '0 0 8px' }}>🎉</p>
                <p style={{ fontFamily: "'Spectral', serif", fontSize: '20px', fontWeight: 600, color: '#243433', margin: '0 0 6px' }}>
                  You're enrolled!
                </p>
                <p style={{ fontSize: '13.5px', color: '#4a6663', margin: 0, lineHeight: 1.5 }}>
                  Our team will contact you within 2 business days to kick off your mentorship journey.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '13px' }}>
                  {MENTORSHIP_FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                      <span style={{ color: '#0a7373', fontFamily: "'Spectral', serif", fontSize: '15px', lineHeight: 1.3, marginTop: '1px' }}>✓</span>
                      <span style={{ fontSize: '14px', color: '#586160', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ height: '1.5px', background: '#dfe6e4', margin: '22px 0 18px' }} />

                <button
                  onClick={handleEnrollClick}
                  disabled={planLoading || checking}
                  style={{
                    width: '100%', background: '#0c8c8c', color: '#fff',
                    border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px',
                    fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
                    cursor: planLoading || checking ? 'default' : 'pointer',
                    opacity: planLoading || checking ? 0.7 : 1,
                  }}
                >
                  {planLoading ? 'Loading…' : 'Enroll Now — ₹15,000'}
                </button>

                <p style={{ margin: '14px 0 0', fontSize: '11.5px', color: '#9aa6a4', textAlign: 'center' }}>
                  Secured by Razorpay · UPI, Cards, Net Banking accepted
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
