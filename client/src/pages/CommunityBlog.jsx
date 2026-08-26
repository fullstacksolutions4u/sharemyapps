import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { 
  MessageSquare, Heart, Send, Trash2, Plus, 
  X, Pencil
} from 'lucide-react';


export default function CommunityBlog() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick Status Form State
  const [quickStatusText, setQuickStatusText] = useState('');

  // Detailed post modal state
  const [expandedCardId, setExpandedCardId] = useState(null);

  // New Post Form State (Detailed experience modal)
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [quickAnonymous, setQuickAnonymous] = useState(false);
  const [newAnonymous, setNewAnonymous] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);

  // Comment input state mapped by post ID
  const [commentInputs, setCommentInputs] = useState({});

  // Fetch Community Posts (Limit to 6 updates)
  const { data, isLoading } = useQuery({
    queryKey: ['community-posts'],
    queryFn: async () => {
      const res = await api.get('/community-posts?page=1&limit=6');
      return res.data;
    },
    staleTime: 30 * 1000
  });

  const posts = data?.posts || [];

  // Create Post Mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData) => {
      const res = await api.post('/community-posts', postData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Status shared successfully!');
      setNewContent('');
      setNewCategory('general');
      setNewAnonymous(false);
      setEditingPostId(null);
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to share status');
    }
  });

  // Edit Post Mutation
  const editPostMutation = useMutation({
    mutationFn: async ({ postId, postData }) => {
      const res = await api.put(`/community-posts/${postId}`, postData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Post updated successfully!');
      setNewContent('');
      setNewCategory('general');
      setNewAnonymous(false);
      setEditingPostId(null);
      setIsModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update post');
    }
  });

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    
    if (editingPostId) {
      editPostMutation.mutate({ 
        postId: editingPostId, 
        postData: { content: newContent, category: newCategory, anonymous: newAnonymous } 
      });
    } else {
      createPostMutation.mutate({ content: newContent, category: newCategory, anonymous: newAnonymous });
    }
  };

  const handleQuickStatusSubmit = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to share your status');
      return;
    }
    if (!quickStatusText.trim()) return;
    createPostMutation.mutate({ content: quickStatusText, category: 'general', anonymous: quickAnonymous }, {
      onSuccess: () => {
        setQuickStatusText('');
        setQuickAnonymous(false);
      }
    });
  };

  // Toggle Like Mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async (postId) => {
      const res = await api.post(`/community-posts/${postId}/like`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
    },
    onError: () => {
      toast.error('Failed to update like status');
    }
  });

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }) => {
      const res = await api.post(`/community-posts/${postId}/comments`, { content });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      setCommentInputs(prev => ({ ...prev, [variables.postId]: '' }));
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    }
  });

  const handleAddComment = (e, postId) => {
    e.preventDefault();
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;
    addCommentMutation.mutate({ postId, content: commentText });
  };

  // Delete Post Mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId) => {
      const res = await api.delete(`/community-posts/${postId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Post deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete post');
    }
  });

  // Delete Comment Mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async ({ postId, commentId }) => {
      const res = await api.delete(`/community-posts/${postId}/comments/${commentId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-posts'] });
      toast.success('Comment deleted');
    },
    onError: () => {
      toast.error('Failed to delete comment');
    }
  });

  const populatedCards = posts.map((p, idx) => {
    const initials = p.author?.name === 'Community Member' ? 'CM' : (p.author?.name?.charAt(0).toUpperCase() || '?');
    
    const noteColors = [
      { bg: 'bg-[#FEF9C3]', border: 'border-[#FEF08A]', text: 'text-amber-950', secondary: 'text-amber-700/80', borderTop: 'border-t-black/10' }, // yellow
      { bg: 'bg-[#DBEAFE]', border: 'border-[#BFDBFE]', text: 'text-blue-950', secondary: 'text-blue-700/80', borderTop: 'border-t-black/10' }, // blue
      { bg: 'bg-[#DCFCE7]', border: 'border-[#BBF7D0]', text: 'text-emerald-950', secondary: 'text-emerald-700/80', borderTop: 'border-t-black/10' }, // green
      { bg: 'bg-[#FFE4E6]', border: 'border-[#FECDD3]', text: 'text-rose-950', secondary: 'text-rose-700/80', borderTop: 'border-t-black/10' }, // rose
      { bg: 'bg-[#F3E8FF]', border: 'border-[#E9D5FF]', text: 'text-purple-950', secondary: 'text-purple-700/80', borderTop: 'border-t-black/10' }, // purple
      { bg: 'bg-[#FFEDD5]', border: 'border-[#FED7AA]', text: 'text-orange-950', secondary: 'text-orange-700/80', borderTop: 'border-t-black/10' }  // orange
    ];
    const color = noteColors[idx % noteColors.length];
    
    const rotateClasses = [
      '-rotate-3',
      'rotate-6 translate-x-4',
      '-rotate-2 -translate-x-2',
      'rotate-3',
      '-rotate-6 -translate-x-4',
      'rotate-2 translate-x-2'
    ];
    
    const rotateClass = rotateClasses[idx % rotateClasses.length];
    const showDelete = !!p.isMyPost;
    
    return {
      id: p._id,
      authorName: p.author?.name || 'Community Member',
      authorTitle: p.category === 'interview' ? 'Interview Exp' : 'General Update',
      avatar: p.author?.avatar,
      color,
      initials,
      content: p.content,
      likes: p.likes.length,
      commentsCount: p.comments.length,
      rotateClass,
      rawPost: p,
      showDelete,
      createdAt: p.createdAt
    };
  });

  const handleCardClick = (card) => {
    if (expandedCardId === card.id) {
      setExpandedCardId(null);
    } else {
      setExpandedCardId(card.id);
    }
  };

  const renderCard = (card, idx) => {
    return (
      <div 
        key={card.id || idx}
        onClick={() => handleCardClick(card)}
        className={`p-4 pt-5 rounded-2xl border border-t-[8px] shadow-xs transition-all duration-500 ease-in-out transform cursor-pointer ${
          expandedCardId === card.id
            ? 'rotate-0 scale-[1.02] z-30 shadow-md'
            : `${card.rotateClass}`
        } ${card.color.borderTop} ${card.color.bg} ${card.color.border} ${card.color.text}`}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            {card.avatar ? (
              <img src={card.avatar} alt={card.authorName} className="w-8 h-8 rounded-full object-cover border border-white/20" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/40 border border-white/10 flex items-center justify-center font-bold text-xs">
                {card.initials}
              </div>
            )}
            <div>
              <p className="text-xs font-bold leading-none">{card.authorName}</p>
              <p className={`text-[9px] font-bold mt-0.5 ${card.color.secondary}`}>{card.authorTitle}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            {card.createdAt && (
              <>
                <span className={`text-[9px] font-semibold ${card.color.secondary} opacity-80`}>
                  {new Date(card.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className={`text-[9px] font-semibold ${card.color.secondary} opacity-70`}>
                  {new Date(card.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                </span>
              </>
            )}
          </div>

          {card.showDelete && (
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const raw = card.rawPost;
                  setNewContent(raw.content);
                  setNewCategory(raw.category);
                  setNewAnonymous(raw.anonymous || false);
                  setEditingPostId(raw._id);
                  setIsModalOpen(true);
                }}
                className="p-1 opacity-60 hover:opacity-100 rounded hover:bg-black/5 transition-colors cursor-pointer"
                title="Edit Post"
              >
                <Pencil size={11} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this community post?')) {
                    deletePostMutation.mutate(card.id);
                  }
                }}
                className="p-1 opacity-60 hover:opacity-100 rounded hover:bg-black/5 transition-colors cursor-pointer"
                title="Delete Post"
              >
                <Trash2 size={11} />
              </button>
            </div>
          )}
        </div>
        <p className={`text-[11px] leading-relaxed font-medium opacity-90 whitespace-pre-wrap ${expandedCardId === card.id ? '' : 'line-clamp-3'}`}>
          {card.content}
        </p>

        <div className={`flex items-center justify-between mt-3 pt-2.5 border-t border-black/5 text-[9.5px] ${card.color.secondary} font-bold`}>
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  toast.error('Please login to like posts');
                  return;
                }
                toggleLikeMutation.mutate(card.id);
              }}
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
            >
              <Heart size={10} className={`text-rose-500 ${user && card.rawPost.likes?.includes(user._id) ? 'fill-rose-500' : ''}`} />
              <span>{card.likes}</span>
            </button>
            <div className="flex items-center gap-1">
              <MessageSquare size={10} />
              <span>{card.commentsCount || 0}</span>
            </div>
          </div>
          <span className="hover:underline">{expandedCardId === card.id ? 'Show less' : 'Read more...'}</span>
        </div>

        {expandedCardId === card.id && (
          <div className="mt-4 pt-4 border-t border-black/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {card.rawPost.comments?.length > 0 ? (
                card.rawPost.comments.map(comment => {
                  const isCommentAuthor = user && comment.author?._id?.toString() === user._id.toString();
                  const isPostAuthor = user && card.rawPost.author?._id?.toString() === user._id.toString();
                  const isAdmin = user && user.role === 'admin';
                  const showCommentDelete = isCommentAuthor || isPostAuthor || isAdmin;

                  return (
                    <div key={comment._id} className="flex items-start justify-between gap-1.5 bg-white/40 p-2 rounded-xl border border-black/5">
                      <div className="flex gap-2">
                        {comment.author?.avatar ? (
                          <img src={comment.author.avatar} alt={comment.author.name} className="w-5 h-5 rounded-md object-cover" />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-white/60 flex items-center justify-center font-bold text-[9px]">
                            {comment.author?.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h6 className="text-[9px] font-bold leading-none">{comment.author?.name}</h6>
                          <p className="text-[10px] mt-0.5 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>

                      {showCommentDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this comment?')) {
                              deleteCommentMutation.mutate({ postId: card.id, commentId: comment._id });
                            }
                          }}
                          className="text-red-500 opacity-60 hover:opacity-100 p-0.5 cursor-pointer"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-[10px] opacity-60 italic text-center py-2">No comments yet. Start the discussion!</p>
              )}
            </div>

            {user ? (
              <form
                onSubmit={(e) => {
                  e.stopPropagation();
                  handleAddComment(e, card.id);
                }}
                onClick={(e) => e.stopPropagation()}
                className="flex gap-1.5"
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInputs[card.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({ ...prev, [card.id]: e.target.value }))}
                  className="flex-1 bg-white/60 border border-black/10 rounded-lg px-2.5 py-1 text-[10px] outline-hidden focus:border-black/25 placeholder-black/40 text-black font-medium"
                />
                <button
                  type="submit"
                  disabled={addCommentMutation.isPending}
                  className="bg-gray-900 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                >
                  <Send size={9} />
                </button>
              </form>
            ) : (
              <p className="text-[9px] opacity-65 italic text-center">Login to comment</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white pb-16">
      
      {/* Dynamic Buy-Me-a-Coffee Style Hero Template */}
      <div className="relative bg-white pt-6 pb-32 px-4 sm:px-6 lg:px-8">
        
        {/* Left Floating Cards Group */}
        <div className="hidden xl:block absolute left-4 top-12 w-80 space-y-6 select-none opacity-85">
          {populatedCards.slice(0, 2).map((card, idx) => renderCard(card, idx))}
        </div>

        {/* Right Floating Cards Group */}
        <div className="hidden xl:block absolute right-4 top-12 w-80 space-y-6 select-none opacity-85">
          {populatedCards.slice(2, 4).map((card, idx) => renderCard(card, idx))}
        </div>

        {/* Central Hero Block */}
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight whitespace-nowrap">
            Share your <span className="text-orange-500">career</span> & <span className="text-[#FFC436]">job hunting</span> journey
          </h1>

          {/* Quick status field & button */}
          <div className="mt-8 max-w-lg mx-auto bg-[#fafbfc] border border-gray-100 p-4.5 rounded-2xl shadow-xs text-left">
            <form onSubmit={handleQuickStatusSubmit} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="What's your job hunting status today?"
                  value={quickStatusText}
                  onChange={(e) => setQuickStatusText(e.target.value)}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-hidden focus:border-gray-400 focus:ring-1 focus:ring-gray-300/10 font-medium placeholder-gray-400"
                />
                <button
                  type="submit"
                  disabled={createPostMutation.isPending || !quickStatusText.trim()}
                  className="bg-gray-900 text-white px-5 py-2.5 rounded-xl hover:bg-gray-800 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Share
                </button>
              </div>
              <div className="flex items-center gap-1.5 px-1">
                <input
                  type="checkbox"
                  id="quick-anon"
                  checked={quickAnonymous}
                  onChange={(e) => setQuickAnonymous(e.target.checked)}
                  className="w-3.5 h-3.5 text-gray-900 border-gray-300 rounded focus:ring-gray-900 accent-gray-900 cursor-pointer"
                />
                <label htmlFor="quick-anon" className="text-[10px] text-gray-500 font-bold select-none cursor-pointer">
                  Post anonymously as Community Member
                </label>
              </div>
            </form>

            <div className="mt-4 pt-3.5 border-t border-gray-100/80 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  if (!user) {
                    toast.error('Please login to share experiences');
                    return;
                  }
                  setNewContent('');
                  setNewCategory('interview');
                  setNewAnonymous(false);
                  setEditingPostId(null);
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 bg-[#FFD93D] hover:bg-[#F4CE26] text-gray-900 font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus size={13} /> Add Job Hunting Experience
              </button>
            </div>
            </div>

            {/* Mobile/Tablet Card Grid (xl:hidden) */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6 xl:hidden text-left max-w-2xl mx-auto">
              {isLoading ? (
                <div className="space-y-4 animate-pulse col-span-full">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100" />
                        <div className="space-y-1 flex-1">
                          <div className="h-3 bg-gray-100 rounded w-1/3" />
                          <div className="h-2 bg-gray-100 rounded w-1/5" />
                        </div>
                      </div>
                      <div className="h-3 bg-gray-100 rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : populatedCards.length > 0 ? (
                populatedCards.map((card, idx) => renderCard(card, idx))
              ) : (
                <div className="col-span-full text-center py-8 text-xs text-gray-400 font-medium">
                  No updates found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remaining Cards Grid (5th card onwards) - Desktop 3-col grid */}
        {populatedCards.length > 4 && (
          <div className="hidden xl:block mt-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-3 gap-6">
              {populatedCards.slice(4).map((card, idx) => renderCard(card, idx))}
            </div>
          </div>
        )}

        {/* Mobile/Tablet Card Grid (xl:hidden) - show all cards */}

      {/* New Post Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-base text-gray-900"></h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreatePost} className="p-5 space-y-4">
              {/* Category selector */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCategory('interview')}
                    className={`py-2 text-center text-xs font-bold border rounded-xl transition-all ${
                      newCategory === 'interview'
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    Interview Exp
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCategory('general')}
                    className={`py-2 text-center text-xs font-bold border rounded-xl transition-all ${
                      newCategory === 'general'
                        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    General
                  </button>
                </div>
              </div>

              {/* Text Area Content */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">What's on your mind?</label>
                <textarea
                  required
                  placeholder="Share a status update, interview question, or daily job hunting experience..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-xs outline-hidden focus:border-gray-400 focus:ring-1 focus:ring-gray-300/10 font-medium resize-none placeholder-gray-400"
                />
              </div>

              {/* Anonymous Option */}
              <div className="flex items-center gap-1.5 px-1">
                <input
                  type="checkbox"
                  id="modal-anon"
                  checked={newAnonymous}
                  onChange={(e) => setNewAnonymous(e.target.checked)}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900 accent-gray-900 cursor-pointer"
                />
                <label htmlFor="modal-anon" className="text-xs text-gray-500 font-bold select-none cursor-pointer">
                  Post anonymously as Community Member
                </label>
              </div>

              {/* Submit CTA */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingPostId(null); }}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPostMutation.isPending || editPostMutation.isPending || !newContent.trim()}
                  className="px-5 py-2 bg-[#FFD93D] hover:bg-[#F4CE26] disabled:opacity-50 text-gray-900 font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  {createPostMutation.isPending || editPostMutation.isPending ? 'Saving...' : editingPostId ? 'Save Changes' : 'Share Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
    </div>
  );
}
