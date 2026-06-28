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
              <Video size={14} /> {saving ? 'Saving…' : 'Save & Notify'}
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
  const [filterStatus, setFilterStatus] = useState('all');
  const [scheduling, setScheduling] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get('/admin/session-requests');
        setSessions(res.data.sessions || []);
      } catch { toast.error('Failed to load session requests'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSaved = (updated) => {
    setSessions(prev => prev.map(s => s._id === updated._id ? updated : s));
  };

  const filtered = filterStatus === 'all' ? sessions : sessions.filter(s => s.status === filterStatus);

  const counts = sessions.reduce((acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; }, {});

  return (
    <div>
      {/* Filter tabs */}
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
            {f === 'all' ? 'All' : STATUS_LABEL[f]}
            {f !== 'all' && counts[f] > 0 && (
              <span style={{ marginLeft: 6, background: STATUS_COLOR[f]?.bg, color: STATUS_COLOR[f]?.color, borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>
                {counts[f]}
              </span>
            )}
            {f === 'all' && (
              <span style={{ marginLeft: 6, background: '#f0f0f0', color: '#555', borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>
                {sessions.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 }}>No session requests.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map(session => {
            const c = STATUS_COLOR[session.status] || STATUS_COLOR.pending;
            return (
              <div
                key={session._id}
                onClick={() => setScheduling(session)}
                style={{ background: '#fff', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' }}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {STATUS_LABEL[session.status]}
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
    </div>
  );
}
