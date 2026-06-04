import { useState, useEffect } from 'react';
import { Megaphone, Plus, Check, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminAnnouncementsSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    api.get('/announcements/all')
      .then(res => setItems(res.data))
      .catch(() => toast.error('Failed to load announcements'))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/announcements', { text });
      setItems(prev => [res.data, ...prev]);
      setText('');
      toast.success('Announcement added');
    } catch { toast.error('Failed to add announcement'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.patch(`/announcements/${id}/toggle`);
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
    } catch { toast.error('Failed to update'); }
  };

  const handleEditSave = async (id) => {
    if (!editText.trim()) return;
    setEditSaving(true);
    try {
      const res = await api.patch(`/announcements/${id}`, { text: editText });
      setItems(prev => prev.map(i => i._id === id ? res.data : i));
      setEditId(null);
      toast.success('Announcement updated');
    } catch { toast.error('Failed to update'); }
    finally { setEditSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/announcements/${id}`);
      setItems(prev => prev.filter(i => i._id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Announcements</h2>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-medium text-[#1A1A1A]">New announcement</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your announcement message..."
          rows={3}
          className="w-full px-3.5 py-2.5 border border-[#E5E1DA] rounded-xl text-sm text-[#1A1A1A] bg-white placeholder-[#9CA3AF] focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={!text.trim() || saving}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          <Plus size={14} /> Add Announcement
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-white border border-[#E5E1DA] rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-12 text-center">
          <Megaphone size={28} className="text-[#9CA3AF] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280]">No announcements yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item._id} className={`bg-white border border-border rounded-2xl px-5 py-4 ${!item.active && 'opacity-60'}`}>
              {editId === item._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    rows={3}
                    className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm text-text bg-bg focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/10 transition resize-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSave(item._id)}
                      disabled={!editText.trim() || editSaving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Check size={12} /> {editSaving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      className="px-3.5 py-1.5 text-xs text-muted hover:text-text border border-border rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <Megaphone size={16} className={`mt-0.5 shrink-0 ${item.active ? 'text-accent' : 'text-[#9CA3AF]'}`} />
                  <p className="flex-1 text-sm text-text leading-relaxed">{item.text}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${item.active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-[#F3F0EB] text-muted border-border'}`}>
                      {item.active ? 'Active' : 'Hidden'}
                    </span>
                    <button onClick={() => handleToggle(item._id)} title={item.active ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-muted hover:text-text transition-colors">
                      {item.active ? <ToggleRight size={16} className="text-accent" /> : <ToggleLeft size={16} />}
                    </button>
                    <button onClick={() => { setEditId(item._id); setEditText(item.text); }} title="Edit"
                      className="p-1.5 rounded-lg hover:bg-[#F3F0EB] text-muted hover:text-text transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(item._id)} title="Delete"
                      className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
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
