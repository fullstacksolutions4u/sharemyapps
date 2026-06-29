import { useEffect, useState } from 'react';
import { Video, Clock, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Hardcoded services — must match server/config/services.js
// ─────────────────────────────────────────────────────────────────────────────
const SERVICES = [
  { key: 'placement_session', label: '1:1 Session with Placement Specialist', shortLabel: '1:1 Session', serviceType: 'session' },
  { key: 'ats_compatible_resume_cover_letter_optimization', label: 'ATS Compatible Resume & Cover letter Optimization', shortLabel: 'ATS Resume', serviceType: 'document' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
const labelStyle   = { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 };
const inputStyle   = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' };
const btnPrimary   = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a7373', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, background: '#fff', cursor: 'pointer', color: '#555' };
const centerMsg    = { textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 };

// ─────────────────────────────────────────────────────────────────────────────
// SESSION REQUESTS TAB
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_STATUS_LABEL = { pending: 'Pending', scheduled: 'Scheduled', completed: 'Completed' };
const SESSION_STATUS_COLOR = {
  pending:   { bg: '#fff8e6', color: '#b45309', border: '#fde68a' },
  scheduled: { bg: '#f0faf9', color: '#0a7373', border: '#a7f3d0' },
  completed: { bg: '#f0f4ff', color: '#3b4fd8', border: '#c7d2fe' },
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
                    ? new Date(session.availabilityFrom).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                  {' → '}
                  {session.availabilityTo
                    ? new Date(session.availabilityTo).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '—'}
                </span>
              </div>
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
            <input
              value={resumeLink}
              onChange={e => setResumeLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={inputStyle}
            />
          </div>
          {isAts && (
            <div>
              <label style={labelStyle}>Cover Letter Link *</label>
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
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
            <button
              onClick={handleComplete}
              disabled={saving}
              style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Sending…' : '✓ Complete & Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SessionRequestsTab({ serviceKey }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [scheduling, setScheduling] = useState(null);
  const [completing, setCompleting] = useState(null);

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

  const byService = serviceKey ? sessions.filter(s => s.serviceKey === serviceKey) : sessions;
  const filtered = filterStatus === 'all' ? byService : byService.filter(s => s.status === filterStatus);
  const counts = byService.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['all', 'pending', 'scheduled', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
            style={{
              border: filterStatus === f ? '1.5px solid #0a7373' : '1px solid #e5e7eb',
              borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
              background: filterStatus === f ? '#f0faf9' : '#fff',
              color: filterStatus === f ? '#0a7373' : '#555', cursor: 'pointer',
            }}
          >
            {f === 'all' ? 'All' : SESSION_STATUS_LABEL[f]}
            <span style={{
              marginLeft: 6, borderRadius: 999, padding: '1px 7px', fontSize: 11,
              background: f === 'all' ? '#f0f0f0' : SESSION_STATUS_COLOR[f]?.bg,
              color: f === 'all' ? '#555' : SESSION_STATUS_COLOR[f]?.color,
            }}>
              {f === 'all' ? byService.length : (counts[f] || 0)}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div style={centerMsg}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={centerMsg}>No session requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map(session => {
            const c = SESSION_STATUS_COLOR[session.status] || SESSION_STATUS_COLOR.pending;
            return (
              <div
                key={session._id}
                onClick={() => {
                  if (session.serviceType === 'document') { if (session.status !== 'completed') setCompleting(session); }
                  else if (session.status !== 'completed') setScheduling(session);
                }}
                style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: session.status !== 'completed' ? 'pointer' : 'default' }}
              >
                {session.user?.avatar
                  ? <img src={session.user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#0a7373', flexShrink: 0 }}>{session.user?.name?.[0]?.toUpperCase() || '?'}</div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{session.user?.name}</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{session.user?.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#555' }}>{session.serviceLabel}</span>
                    {session.scheduledAt && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9aaca9' }}>
                        <Clock size={11} />
                        {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {(session.status === 'scheduled' || (session.serviceType === 'document' && session.status === 'pending')) && (
                    <button
                      onClick={e => { e.stopPropagation(); setCompleting(session); }}
                      style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1.5px solid #0a7373', background: '#f0faf9', color: '#0a7373', cursor: 'pointer', whiteSpace: 'nowrap' }}
                    >
                      {session.serviceType === 'document' ? 'Send Documents' : 'Complete & Send'}
                    </button>
                  )}
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {SESSION_STATUS_LABEL[session.status]}
                  </span>
                  <span style={{ fontSize: 11, color: '#bbb' }}>
                    {new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            );
          })}
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

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT DELIVERIES TAB
// ─────────────────────────────────────────────────────────────────────────────

function SendLinkModal({ user, serviceKey, serviceLabel, onClose, onSent }) {
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSend = async () => {
    if (!link.trim()) { toast.error('Please enter the download link'); return; }
    setSaving(true);
    try {
      await api.post('/admin/session-requests/document-deliver', {
        userId: user._id,
        serviceKey,
        completionLink: link,
      });
      toast.success('Document link sent & email delivered');
      onSent();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send');
    } finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Send Document Link</p>
            <p style={{ margin: 0, fontSize: 12, color: '#888' }}>{user.name} · {serviceLabel}</p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888', padding: 4 }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Google Drive / Dropbox Link *</label>
            <input
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://drive.google.com/..."
              style={inputStyle}
            />
            <p style={{ margin: '6px 0 0', fontSize: 11, color: '#9aaca9' }}>User will receive an email with this link to download their documents.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
            <button
              onClick={handleSend}
              disabled={saving}
              style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}
            >
              {saving ? 'Sending…' : '✓ Send Link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentDeliveriesTab({ service }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/session-requests/entitled/${service.key}`);
      setUsers(res.data.users || []);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [service.key]); // eslint-disable-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect

  if (loading) return <div style={centerMsg}>Loading…</div>;
  if (users.length === 0) return <div style={centerMsg}>No users are entitled to this service yet.</div>;

  return (
    <div>
      <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
        All users entitled to <strong>{service.label}</strong>. Click "Send Link" to deliver their documents.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
        {users.map(u => {
          const session = u.session;
          const delivered = session?.status === 'completed' && session?.completionLink;
          const c = delivered ? SESSION_STATUS_COLOR.completed : SESSION_STATUS_COLOR.pending;
          return (
            <div key={u._id} style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              {u.avatar
                ? <img src={u.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#0a7373', flexShrink: 0 }}>{u.name?.[0]?.toUpperCase() || '?'}</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{u.name}</span>
                <span style={{ marginLeft: 8, fontSize: 11, color: '#888' }}>{u.email}</span>
                {delivered && (
                  <div style={{ marginTop: 2, fontSize: 11, color: '#3b4fd8' }}>
                    Link sent · <a href={session.completionLink} target="_blank" rel="noopener noreferrer" style={{ color: '#3b4fd8' }}>view</a>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                  {delivered ? 'Delivered' : 'Pending'}
                </span>
                <button
                  onClick={() => setSending(u)}
                  style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 7, border: '1.5px solid #0a7373', background: '#f0faf9', color: '#0a7373', cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {delivered ? 'Resend' : 'Send Link'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sending && (
        <SendLinkModal
          user={sending}
          serviceKey={service.key}
          serviceLabel={service.label}
          onClose={() => setSending(null)}
          onSent={fetchUsers}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPremiumServicesSection() {
  const [tab, setTab] = useState('all');

  const tabs = [
    { key: 'all', label: 'All', shortLabel: 'All', serviceKey: null, serviceType: null },
    ...SERVICES.map(s => ({ key: s.key, label: s.label, shortLabel: s.shortLabel, serviceKey: s.key, serviceType: s.serviceType, service: s })),
  ];

  const activeTab = tabs.find(t => t.key === tab) || tabs[0];

  return (
    <div>
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1.5px solid #f0f0f0', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              border: 'none', background: 'none', cursor: 'pointer', padding: '8px 16px',
              fontSize: 13, fontWeight: 600,
              color: tab === t.key ? '#0a7373' : '#888',
              borderBottom: tab === t.key ? '2px solid #0a7373' : '2px solid transparent',
              marginBottom: -1.5,
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            {t.shortLabel}
          </button>
        ))}
      </div>

      {activeTab.serviceType === 'document'
        ? <DocumentDeliveriesTab service={activeTab.service} />
        : <SessionRequestsTab serviceKey={activeTab.serviceKey} />
      }
    </div>
  );
}
