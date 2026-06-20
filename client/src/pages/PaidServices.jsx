import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import PlacementPaymentModal from '../components/PlacementPaymentModal';

const FREE_FEATURES = [
  'Recruiter Direct Hiring',
  'Apply to Jobs',
  'Freelance Opportunities',
  'Mentoring Opportunities',
];

const PREMIUM_FEATURES = [
  'ATS Compatible Resume Optimization',
  'Job Portal Profile Optimization',
  'LinkedIn Profile Branding & Optimization',
  'Resume Circulation Across Hiring Network',
  'Direct Referrals to Companies via Our Developers Community',
  'Dedicated Placement Officer to guide you',
  'Standing out against other applicants',
];

const PLANS_CACHE_KEY = 'sma_plans_v1';
const PLANS_CACHE_TTL = 15 * 60 * 1000;

function getCachedPlans() {
  try {
    const raw = localStorage.getItem(PLANS_CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < PLANS_CACHE_TTL ? data : null;
  } catch { return null; }
}

function setCachedPlans(data) {
  try { localStorage.setItem(PLANS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })); } catch { /* ignore */ }
}

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState(() => getCachedPlans() ?? []);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(() => !getCachedPlans());
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    const cached = getCachedPlans();
    if (cached) return;
    api.get('/plans')
      .then(r => { setPlans(r.data); setCachedPlans(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get('/payments/placement/my-purchases')
      .then(r => setPurchases(r.data))
      .catch(() => {});
  }, [user]);

  const premiumPlan = plans.find(p => p.name === 'Premium') ?? null;
  const isPurchased = premiumPlan && purchases.some(p => p.pack === 'placement_premium');

  const handleGetStarted = () => {
    if (!user) { navigate('/login', { state: { from: '/career-services' } }); return; }
    if (premiumPlan) setSelectedPlan(premiumPlan);
  };

  const refreshPurchases = () => {
    api.get('/payments/placement/my-purchases').then(r => setPurchases(r.data)).catch(() => {});
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#e9e6df',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '780px',
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
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '22px', fontWeight: 600, color: '#0a7373' }}>
                {loading ? '…' : premiumPlan ? `₹${Number(premiumPlan.price).toLocaleString('en-IN')}` : '₹999'}
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
            {isPurchased ? (
              <div style={{
                marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
                border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px',
                fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
              }}>
                ✓ Active
              </div>
            ) : (
              <button
                onClick={handleGetStarted}
                disabled={loading}
                style={{
                  marginTop: '26px',
                  width: '100%',
                  background: '#0c8c8c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '14px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  letterSpacing: '.02em',
                  fontFamily: "'Manrope', sans-serif",
                  cursor: loading ? 'default' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                Get Started
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
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
      </div>

      {selectedPlan && (
        <PlacementPaymentModal
          plan={{ ...selectedPlan, features: PREMIUM_FEATURES }}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => { setSelectedPlan(null); refreshPurchases(); }}
        />
      )}
    </div>
  );
}
