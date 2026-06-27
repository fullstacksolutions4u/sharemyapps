import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const FREE_FEATURES = [
  'Recruiter Direct Hiring',
  'Apply to Jobs',
  'Freelance Opportunities',
  'Mentoring Opportunities',
  'Networking Opportunities with Developers',
];

const PREMIUM_FEATURES = [
  'ATS Compatible Resume & Cover letter Optimization',
  'LinkedIn & Job Portal Profile Optimization',
  '1:1 Session with Placement Specialist for Job Hunting Guidance',
  'Dedicated Placement Officer Support Until You Get Hired',
  'Mock Interviews with Industry Experts',
  'Standing out against other applicants',
];

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freeOffer, setFreeOffer] = useState(null);
  const [offerConfig, setOfferConfig] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const fetchConfig = () => api.get('/offers/config').then(r => setOfferConfig(r.data)).catch(() => {});
    fetchConfig();
    const onFocus = () => fetchConfig();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/offers/my-offer')
      .then(r => setFreeOffer(r.data))
      .catch(() => {});
  }, [user]);

  const handleApplyFreeOffer = async () => {
    if (!user) { navigate('/login', { state: { from: '/career-services' } }); return; }
    setApplyLoading(true);
    setApplyError('');
    try {
      const res = await api.post('/offers/apply');
      setFreeOffer(res.data);
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to apply. Please try again.');
    } finally {
      setApplyLoading(false);
    }
  };

  const renderPremiumButton = () => {
    if (offerConfig === null) return null; // still loading

    if (!offerConfig.freeOfferEnabled) {
      return (
        <button
          disabled
          style={{
            marginTop: '26px', width: '100%', background: '#0c8c8c', color: '#fff',
            border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px',
            fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
            cursor: 'default',
          }}
        >
          Get Started
        </button>
      );
    }

    if (freeOffer) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '13.5px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
        }}>
          ✓ Applied
          <span style={{ display: 'block', fontSize: '11.5px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            You're registered for the free offer. Our executive will contact you within 2 days.{' '}
            Meanwhile, explore the platform for opportunities.
          </span>
        </div>
      );
    }

    const dueDateLabel = offerConfig?.freeOfferDueDate
      ? new Date(offerConfig.freeOfferDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', timeZone: 'UTC' })
      : 'June 30';

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
          {applyLoading ? 'Applying…' : `Apply for Free (Valid till ${dueDateLabel})`}
        </button>
        {applyError && (
          <p style={{ fontSize: '12px', color: '#c0392b', margin: 0, textAlign: 'center' }}>{applyError}</p>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#e9e6df',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '980px',
        background: '#fbfcfb',
        border: '1px solid #e8edeb',
        borderRadius: '22px',
        boxShadow: '0 24px 60px -28px rgba(20,40,38,0.30)',
        overflow: 'hidden',
      }}>

        {/* Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          background: '#f0f6f5',
          borderBottom: '1px solid #e2ecea',
          padding: '12px 24px',
          fontSize: '13.5px',
          color: '#4a6663',
          flexWrap: 'wrap',
        }}>
          <span>Secure a high-paying job and get hired ⚡</span>
          <span style={{ fontWeight: 800, color: '#0a7373' }}>4x faster</span>
          <span>with Premium!</span>
        </div>

        {/* Two columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr' }}>

          {/* Free */}
          <div style={{
            padding: '32px 30px',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #eef2f0',
          }}>
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
                marginTop: '26px',
                width: '100%',
                background: '#243433',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '13.5px',
                fontWeight: 700,
                letterSpacing: '.02em',
                fontFamily: "'Manrope', sans-serif",
                cursor: 'pointer',
              }}
            >
              Get Started for Free
            </button>
          </div>

          {/* Premium */}
          <div style={{
            padding: '32px 30px',
            display: 'flex',
            flexDirection: 'column',
            background: '#f5faf9',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '25px', fontWeight: 600, color: '#243433' }}>Premium</span>
                <span style={{
                  fontSize: '10px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#0a7373', background: '#dcefed', borderRadius: '999px', padding: '3px 9px',
                }}>Popular</span>
              </div>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '18px', fontWeight: 600, color: '#9aa6a4', textDecoration: 'line-through' }}>₹999</span>
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '22px', fontWeight: 700, color: '#0a7373' }}>₹0</span>
              </span>
            </div>
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

        {/* Footer */}
        {offerConfig !== null && !offerConfig.freeOfferEnabled && (
          <div style={{
            textAlign: 'center',
            padding: '14px 24px',
            borderTop: '1px solid #eef2f0',
            fontFamily: "'Spectral', serif",
            fontStyle: 'italic',
            fontSize: '13px',
            color: '#8f9594',
          }}>
            ₹999 Premium Plan · Money-back guarantee if not placed within 2 months
          </div>
        )}
      </div>
    </div>
  );
}
