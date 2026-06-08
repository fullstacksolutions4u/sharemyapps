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
    const p = Math.max(1, parseInt(page));
    const l = parseInt(limit);
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (safeSearch) {
      const searchMatch = {
        ...(status ? { status } : {}),
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { 'owner.name': { $regex: safeSearch, $options: 'i' } },
          { 'owner.email': { $regex: safeSearch, $options: 'i' } },
        ],
      };
      const [result] = await Project.aggregate([
        { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'owner', pipeline: [{ $project: { name: 1, email: 1, avatar: 1 } }] } },
        { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
        { $match: searchMatch },
        { $sort: { createdAt: -1 } },
        { $facet: {
          projects: [{ $skip: (p - 1) * l }, { $limit: l }],
          total: [{ $count: 'n' }],
        }},
      ]);
      const searchTotal = result?.total[0]?.n || 0;
      return res.json({ projects: result?.projects || [], total: searchTotal, page: p, pages: Math.ceil(searchTotal / l) || 1 });
    }

    const filter = status ? { status } : {};
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter).populate('owner', 'name email avatar').sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
    ]);
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
    const owner = project.owner;
    if (owner && status === 'approved') {
      await Notification.create({
        user: owner._id,
        type: 'approved',
        title: 'Project Approved!',
        message: adminNote
          ? `Your project "${project.title}" has been approved and is now live. Admin tip: ${adminNote}`
          : `Your project "${project.title}" has been approved and is now live.`,
        project: project._id,
      });
      sendProjectApprovedEmail({
        to: owner.email,
        name: owner.name,
        projectTitle: project.title,
        projectId: project._id,
        adminNote,
      }).catch(err => console.error('Approval email failed:', err.message));
    } else if (owner && status === 'rejected') {
      await Notification.create({
        user: owner._id,
        type: 'rejected',
        title: 'Project Needs Changes',
        message: adminNote
          ? `Your project "${project.title}" was not approved. Admin note: ${adminNote}`
          : `Your project "${project.title}" was not approved. Please review and resubmit.`,
        project: project._id,
      });
      sendProjectRejectedEmail({
        to: owner.email,
        name: owner.name,
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

exports.setAdminNote = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { adminNote: String(req.body.note ?? '').trim() },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ adminNote: user.adminNote });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.adminUpdateUser = async (req, res) => {
  try {
    const strFields = [
      'name', 'phone', 'bio',
      'linkedinUrl', 'githubUrl', 'leetcodeUrl', 'portfolioUrl', 'cvUrl',
      'companyName', 'companyWebsite', 'industry', 'requirements',
      'badge', 'userType', 'joiningAvailability', 'place', 'district', 'state', 'country',
      'adminNote',
    ];
    const update = {};
    for (const key of strFields) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (req.body.hidden !== undefined) update.hidden = Boolean(req.body.hidden);
    if (req.body.freelanceAvailable !== undefined) update.freelanceAvailable = Boolean(req.body.freelanceAvailable);
    if (req.body.mentorshipAvailable !== undefined) update.mentorshipAvailable = Boolean(req.body.mentorshipAvailable);

    const toNum = v => (v === '' || v === null || v === undefined) ? null : Number(v);
    if (req.body.freelanceRate !== undefined) update.freelanceRate = toNum(req.body.freelanceRate);
    if (req.body.mentorshipRate !== undefined) update.mentorshipRate = toNum(req.body.mentorshipRate);
    if (req.body.currentSalary !== undefined) update.currentSalary = toNum(req.body.currentSalary);
    if (req.body.expectedSalary !== undefined) update.expectedSalary = toNum(req.body.expectedSalary);

    if (req.body.gender !== undefined)
      update.gender = ['male', 'female', 'other', ''].includes(req.body.gender) ? req.body.gender : '';
    if (req.body.dateOfBirth !== undefined)
      update.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;

    const toArr = (v) => (Array.isArray(v) ? v : [v]).map(s => String(s).trim()).filter(Boolean);
    if (req.body.designations !== undefined) update.designations = toArr(req.body.designations);
    if (req.body.mentorshipTech !== undefined) update.mentorshipTech = toArr(req.body.mentorshipTech);
    if (req.body.preferredLocations !== undefined) update.preferredLocations = toArr(req.body.preferredLocations);
    if (req.body.jobMode !== undefined) update.jobMode = toArr(req.body.jobMode);
    if (req.body.languagePreference !== undefined) update.languagePreference = toArr(req.body.languagePreference);

    if (update.badge && !['new_member', 'active', 'top', 'champion'].includes(update.badge))
      return res.status(400).json({ message: 'Invalid badge value' });
    if (update.userType && !['developer', 'client', 'recruiter', 'mentee', 'mentor'].includes(update.userType))
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

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.resumeData = resumeData ?? null;

    // Sync profile fields from resume — profile value always wins (only fill if empty)
    if (resumeData) {
      const info = resumeData.personalInfo || {};
      const isEmpty = v => !v || (Array.isArray(v) && v.length === 0);

      if (isEmpty(user.place)             && info.place)                          user.place             = info.place;
      if (isEmpty(user.district)          && info.district)                       user.district          = info.district;
      if (isEmpty(user.state)             && info.state)                          user.state             = info.state;
      if (isEmpty(user.country)           && info.country)                        user.country           = info.country;
      if (isEmpty(user.linkedinUrl)       && info.linkedin)                       user.linkedinUrl       = info.linkedin;
      if (isEmpty(user.githubUrl)         && info.github)                         user.githubUrl         = info.github;
      if (isEmpty(user.portfolioUrl)      && info.portfolio)                      user.portfolioUrl      = info.portfolio;
      if (isEmpty(user.bio)               && info.summary)                        user.bio               = info.summary;
      if (isEmpty(user.preferredLocations) && resumeData.preferredLocations?.length) user.preferredLocations = resumeData.preferredLocations;
      if (isEmpty(user.jobMode)           && resumeData.jobMode?.length)          user.jobMode           = resumeData.jobMode;
      if (isEmpty(user.yearsOfExperience) && resumeData.totalExperienceYears)     user.yearsOfExperience = String(resumeData.totalExperienceYears);
      if (isEmpty(user.joiningAvailability) && resumeData.noticePeriod)           user.joiningAvailability = resumeData.noticePeriod;
      if (!user.expectedSalary            && resumeData.expectedSalary)           user.expectedSalary    = Number(resumeData.expectedSalary) || null;
      if (!user.currentSalary             && resumeData.currentSalary)            user.currentSalary     = Number(resumeData.currentSalary) || null;
    }

    await user.save();
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

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json({ message: 'Project deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [total, pending, approved, rejected, users, developers, clients, forSale] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ userType: { $ne: 'client' } }),
      User.countDocuments({ userType: 'client' }),
      Project.countDocuments({ forSale: true, status: 'approved' }),
    ]);
    res.json({ total, pending, approved, rejected, users, developers, clients, forSale });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserGrowth = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const map = Object.fromEntries(rows.map(r => [r._id, r.count]));
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      result.push({ date: key, count: map[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
