import { useEffect, useState } from 'react';
import api from '../../api/axios';

export default function AdminOffersSection() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get('/admin/offers?page=1')
      .then(r => setOffers(r.data.offers))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('Delete this application?')) return;
    setDeletingId(id);
    try {
      await api.delete(`/admin/offers/${id}`);
      setOffers(prev => prev.filter(o => o._id !== id));
    } catch {
      alert('Failed to delete. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>Free Offer Applicants</h2>
        <p style={{ margin: '4px 0 0', fontSize: '13.5px', color: '#666' }}>
          Users who applied for the free June premium offer · {offers.length} total
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>Loading…</div>
      ) : offers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#aaa' }}>No applications yet</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#f0f0f0', borderRadius: '12px', overflow: 'hidden' }}>
          {offers.map((o, i) => (
            <div key={o._id} style={{
              background: '#fff', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <span style={{ fontSize: '13px', color: '#aaa', width: '24px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
              {o.user?.avatar
                ? <img src={o.user.avatar} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                : <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#dcefed', color: '#0a7373', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{o.user?.name?.[0]?.toUpperCase()}</span>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>{o.user?.name || '—'}</div>
                <div style={{ fontSize: '12.5px', color: '#888' }}>{o.user?.email || ''}</div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', flexShrink: 0 }}>
                {new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              <button
                onClick={() => handleDelete(o._id)}
                disabled={deletingId === o._id}
                style={{
                  marginLeft: '8px', flexShrink: 0, border: 'none', background: 'none',
                  cursor: deletingId === o._id ? 'not-allowed' : 'pointer',
                  color: '#e53e3e', fontSize: '16px', lineHeight: 1, padding: '4px 6px',
                  borderRadius: '6px', opacity: deletingId === o._id ? 0.5 : 1,
                }}
                title="Delete application"
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
