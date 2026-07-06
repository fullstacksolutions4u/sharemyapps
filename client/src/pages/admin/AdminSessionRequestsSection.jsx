import { useEffect, useState } from 'react';
import { Video, Clock, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const STATUS_LABEL = { pending: 'Pending', scheduled: 'Scheduled', completed: 'Completed' };
const STATUS_COLOR = {
  pending:   { bg: '#fff8e6', color: '#b45309', border: '#fde68a' },
  scheduled: { bg: '#f0faf9', color: '#0a7373', border: '#a7f3d0' },
  completed: { bg: '#f0f4ff', color: '#3b4fd8', border: '#c7d2fe' },
};

const inputStyle = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 8,
  padding: '9px 12px', fontSize: 13, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff',
};

function ScheduleModal({ session, onClose, onSaved }) {
  const [meetLink, setMeetLink] = useState(session.meetLink || '');
  const [scheduledAt, setScheduledAt] = useState(
    session.scheduledAt ? new Date(session.scheduledAt).toISOString().slice(0, 16) : ''
  );
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!meetLink.trim()) { toast.error('Please enter a Google Meet link'); return; }
    setSaving(true);
    try {
      const res = await api.put(`/admin/session-requests/${session._id}`, { meetLink, scheduledAt });
      toast.success('Session scheduled & email sent to user');
      onSaved(res.data.session);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {session.user?.avatar
              ? <img src={session.user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
              : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#0a7373' }}>{session.user?.name?.[0]?.toUpperCase() || '?'}</div>
            }
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{session.user?.name}</p>
              <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{session.serviceLabel}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', padding: 4 }}><X size={18} /></button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {session.message && (
            <div style={{ background: '#faf8f5', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9aaca9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Message</p>
              <p style={{ margin: 0, fontSize: 13, color: '#3f4948', lineHeight: 1.5 }}>{session.message}</p>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Google Meet Link *</label>
            <input
              value={meetLink}
              onChange={e => setMeetLink(e.target.value)}
              placeholder="https://meet.google.com/xxx-xxxx-xxx"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Scheduled Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, background: '#fff', cursor: 'pointer', color: '#555' }}>Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a7373', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              <Video size={14} /> {saving ? 'Scheduling…' : 'Schedule Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const ATS_KEY = 'ats_compatible_resume_cover_letter_optimization';

function CompleteModal({ session, onClose, onCompleted }) {
  const isAts = session.serviceKey === ATS_KEY;
  const [resumeLink, setResumeLink] = useState('');
  const [coverLetterLink, setCoverLetterLink] = useState('');
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!resumeLink.trim()) { toast.error('Please enter the resume link'); return; }
    if (isAts && !coverLetterLink.trim()) { toast.error('Please enter the cover letter link'); return; }
    setSaving(true);
    try {
      await api.post(`/admin/session-requests/${session._id}/complete`, {
        completionLink: resumeLink,
        ...(isAts && { coverLetterLink }),
      });
      toast.success('Completed & email sent to user');
      onCompleted();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>
              {isAts ? 'Send Resume & Cover Letter' : 'Mark as Completed'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{session.user?.name} · {session.serviceLabel}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>{isAts ? 'Resume Link *' : 'Download Link *'}</label>
            <input
              value={resumeLink}
              onChange={e => setResumeLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={inputStyle}
            />
          </div>
          {isAts && (
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 5 }}>Cover Letter Link *</label>
              <input
                value={coverLetterLink}
                onChange={e => setCoverLetterLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                style={inputStyle}
              />
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#9aaca9' }}>User will receive an email with {isAts ? 'both download links' : 'this link'}.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, background: '#fff', cursor: 'pointer', color: '#555' }}>Cancel</button>
            <button
              onClick={handleComplete}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a7373', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Sending…' : '✓ Complete & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSessionRequestsSection() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/session-requests');
      setSessions(res.data.sessions || []);
    } catch { toast.error('Failed to load session requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const handleSaved = () => { fetchSessions(); };

  // Group sessions by user
  const userGroups = Object.values(
    sessions.reduce((acc, s) => {
      const uid = s.user?._id || String(s.user);
      if (!acc[uid]) acc[uid] = { user: s.user, sessions: [] };
      acc[uid].sessions.push(s);
      return acc;
    }, {})
  );

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>Loading…</div>
      ) : userGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>No session requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {userGroups.map(({ user, sessions: userSessions }) => (
            <div key={user?._id} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Avatar + name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, minWidth: 180 }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#0a7373', flexShrink: 0 }}>{user?.name?.[0]?.toUpperCase() || '?'}</div>
                }
                <div style={{ minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a1a', whiteSpace: 'nowrap' }}>{user?.name}</p>
                  <p style={{ margin: 0, fontSize: 11, color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{user?.email}</p>
                </div>
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 36, background: '#f0ece6', flexShrink: 0 }} />

              {/* Service stage chips */}
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 0 }}>
                {userSessions.map((session, idx) => {
                  const c = STATUS_COLOR[session.status] || STATUS_COLOR.pending;
                  const isHovered = hoveredId === session._id;
                  const canAct = session.status !== 'completed';
                  const showComplete = session.status === 'scheduled' || (session.serviceType === 'document' && session.status === 'pending');

                  return (
                    <div key={session._id} style={{ display: 'flex', alignItems: 'center' }}>
                      {idx > 0 && (
                        <span style={{ margin: '0 8px', color: '#d0ccc6', fontSize: 16 }}>→</span>
                      )}
                      <div
                        onMouseEnter={() => setHoveredId(session._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => {
                          if (!canAct) return;
                          if (session.serviceType === 'document') setCompleting(session);
                          else setScheduling(session);
                        }}
                        style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${isHovered ? '#0c8c8c' : '#eae6df'}`,
                          background: isHovered ? '#f0faf9' : '#faf8f5',
                          cursor: canAct ? 'pointer' : 'default',
                          minWidth: 160,
                          filter: isHovered ? 'none' : 'blur(1.5px)',
                          opacity: isHovered ? 1 : 0.45,
                          transition: 'filter 0.2s, opacity 0.2s, border-color 0.2s, background 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7776', whiteSpace: 'nowrap' }}>{session.serviceLabel}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
                            {STATUS_LABEL[session.status]}
                          </span>
                          {session.scheduledAt && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9aaca9' }}>
                              <Clock size={10} />
                              {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        {showComplete && (
                          <button
                            onClick={e => { e.stopPropagation(); setCompleting(session); }}
                            style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, border: '1.5px solid #0a7373', background: '#f0faf9', color: '#0a7373', cursor: 'pointer', whiteSpace: 'nowrap', width: 'fit-content' }}
                          >
                            {session.serviceType === 'document' ? 'Send Documents' : 'Complete & Send'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Date */}
              <span style={{ fontSize: 11, color: '#bbb', flexShrink: 0 }}>
                {new Date(userSessions[0].createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      )}

      {scheduling && (
        <ScheduleModal
          session={scheduling}
          onClose={() => setScheduling(null)}
          onSaved={handleSaved}
        />
      )}
      {completing && (
        <CompleteModal
          session={completing}
          onClose={() => setCompleting(null)}
          onCompleted={handleSaved}
        />
      )}
    </div>
  );
}
