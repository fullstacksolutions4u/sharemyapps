const Project = require('../models/Project');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { cloudinary, deleteImage } = require('../middleware/upload');
const { sendCollaboratorAddedEmail } = require('../utils/email');
const {
  canSeeUser,
  canBrowseAllHidden,
  getExcludedHiddenUserIds,
  getPrivatePairPartnerId,
  isPrivatePairUser,
} = require('../utils/visibility');

async function notifyCollaborators(collaboratorIds, addedBy, project) {
  if (!collaboratorIds.length) return;
  const collaborators = await User.find({ _id: { $in: collaboratorIds } }).select('name email').lean();
  await Promise.allSettled(collaborators.map(async (collab) => {
    await Notification.create({
      user: collab._id,
      fromUser: addedBy._id,
      type: 'collaborator_added',
      title: 'You were added as a collaborator',
      message: `${addedBy.name} added you as a collaborator on "${project.title}".`,
      project: project._id,
    });
    await sendCollaboratorAddedEmail({
      to: collab.email,
      name: collab.name,
      addedByName: addedBy.name,
      projectTitle: project.title,
      projectId: project._id,
    }).catch(() => {});
  }));
}

const PAGE_SIZE = 16;

const SCORE_PAGE1 = 12; // score-sorted slots on page 1 (rows 1–3)
const NEWLY_ADDED = 4;  // newest slots on page 1 (row 4)

const ownerLookupStages = [
  {
    $lookup: {
      from: 'users',
      localField: 'owner',
      foreignField: '_id',
      as: 'owner',
      pipeline: [{ $project: { name: 1, email: 1, avatar: 1, badge: 1, premiumServices: 1 } }],
    },
  },
  { $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: 'projects',
      let: { ownerId: '$owner._id' },
      pipeline: [
        { $match: { $expr: { $and: [{ $eq: ['$owner', '$$ownerId'] }, { $eq: ['$status', 'approved'] }] } } },
        { $count: 'n' },
      ],
      as: '_ownerProjects',
    },
  },
  { $addFields: { 'owner.projectCount': { $ifNull: [{ $arrayElemAt: ['$_ownerProjects.n', 0] }, 0] } } },
  { $project: { _ownerProjects: 0 } },
  {
    $lookup: {
      from: 'users',
      let: { collabIds: { $ifNull: ['$collaborators', []] } },
      pipeline: [
        { $match: { $expr: { $in: ['$_id', '$$collabIds'] } } },
        { $project: { name: 1, avatar: 1 } },
      ],
      as: 'collaborators',
    },
  },
];

exports.getFeaturedProjects = async (req, res) => {
  try {
    const hiddenIds = await getExcludedHiddenUserIds(req.user, User);
    const projects = await Project.aggregate([
      { $match: { featured: true, status: 'approved', hidden: { $ne: true }, owner: { $nin: hiddenIds } } },
      { $sort: { updatedAt: -1 } },
      ...ownerLookupStages,
    ]);
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const popularityPipeline = (filter, skip, limit) => [
  { $match: filter },
  {
    $addFields: {
      likesCount: { $size: '$likes' },
      avgRating: {
        $cond: [{ $gt: [{ $size: '$ratings' }, 0] }, { $avg: '$ratings.value' }, 0],
      },
    },
  },
  { $addFields: { popularityScore: { $add: ['$likesCount', { $multiply: ['$avgRating', 2] }] } } },
  { $sort: { featured: -1, popularityScore: -1, createdAt: -1 } },
  { $skip: skip },
  { $limit: limit },
  ...ownerLookupStages,
];

exports.getProjects = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const search = req.query.search || '';
    const tag = req.query.tag || '';
    const category = req.query.category || '';
    const type = req.query.type || '';

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = { status: 'approved' };
    if (req.user?.role !== 'admin') {
      const hiddenIds = await getExcludedHiddenUserIds(req.user, User);
      filter.owner = { $nin: hiddenIds };
      if (canBrowseAllHidden(req.user)) {
        // legacy hidden viewers: all non-excluded owners (incl. their hidden projects)
      } else if (isPrivatePairUser(req.user)) {
        const partnerId = await getPrivatePairPartnerId(req.user, User);
        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { hidden: { $ne: true } },
              ...(partnerId ? [{ owner: partnerId }] : []),
            ],
          },
        ];
      } else {
        filter.hidden = { $ne: true };
      }
    }
    if (safeSearch) filter.$or = [
      { title: { $regex: safeSearch, $options: 'i' } },
      { description: { $regex: safeSearch, $options: 'i' } },
    ];
    if (tag) filter.techTags = { $in: [tag] };
    if (category) {
      if (category === 'Mobile Applications') {
        const mobileConditions = [
          { appType: 'mobile' },
          { category: { $in: ['Mobile Applications', 'Mobile Application for Client'] } },
        ];
        filter.$or = filter.$or
          ? [{ $and: [{ $or: filter.$or }] }, ...mobileConditions]
          : mobileConditions;
      } else {
        filter.category = category;
      }
    }
    if (type) filter.appType = type;

    const total = await Project.countDocuments(filter);
    // pages: page 1 uses SCORE_PAGE1 score slots, rest use PAGE_SIZE each
    const pages = total <= SCORE_PAGE1
      ? 1
      : 1 + Math.ceil((total - SCORE_PAGE1) / PAGE_SIZE);

    if (page === 1) {
      // Top 8 by score
      const projects = await Project.aggregate(popularityPipeline(filter, 0, SCORE_PAGE1));

      // 4 newest — exclude projects already in the score list
      const scoreIds = projects.map(p => p._id);
      const newlyAdded = await Project.aggregate([
        { $match: { ...filter, _id: { $nin: scoreIds } } },
        { $sort: { createdAt: -1 } },
        { $limit: NEWLY_ADDED },
        ...ownerLookupStages,
      ]);

      return res.json({ projects, newlyAdded, total, page, pages });
    }

    // Page 2+: offset = SCORE_PAGE1 + (page - 2) * PAGE_SIZE
    const skip = SCORE_PAGE1 + (page - 2) * PAGE_SIZE;
    const projects = await Project.aggregate(popularityPipeline(filter, skip, PAGE_SIZE));

    res.json({ projects, newlyAdded: [], total, page, pages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar phone linkedinUrl githubUrl leetcodeUrl followers badge hidden premiumServices')
      .populate('collaborators', 'name avatar badge');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner && !canSeeUser(req.user, project.owner)) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const projectJSON = project.toObject();
    const ownerId = project.owner?._id?.toString();
    const reqUser = req.user;

    const hasAccess = ownerId && reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client' ||
      reqUser._id.toString() === ownerId
    );

    if (projectJSON.owner && !hasAccess) {
      delete projectJSON.owner.email;
      delete projectJSON.owner.phone;
    }

    res.json(projectJSON);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUserProjects = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const user = await User.findById(targetUserId).select('name avatar linkedinUrl githubUrl leetcodeUrl portfolioUrl phone email cvUrl hidden yearsOfExperience joiningAvailability');
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!canSeeUser(req.user, user)) return res.status(404).json({ message: 'User not found' });
    const filter = { owner: targetUserId, status: 'approved' };
    const canSeeHiddenProjects = req.user && (
      req.user.role === 'admin' ||
      String(req.user._id) === String(user._id) ||
      (isPrivatePairUser(req.user) && isPrivatePairUser(user)) ||
      (canBrowseAllHidden(req.user) && !isPrivatePairUser(user))
    );
    if (!canSeeHiddenProjects) {
      filter.hidden = { $ne: true };
    }
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 });

    const reqUser = req.user;
    const hasAccess = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client' ||
      reqUser._id.toString() === targetUserId.toString()
    );

    const userJSON = user.toObject();
    if (!hasAccess) {
      delete userJSON.email;
      delete userJSON.phone;
    }

    res.json({ user: userJSON, projects });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({ owner: req.user._id })
      .populate('collaborators', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, liveUrl, appType, category, techTags, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible, collaborators, forSale, salePrice } = req.body;
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

    const collaboratorIds = collaborators
      ? (Array.isArray(collaborators) ? collaborators : [collaborators]).filter(Boolean)
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
      collaborators: collaboratorIds,
      owner: req.user._id,
      forSale: forSale === 'true' || forSale === true,
      salePrice: (forSale === 'true' || forSale === true) && salePrice ? Number(salePrice) : null,
    });

    if (collaboratorIds.length) {
      notifyCollaborators(collaboratorIds, req.user, project).catch(() => {});
    }

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

    const { title, description, liveUrl, appType, category, techTags, removeScreenshots, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible, resubmit, collaborators, forSale, salePrice } = req.body;
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
    if (forSale !== undefined) {
      project.forSale = forSale === 'true' || forSale === true;
      project.salePrice = project.forSale && salePrice ? Number(salePrice) : null;
    }
    if (collaborators !== undefined) {
      const newIds = (Array.isArray(collaborators) ? collaborators : [collaborators]).filter(Boolean);
      const existingIds = project.collaborators.map(id => id.toString());
      const addedIds = newIds.filter(id => !existingIds.includes(id.toString()));
      project.collaborators = newIds;
      if (addedIds.length) {
        notifyCollaborators(addedIds, req.user, project).catch(() => {});
      }
    }
    if (resubmit === 'true') {
      project.status = 'pending';
      project.adminNote = '';
    }

    if (files.banner?.[0]) {
      if (project.bannerImage) {
        await deleteImage(project.bannerImage);
      }
      project.bannerImage = files.banner[0].path;
    }

    if (removeScreenshots) {
      const toRemove = Array.isArray(removeScreenshots) ? removeScreenshots : [removeScreenshots];
      for (const url of toRemove) {
        await deleteImage(url);
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

exports.recordView = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('owner viewCount');
    if (!project) return res.status(404).json({ message: 'Not found' });
    // don't count the project owner viewing their own project
    if (req.user && project.owner.toString() === req.user._id.toString()) {
      return res.json({ viewCount: project.viewCount });
    }
    if (req.user) {
      // logged-in users count once each: only increments when the user isn't in viewedBy yet
      const updated = await Project.findOneAndUpdate(
        { _id: req.params.id, viewedBy: { $ne: req.user._id } },
        { $addToSet: { viewedBy: req.user._id }, $inc: { viewCount: 1 } },
        { new: true }
      ).select('viewCount');
      return res.json({ viewCount: updated ? updated.viewCount : project.viewCount });
    }
    // guests: deduped per browser session on the client
    await Project.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    res.json({ viewCount: project.viewCount + 1 });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const uid = req.user._id.toString();
    const idx = project.likes.findIndex(l => l.toString() === uid);
    let awardedCoins = 0;
    if (idx >= 0) {
      project.likes.splice(idx, 1);
    } else {
      project.likes.push(req.user._id);
      
      // Check if this is the first like to award coins
      const isFirstLike = !(await Activity.exists({ user: req.user._id, type: 'PROJECT_LIKED', project: project._id }));
      
      // Log feed activity
      await Activity.create({
        user: req.user._id,
        type: 'PROJECT_LIKED',
        project: project._id,
      }).catch(() => {});

      if (isFirstLike && project.owner.toString() !== uid) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: 5 } });
        awardedCoins = 5;
      }

      // notify owner once per user per project (not if they liked their own project)
      if (project.owner.toString() !== uid) {
        const already = await Notification.exists({ user: project.owner, fromUser: req.user._id, type: 'like', project: project._id });
        if (!already) {
          await Notification.create({
            user: project.owner,
            fromUser: req.user._id,
            type: 'like',
            title: 'Someone liked your project',
            message: `Your project "${project.title}" received a new like.`,
            project: project._id,
          });
        }
      }
    }
    await project.save();
    res.json({ likes: project.likes.length, liked: idx < 0, awardedCoins });
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
    const uid = req.user._id.toString();
    const idx = project.ratings.findIndex(r => r.user.toString() === uid);
    const isNew = idx < 0;
    let awardedCoins = 0;

    if (idx >= 0) project.ratings[idx].value = value;
    else {
      project.ratings.push({ user: req.user._id, value });
      
      // Log feed activity only on first rating
      await Activity.create({
        user: req.user._id,
        type: 'PROJECT_RATED',
        project: project._id,
        meta: { rating: value }
      }).catch(() => {});

      if (project.owner.toString() !== uid) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { points: 10 } });
        awardedCoins = 10;
      }
    }
    await project.save();
    // notify owner only on first-time rating, not updates
    if (isNew && project.owner.toString() !== uid) {
      await Notification.create({
        user: project.owner,
        fromUser: req.user._id,
        type: 'rated',
        title: 'Your project received a rating',
        message: `Your project "${project.title}" received a new rating.`,
        project: project._id,
      });
    }
    const avg = project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length;
    res.json({ avg: Math.round(avg * 10) / 10, count: project.ratings.length, userRating: value, awardedCoins });
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
    const project = await Project.findById(req.params.id).select('owner title');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const comment = await Comment.create({ project: req.params.id, user: req.user._id, text });
    await comment.populate('user', 'name avatar');
    
    // Check if this is the first comment to award coins
    const isFirstComment = !(await Activity.exists({ user: req.user._id, type: 'PROJECT_COMMENTED', project: project._id }));

    // Log feed activity
    await Activity.create({
      user: req.user._id,
      type: 'PROJECT_COMMENTED',
      project: project._id,
    }).catch(() => {});

    let awardedCoins = 0;
    if (isFirstComment && project.owner.toString() !== req.user._id.toString()) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { points: 15 } });
      awardedCoins = 15;
    }

    // notify owner, not if they commented on their own project
    if (project.owner.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: project.owner,
        fromUser: req.user._id,
        type: 'commented',
        title: 'New comment on your project',
        message: `Someone left a comment on your project "${project.title}".`,
        project: project._id,
      });
    }
    
    // Convert to object so we can add awardedCoins
    const responseData = comment.toObject();
    responseData.awardedCoins = awardedCoins;

    res.status(201).json(responseData);
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

exports.toggleHidden = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('owner hidden');
    if (!project) return res.status(404).json({ message: 'Not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });
    project.hidden = !project.hidden;
    await project.save();
    res.json({ hidden: project.hidden });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const images = [project.bannerImage, ...project.screenshots].filter(Boolean);
    for (const url of images) {
      await deleteImage(url);
    }

    await project.deleteOne();

    // Also delete any associated activities from the timeline feed
    await Activity.deleteMany({ project: req.params.id });

    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
