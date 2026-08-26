import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Pencil, Check, Heart, Calendar } from 'lucide-react';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function AdminCommunitySection() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' (Experiences) or 'general' (Statuses)

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editCategory, setEditCategory] = useState('general');
  const [editAnonymous, setEditAnonymous] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.get('/community-posts?limit=200')
      .then(res => {
        if (!cancelled) setPosts(res.data.posts || []);
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load community posts');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/community-posts/${id}`);
      setPosts(prev => prev.filter(p => p._id !== id));
      toast.success('Post deleted successfully');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleEditStart = (post) => {
    setEditingId(post._id);
    setEditContent(post.content);
    setEditCategory(post.category || 'general');
    setEditAnonymous(post.anonymous || false);
  };

  const handleEditSave = async (id) => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      const res = await api.put(`/community-posts/${id}`, {
        content: editContent.trim(),
        category: editCategory,
        anonymous: editAnonymous
      });
      // Replace post in state
      setPosts(prev => prev.map(p => p._id === id ? { ...p, ...res.data } : p));
      setEditingId(null);
      toast.success('Post updated successfully');
    } catch {
      toast.error('Failed to update post');
    } finally {
      setSaving(false);
    }
  };

  const filteredPosts = posts.filter(p => p.category === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Community Moderation</h2>
          <p className="text-xs text-gray-500 mt-1">Manage user-added experiences and live status updates.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('interview')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'interview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Experiences (Sticky Notes)
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Status Feed (Text list)
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-white border border-[#E5E1DA] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="bg-white border border-[#E5E1DA] rounded-2xl p-12 text-center">
          <MessageSquare size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">No posts found in this category.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map(post => {
            const isEditing = editingId === post._id;
            return (
              <div 
                key={post._id} 
                className="bg-white border border-[#E5E1DA] rounded-2xl p-5 hover:shadow-xs transition-shadow"
              >
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Post Content</label>
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        rows={4}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-800 bg-gray-50 focus:outline-hidden focus:border-indigo-500 transition resize-none font-medium"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value)}
                          className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white focus:outline-hidden focus:border-indigo-500"
                        >
                          <option value="interview">Interview / Experience</option>
                          <option value="general">Status Update</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 mt-4">
                        <input
                          type="checkbox"
                          id={`anon-edit-${post._id}`}
                          checked={editAnonymous}
                          onChange={e => setEditAnonymous(e.target.checked)}
                          className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label 
                          htmlFor={`anon-edit-${post._id}`}
                          className="text-xs font-bold text-gray-500 select-none cursor-pointer"
                        >
                          Anonymous Mode
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleEditSave(post._id)}
                        disabled={!editContent.trim() || saving}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
                      >
                        <Check size={13} /> {saving ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      {/* Header metadata */}
                      <div className="flex flex-wrap items-center gap-3">
                        {post.author?.avatar && !post.anonymous ? (
                          <img src={post.author.avatar} alt={post.author.name} className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold text-[10px]">
                            {post.anonymous ? 'CM' : (post.author?.name?.charAt(0).toUpperCase() || '?')}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-900">
                              {post.anonymous ? 'Community Member (Anonymous)' : (post.author?.name || 'Unknown')}
                            </span>
                            {post.author?.email && !post.anonymous && (
                              <span className="text-[10px] text-gray-400 font-medium">({post.author.email})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-gray-50 border border-gray-200 text-gray-500 uppercase tracking-wider">
                              {post.category === 'interview' ? 'Experience' : 'Status'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-1">
                              <Calendar size={9} />
                              {new Date(post.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(post.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Post body */}
                      <p className="text-xs text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap pl-0.5">
                        {post.content}
                      </p>

                      {/* Likes/Comments summary */}
                      <div className="flex items-center gap-4 text-[10px] text-gray-400 font-bold pl-0.5">
                        <span className="flex items-center gap-1">
                          <Heart size={10} className="text-rose-500 fill-rose-500" />
                          {post.likes?.length || 0} Likes
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare size={10} />
                          {post.comments?.length || 0} Comments
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleEditStart(post)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all cursor-pointer"
                        title="Edit Post"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(post._id)}
                        className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-100 hover:bg-red-50/50 transition-all cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
