import { useEffect, useState, useCallback } from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import api from '../../api/axios';

function FormResponsesModal({ onClose }) {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/form-responses');
      setHeaders(res.data.headers);
      setRows(res.data.rows);
    } catch {
      setError('Failed to load. Make sure the Google Sheet is set to public viewer.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]); // eslint-disable-line react-hooks/set-state-in-effect

  const nameKey = headers.find(h => h.toLowerCase().includes('name')) || headers[1] || headers[0];
  const timestampKey = headers.find(h => h.toLowerCase().includes('timestamp')) || headers[0];
  const filtered = rows.filter(row =>
    Object.values(row).some(v => v?.toLowerCase?.().includes(search.toLowerCase()))
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1100,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        {/* Modal Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#1a1a1a' }}>Form Responses</div>
            <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{rows.length} total submissions</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13, outline: 'none', width: 180 }}
            />
            <button onClick={loadData} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 12px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
              Refresh
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#f5f5f5', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#666' }}>✕</button>
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading responses…</div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#e53e3e', fontSize: 14 }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>No responses found.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
              {filtered.map((row, i) => (
                <div key={i} style={{ background: selected === i ? '#f0f8ff' : '#fff', cursor: 'pointer' }}
                  onClick={() => setSelected(selected === i ? null : i)}
                  onMouseEnter={e => { if (selected !== i) e.currentTarget.style.background = '#f9f9f9'; }}
                  onMouseLeave={e => { if (selected !== i) e.currentTarget.style.background = '#fff'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                    <span style={{ width: 22, textAlign: 'right', fontSize: 12, color: '#aaa', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ width: 30, height: 30, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                      {row[nameKey]?.[0]?.toUpperCase() || '?'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{row[nameKey] || '—'}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{row[timestampKey]}</div>
                    </div>
                    <span style={{ fontSize: 11, color: '#0a7373', fontWeight: 500 }}>{selected === i ? 'Hide ▲' : 'View ▼'}</span>
                  </div>
                  {selected === i && (
                    <div style={{ padding: '0 16px 16px 60px', background: '#fafcff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
                        {headers.filter(h => h !== nameKey && h !== timestampKey).map(h => row[h] ? (
                          <div key={h} style={{ gridColumn: row[h].length > 60 ? '1/-1' : undefined }}>
                            <div style={{ fontSize: 10, color: '#aaa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{h}</div>
                            <div style={{ fontSize: 13, color: '#333', lineHeight: 1.5 }}>{row[h]}</div>
                          </div>
                        ) : null)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PortfolioModal({ offerId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin/offers/${offerId}/portfolio`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [offerId]);

  const user = data?.offer?.user;
  const projects = data?.projects || [];

  const tag = (text) => (
    <span style={{ background: '#f0f4ff', color: '#3b5bdb', borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}>
      {text}
    </span>
  );

  const whatsappMsg = (name) => encodeURIComponent(
    `Hello ${name}!\n\nI'm Kevin from ShareMyApps Portal. Thank you for applying to Job Hunting Assistance Service!\n\nPlease fill out this quick form to get started the service:\nhttps://forms.gle/DKCift4Pigj48jGP6`
  );

  const socialLinks = [
    {
      key: 'linkedinUrl', label: 'LinkedIn', bg: '#0077b5',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
    },
    {
      key: 'githubUrl', label: 'GitHub', bg: '#24292e',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>,
    },
    {
      key: 'leetcodeUrl', label: 'LeetCode', bg: '#FFA116',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M13.483 0a1.374 1.374 0 0 0-.961.438L7.116 6.226l-3.854 4.126a5.266 5.266 0 0 0-1.209 2.104 5.35 5.35 0 0 0-.125.513 5.527 5.527 0 0 0 .062 2.362 5.83 5.83 0 0 0 .349 1.017 5.938 5.938 0 0 0 1.271 1.818l4.277 4.193.039.038c2.248 2.165 5.852 2.133 8.063-.074l2.396-2.392c.54-.54.54-1.414.003-1.955a1.378 1.378 0 0 0-1.951-.003l-2.396 2.392a3.021 3.021 0 0 1-4.205.038l-.02-.019-4.276-4.193c-.652-.64-.972-1.469-.948-2.263a2.68 2.68 0 0 1 .066-.523 2.545 2.545 0 0 1 .619-1.164L9.13 8.114c1.058-1.134 3.204-1.27 4.43-.278l3.501 2.831c.593.48 1.461.387 1.94-.207a1.384 1.384 0 0 0-.207-1.943l-3.5-2.831c-.8-.647-1.766-1.045-2.774-1.202l2.015-2.158A1.384 1.384 0 0 0 13.483 0zm-2.866 12.815a1.38 1.38 0 0 0-1.38 1.382 1.38 1.38 0 0 0 1.38 1.382H20.79a1.38 1.38 0 0 0 1.38-1.382 1.38 1.38 0 0 0-1.38-1.382z"/></svg>,
    },
    {
      key: 'portfolioUrl', label: 'Portfolio', bg: '#6366f1',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>,
    },
    {
      key: 'cvUrl', label: 'Resume / CV', bg: '#e53e3e',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>,
    },
  ];

  const link = (href, label, bg, icon) => href ? (
    <a href={href} target="_blank" rel="noreferrer" style={{
      color: '#fff', fontSize: 12, textDecoration: 'none',
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, borderRadius: 8, padding: '6px 12px', fontWeight: 600,
    }}>
      {icon} {label}
    </a>
  ) : null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 960,
        maxHeight: '90vh', overflowY: 'auto', padding: 32, position: 'relative'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, border: 'none',
          background: '#f5f5f5', borderRadius: 8, width: 32, height: 32,
          cursor: 'pointer', fontSize: 16, color: '#666'
        }}>✕</button>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading portfolio…</div>
        ) : !user ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>No data found</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 24 }}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <span style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>{user.name?.[0]?.toUpperCase()}</span>
              }
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 20, color: '#1a1a1a' }}>{user.name}</span>
                  {user.regNumber && (
                    <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>
                      #{user.regNumber}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: '#888' }}>{user.email}</div>
                {user.place && <div style={{ fontSize: 12, color: '#aaa' }}>{[user.place, user.district, user.state, user.country].filter(Boolean).join(', ')}</div>}
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {user.designations?.map(d => tag(d))}
                </div>
              </div>
              {/* WhatsApp Button */}
              {user.phone && (
                <a
                  href={`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${whatsappMsg(user.name)}`}
                  target="_blank" rel="noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#25D366', color: '#fff', borderRadius: 10,
                    padding: '8px 14px', fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0
                  }}
                >
                  WhatsApp
                </a>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 6 }}>BIO</div>
                <p style={{ margin: 0, fontSize: 14, color: '#333', lineHeight: 1.6 }}>{user.bio}</p>
              </div>
            )}

            {/* Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 20 }}>
              {user.yearsOfExperience && <div><span style={{ fontSize: 12, color: '#aaa' }}>Experience</span><div style={{ fontSize: 14, fontWeight: 500 }}>{user.yearsOfExperience}</div></div>}
              {user.joiningAvailability && <div><span style={{ fontSize: 12, color: '#aaa' }}>Available to Join</span><div style={{ fontSize: 14, fontWeight: 500 }}>{user.joiningAvailability}</div></div>}
              {user.currentSalary && <div><span style={{ fontSize: 12, color: '#aaa' }}>Current CTC</span><div style={{ fontSize: 14, fontWeight: 500 }}>₹{user.currentSalary?.toLocaleString()}</div></div>}
              {user.expectedSalary && <div><span style={{ fontSize: 12, color: '#aaa' }}>Expected CTC</span><div style={{ fontSize: 14, fontWeight: 500 }}>₹{user.expectedSalary?.toLocaleString()}</div></div>}
              {user.phone && <div><span style={{ fontSize: 12, color: '#aaa' }}>Phone</span><div style={{ fontSize: 14, fontWeight: 500 }}>{user.phone}</div></div>}
              {user.jobMode?.length > 0 && <div><span style={{ fontSize: 12, color: '#aaa' }}>Job Mode</span><div style={{ fontSize: 14, fontWeight: 500 }}>{user.jobMode.join(', ')}</div></div>}
              {user.preferredLocations?.length > 0 && <div style={{ gridColumn: '1/-1' }}><span style={{ fontSize: 12, color: '#aaa' }}>Preferred Locations</span><div style={{ fontSize: 14, fontWeight: 500 }}>{user.preferredLocations.join(', ')}</div></div>}
            </div>

            {/* Skills */}
            {user.familiarTech?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 8 }}>SKILLS</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {user.familiarTech.map(t => tag(t))}
                </div>
              </div>
            )}

            {/* Links */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              {socialLinks.map(({ key, label, bg, icon }) => link(user[key], label, bg, icon))}
            </div>

            {/* Projects */}
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: '#555', marginBottom: 12 }}>
                PROJECTS ({projects.length})
              </div>
              {projects.length === 0 ? (
                <div style={{ fontSize: 13, color: '#aaa' }}>No projects submitted yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {projects.map(p => (
                    <div key={p._id} style={{ border: '1px solid #eee', borderRadius: 10, padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{p.title}</div>
                          <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>{p.category} · {p.appType}</div>
                          <div style={{ fontSize: 13, color: '#555', marginBottom: 8 }}>{p.description?.slice(0, 120)}{p.description?.length > 120 ? '…' : ''}</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {p.techTags?.map(t => tag(t))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                          <span style={{
                            fontSize: 11, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                            background: p.status === 'approved' ? '#e6f7f0' : p.status === 'rejected' ? '#fdecea' : '#fff8e1',
                            color: p.status === 'approved' ? '#0a7373' : p.status === 'rejected' ? '#c0392b' : '#b8860b'
                          }}>{p.status}</span>
                          {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0a7373' }}>🔗 Live</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


function SRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#aaa', minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function parseNotes(raw) {
  if (!raw) return { wellness: '', strength: '', advice: '' };
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === 'object' && ('wellness' in p || 'strength' in p || 'advice' in p)) {
      return { wellness: p.wellness || '', strength: p.strength || '', advice: p.advice || '' };
    }
  } catch { /* ignore */ }
  return { wellness: '', strength: '', advice: raw };
}

function SummaryModal({ offer, onClose, onSummaryUpdate, onCommentUpdate }) {
  const [summary, setSummary]     = useState(offer.aiSummary   || null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const parsed = parseNotes(offer.summaryComment);
  const [wellness, setWellness]   = useState(parsed.wellness);
  const [strength, setStrength]   = useState(parsed.strength);
  const [advice, setAdvice]       = useState(parsed.advice);
  const [commentSaving, setCommentSaving]   = useState(false);
  const [commentSaved, setCommentSaved]     = useState(false);
  const [commentError, setCommentError]     = useState('');
  const [fixingSpelling, setFixingSpelling] = useState(false);

  const [activeTab, setActiveTab]           = useState('summary');
  const [timeline, setTimeline]             = useState(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [actType, setActType]               = useState('meeting');
  const [actNote, setActNote]               = useState('');
  const [actScheduledAt, setActScheduledAt] = useState('');
  const [addingActivity, setAddingActivity] = useState(false);

  useEffect(() => { if (!summary) generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/admin/offers/${offer._id}/ai-summary`);
      setSummary(res.data.aiSummary);
      onSummaryUpdate(offer._id, res.data.aiSummary, res.data.aiSummaryAt);
    } catch {
      setError('Failed to generate. Check OpenAI API key.');
    } finally {
      setLoading(false);
    }
  }

  async function fixSpelling() {
    if (!wellness.trim() && !strength.trim() && !advice.trim()) return;
    setFixingSpelling(true);
    try {
      const [wRes, sRes, aRes] = await Promise.all([
        wellness.trim() ? api.post('/admin/fix-spelling', { text: wellness }) : Promise.resolve(null),
        strength.trim() ? api.post('/admin/fix-spelling', { text: strength }) : Promise.resolve(null),
        advice.trim()   ? api.post('/admin/fix-spelling', { text: advice })   : Promise.resolve(null),
      ]);
      if (wRes) setWellness(wRes.data.text);
      if (sRes) setStrength(sRes.data.text);
      if (aRes) setAdvice(aRes.data.text);
      setCommentSaved(false);
    } catch { /* ignore */ } finally {
      setFixingSpelling(false);
    }
  }

  async function saveComment() {
    setCommentSaving(true);
    setCommentSaved(false);
    setCommentError('');
    try {
      const comment = JSON.stringify({ wellness, strength, advice });
      await api.patch(`/admin/offers/${offer._id}/summary-comment`, { comment });
      setCommentSaved(true);
      onCommentUpdate(offer._id, comment);
      setTimeout(() => setCommentSaved(false), 2500);
    } catch (err) {
      setCommentError(err?.response?.data?.message || 'Failed to save');
    } finally {
      setCommentSaving(false);
    }
  }

  async function loadTimeline() {
    setTimelineLoading(true);
    try {
      const res = await api.get(`/admin/offers/${offer._id}/timeline`);
      setTimeline(res.data.events);
    } catch { /* ignore */ } finally {
      setTimelineLoading(false);
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    if (tab === 'timeline' && !timeline) loadTimeline();
  }

  async function addActivity() {
    if (!actNote.trim()) return;
    setAddingActivity(true);
    try {
      await api.post(`/admin/offers/${offer._id}/activity`, {
        type: actType, note: actNote, scheduledAt: actScheduledAt || null,
      });
      setActNote('');
      setActScheduledAt('');
      setShowActivityForm(false);
      setTimeline(null);
      await loadTimeline();
    } catch { /* ignore */ } finally {
      setAddingActivity(false);
    }
  }

  const ACT_CONFIG = {
    meeting_logged: { label: 'Meeting Scheduled', tag: '#1a1a1a' },
    meeting_attend: { label: 'Attend Meeting',    tag: '#1a1a1a' },
    meeting:        { label: 'Meeting Scheduled', tag: '#1a1a1a' },
    call:           { label: 'Call / Doubt Session', tag: '#1a1a1a' },
    note:           { label: 'General Note',      tag: '#1a1a1a' },
    other:          { label: 'Stop Services',      tag: '#1a1a1a' },
    signup:         { label: 'Signed Up',         tag: '#1a1a1a' },
    applied:        { label: 'Applied for Premium Service', tag: '#1a1a1a' },
    whatsapp:       { label: 'WhatsApp Contacted', tag: '#1a1a1a' },
    enrolled:       { label: 'Enrolled in Program', tag: '#1a1a1a' },
  };

  const TL_ICONS = {
    meeting_logged: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    meeting_attend: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    meeting:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    call:           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.75a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16a2 2 0 0 1 .27.92z"/></svg>,
    note:           <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    other:          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    signup:         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    applied:        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    whatsapp:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    enrolled:       <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  };

  const s = summary;

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 1280, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ flexShrink: 0, borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {offer.user?.avatar
              ? <img src={offer.user.avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
              : <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15 }}>{offer.user?.name?.[0]?.toUpperCase()}</span>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>{offer.user?.name}{summary?.headline ? ` — ${summary.headline}` : ''}</div>
            </div>
            <button
              onClick={() => setShowActivityForm(v => !v)}
              style={{ border: '1px solid #e67e22', borderRadius: 8, padding: '6px 14px', fontSize: 13, background: showActivityForm ? '#fff8f0' : '#fff', cursor: 'pointer', color: '#e67e22', fontWeight: 600 }}
            >
              + Log Activity
            </button>
            <button onClick={generate} disabled={loading} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 13, background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', color: '#555', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Generating…' : '↺ Refresh'}
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#f5f5f5', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#666' }}>✕</button>
          </div>

          {/* Activity form */}
          {showActivityForm && (
            <div style={{ margin: '0 20px 12px', border: '1px solid #f0c080', borderRadius: 10, padding: '12px 14px', background: '#fffbf5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 200px auto', gap: 8, alignItems: 'flex-start' }}>
                <select
                  value={actType}
                  onChange={e => setActType(e.target.value)}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, outline: 'none', background: '#fff', color: '#333' }}
                >
                  <option value="meeting">📅 Meeting Scheduled</option>
                  <option value="call">📞 Call / Doubt Session</option>
                  <option value="note">📝 General Note</option>
                  <option value="other">Stop Services</option>
                </select>
                <textarea
                  value={actNote}
                  onChange={e => setActNote(e.target.value)}
                  placeholder="Add details about this activity…"
                  rows={2}
                  style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Scheduled Date/Time</label>
                  <input
                    type="datetime-local"
                    value={actScheduledAt}
                    onChange={e => setActScheduledAt(e.target.value)}
                    style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none' }}
                  />
                </div>
                <button
                  onClick={addActivity}
                  disabled={addingActivity || !actNote.trim()}
                  style={{ border: 'none', background: addingActivity || !actNote.trim() ? '#ccc' : '#e67e22', color: '#fff', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: addingActivity || !actNote.trim() ? 'not-allowed' : 'pointer', alignSelf: 'flex-end' }}
                >
                  {addingActivity ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, padding: '0 20px' }}>
            {[['summary', 'AI Summary'], ['timeline', 'Timeline']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => switchTab(key)}
                style={{
                  border: 'none', background: 'none', padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  color: activeTab === key ? '#1a1a1a' : '#aaa',
                  borderBottom: activeTab === key ? '2px solid #1a1a1a' : '2px solid transparent',
                  cursor: 'pointer', transition: 'color 0.15s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div>
              {timelineLoading ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#aaa', fontSize: 14 }}>Loading timeline…</div>
              ) : !timeline || timeline.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 48, color: '#aaa', fontSize: 14 }}>No events yet.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {timeline.map(ev => {
                    const cfg = ACT_CONFIG[ev.eventType] || ACT_CONFIG.other;
                    const icon = TL_ICONS[ev.eventType] || TL_ICONS.other;
                    const date = new Date(ev.at);
                    return (
                      <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                          background: '#fff', border: '1.5px solid #d1d5db',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#374151', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}>
                          {icon}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {cfg.label}
                          </div>
                          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                            {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {' · '}
                            {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Summary tab */}
          {activeTab === 'summary' && (loading && !s ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
              <div style={{ fontSize: 14, marginBottom: 6 }}>Analysing profile, resume & form data…</div>
              <div style={{ fontSize: 12, color: '#ccc' }}>This may take a few seconds</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ color: '#e53e3e', fontSize: 14, marginBottom: 12 }}>{error}</div>
              <button onClick={generate} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Try Again</button>
            </div>
          ) : s?.raw ? (
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.raw}</div>
          ) : s ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

                {s.keySkills?.length > 0 && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Key Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {s.keySkills.map(sk => (
                        <span key={sk} style={{ background: '#f0f4ff', color: '#3b5bdb', borderRadius: 6, padding: '2px 9px', fontSize: 12, fontWeight: 500 }}>{sk}</span>
                      ))}
                    </div>
                  </div>
                )}

                {s.experience && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px', gridColumn: '1/-1' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Experience</div>
                    {Array.isArray(s.experience) ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px 20px' }}>
                        {s.experience.map((e, i) => (
                          <div key={i} style={{ borderLeft: '2px solid #e5e7eb', paddingLeft: 10 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a1a' }}>{e.role}</div>
                            <div style={{ fontSize: 12, color: '#555' }}>{e.company}</div>
                            {e.period && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>{e.period}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <SRow label="Total" value={s.experience.years} />
                        <SRow label="Current Role" value={s.experience.currentRole} />
                      </div>
                    )}
                  </div>
                )}

                {s.jobPreferences && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Job Preferences</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <SRow label="Mode" value={s.jobPreferences.mode} />
                      <SRow label="Locations" value={s.jobPreferences.locations?.join(', ')} />
                      <SRow label="Availability" value={s.jobPreferences.availability} />
                      <SRow label="Current CTC" value={s.jobPreferences.currentCTC} />
                      <SRow label="Expected CTC" value={s.jobPreferences.expectedCTC} />
                    </div>
                  </div>
                )}

                {s.education && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Education</div>
                    <div style={{ fontSize: 13, color: '#333' }}>{s.education}</div>
                  </div>
                )}


              </div>

              {/* Google Form responses */}
              {(s.formSummary || s.formInsights) && (
                <div style={{ border: '1px solid #e8f0fe', background: '#f8faff', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#3b5bdb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Google Form Response
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.7 }}>{s.formSummary || s.formInsights}</p>
                </div>
              )}

            </div>
          ) : null)}

          {/* Admin Notes — 3 sections, visible only in Summary tab */}
          {activeTab === 'summary' && (
          <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Admin Notes <span style={{ fontWeight: 400, textTransform: 'none', fontSize: 10, color: '#bbb' }}>(used by AI on next refresh)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Wellness', color: '#0a7373', bg: '#f0faf9', val: wellness, set: v => { setWellness(v); setCommentSaved(false); }, placeholder: 'e.g. Communicates well, positive attitude…' },
                { label: 'Strength', color: '#3b5bdb', bg: '#f0f4ff', val: strength, set: v => { setStrength(v); setCommentSaved(false); }, placeholder: 'e.g. Strong React skills, 3 yrs experience…' },
                { label: 'Advice',   color: '#c05621', bg: '#fff8f0', val: advice,   set: v => { setAdvice(v);   setCommentSaved(false); }, placeholder: 'e.g. Needs to improve DSA, update resume…' },
              ].map(({ label, color, bg, val, set, placeholder }) => (
                <div key={label} style={{ border: `1px solid ${color}33`, borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: bg, padding: '5px 10px', fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    • {label}
                  </div>
                  <textarea
                    value={val}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    spellCheck={true}
                    style={{
                      width: '100%', boxSizing: 'border-box', border: 'none',
                      borderTop: `1px solid ${color}22`, padding: '8px 10px',
                      fontSize: 12, resize: 'vertical', outline: 'none',
                      color: '#333', lineHeight: 1.7, fontFamily: 'inherit', background: '#fff',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginTop: 8 }}>
              {commentError && <span style={{ fontSize: 12, color: '#e53e3e' }}>{commentError}</span>}
              <button
                onClick={fixSpelling}
                disabled={fixingSpelling || (!wellness.trim() && !strength.trim() && !advice.trim())}
                style={{
                  border: '1px solid #e5e7eb', background: '#fff', color: '#555',
                  borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600,
                  cursor: fixingSpelling || (!wellness.trim() && !strength.trim() && !advice.trim()) ? 'not-allowed' : 'pointer',
                  opacity: fixingSpelling || (!wellness.trim() && !strength.trim() && !advice.trim()) ? 0.5 : 1,
                }}
              >
                {fixingSpelling ? 'Fixing…' : '✦ Fix Spelling'}
              </button>
              <button
                onClick={saveComment}
                disabled={commentSaving}
                style={{
                  border: 'none', background: commentSaved ? '#0a7373' : '#1a1a1a',
                  color: '#fff', borderRadius: 8, padding: '6px 16px',
                  fontSize: 12, fontWeight: 600, cursor: commentSaving ? 'not-allowed' : 'pointer',
                  opacity: commentSaving ? 0.7 : 1, transition: 'background 0.2s',
                }}
              >
                {commentSaving ? 'Saving…' : commentSaved ? '✓ Saved' : 'Save Notes'}
              </button>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminOffersSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const [showFormResponses, setShowFormResponses] = useState(false);
  const [summaryOffer, setSummaryOffer] = useState(null);

  const whatsappMsg = (name) => encodeURIComponent(
    `Hello ${name}!\n\nI'm Kevin from ShareMyApps Portal. Thank you for applying to Job Hunting Assistance Service!\n\nPlease fill out this quick form to get started the service:\nhttps://forms.gle/DKCift4Pigj48jGP6`
  );

  async function handleWhatsapp(e, offer) {
    e.stopPropagation();
    const phone = offer.user?.phone?.replace(/\D/g, '');
    if (!phone) return;
    window.open(`https://wa.me/${phone}?text=${whatsappMsg(offer.user?.name)}`, '_blank');
    if (!offer.whatsappContacted) {
      try {
        const res = await api.patch(`/admin/offers/${offer._id}/whatsapp-contacted`);
        setOffers(prev => prev.map(o => o._id === offer._id ? { ...o, whatsappContacted: true, whatsappContactedAt: res.data.whatsappContactedAt } : o));
      } catch { /* ignore */ }
    }
  }

  useEffect(() => {
    api.get('/admin/offers?page=1')
      .then(r => setOffers(r.data.offers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleEnroll(e, offer) {
    e.stopPropagation();
    try {
      const res = await api.patch(`/admin/offers/${offer._id}/enroll`);
      setOffers(prev => prev.map(o => o._id === offer._id ? { ...o, enrolled: res.data.enrolled, enrolledAt: res.data.enrolledAt } : o));
    } catch { /* ignore */ }
  }

  function handleSummaryUpdate(offerId, aiSummary, aiSummaryAt) {
    setOffers(prev => prev.map(o => o._id === offerId ? { ...o, aiSummary, aiSummaryAt } : o));
    setSummaryOffer(prev => prev && prev._id === offerId ? { ...prev, aiSummary, aiSummaryAt } : prev);
  }

  function handleCommentUpdate(offerId, summaryComment) {
    setOffers(prev => prev.map(o => o._id === offerId ? { ...o, summaryComment } : o));
    setSummaryOffer(prev => prev && prev._id === offerId ? { ...prev, summaryComment } : prev);
  }

  return (
    <div>
      {selectedOfferId && (
        <PortfolioModal offerId={selectedOfferId} onClose={() => setSelectedOfferId(null)} />
      )}
      {showFormResponses && (
        <FormResponsesModal onClose={() => setShowFormResponses(false)} />
      )}
      {summaryOffer && (
        <SummaryModal offer={summaryOffer} onClose={() => setSummaryOffer(null)} onSummaryUpdate={handleSummaryUpdate} onCommentUpdate={handleCommentUpdate} />
      )}
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setShowFormResponses(true)}
          style={{ border: '1.5px solid #0a7373', background: '#fff', color: '#0a7373', borderRadius: 8, padding: '7px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
        >
          View Form Responses
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>Loading…</div>
      ) : offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>No applications yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
          {[...offers].sort((a, b) => (b.enrolled ? 1 : 0) - (a.enrolled ? 1 : 0)).map((o, i) => (
            <div key={o._id}
              onClick={() => setSelectedOfferId(o._id)}
              style={{
                background: '#fff', padding: '14px 18px',
                display: 'grid',
                gridTemplateColumns: '28px 34px 1fr 1fr 120px 90px 80px 110px 100px 36px',
                alignItems: 'center', gap: '12px',
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              {/* # */}
              <span style={{ fontSize: '13px', color: '#aaa', textAlign: 'right' }}>{i + 1}</span>

              {/* Avatar */}
              {o.user?.avatar
                ? <img src={o.user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                : <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{o.user?.name?.[0]?.toUpperCase()}</span>
              }

              {/* Name */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.user?.name || '—'}</div>
                {o.activities?.some(a => a.type === 'other') && (
                  <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600, marginTop: 2 }}>Stop Services</div>
                )}
              </div>

              {/* Designation */}
              <div style={{ fontSize: '13px', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {o.user?.designations?.[0] || '—'}
              </div>

              {/* WhatsApp status */}
              <div>
                {o.whatsappContacted ? (
                  <span style={{ fontSize: 11, background: '#e6f7f0', color: '#0a7373', borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>
                    Contacted
                  </span>
                ) : (
                  <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', borderRadius: 6, padding: '3px 10px', fontWeight: 600 }}>
                    Not Contacted
                  </span>
                )}
              </div>

              {/* Summary button */}
              <button
                onClick={e => { e.stopPropagation(); setSummaryOffer(o); }}
                style={{
                  border: o.aiSummary ? 'none' : '1px solid #e5e7eb',
                  background: o.aiSummary ? '#1a1a1a' : '#fff',
                  color: o.aiSummary ? '#fff' : '#555',
                  borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                }}
              >
                ✦ Summary
              </button>

              {/* View Portfolio */}
              <div style={{ fontSize: '12px', color: '#0a7373', fontWeight: 500 }}>View Portfolio →</div>

              {/* WhatsApp button */}
              {o.user?.phone ? (
                <button
                  onClick={(e) => handleWhatsapp(e, o)}
                  style={{
                    border: 'none', background: '#25D366', color: '#fff',
                    borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >WhatsApp</button>
              ) : (
                <span style={{ fontSize: 11, color: '#ccc' }}>No phone</span>
              )}

              {/* Enroll tick button */}
              <button
                onClick={(e) => handleEnroll(e, o)}
                title={o.enrolled ? 'Unenroll' : 'Enroll in program'}
                style={{
                  border: 'none', borderRadius: '50%', width: 30, height: 30,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', fontSize: 16, fontWeight: 700,
                  background: o.enrolled ? '#0a7373' : '#f0f0f0',
                  color: o.enrolled ? '#fff' : '#aaa',
                  transition: 'all 0.2s',
                }}
              >✓</button>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
