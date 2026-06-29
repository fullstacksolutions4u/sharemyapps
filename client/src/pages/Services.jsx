import { useEffect, useState } from 'react';
import { Lock, LockOpen, Video, CheckCircle2, FileText } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const STATUS_COLOR = {
  pending:   { bg: '#fff8e6', color: '#b45309', border: '#fde68a' },
  scheduled: { bg: '#f0faf9', color: '#0a7373', border: '#a7f3d0' },
  completed: { bg: '#f0f4ff', color: '#3b4fd8', border: '#c7d2fe' },
};

function SessionStatus({ session }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
          background: STATUS_COLOR[session.status]?.bg,
          color: STATUS_COLOR[session.status]?.color,
          border: `1px solid ${STATUS_COLOR[session.status]?.border}`,
        }}>
          {STATUS_LABEL[session.status]}
        </span>
        <span style={{ fontSize: 11, color: '#9aaca9' }}>
          Requested {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {session.status === 'pending' && (
        <div style={{ padding: '14px 16px', background: '#faf8f5', borderRadius: 10, border: '1px solid #eae6df' }}>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7776', lineHeight: 1.6 }}>
            {session.serviceType === 'document'
              ? "Our team is preparing your documents. You'll receive an email with your download link when they're ready."
              : 'Your request has been received. Our team will schedule a meeting and share the Google Meet link here.'}
          </p>
        </div>
      )}

      {session.status === 'scheduled' && session.meetLink && (
        <div style={{ padding: '16px 18px', background: '#f0faf9', borderRadius: 10, border: '1.5px solid #0c8c8c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Video size={15} color="#0a7373" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0a7373' }}>Meeting Scheduled</span>
          </div>
          {session.scheduledAt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Clock size={13} color="#9aaca9" />
              <span style={{ fontSize: 12, color: '#6b7776' }}>
                {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          {session.adminNotes && (
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#0a5f5f', lineHeight: 1.6 }}>{session.adminNotes}</p>
          )}
          <a
            href={session.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#0a7373', color: '#fff', borderRadius: 8,
              padding: '10px 18px', fontSize: 13, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'Manrope', sans-serif",
            }}
          >
            <Video size={14} /> Join Google Meet
          </a>
        </div>
      )}

      {session.status === 'completed' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f0f4ff', borderRadius: 10, border: '1px solid #c7d2fe' }}>
            <CheckCircle2 size={15} color="#3b4fd8" />
            <span style={{ fontSize: 13, color: '#3b4fd8', fontWeight: 600 }}>Completed</span>
          </div>

          {session.completionLink && (
            <div style={{ padding: '16px 18px', background: '#f0faf9', borderRadius: 10, border: '1.5px solid #0c8c8c', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: '#0a5f5f', fontWeight: 600 }}>Your documents are ready!</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a
                  href={session.completionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#0a7373', color: '#fff', borderRadius: 8,
                    padding: '10px 20px', fontSize: 13, fontWeight: 700,
                    textDecoration: 'none', fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <FileText size={14} /> {session.coverLetterLink ? 'Download Resume' : 'Download Documents'}
                </a>
                {session.coverLetterLink && (
                  <a
                    href={session.coverLetterLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      background: '#0a7373', color: '#fff', borderRadius: 8,
                      padding: '10px 20px', fontSize: 13, fontWeight: 700,
                      textDecoration: 'none', fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    <FileText size={14} /> Download Cover Letter
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const fieldStyle = {
  width: '100%', border: '1px solid #e2e8e6', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, color: '#1a2120',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fff',
};
const fieldLabel = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaca9',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5,
};

function RequestForm({ serviceKey, onRequested }) {
  const [date, setDate] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!date || !timeFrom || !timeTo) {
      setError('Please select a date and both from/to times.');
      return;
    }
    if (timeFrom < '09:00' || timeFrom > '20:00' || timeTo < '09:00' || timeTo > '20:00') {
      setError('Times must be between 9:00 AM and 8:00 PM.');
      return;
    }
    const availabilityFrom = `${date}T${timeFrom}`;
    const availabilityTo   = `${date}T${timeTo}`;
    if (new Date(availabilityTo) <= new Date(availabilityFrom)) {
      setError('End time must be after start time.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/premium-services/${serviceKey}/session-request`, {
        availabilityFrom,
        availabilityTo,
      });
      onRequested();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr auto', gap: 10, alignItems: 'flex-end' }}>
        <div>
          <label style={fieldLabel}>Preferred Date *</label>
          <input
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={fieldLabel}>From *</label>
          <input
            type="time"
            value={timeFrom}
            min="09:00"
            max="20:00"
            onChange={e => {
              const v = e.target.value;
              if (v && v < '09:00') setTimeFrom('09:00');
              else if (v && v > '20:00') setTimeFrom('20:00');
              else setTimeFrom(v);
            }}
            style={fieldStyle}
          />
        </div>
        <div>
          <label style={fieldLabel}>To *</label>
          <input
            type="time"
            value={timeTo}
            min="09:00"
            max="20:00"
            onChange={e => {
              const v = e.target.value;
              if (v && v < '09:00') setTimeTo('09:00');
              else if (v && v > '20:00') setTimeTo('20:00');
              else setTimeTo(v);
            }}
            style={fieldStyle}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            background: '#0a7373', color: '#fff',
            border: 'none', borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 700, cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1, fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}
        >
          {loading ? 'Requesting…' : 'Submit Request'}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 11, color: '#9aaca9' }}>
        Available time slots: <strong>9:00 AM – 8:00 PM</strong>
      </p>
      {error && <p style={{ margin: 0, fontSize: 12, color: '#c0392b' }}>{error}</p>}
    </div>
  );
}

function ServiceRow({ service, unlockEntry, session: activeSession, onSessionRequested }) {
  const unlocked = !!unlockEntry;
  const [showForm, setShowForm] = useState(false);

  const isDocumentService = service.serviceType === 'document';
  const isScheduled = activeSession?.status === 'scheduled';
  const isCompleted = activeSession?.status === 'completed';

  const handleRequested = () => {
    setShowForm(false);
    onSessionRequested();
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 14,
      border: '1.5px solid #eae6df', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', flexWrap: 'wrap' }}>
        {/* Lock icon */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: unlocked ? '#dcefed' : '#ede9e1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {unlocked ? <LockOpen size={18} color="#0a7373" /> : <Lock size={16} color="#9aaca9" />}
        </div>

        {/* Label */}
        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a2120', flex: 1, minWidth: 0 }}>
          {service.label}
        </span>

        {/* Scheduled: Join Google Meet button with time */}
        {isScheduled && activeSession.meetLink && (
          <a
            href={activeSession.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#0a7373', color: '#fff', borderRadius: 8,
              padding: '8px 16px', fontSize: 12, fontWeight: 700,
              textDecoration: 'none', fontFamily: "'Manrope', sans-serif",
              whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            <Video size={13} />
            Join Google Meet
            {activeSession.scheduledAt && (
              <span style={{ fontWeight: 400, opacity: 0.85 }}>
                · {new Date(activeSession.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </a>
        )}

        {/* Completed session */}
        {activeSession?.status === 'completed' && !isDocumentService && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#3b4fd8' }}>
            <CheckCircle2 size={14} /> Completed
          </span>
        )}

        {/* Document service: always show 2 download buttons, active only when ready */}
        {isDocumentService && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexShrink: 0 }}>
            {[
              { label: 'Download Resume', link: activeSession?.completionLink },
              { label: 'Download Cover letter', link: activeSession?.coverLetterLink },
            ].map(({ label, link }) => (
              link ? (
                <a
                  key={label}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: '#0a7373', color: '#fff', borderRadius: 8,
                    padding: '8px 14px', fontSize: 12, fontWeight: 700,
                    textDecoration: 'none', fontFamily: "'Manrope', sans-serif", whiteSpace: 'nowrap',
                  }}
                >
                  <FileText size={13} /> {label}
                </a>
              ) : (
                <span
                  key={label}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: '#f0f0f0', color: '#b0b0b0', borderRadius: 8,
                    padding: '8px 14px', fontSize: 12, fontWeight: 700,
                    whiteSpace: 'nowrap', fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  <FileText size={13} /> {label}
                </span>
              )
            ))}
          </div>
        )}

        {/* Request Session button */}
        {unlocked && !activeSession && !isDocumentService && (
          <button
            onClick={() => setShowForm(f => !f)}
            style={{
              flexShrink: 0, background: '#0a7373', color: '#fff',
              border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            {showForm ? 'Cancel' : 'Request Session'}
          </button>
        )}

        {/* Pending non-document: show status badge */}
        {activeSession?.status === 'pending' && !isDocumentService && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
            background: STATUS_COLOR.pending.bg, color: STATUS_COLOR.pending.color,
            border: `1px solid ${STATUS_COLOR.pending.border}`, whiteSpace: 'nowrap',
          }}>
            Pending
          </span>
        )}
      </div>

      {/* Request form inline */}
      {showForm && (
        <div style={{ borderTop: '1px solid #f0ece6', padding: '16px 20px' }}>
          <RequestForm serviceKey={service.key} onRequested={handleRequested} />
        </div>
      )}
    </div>
  );
}

export default function Services() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState(null);
  const [unlockedServices, setUnlockedServices] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    api.get('/premium-services/catalog')
      .then(r => setCatalog(r.data.services || []))
      .catch(() => setCatalog([]));
  }, []);

  const fetchSessions = () => {
    api.get('/premium-services/my-sessions').then(r => setSessions(r.data.sessions || [])).catch(() => {});
  };

  useEffect(() => {
    if (!user) return;
    api.get('/premium-services/my-services').then(r => setUnlockedServices(r.data.services || [])).catch(() => {});
    fetchSessions();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const getUnlockEntry = key => unlockedServices.find(s => s.key === key) || null;

  const getSession = key =>
    sessions.find(s => s.serviceKey === key && s.status !== 'completed') ||
    sessions.find(s => s.serviceKey === key) ||
    null;

  if (catalog === null) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aaca9', fontSize: 14, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (catalog.length === 0) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9aaca9', fontSize: 14, fontFamily: "'Manrope', system-ui, sans-serif" }}>
        No services available yet.
      </div>
    );
  }

  const placementSession = getSession('placement_session');
  const atsSession = getSession('ats_compatible_resume_cover_letter_optimization');
  const placementScheduled =
    placementSession?.status === 'scheduled' ||
    placementSession?.status === 'completed' ||
    !!atsSession?.completionLink;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 24px', fontFamily: "'Manrope', system-ui, sans-serif", background: '#f2efe8' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {catalog.filter(service => service.serviceType !== 'document' || placementScheduled).map(service => (
          <ServiceRow
            key={service.key}
            service={service}
            unlockEntry={getUnlockEntry(service.key)}
            session={getSession(service.key)}
            onSessionRequested={fetchSessions}
          />
        ))}
      </div>
    </div>
  );
}
