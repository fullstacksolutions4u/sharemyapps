import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import PlacementPaymentModal from '../../components/modals/PlacementPaymentModal';
import _Lottie from 'lottie-react';
const Lottie = _Lottie.default ?? _Lottie;
import spinnerAnimation from '../../assets/mentorship.json';

const MENTORSHIP_FEATURES = [
  '30 structured learning modules, including hands-on, real-world project building.',
  '8-month program duration',
  'Experience 2 free modules before joining the full program.',
  'Weekly Tech review by experienced developer from our community',
  '24/7 dedicated tech support, including personalized 1:1 doubt-clearing calls over Meet.',
  'Earn during the program with client freelance projects',
  'Work on real projects for software companies during the mentorship period',
  'Job Assistance Plan included FREE — exclusive for mentorship students',
];

const inputStyle = {
  width: '100%', padding: '11px 14px', borderRadius: '8px', border: '1px solid #dfe6e4',
  fontSize: '13.5px', color: '#243433', outline: 'none', fontFamily: "'Manrope', sans-serif",
  background: '#fff', boxSizing: 'border-box',
};

function ApplyModal({ user, onClose, onSubmitted }) {
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState('');
  const [qualification, setQualification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim() || !location.trim() || !qualification.trim()) { toast.error('Please fill in all fields.'); return; }
    setSubmitting(true);
    try {
      const res = await api.post('/mentorship/program/apply', { phone: phone.trim(), location: location.trim(), qualification: qualification.trim() });
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
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#4a6663', marginBottom: '6px' }}>Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Kochi, Kerala"
              required
              maxLength={100}
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

const MODULES_LIST = [
  "HTML & CSS", "JavaScript Part 1", "JavaScript Part 2", "JavaScript Part 3", "JavaScript Part 4",
  "Node.js Part 1", "Node.js Part 2", "MongoDB", "React Part 1", "React Part 2", "React Part 3",
  "State Management", "Deployment Fundamentals", "Full Domain Review 1", "Project 1 : MERN Application",
  "DSA Part 1", "DSA Part 2", "DSA Part 3", "PostgreSQL", "TypeScript", "Next.js", "Deployment Advanced",
  "Full Domain Review 2", "Project 2 : Next.js + PostgreSQL + TypeScript", "Python, FastAPI/Django", 
  "Agentic AI", "Micro Services", "System Design", "Project 3 : Collaborative/Freelance Project", 
  "Enter into Job Assistant Services"
];

function ModulesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div 
        onClick={e => e.stopPropagation()} 
        style={{ 
          background: '#fbfcfb', borderRadius: '16px', width: '100%', maxWidth: '750px', 
          display: 'flex', flexDirection: 'column',
          border: '1px solid #e8edeb', boxShadow: '0 24px 60px -28px rgba(20,40,38,0.35)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '16px', borderBottom: '1px solid #e8edeb', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#fff' }}>
          <h3 style={{ margin: 0, fontFamily: "'Spectral', serif", fontSize: '19px', fontWeight: 600, color: '#0a7373' }}>
            Mentorship Program Modules
          </h3>
          <button onClick={onClose} style={{ position: 'absolute', right: '16px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7b8a87', padding: '4px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div style={{ padding: '16px 24px 20px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            {MODULES_LIST.map((mod, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ 
                  background: '#eef8f3', color: '#0a7373', fontSize: '11px', fontWeight: 800, 
                  minWidth: '22px', height: '22px', borderRadius: '50%', display: 'flex', 
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                }}>
                  {i + 1}
                </div>
                <div style={{ fontSize: '12.5px', color: '#3f4f4d', fontWeight: 600, fontFamily: "'Manrope', sans-serif" }}>
                  {mod}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const floatBadges = [
  // left side
  { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg', top: '10%', left: '4%', delay: 0 },
  { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg', top: '25%', left: '2%', delay: 1.5 },
  { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', top: '40%', left: '5%', delay: 3 },
  { name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg', top: '55%', left: '1%', delay: 4.5 },
  { name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg', top: '70%', left: '6%', delay: 0.8 },
  { name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg', top: '85%', left: '3%', delay: 2.3 },
  { name: 'VectorDB', emoji: '📦', top: '48%', left: '12%', delay: 3.8 },

  // right side
  { name: 'MongoDB', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg', top: '12%', right: '4%', delay: 1.1 },
  { name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg', top: '26%', right: '2%', delay: 2.6 },
  { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg', top: '42%', right: '5%', delay: 4.1 },
  { name: 'Python', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg', top: '58%', right: '1%', delay: 0.3 },
  { name: 'FastAPI', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg', top: '72%', right: '6%', delay: 1.8 },
  { name: 'DSA', emoji: '📊', top: '86%', right: '3%', delay: 3.3 },

  // top/bottom
  { name: 'Agentic AI', emoji: '🤖', top: '4%', left: '15%', delay: 0.5 },
  { name: 'MCP', emoji: '🔌', top: '4%', right: '15%', delay: 2 },
  { name: 'LangChain', emoji: '🔗', top: '93%', left: '20%', delay: 1.2 },
  { name: 'LangGraph', emoji: '🕸️', top: '93%', right: '20%', delay: 2.7 },
];

export default function MentorshipProgram() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payModal, setPayModal] = useState(null);
  const [applyOpen, setApplyOpen] = useState(false);
  const [modulesOpen, setModulesOpen] = useState(false);
  const [plans, setPlans] = useState(null);
  const [plansLoading, setPlansLoading] = useState(true);
  const [purchased, setPurchased] = useState(false);
  const [application, setApplication] = useState(null);
  const [checking, setChecking] = useState(user != null);
  const [minLoadTimeDone, setMinLoadTimeDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadTimeDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

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

  useEffect(() => {
    api.get('/plans')
      .then((r) => setPlans(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, []);

  const mentorshipPlan = plans?.find(p => p.name === 'Mentorship');
  const priceDisplay = mentorshipPlan ? `₹${mentorshipPlan.price.toLocaleString('en-IN')}/-` : '…';
  const originalPriceDisplay = mentorshipPlan?.originalPrice
    ? `₹${mentorshipPlan.originalPrice.toLocaleString('en-IN')}/-`
    : null;

  const handlePayClick = async () => {
    if (!plans) {
      toast.error('Could not load plan. Please try again.');
      return;
    }
    const plan = { ...mentorshipPlan };
    if (!plan || !plan.price) { toast.error('Mentorship plan is unavailable right now. Please try again later.'); return; }
    setPayModal({ ...plan, features: MENTORSHIP_FEATURES });
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
            disabled={plansLoading}
            style={{ width: '100%', background: '#0c8c8c', color: '#fff', border: 'none', borderRadius: '8px', padding: '14px', fontSize: '13.5px', fontWeight: 700, letterSpacing: '.02em', cursor: plansLoading ? 'default' : 'pointer', opacity: plansLoading ? 0.7 : 1, fontFamily: "'Manrope', sans-serif" }}
          >
            {plansLoading ? 'Loading…' : `Pay ${priceDisplay.replace('/-', '')} & Start`}
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
        Enroll in Mentorship Program for Free
      </button>
    );
  };

  if (checking || plansLoading || !minLoadTimeDone) {
    return (
      <div style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#eefcf5'
      }}>
        <div style={{ width: 300, height: 300 }}>
          <Lottie animationData={spinnerAnimation} loop={true} />
        </div>
      </div>
    );
  }

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
      {modulesOpen && <ModulesModal onClose={() => setModulesOpen(false)} />}
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
        background: 'linear-gradient(135deg, #f3f2ee 0%, #e2ece8 50%, #cce0da 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px 24px 24px',
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}>
        <button
          onClick={() => setModulesOpen(true)}
          className="absolute top-4 right-4 md:top-6 md:right-8 z-20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
          style={{
            background: '#FFD600',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            color: '#1a1a1a',
            fontSize: '13px',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          View All Modules
        </button>
        {/* Floating tech badges container */}
        <div className="absolute inset-0 max-w-[1250px] mx-auto pointer-events-none hidden lg:block" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {floatBadges.map((badge, idx) => (
            <div
              key={idx}
              className="absolute pointer-events-auto"
              style={{
                top: badge.top,
                left: badge.left,
                right: badge.right,
                bottom: badge.bottom,
                position: 'absolute',
              }}
            >
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-xs border border-border/80 rounded-2xl shadow-xs hover:scale-110 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default">
                {badge.icon ? (
                  <img src={badge.icon} alt={badge.name} className="w-4 h-4 object-contain" style={{ width: '16px', height: '16px' }} />
                ) : (
                  <span className="text-xs">{badge.emoji}</span>
                )}
                <span className="text-[11px] font-bold text-text/80">{badge.name}</span>
              </div>
            </div>
          ))}
        </div>

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
            <div style={{
              position: 'absolute',
              top: '18px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: '#f5efe2',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: "'Manrope', sans-serif",
              letterSpacing: '0.02em',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}>
              {originalPriceDisplay && (
                <span style={{ textDecoration: 'line-through', opacity: 0.55, fontSize: '11px', fontWeight: 600, display: 'block', textAlign: 'center' }}>
                  {originalPriceDisplay}
                </span>
              )}
              <span style={{ color: originalPriceDisplay ? '#7fd1c7' : '#f5efe2', display: 'block', textAlign: 'center' }}>{priceDisplay}</span>
            </div>
            <h1 
              className="text-[19px] md:text-[20px] whitespace-nowrap max-md:whitespace-normal max-md:text-[16px]"
              style={{ margin: '0 auto', fontFamily: "'Spectral', serif", fontWeight: 600, color: '#f5efe2' }}
            >
              Mentorship Program with Placement
            </h1>
            <p style={{ margin: '6px 0 0', fontFamily: "'Manrope', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '.04em', color: '#7fd1c7' }}>
              Full Stack AI Engineer
            </p>
          </div>


          {/* Body */}
          <div style={{ padding: '20px 28px' }}>
            {purchased && !checking ? (
              <div style={{ textAlign: 'center', padding: '8px 0 40px', minHeight: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <p style={{ fontSize: '30px', margin: '0 0 6px' }}>🎉</p>
                <p style={{ fontFamily: "'Spectral', serif", fontSize: '18px', fontWeight: 600, color: '#243433', margin: '0 0 6px' }}>
                  You're enrolled!
                </p>
                <p style={{ fontSize: '12.5px', color: '#4a6663', margin: 0, lineHeight: 1.5 }}>
                  Our team will contact you within 1 business day to kick off your mentorship journey.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {MENTORSHIP_FEATURES.map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                      <span style={{ color: '#0a7373', fontFamily: "'Spectral', serif", fontSize: '13px', lineHeight: 1.3, marginTop: '1px' }}>✓</span>
                      <span style={{ fontSize: '12.5px', color: '#586160', lineHeight: 1.4 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div style={{ height: '1.5px', background: '#dfe6e4', margin: '22px 0 18px' }} />

                {renderAction()}

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', width: '100%' }}>
                  <div 
                    className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 cursor-default"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      background: 'linear-gradient(135deg, #fffcf5 0%, #fdf2d8 100%)', 
                      border: '1px solid #f3dfb3', 
                      padding: '8px 18px', 
                      borderRadius: '14px', 
                      boxShadow: '0 4px 16px rgba(148, 98, 0, 0.08)' 
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🏆</span>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#946200', letterSpacing: '0.02em', fontFamily: "'Manrope', sans-serif" }}>
                      23+ Placements
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
