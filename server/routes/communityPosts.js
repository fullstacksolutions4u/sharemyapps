const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const CommunityPost = require('../models/CommunityPost');

// Helper to sanitize anonymous posts before returning to client
const sanitizePost = (post, user) => {
  if (!post) return post;
  const p = post.toObject ? post.toObject() : post;
  const isMyPost = user && p.author?._id?.toString() === user._id.toString();
  const isAdmin = user && user.role === 'admin';
  p.isMyPost = !!(isMyPost || isAdmin);

  if (p.anonymous) {
    p.author = {
      _id: 'anonymous',
      name: 'Community Member',
      avatar: '',
      badge: '',
      premiumServices: []
    };
  }
  return p;
};

// GET /api/community-posts — fetch paginated posts, optionally filtered by category / search (optionalAuth for sanitization)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit) || 10), 1000);
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.category && req.query.category !== 'all') {
      query.category = req.query.category;
    }
    if (req.query.search?.trim()) {
      const safeSearch = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.content = { $regex: safeSearch, $options: 'i' };
    }

    const totalCount = await CommunityPost.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    const posts = await CommunityPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name avatar badge premiumServices')
      .populate('comments.author', 'name avatar badge premiumServices')
      .lean();

    const sanitizedPosts = posts.map(p => sanitizePost(p, req.user));

    res.json({
      posts: sanitizedPosts,
      totalPages,
      totalCount,
      currentPage: page
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch community posts' });
  }
});

// POST /api/community-posts — create a new community post (auth required)
router.post('/', protect, async (req, res) => {
  try {
    const { content, category, anonymous } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const validCategories = ['job-hunt', 'interview', 'general'];
    const chosenCategory = validCategories.includes(category) ? category : 'general';

    const newPost = await CommunityPost.create({
      author: req.user._id,
      content: content.trim(),
      category: chosenCategory,
      anonymous: !!anonymous,
      likes: [],
      comments: []
    });

    const Activity = require('../models/Activity');
    await Activity.create({
      user: req.user._id,
      type: 'COMMUNITY_POST_CREATED',
      communityPost: newPost._id
    });

    const populatedPost = await CommunityPost.findById(newPost._id)
      .populate('author', 'name avatar badge premiumServices')
      .lean();

    res.status(201).json(sanitizePost(populatedPost, req.user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to create community post' });
  }
});

// POST /api/community-posts/:id/like — toggle like on a post (auth required)
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const uid = req.user._id.toString();
    const idx = post.likes.findIndex(l => l.toString() === uid);

    let liked = false;
    if (idx >= 0) {
      post.likes.splice(idx, 1);
    } else {
      post.likes.push(req.user._id);
      liked = true;
    }

    await post.save();
    res.json({ likes: post.likes.length, liked });
  } catch (err) {
    res.status(500).json({ message: 'Failed to like community post' });
  }
});

// POST /api/community-posts/:id/comments — add a comment to a post (auth required)
router.post('/:id/comments', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.user._id,
      content: content.trim()
    });

    await post.save();

    const updatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'name avatar badge premiumServices')
      .populate('comments.author', 'name avatar badge premiumServices')
      .lean();

    res.status(201).json(sanitizePost(updatedPost, req.user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// DELETE /api/community-posts/:id/comments/:commentId — delete a comment from a post (auth required)
router.delete('/:id/comments/:commentId', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author, post author, or admin can delete
    const isCommentAuthor = comment.author.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    comment.deleteOne();
    await post.save();

    const updatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'name avatar badge premiumServices')
      .populate('comments.author', 'name avatar badge premiumServices')
      .lean();

    res.json(sanitizePost(updatedPost, req.user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete comment' });
  }
});

// PUT /api/community-posts/:id — update a post (auth required)
router.put('/:id', protect, async (req, res) => {
  try {
    const { content, category, anonymous } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: 'Post content is required' });
    }

    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only post author or admin can edit
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to edit this post' });
    }

    const validCategories = ['job-hunt', 'interview', 'general'];
    const chosenCategory = validCategories.includes(category) ? category : 'general';

    post.content = content.trim();
    post.category = chosenCategory;
    if (anonymous !== undefined) {
      post.anonymous = !!anonymous;
    }

    await post.save();

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'name avatar badge premiumServices')
      .lean();

    res.json(sanitizePost(populatedPost, req.user));
  } catch (err) {
    res.status(500).json({ message: 'Failed to update community post' });
  }
});

// DELETE /api/community-posts/:id — delete a post (auth required)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only post author or admin can delete
    const isPostAuthor = post.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPostAuthor && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    const Activity = require('../models/Activity');
    await Activity.deleteMany({ communityPost: post._id });

    res.json({ success: true, message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete community post' });
  }
});

module.exports = router;
