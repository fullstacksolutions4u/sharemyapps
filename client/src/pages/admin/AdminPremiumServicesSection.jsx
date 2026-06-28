import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Video, Clock, X } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Shared styles
// ─────────────────────────────────────────────────────────────────────────────
const labelStyle   = { fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 5 };
const inputStyle   = { width: '100%', border: '1px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', background: '#fff' };
const btnPrimary   = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0a7373', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, background: '#fff', cursor: 'pointer', color: '#555' };
const iconBtn      = { border: '1px solid #e5e7eb', borderRadius: 7, padding: '5px 7px', background: '#fff', cursor: 'pointer', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const centerMsg    = { textAlign: 'center', padding: '40px 24px', color: '#aaa', fontSize: 14 };

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE CATALOG TAB
// ─────────────────────────────────────────────────────────────────────────────

const EMPTY_FORM = { label: '', description: '', bullets: '', unlockedMessage: '', active: true };

function ServiceForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.label.trim()) { toast.error('Label is required'); return; }
    onSave({ ...form, bullets: form.bullets.split('\n').map(b => b.trim()).filter(Boolean) });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={labelStyle}>Service Label *</label>
        <input value={form.label} onChange={e => set('label', e.target.value)} placeholder="e.g. Session with Placement Officer" style={inputStyle} />
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Short description shown to the user" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>What's Included (one bullet per line)</label>
        <textarea value={form.bullets} onChange={e => set('bullets', e.target.value)} rows={4} placeholder={"Private 1:1 call with a specialist\nResume review and feedback"} style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div>
        <label style={labelStyle}>Unlocked Message</label>
        <textarea value={form.unlockedMessage} onChange={e => set('unlockedMessage', e.target.value)} rows={2} placeholder="Message shown to user when this service is unlocked" style={{ ...inputStyle, resize: 'vertical' }} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input type="checkbox" id="svc-active" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
        <label htmlFor="svc-active" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Active (visible to users)</label>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onCancel} style={btnSecondary}>Cancel</button>
        <button onClick={handleSave} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.7 : 1 }}>
          {saving ? 'Saving…' : 'Save Service'}
        </button>
      </div>
    </div>
  );
}

function CatalogTab({ onServicesChange }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/premium-services/catalog');
      setServices(res.data.services);
      onServicesChange?.(res.data.services);
    } catch { toast.error('Failed to load services'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      const res = await api.post('/admin/premium-services/catalog', data);
      const updated = [...services, res.data.service];
      setServices(updated);
      onServicesChange?.(updated);
      setCreating(false);
      toast.success('Service created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
    finally { setSaving(false); }
  };

  const handleEdit = async (id, data) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/premium-services/catalog/${id}`, data);
      const updated = services.map(s => s._id === id ? res.data.service : s);
      setServices(updated);
      onServicesChange?.(updated);
      setEditingId(null);
      toast.success('Service updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/admin/premium-services/catalog/${id}`);
      const updated = services.filter(s => s._id !== id);
      setServices(updated);
      onServicesChange?.(updated);
      toast.success('Service deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete'); }
  };

  const toFormInitial = s => ({
    label: s.label,
    description: s.description || '',
    bullets: (s.bullets || []).join('\n'),
    unlockedMessage: s.unlockedMessage || '',
    active: s.active !== false,
  });

  if (loading) return <div style={centerMsg}>Loading…</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 16 }}>
        {!creating && (
          <button onClick={() => { setCreating(true); setEditingId(null); }} style={btnPrimary}>
            <Plus size={14} /> Add Service
          </button>
        )}
      </div>

      {creating && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: '18px 20px', marginBottom: 14, background: '#fafafa' }}>
          <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>New Service</p>
          <ServiceForm onSave={handleCreate} onCancel={() => setCreating(false)} saving={saving} />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
        {services.length === 0 && !creating && (
          <div style={{ background: '#fff', ...centerMsg }}>No services yet. Click "Add Service" to create one.</div>
        )}
        {services.map(s => (
          <div key={s._id} style={{ background: '#fff' }}>
            {editingId === s._id ? (
              <div style={{ padding: '16px 18px' }}>
                <p style={{ margin: '0 0 14px', fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Edit Service {s.number}</p>
                <ServiceForm initial={toFormInitial(s)} onSave={data => handleEdit(s._id, data)} onCancel={() => setEditingId(null)} saving={saving} />
              </div>
            ) : (
              <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 13, color: '#aaa', minWidth: 24, textAlign: 'right' }}>{s.number}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{s.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, borderRadius: 999, padding: '1px 8px', background: s.active ? '#dcefed' : '#f0f0f0', color: s.active ? '#0a7373' : '#999' }}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {s.description && (
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>{s.description}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                  <button onClick={() => setExpanded(expanded === s._id ? null : s._id)} style={iconBtn} title="Preview">
                    {expanded === s._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                  <button onClick={() => { setEditingId(s._id); setCreating(false); }} style={iconBtn} title="Edit"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(s._id)} style={{ ...iconBtn, color: '#e53e3e' }} title="Delete"><Trash2 size={14} /></button>
                </div>
              </div>
            )}
            {expanded === s._id && editingId !== s._id && (
              <div style={{ padding: '0 18px 14px 54px', borderTop: '1px solid #f5f5f5' }}>
                {s.bullets?.length > 0 && (
                  <ul style={{ margin: '10px 0 6px', paddingLeft: 18 }}>
                    {s.bullets.map((b, i) => <li key={i} style={{ fontSize: 12, color: '#555', marginBottom: 3 }}>{b}</li>)}
                  </ul>
                )}
                {s.unlockedMessage && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#0a7373', background: '#f0faf9', borderRadius: 6, padding: '6px 10px' }}>
                    <strong>Unlocked msg:</strong> {s.unlockedMessage}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
  const [adminNotes, setAdminNotes] = useState(session.adminNotes || '');
  const [instructions, setInstructions] = useState(session.instructions || '');
  const [completionFeedback, setCompletionFeedback] = useState(session.completionFeedback || '');
  const [status, setStatus] = useState(session.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/session-requests/${session._id}`, { meetLink, scheduledAt, adminNotes, instructions, completionFeedback, status });
      toast.success('Session updated');
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
          {session.message && (
            <div style={{ background: '#faf8f5', borderRadius: 8, padding: '10px 14px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9aaca9', textTransform: 'uppercase', letterSpacing: '0.06em' }}>User Message</p>
              <p style={{ margin: 0, fontSize: 13, color: '#3f4948', lineHeight: 1.5 }}>{session.message}</p>
            </div>
          )}

          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} style={inputStyle}>
              <option value="pending">Pending</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Google Meet Link</label>
            <input value={meetLink} onChange={e => setMeetLink(e.target.value)} placeholder="https://meet.google.com/xxx-xxxx-xxx" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Scheduled Date & Time</label>
            <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Note to User (optional)</label>
            <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={2} placeholder="Any additional info for the user…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {status === 'completed' && (
            <>
              <div>
                <label style={labelStyle}>Instructions</label>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} placeholder="Next steps, resources, or action items for the user…" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={labelStyle}>Feedback for User</label>
                <textarea value={completionFeedback} onChange={e => setCompletionFeedback(e.target.value)} rows={3} placeholder="Share feedback about the session with the user…" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
            </>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={btnSecondary}>Cancel</button>
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

function SessionRequestsTab({ serviceKey }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [scheduling, setScheduling] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/session-requests');
      setSessions(res.data.sessions || []);
    } catch { toast.error('Failed to load session requests'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSaved = (updated) => {
    setSessions(prev => prev.map(s => s._id === updated._id ? updated : s));
  };

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
              {f === 'all' ? sessions.length : (counts[f] || 0)}
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminPremiumServicesSection() {
  const [tab, setTab] = useState('catalog');
  const [services, setServices] = useState([]);

  useEffect(() => {
    api.get('/admin/premium-services/catalog')
      .then(res => setServices(res.data.services || []))
      .catch(() => {});
  }, []);

  // tabs: catalog, all, then one per service
  const tabs = [
    { key: 'catalog', label: 'Service Catalog', serviceKey: null },
    { key: 'all',     label: 'All',             serviceKey: null },
    ...services.map(s => ({ key: s.key, label: s.label, serviceKey: s.key })),
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
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'catalog'
        ? <CatalogTab onServicesChange={setServices} />
        : <SessionRequestsTab serviceKey={activeTab.serviceKey} />
      }
    </div>
  );
}
