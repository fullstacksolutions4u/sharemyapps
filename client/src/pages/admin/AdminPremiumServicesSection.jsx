import { useEffect, useState } from 'react';
import { Video, Clock, X, Trash2, Pencil } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const SHORT_LABEL = {
  placement_session: '1:1 Session',
  ats_compatible_resume_cover_letter_optimization: 'Resume & Cover letter',
};

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
const labelStyle   = { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 };
const btnSecondary = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, background: '#fff', cursor: 'pointer', color: '#555' };

function ScheduleModal({ session, onClose, onSaved }) {
  const [meetLink, setMeetLink] = useState(session.meetLink || '');
  const [scheduledAt, setScheduledAt] = useState(() => {
    if (!session.scheduledAt) return '';
    const d = new Date(session.scheduledAt);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!meetLink.trim()) { toast.error('Please enter a Google Meet link'); return; }
    if (scheduledAt && session.availabilityFrom && session.availabilityTo) {
      const scheduled = new Date(scheduledAt);
      const from = new Date(session.availabilityFrom);
      const to = new Date(session.availabilityTo);
      if (scheduled < from || scheduled > to) {
        toast.error(`Scheduled time must be within user's availability: ${from.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} – ${to.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })}`);
        return;
      }
    }
    setSaving(true);
    try {
      const scheduledAtUTC = scheduledAt ? new Date(scheduledAt).toISOString() : scheduledAt;
      const res = await api.put(`/admin/session-requests/${session._id}`, { meetLink, scheduledAt: scheduledAtUTC });
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

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(session.availabilityFrom || session.availabilityTo) && (
            <div style={{ background: '#f0faf9', borderRadius: 8, padding: '10px 14px', border: '1px solid #a7f3d0' }}>
              <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#9aaca9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Availability</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#0a5f5f' }}>
                <Clock size={13} color="#0a7373" />
                <span>
                  {session.availabilityFrom
                    ? new Date(session.availabilityFrom).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                    : '—'}
                  {' → '}
                  {session.availabilityTo
                    ? new Date(session.availabilityTo).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {session.message && (
            <div style={{ background: '#faf8f5', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9aaca9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Message</p>
              <p style={{ margin: 0, fontSize: 13, color: '#3f4948', lineHeight: 1.5 }}>{session.message}</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Google Meet Link *</label>
            <input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Scheduled Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={inputStyle} />
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
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
            <label style={labelStyle}>{isAts ? 'Resume Link *' : 'Download Link *'}</label>
            <input value={resumeLink} onChange={e => setResumeLink(e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
          </div>
          {isAts && (
            <div>
              <label style={labelStyle}>Cover Letter Link *</label>
              <input value={coverLetterLink} onChange={e => setCoverLetterLink(e.target.value)} placeholder="https://drive.google.com/..." style={inputStyle} />
            </div>
          )}
          <p style={{ margin: 0, fontSize: 11, color: '#9aaca9' }}>User will receive an email with {isAts ? 'both download links' : 'this link'}.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
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

export default function AdminPremiumServicesSection() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduling, setScheduling] = useState(null);
  const [completing, setCompleting] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  const handleDeleteUser = async (userId) => {
    if (!userId || userId === 'null' || userId === 'undefined') {
      toast.error('Cannot delete — user reference is missing');
      return;
    }
    if (!window.confirm('Remove this user from Services? All their session requests will be deleted.')) return;
    try {
      await api.delete(`/admin/session-requests/user/${userId}`);
      setSessions(prev => prev.filter(s => String(s.user?._id) !== userId));
      toast.success('User removed from Services');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/session-requests');
      setSessions(res.data.sessions || []);
    } catch { toast.error('Failed to load session requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSessions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  const SERVICE_ORDER = ['placement_session', 'ats_compatible_resume_cover_letter_optimization'];

  const userGroups = Object.values(
    sessions.filter(s => s.user && s.user._id).reduce((acc, s) => {
      const uid = String(s.user._id);
      if (!acc[uid]) acc[uid] = { uid, user: s.user, sessions: [] };
      acc[uid].sessions.push(s);
      return acc;
    }, {})
  ).map(group => ({
    ...group,
    sessions: [...group.sessions].sort(
      (a, b) => SERVICE_ORDER.indexOf(a.serviceKey) - SERVICE_ORDER.indexOf(b.serviceKey)
    ),
  }));

  return (
    <div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>Loading…</div>
      ) : userGroups.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>No session requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {userGroups.map(({ uid, user, sessions: userSessions }) => (
            <div key={uid} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
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

              {/* Service stage chips — always render both in SERVICE_ORDER */}
              <div style={{ display: 'flex', alignItems: 'center', flex: 1, flexWrap: 'wrap', gap: 0 }}>
                {SERVICE_ORDER.map((serviceKey, idx) => {
                  const session = userSessions.find(s => s.serviceKey === serviceKey);
                  const placementSession = userSessions.find(s => s.serviceKey === 'placement_session');
                  const isPlacement = serviceKey === 'placement_session';

                  // Blur 1:1 Session if not yet requested; blur ATS if 1:1 not scheduled/completed
                  const isBlurred = isPlacement
                    ? !session
                    : !(placementSession?.status === 'scheduled' || placementSession?.status === 'completed');

                  const c = session ? (STATUS_COLOR[session.status] || STATUS_COLOR.pending) : STATUS_COLOR.pending;
                  const isHovered = session && hoveredId === session._id;
                  const canAct = session && session.status !== 'completed';

                  return (
                    <div key={serviceKey} style={{ display: 'flex', alignItems: 'center' }}>
                      {idx > 0 && (
                        <span style={{ margin: '0 8px', color: '#d0ccc6', fontSize: 16 }}>→</span>
                      )}
                      <div
                        onMouseEnter={() => session && setHoveredId(session._id)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          position: 'relative',
                          display: 'flex', flexDirection: 'column', gap: 6,
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${isHovered ? '#0c8c8c' : '#eae6df'}`,
                          background: isHovered ? '#f0faf9' : '#faf8f5',
                          minWidth: 160,
                          transition: 'border-color 0.2s, background 0.2s',
                          ...(isBlurred ? { filter: 'blur(3px)', opacity: 0.45, pointerEvents: 'none' } : {}),
                        }}
                      >
                        {/* Edit icon — top right for scheduled session-type */}
                        {canAct && session.status === 'scheduled' && session.serviceType !== 'document' && (
                          <button
                            onClick={e => { e.stopPropagation(); setScheduling(session); }}
                            title="Edit Schedule"
                            style={{
                              position: 'absolute', top: 6, right: 6,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              width: 22, height: 22, borderRadius: 5,
                              border: '1px solid #c0dbd9', background: '#e8f5f4', color: '#0a7373',
                              cursor: 'pointer', padding: 0,
                            }}
                          >
                            <Pencil size={11} />
                          </button>
                        )}

                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7776', whiteSpace: 'nowrap', paddingRight: session?.status === 'scheduled' ? 26 : 0 }}>
                          {SHORT_LABEL[serviceKey]}
                        </span>

                        {session && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            {session.status !== 'pending' && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>
                                {STATUS_LABEL[session.status]}
                              </span>
                            )}
                            {session.scheduledAt && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#9aaca9' }}>
                                <Clock size={10} />
                                {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}

                        {canAct && session.status !== 'scheduled' && (
                          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                            {session.serviceType === 'document' ? (
                              <button
                                onClick={e => { e.stopPropagation(); setCompleting(session); }}
                                style={{
                                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                  border: '1.5px solid #0a7373', background: '#f0faf9', color: '#0a7373',
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >
                                Send Documents
                              </button>
                            ) : (
                              <button
                                onClick={e => { e.stopPropagation(); setScheduling(session); }}
                                style={{
                                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                  border: '1.5px solid #0a7373', background: '#f0faf9', color: '#0a7373',
                                  cursor: 'pointer', whiteSpace: 'nowrap',
                                }}
                              >
                                Schedule
                              </button>
                            )}
                          </div>
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

              {/* Delete */}
              {uid && uid !== 'null' && uid !== 'undefined' && <button
                onClick={() => handleDeleteUser(uid)}
                title="Remove user from Services"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d1a0a0', padding: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.color = '#c0392b'}
                onMouseLeave={e => e.currentTarget.style.color = '#d1a0a0'}
              >
                <Trash2 size={15} />
              </button>}
            </div>
          ))}
        </div>
      )}

      {scheduling && (
        <ScheduleModal
          session={scheduling}
          onClose={() => setScheduling(null)}
          onSaved={() => { fetchSessions(); setScheduling(null); }}
        />
      )}
      {completing && (
        <CompleteModal
          session={completing}
          onClose={() => setCompleting(null)}
          onCompleted={fetchSessions}
        />
      )}
    </div>
  );
}
