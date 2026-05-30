const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const { cloudinary } = require('../middleware/upload');

const PAGE_SIZE = 12;

exports.getProjects = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const search = req.query.search || '';
    const tag = req.query.tag || '';
    const category = req.query.category || '';

    const filter = { status: 'approved' };
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (tag) filter.techTags = { $in: [tag] };
    if (category) filter.category = category;

    const total = await Project.countDocuments(filter);
    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    res.json({ projects, total, page, pages: Math.ceil(total / PAGE_SIZE) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar phone linkedinUrl githubUrl leetcodeUrl');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('name avatar linkedinUrl githubUrl leetcodeUrl phone email');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const projects = await Project.find({ owner: req.params.userId, status: 'approved' })
      .sort({ createdAt: -1 });
    res.json({ user, projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, liveUrl, appType, category, techTags, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible } = req.body;
    if (!title || !description || !liveUrl)
      return res.status(400).json({ message: 'Title, description, and live URL are required' });

    const files = req.files || {};
    const bannerImage = files.banner?.[0]?.path || '';
    const screenshots = (files.screenshots || []).map(f => f.path);

    const tags = techTags
      ? (Array.isArray(techTags) ? techTags : techTags.split(',').map(t => t.trim()).filter(Boolean))
      : [];

    const parsedGithubUrls = githubUrls
      ? (Array.isArray(githubUrls) ? githubUrls : [githubUrls]).map(u => u.trim()).filter(Boolean)
      : [];

    const project = await Project.create({
      title, description, liveUrl, bannerImage, screenshots,
      appType: appType || 'web',
      category: category || '',
      techTags: tags,
      contactEmail: contactEmail || '',
      contactPhone: contactPhone || '',
      linkedinUrl: linkedinUrl || '',
      githubUrls: parsedGithubUrls,
      githubVisible: githubVisible !== 'false',
      owner: req.user._id,
    });

    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const { title, description, liveUrl, appType, category, techTags, removeScreenshots, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible, resubmit } = req.body;
    const files = req.files || {};

    if (title) project.title = title;
    if (description) project.description = description;
    if (liveUrl) project.liveUrl = liveUrl;
    if (appType) project.appType = appType;
    if (category !== undefined) project.category = category;
    if (techTags !== undefined) {
      project.techTags = Array.isArray(techTags)
        ? techTags
        : techTags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (contactEmail !== undefined) project.contactEmail = contactEmail;
    if (contactPhone !== undefined) project.contactPhone = contactPhone;
    if (linkedinUrl !== undefined) project.linkedinUrl = linkedinUrl;
    if (githubUrls !== undefined) {
      project.githubUrls = (Array.isArray(githubUrls) ? githubUrls : [githubUrls]).map(u => u.trim()).filter(Boolean);
    }
    if (githubVisible !== undefined) project.githubVisible = githubVisible !== 'false';
    if (resubmit === 'true') {
      project.status = 'pending';
      project.adminNote = '';
    }

    if (files.banner?.[0]) {
      if (project.bannerImage) {
        const pid = project.bannerImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
      }
      project.bannerImage = files.banner[0].path;
    }

    if (removeScreenshots) {
      const toRemove = Array.isArray(removeScreenshots) ? removeScreenshots : [removeScreenshots];
      for (const url of toRemove) {
        const pid = url.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
      }
      project.screenshots = project.screenshots.filter(s => !toRemove.includes(s));
    }

    if (files.screenshots?.length) {
      project.screenshots = [...project.screenshots, ...files.screenshots.map(f => f.path)];
    }

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const uid = req.user._id.toString();
    const idx = project.likes.findIndex(l => l.toString() === uid);
    if (idx >= 0) project.likes.splice(idx, 1);
    else project.likes.push(req.user._id);
    await project.save();
    res.json({ likes: project.likes.length, liked: idx < 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.rateProject = async (req, res) => {
  try {
    const value = parseInt(req.body.value);
    if (!value || value < 1 || value > 5)
      return res.status(400).json({ message: 'Rating must be 1–5' });
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const idx = project.ratings.findIndex(r => r.user.toString() === req.user._id.toString());
    if (idx >= 0) project.ratings[idx].value = value;
    else project.ratings.push({ user: req.user._id, value });
    await project.save();
    const avg = project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length;
    res.json({ avg: Math.round(avg * 10) / 10, count: project.ratings.length, userRating: value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ project: req.params.id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Comment text required' });
    const comment = await Comment.create({ project: req.params.id, user: req.user._id, text });
    await comment.populate('user', 'name avatar');
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Not found' });
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isAdmin)
      return res.status(403).json({ message: 'Forbidden' });
    await comment.deleteOne();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const images = [project.bannerImage, ...project.screenshots].filter(Boolean);
    for (const url of images) {
      const pid = url.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`sharemyapp/${pid}`).catch(() => {});
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
