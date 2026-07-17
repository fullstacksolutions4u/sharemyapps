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
];

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #dfe6e4',
  fontSize: '13.5px', color: '#243433', outline: 'none', fontFamily: "'Manrope', sans-serif",
  background: '#fff', boxSizing: 'border-box',
};

function ApplyModal({ user, onClose, onSubmitted }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [qualification, setQualification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !qualification.trim()) { toast.error('Please fill in both fields.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/mentorship/program/apply', { phone: phone.trim(), qualification: qualification.trim() });
      onSubmitted(res.data.application);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div style={{ background: '#fbfcfb', borderRadius: '18px', width: '100%', maxWidth: '400px', padding: '26px 26px 24px', border: '1px solid #e8edeb', boxShadow: '0 24px 60px -28px rgba(20,40,38,0.35)' }}>
        <h3 style={{ margin: '0 0 4px', fontFamily: "'Spectral', serif", fontSize: '20px', fontWeight: 600, color: '#243433', textAlign: 'center' }}>
          Enroll in Mentorship Program
        </h3>
        <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: '#7b8a87', lineHeight: 1.5, textAlign: 'center' }}>
          Our executive will contact you shortly for further steps.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6663', marginBottom: '6px' }}>Contact number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6663', marginBottom: '6px' }}>Qualification</label>
            <input
              type="text"
              value={qualification}
              onChange={e => setQualification(e.target.value)}
              placeholder="e.g. B.Tech CSE, BCA, MCA, Self-taught"
              required
              maxLength={200}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, background: 'transparent', color: '#4a6663', border: '1px solid #dfe6e4', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{ flex: 1.4, background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '13px', fontWeight: 700, cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, fontFamily: "'Manrope', sans-serif" }}
            >
              {submitting ? 'Submitting…' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function MentorshipProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payModal, setPayModal] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [application, setApplication] = useState(null);
  const [checking, setChecking] = useState(user != null);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.get('/payments/placement/my-purchases')
        .then(r => { if (r.data?.some(p => p.pack === 'placement_mentorship')) setPurchased(true); })
        .catch(() => {}),
      api.get('/mentorship/program/my-application')
        .then(r => setApplication(r.data?.application || null))
        .catch(() => {}),
    ]).finally(() => setChecking(false));
  }, [user]);

  const handlePayClick = async () => {
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

  const status = application?.status; // undefined | 'pending' | 'approved' | 'rejected'

  const renderAction = () => {
    if (checking) {
      return (
        <button disabled style={{ width: '100%', background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700, opacity: 0.6, fontFamily: "'Manrope', sans-serif" }}>
          Loading…
        </button>
      );
    }
    if (status === 'approved') {
      return (
        <>
          <div style={{ background: '#eef8f3', border: '1px solid #bfe3d2', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0a7350' }}>✅ Application verified — you can now complete the payment</p>
          </div>
          <button
            onClick={handlePayClick}
            disabled={planLoading}
            style={{ width: '100%', background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700, letterSpacing: '.02em', cursor: planLoading ? 'default' : 'pointer', opacity: planLoading ? 0.7 : 1, fontFamily: "'Manrope', sans-serif" }}
          >
            {planLoading ? 'Loading…' : 'Pay ₹15,000 & Start'}
          </button>
        </>
      );
    }
    if (status === 'pending') {
      return (
        <div style={{ background: '#fff9ec', border: '1px solid #f3dfb3', borderRadius: '10px', padding: '14px 16px', textAlign: 'center' }}>
          <p style={{ margin: '0 0 4px', fontSize: '13.5px', fontWeight: 700, color: '#946200' }}>⏳ Application under review</p>
          <p style={{ margin: 0, fontSize: '12.5px', color: '#a58a4f', lineHeight: 1.5 }}>
            Our executive will contact you shortly.
          </p>
        </div>
      );
    }
    if (status === 'rejected') {
      return (
        <>
          <div style={{ background: '#fdf1f0', border: '1px solid #f0c7c3', borderRadius: '10px', padding: '12px 16px', marginBottom: '14px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '13px', color: '#a33c31', lineHeight: 1.5 }}>Your application wasn't approved. You can update your details and apply again.</p>
          </div>
          <button
            onClick={() => setApplyOpen(true)}
            style={{ width: '100%', background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
          >
            Apply Again
          </button>
        </>
      );
    }
    return (
      <button
        onClick={() => { if (!user) { navigate('/register'); return; } setApplyOpen(true); }}
        style={{ width: '100%', background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700, letterSpacing: '.02em', cursor: 'pointer', fontFamily: "'Manrope', sans-serif" }}
      >
        Apply for Mentorship Program — Starting July 27, Enroll Now!
      </button>
    );
  };

  return (
    <>
      {applyOpen && (
        <ApplyModal
          user={user}
          onClose={() => setApplyOpen(false)}
          onSubmitted={(app) => {
            setApplication(app);
            setApplyOpen(false);
            toast.success('Application submitted! Our team will verify and get back to you.');
          }}
        />
      )}
      {payModal && (
        <PlacementPaymentModal
          plan={payModal}
          user={user}
          onClose={() => setPayModal(null)}
          onSuccess={() => { setPayModal(null); setPurchased(true); toast.success('Payment successful! Our team will reach out shortly.'); }}
        />
      )}
      <div style={{
        position: 'relative',
        height: 'calc(100vh - 64px)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        background: '#e9e6df',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
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
          Practice Quiz Zone
          <span style={{ fontSize: '16px' }}>🎓</span>
        </button>
        <div style={{
          width: '100%',
          maxWidth: '680px',
          background: '#fbfcfb',
          border: '1px solid #e8edeb',
          borderRadius: '22px',
          boxShadow: '0 24px 60px -28px rgba(20,40,38,0.30)',
          overflow: 'hidden',
        }}>
          {/* Banner */}
          <div style={{
            position: 'relative',
            background: 'linear-gradient(135deg, #1c2b29 0%, #0a7373 100%)',
            padding: '28px 32px',
            textAlign: 'center',
          }}>
            {/* Price badge — top right corner */}
            <div style={{
              position: 'absolute',
              top: '14px',
              right: '16px',
              background: 'rgba(245,166,35,0.15)',
              border: '1px solid rgba(245,166,35,0.5)',
              borderRadius: '8px',
              padding: '4px 10px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#F5A623',
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '.02em',
            }}>
              ₹15,000/-
            </div>

            <h1 style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '26px', fontWeight: 600, color: '#f5efe2' }}>
              Mentorship Program with Placement
            </h1>
            <p style={{ margin: '8px 0 0', fontFamily: "'Manrope', sans-serif", fontSize: '15px', fontWeight: 700, letterSpacing: '.04em', color: '#7fd1c7' }}>
              MERN Full Stack AI Engineer
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

                {renderAction()}

                {status === 'approved' && (
                  <p style={{ margin: '14px 0 0', fontSize: '11.5px', color: '#9aa6a4', textAlign: 'center' }}>
                    Secured by Razorpay · UPI, Cards, Net Banking accepted
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
