const Project = require('../models/Project');
const { cloudinary } = require('../middleware/upload');

const PAGE_SIZE = 12;

exports.getProjects = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const search = req.query.search || '';
    const tag = req.query.tag || '';

    const filter = {};
    if (search) filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
    if (tag) filter.techTags = { $in: [tag] };

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
      .populate('owner', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
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
    const { title, description, liveUrl, techTags } = req.body;
    if (!title || !description || !liveUrl)
      return res.status(400).json({ message: 'Title, description, and live URL are required' });

    const files = req.files || {};
    const bannerImage = files.banner?.[0]?.path || '';
    const screenshots = (files.screenshots || []).map(f => f.path);

    const tags = techTags
      ? (Array.isArray(techTags) ? techTags : techTags.split(',').map(t => t.trim()).filter(Boolean))
      : [];

    const project = await Project.create({
      title, description, liveUrl, bannerImage, screenshots,
      techTags: tags,
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

    const { title, description, liveUrl, techTags, removeScreenshots } = req.body;
    const files = req.files || {};

    if (title) project.title = title;
    if (description) project.description = description;
    if (liveUrl) project.liveUrl = liveUrl;
    if (techTags !== undefined) {
      project.techTags = Array.isArray(techTags)
        ? techTags
        : techTags.split(',').map(t => t.trim()).filter(Boolean);
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
