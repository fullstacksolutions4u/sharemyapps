import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const FREE_FEATURES = [
  'Recruiter Direct Hiring based on your portfolio and projects',
  'Apply to all jobs listed on ShareMyApps portal',
  'Freelance & Mentoring Opportunities',
  'Networking Opportunities with Developers',
  'Explore other developers projects and source codes',
];

const PREMIUM_FEATURES = [
  '1:1 Session with Placement Specialist for Job Hunting Guidance',
  'ATS Compatible Resume & Cover letter Optimization',
  'LinkedIn & Job Portals Profile Optimization',
  'Dedicated Placement Officer Support Until You Get Hired',
  'Mock Interviews for freshers with Industry Experts',
];

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freeOffer, setFreeOffer] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [offerConfig, setOfferConfig] = useState(null);
  const [plans, setPlans] = useState(null);
  const [payModal, setPayModal] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [hasFreeGrant, setHasFreeGrant] = useState(false);
  const [checkingPaid, setCheckingPaid] = useState(user != null);

  const freeOfferActive = offerConfig?.freeOfferEnabled && (
    !offerConfig.freeOfferDueDate || new Date() <= new Date(offerConfig.freeOfferDueDate)
  );
  
  const premiumPlan = plans?.find(p => p.name === 'Premium') || plans?.[0];
  const premiumPrice = premiumPlan ? premiumPlan.price : null;
  
  const oldPriceDisplay = premiumPrice
    ? `₹${premiumPrice.toLocaleString('en-IN')}`
    : null;
  const priceDisplay = premiumPrice
    ? `₹${(user?.hasCoinDiscount ? Math.round(premiumPrice * 0.70) : premiumPrice).toLocaleString('en-IN')}`
    : null;

  useEffect(() => {
    api.get('/offers/config').then(r => setOfferConfig(r.data)).catch(() => {});
    api.get('/plans').then(r => setPlans(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/offers/my-offer').then(r => setFreeOffer(r.data)).catch(() => {});
    Promise.allSettled([
      api.get('/payments/placement/my-purchases'),
      api.get('/premium-services/my-services'),
      api.get('/offers/my-grant'),
    ]).then(([pay, svc, grant]) => {
      if (pay.status === 'fulfilled' && pay.value.data?.length > 0) {
        setPaidSuccess(true);
        setHasPremiumAccess(true);
      }
      if (svc.status === 'fulfilled' && (svc.value.data?.services || []).length > 0) {
        setHasPremiumAccess(true);
      }
      if (grant.status === 'fulfilled' && grant.value.data?.granted) {
        setHasFreeGrant(true);
        setHasPremiumAccess(true);
      }
    }).finally(() => setCheckingPaid(false));
  }, [user]);

  const handleApplyFreeOffer = async () => {
    if (!user) { navigate('/login', { state: { from: '/career-services' } }); return; }
    setApplyLoading(true);
    setApplyError('');
    try {
      const res = await api.post('/offers/apply');
      setFreeOffer(res.data);
      if (hasFreeGrant) {
        // Granted users go straight to the job-search intake form
        toast.success('Application submitted! Now tell us about your job search.');
        navigate('/dashboard/services');
        return;
      }
      toast.success('You\'re registered! Our executive will contact you within 2 days.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply. Please try again.';
      setApplyError(msg);
      toast.error(msg);
    } finally {
      setApplyLoading(false);
    }
  };

  const renderPremiumButton = () => {
    if (checkingPaid) {
      return (
        <div style={{ marginTop: '26px', width: '100%', height: '48px', background: '#f0f4f3', borderRadius: '8px' }} />
      );
    }

    if (paidSuccess) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '13.5px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
        }}>
          Payment Successful 🎉
          <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            Our Executive will contact you shortly for further process.
          </span>
        </div>
      );
    }

    if (hasPremiumAccess) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '13.5px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
          boxSizing: 'border-box',
        }}>
          Premium Unlocked for You 🎉
          <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            All premium services are free on your account.
          </span>
        </div>
      );
    }

    if (freeOffer) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '13.5px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
        }}>
          Successfully registered for job hunting assistance service.
          <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            Executive will contact you shortly.
          </span>
        </div>
      );
    }

    // Admin-invited user who hasn't applied yet — show the apply button
    if (hasFreeGrant) {
      return (
        <div style={{ marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            width: '100%', background: '#dcefed', color: '#0a7373',
            borderRadius: '8px', padding: '12px 14px', fontSize: '12.5px',
            fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
            boxSizing: 'border-box',
          }}>
            You've been selected for FREE premium access 🎉
          </div>
          <button
            onClick={handleApplyFreeOffer}
            disabled={applyLoading}
            style={{
              width: '100%', background: '#0c8c8c', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700,
              letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
              cursor: applyLoading ? 'default' : 'pointer', opacity: applyLoading ? 0.6 : 1,
            }}
          >
            {applyLoading ? 'Applying…' : 'Apply for Free Premium Services'}
          </button>
          {applyError && (
            <p style={{ fontSize: '12px', color: '#c0392b', margin: 0, textAlign: 'center' }}>{applyError}</p>
          )}
        </div>
      );
    }

    if (freeOfferActive) {
      return (
        <div style={{ marginTop: '26px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={handleApplyFreeOffer}
            disabled={applyLoading}
            style={{
              width: '100%', background: '#0c8c8c', color: '#fff', border: 'none',
              borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700,
              letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
              cursor: applyLoading ? 'default' : 'pointer', opacity: applyLoading ? 0.6 : 1,
            }}
          >
            {applyLoading ? 'Applying…' : offerConfig.freeOfferDueDate
              ? `Reserve Your Free Spot Before ${new Date(offerConfig.freeOfferDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`
              : 'Reserve Your Free Spot'}
          </button>
          {applyError && (
            <p style={{ fontSize: '12px', color: '#c0392b', margin: 0, textAlign: 'center' }}>{applyError}</p>
          )}
        </div>
      );
    }

    const handlePaidClick = async () => {
      if (!user) { navigate('/register'); return; }
      
      if (!plans) {
        toast.error('Could not load plan. Please try again.');
        return;
      }
      
      const plan = { ...premiumPlan }; // Create a copy to safely modify the price for the modal
      if (!plan || !plan.price) { toast.error('No plan available. Please try again.'); return; }
      
      if (user?.hasCoinDiscount) {
        plan.price = Math.round(plan.price * 0.70);
      }
      setPayModal({ ...plan, features: PREMIUM_FEATURES });
    };

    const handleClaimDiscount = async () => {
      try {
        setPlanLoading(true);
        await api.post('/offers/claim-coin-discount');
        toast.success('30% discount claimed successfully!');
        window.location.reload();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to claim discount');
        setPlanLoading(false);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '26px' }}>
        {user && !user.hasCoinDiscount && !(freeOfferActive || hasPremiumAccess || hasFreeGrant) && (
          <button
            onClick={handleClaimDiscount}
            disabled={planLoading || (user.coins || 0) < 300}
            style={{
              width: '100%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff',
              border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px',
              fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
              boxShadow: (user.coins || 0) < 300 ? 'none' : '0 6px 16px rgba(245, 158, 11, 0.25)',
              cursor: (planLoading || (user.coins || 0) < 300) ? 'not-allowed' : 'pointer', 
              opacity: (planLoading || (user.coins || 0) < 300) ? 0.5 : 1,
            }}
          >
            {planLoading ? 'Processing…' : `Claim 30% Discount (${user.coins || 0}/300 Coins)`}
          </button>
        )}
        <button
          onClick={handlePaidClick}
          disabled={planLoading}
          style={{
            width: '100%', background: '#008b74', color: '#fff',
            border: 'none', borderRadius: '10px', padding: '14px', fontSize: '14px',
            fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
            boxShadow: '0 6px 16px rgba(0, 139, 116, 0.25)',
            cursor: planLoading ? 'default' : 'pointer', opacity: planLoading ? 0.7 : 1,
          }}
        >
          {planLoading ? 'Loading…' : `Get Started — ${priceDisplay ?? '…'}`}
        </button>
      </div>
    );
  };

  return (
    <>
    {payModal && (
      <PlacementPaymentModal
        plan={payModal}
        user={user}
        onClose={() => setPayModal(null)}
        onSuccess={() => { setPayModal(null); setPaidSuccess(true); toast.success('Payment successful! Our HR team will reach out shortly.'); }}
      />
    )}
    <div style={{
      position: 'relative',
      minHeight: 'calc(100vh - 64px)',
      background: '#e9e6df',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 24px 24px',
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <button
        onClick={() => navigate('/quiz-zone')}
        style={{
          position: 'absolute',
          top: '24px',
          right: '32px',
          background: 'linear-gradient(135deg, #F5A623 0%, #d48a1b 100%)',
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 20px',
          fontSize: '13.5px',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: "'Manrope', sans-serif",
          boxShadow: '0 4px 14px rgba(245, 166, 35, 0.3)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(245, 166, 35, 0.4)'; }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 166, 35, 0.3)'; }}
      >
        Earn Coins & Claim Discount
      </button>
      <div style={{
        width: '100%',
        maxWidth: '1080px',
        background: '#fbfcfb',
        border: '1px solid #e8edeb',
        borderRadius: '22px',
        boxShadow: '0 24px 60px -28px rgba(20,40,38,0.30)',
        overflow: 'hidden',
      }}>

        {/* Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: '#f0f6f5', borderBottom: '1px solid #e2ecea',
          padding: '12px 24px', fontSize: '13.5px', color: '#4a6663', flexWrap: 'wrap',
        }}>
          <span>Secure a high-paying job and get hired ⚡</span>
          <span style={{ fontWeight: 800, color: '#0a7373' }}>10x faster</span>
          <span>with Premium!</span>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr' }}>

          {/* Free */}
          <div style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eef2f0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '25px', fontWeight: 600, color: '#243433' }}>Free</span>
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '18px', fontWeight: 600, color: '#9aa6a4' }}>₹0</span>
            </div>
            <div style={{ height: '1.5px', background: '#dfe6e4', margin: '14px 0 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                  <span style={{ color: '#a8b2af', fontFamily: "'Spectral', serif", fontSize: '15px', lineHeight: 1.3, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '14px', color: '#586160', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              style={{
                marginTop: '26px', width: '100%', background: '#fff', color: '#000',
                border: '1.5px solid #c9ede6', borderRadius: '10px', padding: '13px 14px', fontSize: '14px',
                fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif", cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 166, 147, 0.1)',
              }}
            >
              Get Started for Free
            </button>
          </div>

          {/* Premium */}
          <div style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', background: '#f5faf9' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '25px', fontWeight: 600, color: '#243433' }}>Premium</span>
                <span style={{
                  fontSize: '10px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#0a7373', background: '#dcefed', borderRadius: '999px', padding: '3px 9px',
                }}>
                  Popular
                </span>
              </div>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {(freeOfferActive || hasPremiumAccess || hasFreeGrant) && priceDisplay && (
                  <span style={{ fontFamily: "'Spectral', serif", fontSize: '18px', fontWeight: 600, color: '#9aa6a4', textDecoration: 'line-through' }}>
                    {priceDisplay}
                  </span>
                )}
                {!(freeOfferActive || hasPremiumAccess || hasFreeGrant) && user?.hasCoinDiscount && oldPriceDisplay && (
                  <span style={{ fontFamily: "'Spectral', serif", fontSize: '18px', fontWeight: 600, color: '#9aa6a4', textDecoration: 'line-through' }}>
                    {oldPriceDisplay}
                  </span>
                )}
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '22px', fontWeight: 700, color: (freeOfferActive || hasPremiumAccess || hasFreeGrant || user?.hasCoinDiscount) ? '#0a7373' : '#243433' }}>
                  {offerConfig === null ? '…' : (freeOfferActive || hasPremiumAccess || hasFreeGrant) ? '₹0' : priceDisplay}
                </span>
              </span>
            </div>
            {user?.hasCoinDiscount && !(freeOfferActive || hasPremiumAccess || hasFreeGrant) && (
              <div style={{ fontSize: '13px', fontWeight: 800, marginBottom: '0px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🎉</span>
                <span style={{
                  background: 'linear-gradient(90deg, #9e6f00, #dca818, #9e6f00)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0px 1px 1px rgba(158, 111, 0, 0.2))'
                }}>
                  30% Coin Discount Applied!
                </span>
              </div>
            )}
            <div style={{ height: '2px', background: '#0c8c8c', margin: '14px 0 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: 'none', marginTop: '2px' }}>
                    <path d="M3 8.4l3 3 7-7.4" stroke="#0c8c8c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '14px', color: '#3f4948', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            {renderPremiumButton()}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
