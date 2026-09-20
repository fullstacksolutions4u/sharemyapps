import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../../components/modals/PlacementPaymentModal';
import _Lottie from 'lottie-react';
const Lottie = _Lottie.default ?? _Lottie;
import spinnerAnimation from '../../assets/placement-services-spinner.json';

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

const DUBAI_FEATURES = [
  'Single entry visa for job seekers with 60/90/120 days',
  '2 months accommodation with food',
  'Wi-Fi',
  'Metro Card',
  'One-Way Air Ticket with Airport Pickup',
  'Premium package included with this package',
];

export default function PaidServices() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [freeOffer, setFreeOffer] = useState(null);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [offerConfig, setOfferConfig] = useState(null);
  const [plans, setPlans] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [payModal, setPayModal] = useState(null);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [hasFreeGrant, setHasFreeGrant] = useState(false);
  const [checkingPaid, setCheckingPaid] = useState(user != null);
  const [minLoadTimeDone, setMinLoadTimeDone] = useState(false);
  const [showDubaiEnquiry, setShowDubaiEnquiry] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMinLoadTimeDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  const freeOfferActive = offerConfig?.freeOfferEnabled && (
    !offerConfig.freeOfferDueDate || new Date() <= new Date(offerConfig.freeOfferDueDate)
  );
  
  const premiumPriceRupees = (() => {
    const fromPlan = plans?.find((p) => p.name === 'Premium')?.price;
    if (fromPlan != null && fromPlan > 0) return fromPlan;
    if (offerConfig?.premiumServicePricePaise) return offerConfig.premiumServicePricePaise / 100;
    return null;
  })();

  const premiumPlan = plans?.find((p) => p.name === 'Premium') ?? (
    premiumPriceRupees ? { name: 'Premium', price: premiumPriceRupees } : null
  );

  const priceDisplay = premiumPriceRupees != null
    ? `₹${premiumPriceRupees.toLocaleString('en-IN')}`
    : null;

  useEffect(() => {
    api.get('/offers/config').then((r) => setOfferConfig(r.data)).catch(() => setOfferConfig({}));
    api.get('/plans')
      .then((r) => setPlans(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
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
          borderRadius: '8px', padding: '14px', fontSize: '12px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
        }}>
          Payment Successful 🎉
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            Our Executive will contact you shortly for further process.
          </span>
        </div>
      );
    }

    if (hasPremiumAccess) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '12px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
          boxSizing: 'border-box',
        }}>
          Premium Unlocked for You 🎉
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
            All premium services are free on your account.
          </span>
        </div>
      );
    }

    if (freeOffer) {
      return (
        <div style={{
          marginTop: '26px', width: '100%', background: '#dcefed', color: '#0a7373',
          borderRadius: '8px', padding: '14px', fontSize: '12px',
          fontWeight: 700, textAlign: 'center', letterSpacing: '.02em',
        }}>
          Successfully registered for job hunting assistance service.
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 500, marginTop: '4px', color: '#2a8a7a' }}>
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
            borderRadius: '8px', padding: '12px 14px', fontSize: '11px',
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
              borderRadius: '8px', padding: '14px', fontSize: '12px', fontWeight: 700,
              letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
              cursor: applyLoading ? 'default' : 'pointer', opacity: applyLoading ? 0.6 : 1,
            }}
          >
            {applyLoading ? 'Applying…' : 'Apply for Free Premium Services'}
          </button>
          {applyError && (
            <p style={{ fontSize: '10.5px', color: '#c0392b', margin: 0, textAlign: 'center' }}>{applyError}</p>
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
              borderRadius: '8px', padding: '14px', fontSize: '12px', fontWeight: 700,
              letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
              cursor: applyLoading ? 'default' : 'pointer', opacity: applyLoading ? 0.6 : 1,
            }}
          >
            {applyLoading ? 'Applying…' : offerConfig.freeOfferDueDate
              ? `Reserve Your Free Spot Before ${new Date(offerConfig.freeOfferDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}`
              : 'Reserve Your Free Spot'}
          </button>
          {applyError && (
            <p style={{ fontSize: '10.5px', color: '#c0392b', margin: 0, textAlign: 'center' }}>{applyError}</p>
          )}
        </div>
      );
    }

    const handlePaidClick = async () => {
      if (!user) { navigate('/register'); return; }

      if (!premiumPlan?.price) {
        toast.error('Could not load plan price. Please refresh and try again.');
        return;
      }

      const plan = { ...premiumPlan, features: PREMIUM_FEATURES };
      setPayModal(plan);
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '26px' }}>
        <button
          onClick={handlePaidClick}
          disabled={plansLoading || !priceDisplay}
          style={{
            width: '100%', background: '#008b74', color: '#fff',
            border: 'none', borderRadius: '10px', padding: '14px', fontSize: '12.5px',
            fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
            boxShadow: '0 6px 16px rgba(0, 139, 116, 0.25)',
            cursor: plansLoading ? 'default' : 'pointer', opacity: plansLoading ? 0.7 : 1,
          }}
        >
          {plansLoading ? 'Loading…' : priceDisplay ? `Get Started — ${priceDisplay}` : 'Get Started'}
        </button>
      </div>
    );
  };



  if (plansLoading || checkingPaid || !minLoadTimeDone) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#e6f5f4'
      }}>
        <div style={{ width: 300, height: 300 }}>
          <Lottie animationData={spinnerAnimation} loop={true} />
        </div>
      </div>
    );
  }

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
      background: '#e6f5f4',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      padding: '40px 24px 24px',
      fontFamily: "'Manrope', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: '1280px',
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
          padding: '12px 24px', fontSize: '12px', color: '#4a6663', flexWrap: 'wrap',
        }}>
          <span>Secure a high-paying job and get hired ⚡</span>
          <span style={{ fontWeight: 800, color: '#0a7373' }}>10x faster</span>
          <span>with Premium!</span>
        </div>

        {/* Three columns */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>

          {/* Free */}
          <div style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #eef2f0', background: '#e6f5f4' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '23.5px', fontWeight: 600, color: '#243433' }}>Free</span>
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '16.5px', fontWeight: 600, color: '#9aa6a4' }}>₹0</span>
            </div>
            <div style={{ height: '1.5px', background: '#dfe6e4', margin: '14px 0 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
              {FREE_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                  <span style={{ color: '#a8b2af', fontFamily: "'Spectral', serif", fontSize: '13.5px', lineHeight: 1.3, marginTop: '1px' }}>✓</span>
                  <span style={{ fontSize: '12.5px', color: '#586160', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/register')}
              style={{
                marginTop: '26px', width: '100%', background: '#fff', color: '#000',
                border: '1.5px solid #c9ede6', borderRadius: '10px', padding: '13px 14px', fontSize: '12.5px',
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
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '23.5px', fontWeight: 600, color: '#243433' }}>Premium</span>
                <span style={{
                  fontSize: '9px', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: '#0a7373', background: '#dcefed', borderRadius: '999px', padding: '3px 9px',
                }}>
                  Popular
                </span>
              </div>
              <span style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                {(freeOfferActive || hasPremiumAccess || hasFreeGrant) && priceDisplay && (
                  <span style={{ fontFamily: "'Spectral', serif", fontSize: '16.5px', fontWeight: 600, color: '#9aa6a4', textDecoration: 'line-through' }}>
                    {priceDisplay}
                  </span>
                )}
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '20.5px', fontWeight: 700, color: (freeOfferActive || hasPremiumAccess || hasFreeGrant) ? '#0a7373' : '#243433' }}>
                  {plansLoading || offerConfig === null
                    ? '…'
                    : (freeOfferActive || hasPremiumAccess || hasFreeGrant)
                      ? '₹0'
                      : (priceDisplay ?? '…')}
                </span>
              </span>
            </div>
            <div style={{ height: '2px', background: '#0c8c8c', margin: '14px 0 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
              {PREMIUM_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '11px' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flex: 'none', marginTop: '2px' }}>
                    <path d="M3 8.4l3 3 7-7.4" stroke="#0c8c8c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '12.5px', color: '#3f4948', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            {renderPremiumButton()}
          </div>

          {/* Dubai Package */}
          <div style={{ padding: '32px 30px', display: 'flex', flexDirection: 'column', background: '#fffcf0', borderLeft: '1px solid #eef2f0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: "'Spectral', serif", fontSize: '16.5px', fontWeight: 600, color: '#332900' }}>Dubai Job Hunting Package</span>
              </div>
              <span style={{ fontFamily: "'Spectral', serif", fontSize: '14.5px', fontWeight: 700, color: '#b38f00' }}>
                ₹1,10,000
              </span>
            </div>
            <div style={{ height: '2px', background: '#e6b800', margin: '14px 0 18px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '9px', flex: 1 }}>
              {DUBAI_FEATURES.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flex: 'none', marginTop: '2px' }}>
                    <path d="M3 8.4l3 3 7-7.4" stroke="#e6b800" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: '11.5px', color: '#4d3d00', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            
            <div style={{ background: '#fff4cc', padding: '10px', borderRadius: '8px', marginTop: '14px', border: '1px solid #ffe680' }}>
              <p style={{ fontSize: '9.5px', color: '#665200', margin: 0, fontWeight: 500, lineHeight: 1.4, textAlign: 'justify' }}>
                This package is designed for job seekers who wish to explore employment opportunities in Dubai independently while staying on a visit visa. We take care of all the essential arrangements, allowing you to focus entirely on your job search.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
              <button
                onClick={() => {
                  if (!user) { navigate('/register'); return; }
                  setShowDubaiEnquiry(true);
                }}
                style={{
                  width: '100%', background: '#cc9900', color: '#fff',
                  border: 'none', borderRadius: '10px', padding: '14px', fontSize: '12.5px',
                  fontWeight: 700, letterSpacing: '.02em', fontFamily: "'Manrope', sans-serif",
                  boxShadow: '0 6px 16px rgba(204, 153, 0, 0.25)',
                  cursor: 'pointer',
                }}
              >
                Enquiry
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
    
    {showDubaiEnquiry && user && (
      <DubaiEnquiryModal 
        user={user} 
        onClose={() => setShowDubaiEnquiry(false)} 
      />
    )}
    </>
  );
}

function DubaiEnquiryModal({ user, onClose }) {
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState(user.phone || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone?.trim()) return toast.error('Please provide a phone number');
    if (!message?.trim()) return toast.error('Please provide a message');
    setLoading(true);
    try {
      await api.post('/premium-services/dubai-enquiry', { message, phone });
      toast.success('Enquiry submitted successfully! We will contact you soon.');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit enquiry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-50/50">
          <h3 className="text-lg font-bold text-amber-800">Dubai Job Hunting Package Enquiry</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input type="text" readOnly value={user.name} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input type="email" readOnly value={user.email} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 cursor-not-allowed outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                readOnly={!!user.phone}
                placeholder="Enter your phone number"
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none transition-shadow ${
                  user.phone 
                    ? 'bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed' 
                    : 'bg-white border-amber-200 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 text-gray-800'
                }`}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Message to Admin <span className="text-red-500">*</span></label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any specific questions or requirements?"
              rows="3"
              className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-shadow resize-none"
            ></textarea>
          </div>
          
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {loading && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              Submit Enquiry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
