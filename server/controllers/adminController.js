const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const FreeOffer = require('../models/FreeOffer');
const { sendProjectApprovedEmail, sendProjectRejectedEmail } = require('../utils/email');
const { generateAndUploadThumbnail } = require('../utils/thumbnailGenerator');

exports.getPendingProjects = async (req, res) => {
  try {
    const projects = await Project.find({ status: 'pending' })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
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
        { $lookup: { from: 'users', localField: 'owner', foreignField: '_id', as: 'owner', pipeline: [{ $project: { name: 1, email: 1, avatar: 1, phone: 1, linkedinUrl: 1, githubUrl: 1 } }] } },
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
      Project.find(filter).populate('owner', 'name email avatar phone linkedinUrl githubUrl').sort({ createdAt: -1 }).skip((p - 1) * l).limit(l).lean(),
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

    // Trigger background thumbnail generation if approved and no banner image
    if (status === 'approved' && project.liveUrl && !project.bannerImage) {
      generateAndUploadThumbnail(project.liveUrl).then(async (url) => {
        if (url) {
          project.bannerImage = url;
          await project.save();
        }
      }).catch(err => console.error('Background thumbnail failed:', err.message));
    }

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
      await Activity.create({
        user: owner._id,
        type: 'PROJECT_APPROVED',
        project: project._id,
        createdAt: project.createdAt,
      }).catch(err => console.error('Activity creation failed:', err.message));

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
    await project.populate('owner', 'name email avatar');
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const query = {};
    if (req.query.userType) {
      query.userType = req.query.userType;
    }
    if (req.query.onlyContacted === 'true') {
      const Vacancy = require('../models/Vacancy');
      const vacancies = await Vacancy.find({}, 'applicantStatus');
      const contactedUserIds = new Set();
      vacancies.forEach(v => {
        if (v.applicantStatus) {
          const statusObj = v.applicantStatus instanceof Map ? Object.fromEntries(v.applicantStatus) : v.applicantStatus;
          for (const userId in statusObj) {
            if (statusObj[userId] === 'contacted') {
              contactedUserIds.add(userId);
            }
          }
        }
      });
      query._id = { $in: Array.from(contactedUserIds) };
    }

    const [users, stats] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }),
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
      'yearsOfExperience', 'adminNote',
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

    const isPlaceholderCv = (u) => {
      const c = (u || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return c === 'drive.google.com';
    };
    if (update.cvUrl !== undefined) {
      const existing = await User.findById(req.params.id).select('cvUrl cvWasPlaceholder');
      if (existing && isPlaceholderCv(existing.cvUrl)) update.cvWasPlaceholder = true;
      if (isPlaceholderCv(update.cvUrl)) update.cvWasPlaceholder = true;
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user.toObject());
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
    await Promise.all([
      user.save(),
      FreeOffer.deleteOne({ user: user._id }),
    ]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    // Also delete any associated activities from the timeline feed
    await Activity.deleteMany({ project: req.params.id });

    res.json({ message: 'Project deleted successfully' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [
      total,
      pending,
      approved,
      rejected,
      users,
      developers,
      clients,
      forSale,
      pendingVacancies,
      pendingOffers,
      pendingMentorships
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'approved' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments(),
      User.countDocuments({ userType: { $ne: 'client' } }),
      User.countDocuments({ userType: 'client' }),
      Project.countDocuments({ forSale: true, status: 'approved' }),
      require('../models/Vacancy').countDocuments({ status: 'pending', isViewed: { $ne: true } }),
      FreeOffer.countDocuments({ status: 'pending' }),
      require('../models/MentorshipApplication').countDocuments({ status: 'pending' }),
    ]);
    res.json({
      total,
      pending,
      approved,
      rejected,
      users,
      developers,
      clients,
      forSale,
      pendingVacancies,
      pendingApplicants: pendingOffers + pendingMentorships
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserGrowth = async (req, res) => {
  try {
    const mode = req.query.mode || 'daily';

    if (mode === 'monthly') {
      const months = parseInt(req.query.months) || 12;
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      since.setMonth(since.getMonth() - months + 1);

      const rows = await User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const map = Object.fromEntries(rows.map(r => [r._id, r.count]));
      const result = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(since);
        d.setMonth(since.getMonth() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        result.push({ date: key, count: map[key] || 0 });
      }

      return res.json(result);
    }

    const days = parseInt(req.query.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
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
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      result.push({ date: key, count: map[key] || 0 });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/email/users — lightweight user list for the Email page recipient picker
exports.getEmailRecipients = async (req, res) => {
  try {
    const users = await User.find({
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    })
      .select('name email avatar regNumber userType')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/admin/email/send — send a custom email via Brevo to selected users.
// Accepts either subject+body or a templateId; {{name}} in either is replaced per recipient.
exports.sendCustomEmail = async (req, res) => {
  try {
    const { subject, body, userIds, templateId } = req.body;

    let emailSubject = subject?.trim();
    let emailBody = body?.trim();
    if (templateId) {
      const EmailTemplate = require('../models/EmailTemplate');
      const template = await EmailTemplate.findById(templateId).lean();
      if (!template) return res.status(404).json({ message: 'Email template not found' });
      emailSubject = template.subject;
      emailBody = template.body;
    }

    if (!emailSubject) return res.status(400).json({ message: 'Subject is required' });
    if (!emailBody) return res.status(400).json({ message: 'Body is required' });
    if (!Array.isArray(userIds) || userIds.length === 0)
      return res.status(400).json({ message: 'Select at least one user' });

    const users = await User.find({
      _id: { $in: userIds },
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    }).select('name email').lean();
    if (users.length === 0)
      return res.status(404).json({ message: 'No valid recipients found' });

    const fillName = (text, name) => text.replace(/\{\{\s*name\s*\}\}/gi, name || 'there');

    const { sendAdminCustomEmail } = require('../utils/email');
    let sent = 0;
    const failed = [];
    for (const u of users) {
      try {
        await sendAdminCustomEmail({
          to: u.email,
          name: u.name,
          subject: fillName(emailSubject, u.name),
          body: fillName(emailBody, u.name),
        });
        sent++;
      } catch (err) {
        console.error(`Admin email failed for ${u.email}:`, err.message);
        failed.push(u.email);
      }
    }

    res.json({ sent, failed, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Email templates (reusable on the Email page and in other admin flows) ─────

exports.getEmailTemplates = async (_req, res) => {
  try {
    const EmailTemplate = require('../models/EmailTemplate');
    const templates = await EmailTemplate.find().sort({ updatedAt: -1 }).lean();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Template name is required' });
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!body?.trim()) return res.status(400).json({ message: 'Body is required' });
    const EmailTemplate = require('../models/EmailTemplate');
    const template = await EmailTemplate.create({
      name: name.trim(),
      subject: subject.trim(),
      body: body.trim(),
      createdBy: req.user._id,
    });
    res.status(201).json({ template });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A template with this name already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.updateEmailTemplate = async (req, res) => {
  try {
    const { name, subject, body } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Template name is required' });
    if (!subject?.trim()) return res.status(400).json({ message: 'Subject is required' });
    if (!body?.trim()) return res.status(400).json({ message: 'Body is required' });
    const EmailTemplate = require('../models/EmailTemplate');
    const template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      { name: name.trim(), subject: subject.trim(), body: body.trim() },
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ template });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'A template with this name already exists' });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteEmailTemplate = async (req, res) => {
  try {
    const EmailTemplate = require('../models/EmailTemplate');
    const template = await EmailTemplate.findByIdAndDelete(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/companies — companies derived from users' resumeData work history.
// resumeData is Mixed and its shape varies across users (workExperience[] camelCase,
// legacy experience[] with a duration string, currentCompany / current_company scalars),
// so extraction happens in JS rather than an aggregation pipeline.
exports.getCompanies = async (req, res) => {
  try {
    const users = await User.find({
      resumeData: { $ne: null },
      isDeleted: { $ne: true },
      userType: { $ne: 'client' },
    }).select('name email avatar regNumber designations resumeData').lean();

    const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
    const companies = new Map(); // normalized name -> { name, developers: [] }

    for (const u of users) {
      const rd = (u.resumeData && typeof u.resumeData === 'object') ? u.resumeData : {};
      const entries = [];

      if (Array.isArray(rd.workExperience)) {
        for (const w of rd.workExperience) {
          if (w && typeof w.company === 'string' && w.company.trim()) {
            entries.push({
              company: w.company,
              role: typeof w.role === 'string' ? w.role : '',
              period: [w.startDate, w.current ? 'Present' : w.endDate].filter(Boolean).join(' – '),
              current: !!w.current,
            });
          }
        }
      }

      if (Array.isArray(rd.experience)) {
        for (const w of rd.experience) {
          if (w && typeof w.company === 'string' && w.company.trim()) {
            entries.push({
              company: w.company,
              role: typeof w.role === 'string' ? w.role : '',
              period: typeof w.duration === 'string' ? w.duration : '',
              current: /present|current/i.test(w.duration || ''),
            });
          }
        }
      }

      const cc = rd.currentCompany || rd.current_company;
      if (typeof cc === 'string' && cc.trim() && !entries.some(e => normalize(e.company) === normalize(cc))) {
        entries.push({
          company: cc,
          role: typeof (rd.currentRole || rd.current_role) === 'string' ? (rd.currentRole || rd.current_role) : '',
          period: '',
          current: true,
        });
      }

      for (const e of entries) {
        const name = e.company.trim().replace(/\s+/g, ' ');
        const key = name.toLowerCase();
        if (!companies.has(key)) companies.set(key, { name, developers: [] });
        const company = companies.get(key);

        const userId = String(u._id);
        const stint = { role: e.role, period: e.period, current: e.current };
        const existing = company.developers.find(d => d.userId === userId);
        if (existing) {
          existing.stints.push(stint);
          existing.current = existing.current || e.current;
        } else {
          company.developers.push({
            userId,
            name: u.name,
            email: u.email,
            avatar: u.avatar || null,
            regNumber: u.regNumber || null,
            designations: Array.isArray(u.designations) ? u.designations.filter(Boolean) : [],
            current: e.current,
            stints: [stint],
          });
        }
      }
    }

    const result = [...companies.values()]
      .map(c => ({
        ...c,
        developerCount: c.developers.length,
        currentCount: c.developers.filter(d => d.current).length,
      }))
      .sort((a, b) => b.developerCount - a.developerCount || a.name.localeCompare(b.name));

    res.json({ companies: result, totalCompanies: result.length, usersScanned: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
