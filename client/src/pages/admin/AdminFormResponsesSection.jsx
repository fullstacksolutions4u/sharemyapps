import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminFormResponsesSection() {
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch();
  }, []);

  async function fetch() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/form-responses');
      setHeaders(res.data.headers);
      setRows(res.data.rows);
    } catch {
      setError('Failed to load responses. Make sure the Google Sheet is set to public viewer.');
    } finally {
      setLoading(false);
    }
  }

  const filtered = rows.filter(row =>
    Object.values(row).some(v => v?.toLowerCase?.().includes(search.toLowerCase()))
  );

  const nameKey = headers.find(h => h.toLowerCase().includes('name')) || headers[1] || headers[0];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>Form Responses</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888' }}>{rows.length} total submissions</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search responses..."
            style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, outline: 'none', width: 220 }}
          />
          <button onClick={fetch} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '7px 14px', fontSize: 13, background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>Loading responses…</div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#e53e3e', fontSize: 14 }}>{error}</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#aaa' }}>No responses found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#f0f0f0', borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map((row, i) => (
            <div
              key={i}
              onClick={() => setSelected(selected === i ? null : i)}
              style={{ background: '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f9f9f9'}
              onMouseLeave={e => e.currentTarget.style.background = selected === i ? '#f0f8ff' : '#fff'}
            >
              {/* Row summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px' }}>
                <span style={{ width: 24, textAlign: 'right', fontSize: 13, color: '#aaa', flexShrink: 0 }}>{i + 1}</span>
                <span style={{ width: 32, height: 32, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {row[nameKey]?.[0]?.toUpperCase() || '?'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{row[nameKey] || '—'}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>{row[headers[0]]}</div>
                </div>
                <span style={{ fontSize: 12, color: '#0a7373', fontWeight: 500 }}>{selected === i ? 'Hide ▲' : 'View ▼'}</span>
              </div>

              {/* Expanded detail */}
              {selected === i && (
                <div style={{ padding: '0 18px 18px 74px', background: '#fafcff' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px' }}>
                    {headers.slice(2).map(h => row[h] ? (
                      <div key={h}>
                        <div style={{ fontSize: 11, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{h}</div>
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
  );
}
