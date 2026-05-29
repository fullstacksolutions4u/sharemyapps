const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'pending' })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProjectStatus = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status))
      return res.status(400).json({ message: 'Invalid status' });

    const project = await Project.findById(req.params.id).populate('owner', 'name email avatar');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.status = status;
    if (adminNote !== undefined) project.adminNote = adminNote || '';
    await project.save();

    // Create notification for the project owner
    if (status === 'approved') {
      await Notification.create({
        user: project.owner._id,
        type: 'approved',
        title: 'Project Approved!',
        message: `Your project "${project.title}" has been approved and is now live.`,
        project: project._id,
      });
    } else if (status === 'rejected') {
      await Notification.create({
        user: project.owner._id,
        type: 'rejected',
        title: 'Project Needs Changes',
        message: adminNote
          ? `Your project "${project.title}" was not approved. Admin note: ${adminNote}`
          : `Your project "${project.title}" was not approved. Please review and resubmit.`,
        project: project._id,
      });
    }

    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminUpdateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const { title, description, liveUrl, appType, category, techTags, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible } = req.body;

    if (title) project.title = title;
    if (description) project.description = description;
    if (liveUrl) project.liveUrl = liveUrl;
    if (appType) project.appType = appType;
    if (category !== undefined) project.category = category;
    if (techTags !== undefined) {
      project.techTags = Array.isArray(techTags) ? techTags : techTags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (contactEmail !== undefined) project.contactEmail = contactEmail;
    if (contactPhone !== undefined) project.contactPhone = contactPhone;
    if (linkedinUrl !== undefined) project.linkedinUrl = linkedinUrl;
    if (githubUrls !== undefined) {
      project.githubUrls = (Array.isArray(githubUrls) ? githubUrls : [githubUrls]).map(u => u.trim()).filter(Boolean);
    }
    if (githubVisible !== undefined) project.githubVisible = githubVisible !== 'false' && githubVisible !== false;

    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, users] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
    ]);
    res.json({ total, pending, approved, rejected, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
