import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

// ── helpers ───────────────────────────────────────────────────────────────────

function tag(text, color = '#0a7373') {
  return (
    <span key={text} style={{
      background: color === '#0a7373' ? '#dcefed' : '#f0f4ff',
      color,
      borderRadius: 6,
      padding: '2px 9px',
      fontSize: 12,
      fontWeight: 500,
      display: 'inline-block',
    }}>
      {text}
    </span>
  );
}

function Row({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ fontSize: 12, color: '#aaa', minWidth: 120, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1a1a1a', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 8 ? '#0a7373' : score >= 6 ? '#b8860b' : '#c0392b';
  const bg = score >= 8 ? '#e6f7f0' : score >= 6 ? '#fff8e1' : '#fdecea';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{
        fontSize: 28, fontWeight: 800, color,
        lineHeight: 1,
      }}>{score}<span style={{ fontSize: 14, fontWeight: 600 }}>/10</span></span>
      <span style={{ fontSize: 12, fontWeight: 600, background: bg, color, borderRadius: 6, padding: '3px 10px' }}>
        {score >= 8 ? 'Strong' : score >= 6 ? 'Good' : 'Needs Work'}
      </span>
    </div>
  );
}

// ── Summary Modal ─────────────────────────────────────────────────────────────

function SummaryModal({ userData, onClose, onSummaryUpdate }) {
  const [summary, setSummary] = useState(userData.aiSummary || null);
  const [summaryAt, setSummaryAt] = useState(userData.aiSummaryAt || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate if no existing summary
  useEffect(() => {
    if (!summary) generate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function generate() {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/admin/offers/${userData.offerId}/ai-summary`);
      setSummary(res.data.aiSummary);
      setSummaryAt(res.data.aiSummaryAt);
      onSummaryUpdate(userData.offerId, res.data.aiSummary, res.data.aiSummaryAt);
    } catch {
      setError('Failed to generate summary. Check OpenAI API key.');
    } finally {
      setLoading(false);
    }
  }

  const s = summary;
  const isRaw = s && s.raw;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 820, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          {userData.profile.avatar
            ? <img src={userData.profile.avatar} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
            : <span style={{ width: 40, height: 40, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>{userData.profile.name?.[0]?.toUpperCase()}</span>
          }
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#1a1a1a' }}>{userData.profile.name} — AI Summary</div>
            {summaryAt && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Generated {new Date(summaryAt).toLocaleString()}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={generate}
              disabled={loading}
              style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '6px 14px', fontSize: 13, background: '#fff', cursor: loading ? 'not-allowed' : 'pointer', color: '#555', fontWeight: 500, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Generating…' : '↺ Refresh'}
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#f5f5f5', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#666' }}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {loading && !s ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
              <div style={{ fontSize: 14, marginBottom: 8 }}>Analysing profile, resume & form data…</div>
              <div style={{ fontSize: 12, color: '#ccc' }}>This may take a few seconds</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ color: '#e53e3e', fontSize: 14, marginBottom: 12 }}>{error}</div>
              <button onClick={generate} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>Try Again</button>
            </div>
          ) : isRaw ? (
            <div style={{ fontSize: 14, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{s.raw}</div>
          ) : s ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Headline + score */}
              <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17, color: '#1a1a1a', marginBottom: 6 }}>{s.headline}</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.65 }}>{s.overview}</p>
                </div>
                {s.readinessScore != null && (
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <ScoreBadge score={s.readinessScore} />
                    {s.readinessNote && <div style={{ fontSize: 11, color: '#888', marginTop: 4, maxWidth: 180 }}>{s.readinessNote}</div>}
                  </div>
                )}
              </div>

              {/* 2-col grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Key Skills */}
                {s.keySkills?.length > 0 && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Key Skills</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {s.keySkills.map(sk => tag(sk, '#3b5bdb'))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {s.experience && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Experience</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Row label="Total" value={s.experience.years} />
                      <Row label="Current Role" value={s.experience.currentRole} />
                      {s.experience.summary && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#666', lineHeight: 1.5 }}>{s.experience.summary}</p>}
                    </div>
                  </div>
                )}

                {/* Job Preferences */}
                {s.jobPreferences && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Job Preferences</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <Row label="Mode" value={s.jobPreferences.mode} />
                      <Row label="Locations" value={s.jobPreferences.locations?.join(', ')} />
                      <Row label="Availability" value={s.jobPreferences.availability} />
                      <Row label="Current CTC" value={s.jobPreferences.currentCTC} />
                      <Row label="Expected CTC" value={s.jobPreferences.expectedCTC} />
                    </div>
                  </div>
                )}

                {/* Education */}
                {s.education && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Education</div>
                    <div style={{ fontSize: 13, color: '#333' }}>{s.education}</div>
                  </div>
                )}

                {/* Strengths */}
                {s.strengths?.length > 0 && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Strengths</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {s.strengths.map((st, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: '#0a7373', fontWeight: 700, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 13, color: '#333' }}>{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {s.gaps?.length > 0 && (
                  <div style={{ border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Areas to Improve</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {s.gaps.map((g, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ color: '#e53e3e', fontWeight: 700, flexShrink: 0 }}>!</span>
                          <span style={{ fontSize: 13, color: '#555' }}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Insights */}
              {s.formInsights && (
                <div style={{ border: '1px solid #e8f0fe', background: '#f8faff', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#3b5bdb', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Form Insights</div>
                  <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.65 }}>{s.formInsights}</p>
                </div>
              )}

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export default function AdminPremiumUsersSection() {
  const [data, setData] = useState({ users: [], formHeaders: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [summaryTarget, setSummaryTarget] = useState(null); // user index

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/premium-users');
      setData(res.data);
    } catch {
      setError('Failed to load premium users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Update cached summary in local state after generation
  function handleSummaryUpdate(offerId, aiSummary, aiSummaryAt) {
    setData(prev => ({
      ...prev,
      users: prev.users.map(u =>
        u.offerId === offerId ? { ...u, aiSummary, aiSummaryAt } : u
      ),
    }));
  }

  const q = search.toLowerCase();
  const filtered = data.users.filter(u =>
    !q ||
    u.profile.name?.toLowerCase().includes(q) ||
    u.profile.email?.toLowerCase().includes(q) ||
    u.profile.designations?.some(d => d.toLowerCase().includes(q)) ||
    u.profile.familiarTech?.some(t => t.toLowerCase().includes(q))
  );

  const selectedUser = summaryTarget !== null ? filtered[summaryTarget] : null;

  return (
    <div>
      {selectedUser && (
        <SummaryModal
          userData={selectedUser}
          onClose={() => setSummaryTarget(null)}
          onSummaryUpdate={handleSummaryUpdate}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Premium Service Users</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>
            {data.users.length} enrolled · click Summary for AI analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, skill…"
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, outline: 'none', width: 220 }}
          />
          <button onClick={load} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, background: '#fff', cursor: 'pointer' }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading premium users…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#e53e3e' }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>
          {data.users.length === 0 ? 'No enrolled users yet.' : 'No results match your search.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((u, i) => {
            const p = u.profile;
            const hasSummary = !!u.aiSummary;
            const loc = [p.place, p.state].filter(Boolean).join(', ');

            return (
              <div
                key={u.offerId}
                style={{ background: '#fff', padding: '13px 18px', display: 'grid', gridTemplateColumns: '28px 38px 1fr auto', alignItems: 'center', gap: 12 }}
              >
                <span style={{ fontSize: 13, color: '#aaa', textAlign: 'right' }}>{i + 1}</span>

                {p.avatar
                  ? <img src={p.avatar} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover' }} />
                  : <span style={{ width: 38, height: 38, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{p.name?.[0]?.toUpperCase()}</span>
                }

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{p.name}</span>
                    {p.regNumber && (
                      <span style={{ fontSize: 11, background: '#fff3cd', color: '#856404', borderRadius: 6, padding: '1px 7px', fontWeight: 600 }}>#{p.regNumber}</span>
                    )}
                    {p.yearsOfExperience && <span style={{ fontSize: 11, color: '#888' }}>{p.yearsOfExperience} exp</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                    {p.designations?.[0]}{loc ? ` · ${loc}` : ''}{p.expectedSalary ? ` · ₹${(p.expectedSalary / 100000).toFixed(1)}L exp` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap' }}>
                    {p.familiarTech?.slice(0, 5).map(t => tag(t))}
                    {p.familiarTech?.length > 5 && <span style={{ fontSize: 11, color: '#aaa', alignSelf: 'center' }}>+{p.familiarTech.length - 5}</span>}
                  </div>
                </div>

                <button
                  onClick={() => setSummaryTarget(i)}
                  style={{
                    border: hasSummary ? '1.5px solid #0a7373' : '1.5px solid #e5e7eb',
                    background: hasSummary ? '#0a7373' : '#fff',
                    color: hasSummary ? '#fff' : '#555',
                    borderRadius: 8,
                    padding: '6px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {hasSummary ? '✦' : '✦'} Summary
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
