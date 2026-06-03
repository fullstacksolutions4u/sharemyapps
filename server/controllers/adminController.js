const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendProjectApprovedEmail, sendProjectRejectedEmail } = require('../utils/email');

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
    const { status, page = 1, limit = 12, search = '' } = req.query;
    const filter = status ? { status } : {};
    if (search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    const p = Math.max(1, parseInt(page));
    const l = parseInt(limit);
    const total = await Project.countDocuments(filter);

    let projects;
    if (search.trim()) {
      // When searching, also match by owner name/email via aggregation
      projects = await Project.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
            pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }],
          },
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            ...(status ? { status } : {}),
            $or: [
              { title: { $regex: search.trim(), $options: 'i' } },
              { description: { $regex: search.trim(), $options: 'i' } },
              { 'owner.name': { $regex: search.trim(), $options: 'i' } },
              { 'owner.email': { $regex: search.trim(), $options: 'i' } },
            ],
          },
        },
        { $sort: { createdAt: -1 } },
        { $skip: (p - 1) * l },
        { $limit: l },
      ]);
      // recount with owner join for accuracy
      const countResult = await Project.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner',
            pipeline: [{ $project: { name: 1, email: 1 } }],
          },
        },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            ...(status ? { status } : {}),
            $or: [
              { title: { $regex: search.trim(), $options: 'i' } },
              { description: { $regex: search.trim(), $options: 'i' } },
              { 'owner.name': { $regex: search.trim(), $options: 'i' } },
              { 'owner.email': { $regex: search.trim(), $options: 'i' } },
            ],
          },
        },
        { $count: 'n' },
      ]);
      const searchTotal = countResult[0]?.n || 0;
      return res.json({ projects, total: searchTotal, page: p, pages: Math.ceil(searchTotal / l) || 1 });
    }

    projects = await Project.find(filter)
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l);
    res.json({ projects, total, page: p, pages: Math.ceil(total / l) || 1 });
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

    // Create in-app notification + send email to project owner
    if (status === 'approved') {
      await Notification.create({
        user: project.owner._id,
        type: 'approved',
        title: 'Project Approved!',
        message: adminNote
          ? `Your project "${project.title}" has been approved and is now live. Admin tip: ${adminNote}`
          : `Your project "${project.title}" has been approved and is now live.`,
        project: project._id,
      });
      sendProjectApprovedEmail({
        to: project.owner.email,
        name: project.owner.name,
        projectTitle: project.title,
        projectId: project._id,
        adminNote,
      }).catch(err => console.error('Approval email failed:', err.message));
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
      sendProjectRejectedEmail({
        to: project.owner.email,
        name: project.owner.name,
        projectTitle: project.title,
        projectId: project._id,
        adminNote,
      }).catch(err => console.error('Rejection email failed:', err.message));
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
    const [users, stats] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }),
      Project.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: '$owner',
            projectCount: { $sum: 1 },
            totalLikes: { $sum: { $size: '$likes' } },
            allRatings: { $push: '$ratings' },
          },
        },
        {
          $addFields: {
            flatRatings: {
              $reduce: {
                input: '$allRatings',
                initialValue: [],
                in: { $concatArrays: ['$$value', '$$this'] },
              },
            },
          },
        },
        {
          $addFields: {
            avgRating: {
              $cond: [
                { $gt: [{ $size: '$flatRatings' }, 0] },
                { $round: [{ $avg: '$flatRatings.value' }, 1] },
                0,
              ],
            },
          },
        },
        { $addFields: { ratingCount: { $size: '$flatRatings' } } },
        { $project: { allRatings: 0, flatRatings: 0 } },
      ]),
    ]);

    const statsMap = Object.fromEntries(stats.map(s => [s._id.toString(), s]));
    const result = users.map(u => {
      const s = statsMap[u._id.toString()] || {};
      const projectCount = s.projectCount || 0;
      const totalLikes   = s.totalLikes   || 0;
      const avgRating    = s.avgRating    || 0;
      const ratingCount  = s.ratingCount  || 0;
      return {
        ...u.toObject(),
        projectCount,
        totalLikes,
        avgRating,
        engagementScore: totalLikes * 2 + avgRating * 10 + ratingCount,
      };
    });

    result.sort((a, b) => b.engagementScore - a.engagementScore);

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message }); }
};

exports.getResumes = async (req, res) => {
  try {
    const users = await User.find({ cvUrl: { $ne: '' }, userType: 'developer' })
      .select('name email regNumber avatar cvUrl userType createdAt')
      .sort({ updatedAt: -1 });
    res.json(users);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleFeatured = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.status !== 'approved')
      return res.status(400).json({ message: 'Only approved projects can be featured' });

    if (!project.featured) {
      const count = await Project.countDocuments({ featured: true });
      if (count >= 2) return res.status(400).json({ message: 'Only 2 projects can be featured at a time. Unfeature one first.' });
    }

    project.featured = !project.featured;
    await project.save();
    res.json({ featured: project.featured });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.adminToggleHidden = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    project.hidden = !project.hidden;
    await project.save();
    res.json({ hidden: project.hidden });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleUserHidden = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.hidden = !user.hidden;
    await user.save();
    res.json({ hidden: user.hidden });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const allowed = [
      'name', 'phone',
      'linkedinUrl', 'githubUrl', 'leetcodeUrl', 'portfolioUrl', 'cvUrl',
      'companyName', 'companyWebsite', 'industry', 'requirements',
      'badge', 'hidden', 'userType',
    ];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (req.body.designations !== undefined) {
      update.designations = (Array.isArray(req.body.designations) ? req.body.designations : [req.body.designations])
        .map(d => d.trim()).filter(Boolean);
    }
    if (update.badge && !['new_member', 'active', 'top', 'champion'].includes(update.badge))
      return res.status(400).json({ message: 'Invalid badge value' });
    if (update.userType && !['developer', 'client'].includes(update.userType))
      return res.status(400).json({ message: 'Invalid userType value' });

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toPublicJSON());
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setDesignation = async (req, res) => {
  try {
    const raw = req.body.designations ?? req.body.designation;
    const designations = (Array.isArray(raw) ? raw : [raw])
      .map(d => String(d).trim()).filter(Boolean);
    const user = await User.findByIdAndUpdate(req.params.id, { designations }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ designations: user.designations });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setBadge = async (req, res) => {
  try {
    const { badge } = req.body;
    if (!['new_member', 'active', 'top', 'champion'].includes(badge)) {
      return res.status(400).json({ message: 'Invalid badge value' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { badge }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.setResumeData = async (req, res) => {
  try {
    const { resumeData } = req.body;
    if (resumeData !== null && typeof resumeData !== 'object') {
      return res.status(400).json({ message: 'resumeData must be a JSON object or null' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { resumeData: resumeData ?? null },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ resumeData: user.resumeData });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isDeleted) return res.status(400).json({ message: 'User is already deleted' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete admin accounts' });
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, users, developers, clients] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ userType: { $ne: 'client' } }),
      User.countDocuments({ userType: 'client' }),
    ]);
    res.json({ total, pending, approved, rejected, users, developers, clients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
