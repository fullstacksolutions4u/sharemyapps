import { useEffect, useState } from 'react';
import { Lock, CheckCircle, UserCheck, CalendarCheck } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const SERVICE_KEY = 'placement_session';

export default function PlacementSession() {
  const { user } = useAuth();
  const [status, setStatus] = useState(null); // null=loading, false=locked, object=unlocked entry

  useEffect(() => {
    (async () => {
      if (!user) { setStatus(false); return; }
      try {
        const r = await api.get('/premium-services/my-services');
        const match = (r.data.services || []).find(s => s.key === SERVICE_KEY);
        setStatus(match || false);
      } catch {
        setStatus(false);
      }
    })();
  }, [user]);

  const loading = status === null;
  const unlocked = status && status !== false;

  return (
    <div style={{
      minHeight: 'calc(100vh - 64px)',
      background: '#f2efe8',
      padding: '48px 24px',
      fontFamily: "'Manrope', system-ui, sans-serif",
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 620 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: unlocked ? '#dcefed' : '#e8e4dc',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {loading ? null : unlocked
              ? <UserCheck size={22} color="#0a7373" />
              : <Lock size={20} color="#9aaca9" />
            }
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: '#1a2120', lineHeight: 1.2 }}>
              1:1 Placement Session
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: 13, color: '#6b7776' }}>
              Job Hunting Guidance with a Placement Specialist
            </p>
          </div>
          {!loading && (
            <span style={{
              marginLeft: 'auto', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              borderRadius: 999, padding: '3px 10px',
              background: unlocked ? '#dcefed' : '#ede9e1',
              color: unlocked ? '#0a7373' : '#9aaca9',
              flexShrink: 0,
            }}>
              {unlocked ? 'Unlocked' : 'Locked'}
            </span>
          )}
        </div>

        {/* Card */}
        <div style={{
          background: '#fff',
          border: unlocked ? '1.5px solid #0c8c8c' : '1.5px solid #e2e8e6',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: unlocked ? '0 0 0 4px rgba(12,140,140,0.07)' : 'none',
          opacity: loading ? 0.5 : 1,
          transition: 'opacity 0.2s',
        }}>

          {/* What you get */}
          <div style={{ padding: '24px 26px', borderBottom: '1px solid #f0f0f0' }}>
            <p style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#9aaca9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              What's included
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {[
                'Private, scheduled 1:1 video/call with a placement specialist',
                'Resume review and targeted feedback',
                'Job search strategy mapped to your background and target roles',
                'Step-by-step action plan to move forward immediately',
                'Guidance on ATS optimisation and application approach',
              ].map((point, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                    background: unlocked ? '#dcefed' : '#f0ece6',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: unlocked ? '#0a7373' : '#bbb',
                  }}>✓</span>
                  <span style={{ fontSize: 14, color: '#3f4948', lineHeight: 1.5 }}>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Status area */}
          <div style={{ padding: '22px 26px', background: unlocked ? '#f0faf9' : '#faf8f5' }}>
            {unlocked ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <CheckCircle size={17} color="#0a7373" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0a7373' }}>Session Unlocked</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 13, color: '#0a5f5f', lineHeight: 1.6 }}>
                  Our placement specialist will reach out to you via WhatsApp or email within 1–2 business days to schedule your session.
                </p>
                {status?.notes && (
                  <div style={{
                    background: '#e6f4f3', borderRadius: 8, padding: '9px 14px',
                    fontSize: 12, color: '#0a5f5f',
                  }}>
                    <span style={{ fontWeight: 600 }}>Note from team: </span>{status.notes}
                  </div>
                )}
                {status?.unlockedAt && (
                  <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9aaca9' }}>
                    Unlocked on {new Date(status.unlockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Lock size={15} color="#9aaca9" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#9aaca9' }}>Not yet unlocked</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: '#aab8b5', lineHeight: 1.55 }}>
                  This session is unlocked individually by our team. If you've applied for premium services, our team will review your profile and unlock this when you're eligible.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {!unlocked && !loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, padding: '14px 18px', background: '#fff', border: '1px solid #e8e4dc', borderRadius: 12 }}>
            <CalendarCheck size={16} color="#0a7373" style={{ flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: 13, color: '#6b7776', lineHeight: 1.5 }}>
              <strong style={{ color: '#1a2120' }}>Already applied?</strong> Our team reviews applications and unlocks sessions manually. Check back here once we've been in touch.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
