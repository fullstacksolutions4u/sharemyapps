const projectRepo = require('../repositories/project.repository');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const { deleteImage } = require('../middleware/upload');
const { sendCollaboratorAddedEmail } = require('../utils/email');
const { sanitizeText, sanitizeRichText, sanitizeUrl, sanitizeTextArray, sanitizeUrlArray } = require('../utils/sanitize');
const {
  canSeeUser,
  canBrowseAllHidden,
  getExcludedHiddenUserIds,
  getPrivatePairPartnerId,
  isPrivatePairUser,
} = require('../utils/visibility');

const PAGE_SIZE = 16;
const SCORE_PAGE1 = 12;
const NEWLY_ADDED = 4;

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

class ProjectService {
  async notifyCollaborators(collaboratorIds, addedBy, project) {
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

  async getFeaturedProjects(reqUser) {
    const hiddenIds = await getExcludedHiddenUserIds(reqUser, User);
    const pipeline = [
      { $match: { featured: true, status: 'approved', hidden: { $ne: true }, owner: { $nin: hiddenIds } } },
      { $sort: { updatedAt: -1 } },
      ...ownerLookupStages,
    ];
    return await projectRepo.aggregate(pipeline);
  }

  async getProjects(reqUser, queryParams) {
    const page = Math.max(1, parseInt(queryParams.page) || 1);
    const search = queryParams.search || '';
    const tag = queryParams.tag || '';
    const category = queryParams.category || '';
    const type = queryParams.type || '';

    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = { status: 'approved' };
    
    if (reqUser?.role !== 'admin') {
      const hiddenIds = await getExcludedHiddenUserIds(reqUser, User);
      filter.owner = { $nin: hiddenIds };
      if (canBrowseAllHidden(reqUser)) {
        // legacy hidden viewers: all non-excluded owners
      } else if (isPrivatePairUser(reqUser)) {
        const partnerId = await getPrivatePairPartnerId(reqUser, User);
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

    const total = await projectRepo.count(filter);
    const pages = total <= SCORE_PAGE1 ? 1 : 1 + Math.ceil((total - SCORE_PAGE1) / PAGE_SIZE);

    if (page === 1) {
      const projects = await projectRepo.aggregate(popularityPipeline(filter, 0, SCORE_PAGE1));
      const scoreIds = projects.map(p => p._id);
      const newlyAdded = await projectRepo.aggregate([
        { $match: { ...filter, _id: { $nin: scoreIds } } },
        { $sort: { createdAt: -1 } },
        { $limit: NEWLY_ADDED },
        ...ownerLookupStages,
      ]);
      return { projects, newlyAdded, total, page, pages };
    }

    const skip = SCORE_PAGE1 + (page - 2) * PAGE_SIZE;
    const projects = await projectRepo.aggregate(popularityPipeline(filter, skip, PAGE_SIZE));
    return { projects, newlyAdded: [], total, page, pages };
  }

  async getProject(id, reqUser) {
    const project = await projectRepo.findByIdWithPopulate(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }
    if (project.owner && !canSeeUser(reqUser, project.owner)) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }

    const projectJSON = project.toObject();
    const ownerId = project.owner?._id?.toString();
    const hasAccess = ownerId && reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client' ||
      reqUser._id.toString() === ownerId
    );

    if (projectJSON.owner && !hasAccess) {
      delete projectJSON.owner.email;
    }
    return projectJSON;
  }

  async getUserProjects(targetUserId, reqUser) {
    const user = await User.findById(targetUserId).select('name avatar linkedinUrl githubUrl leetcodeUrl portfolioUrl phone email cvUrl hidden yearsOfExperience joiningAvailability');
    if (!user || !canSeeUser(reqUser, user)) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    const filter = { owner: targetUserId, status: 'approved' };
    const canSeeHiddenProjects = reqUser && (
      reqUser.role === 'admin' ||
      String(reqUser._id) === String(user._id) ||
      (isPrivatePairUser(reqUser) && isPrivatePairUser(user)) ||
      (canBrowseAllHidden(reqUser) && !isPrivatePairUser(user))
    );
    if (!canSeeHiddenProjects) {
      filter.hidden = { $ne: true };
    }
    const projects = await projectRepo.findByFilter(filter);
    const hasAccess = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client' ||
      reqUser._id.toString() === targetUserId.toString()
    );

    const userJSON = user.toObject();
    if (!hasAccess) {
      delete userJSON.email;
    }
    return { user: userJSON, projects };
  }

  async getMyProjects(reqUser) {
    return await projectRepo.findByOwner(reqUser._id);
  }

  async createProject(data, files, reqUser) {
    const bannerImage = files.banner?.[0]?.path || '';
    const screenshots = (files.screenshots || []).map(f => f.path);

    const tags = data.techTags
      ? sanitizeTextArray(Array.isArray(data.techTags) ? data.techTags : data.techTags.split(',').map(t => t.trim()).filter(Boolean))
      : [];

    const parsedGithubUrls = data.githubUrls
      ? sanitizeUrlArray((Array.isArray(data.githubUrls) ? data.githubUrls : [data.githubUrls]).filter(Boolean))
      : [];

    const collaboratorIds = data.collaborators
      ? (Array.isArray(data.collaborators) ? data.collaborators : [data.collaborators]).filter(Boolean)
      : [];

    const projectData = {
      title: sanitizeText(data.title),
      description: sanitizeRichText(data.description),
      liveUrl: sanitizeUrl(data.liveUrl),
      bannerImage, screenshots,
      appType: sanitizeText(data.appType) || 'web',
      category: sanitizeText(data.category) || '',
      techTags: tags,
      contactEmail: sanitizeText(data.contactEmail) || '',
      contactPhone: sanitizeText(data.contactPhone) || '',
      linkedinUrl: sanitizeUrl(data.linkedinUrl) || '',
      githubUrls: parsedGithubUrls,
      githubVisible: data.githubVisible !== 'false',
      collaborators: collaboratorIds,
      owner: reqUser._id,
      forSale: data.forSale === 'true' || data.forSale === true,
      salePrice: (data.forSale === 'true' || data.forSale === true) && data.salePrice ? Number(data.salePrice) : null,
    };

    const project = await projectRepo.create(projectData);

    if (collaboratorIds.length) {
      this.notifyCollaborators(collaboratorIds, reqUser, project).catch(() => {});
    }
    return project;
  }

  async updateProject(id, data, files, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Project not found'); err.status = 404; throw err; }
    if (project.owner.toString() !== reqUser._id.toString()) {
      const err = new Error('Forbidden'); err.status = 403; throw err;
    }

    if (data.title) project.title = sanitizeText(data.title);
    if (data.description) project.description = sanitizeRichText(data.description);
    if (data.liveUrl) project.liveUrl = sanitizeUrl(data.liveUrl);
    if (data.appType) project.appType = sanitizeText(data.appType);
    if (data.category !== undefined) project.category = sanitizeText(data.category);
    if (data.techTags !== undefined) {
      const rawTags = Array.isArray(data.techTags) ? data.techTags : data.techTags.split(',').map(t => t.trim()).filter(Boolean);
      project.techTags = sanitizeTextArray(rawTags);
    }
    if (data.contactEmail !== undefined) project.contactEmail = sanitizeText(data.contactEmail);
    if (data.contactPhone !== undefined) project.contactPhone = sanitizeText(data.contactPhone);
    if (data.linkedinUrl !== undefined) project.linkedinUrl = sanitizeUrl(data.linkedinUrl);
    if (data.githubUrls !== undefined) {
      project.githubUrls = sanitizeUrlArray((Array.isArray(data.githubUrls) ? data.githubUrls : [data.githubUrls]).filter(Boolean));
    }
    if (data.githubVisible !== undefined) project.githubVisible = data.githubVisible !== 'false';
    if (data.forSale !== undefined) {
      project.forSale = data.forSale === 'true' || data.forSale === true;
      project.salePrice = project.forSale && data.salePrice ? Number(data.salePrice) : null;
    }
    if (data.collaborators !== undefined) {
      const newIds = (Array.isArray(data.collaborators) ? data.collaborators : [data.collaborators]).filter(Boolean);
      const existingIds = project.collaborators.map(cid => cid.toString());
      const addedIds = newIds.filter(cid => !existingIds.includes(cid.toString()));
      project.collaborators = newIds;
      if (addedIds.length) {
        this.notifyCollaborators(addedIds, reqUser, project).catch(() => {});
      }
    }
    if (data.resubmit === 'true') {
      project.status = 'pending';
      project.adminNote = '';
    }

    if (files.banner?.[0]) {
      if (project.bannerImage) await deleteImage(project.bannerImage);
      project.bannerImage = files.banner[0].path;
    }

    if (data.removeScreenshots) {
      const toRemove = Array.isArray(data.removeScreenshots) ? data.removeScreenshots : [data.removeScreenshots];
      for (const url of toRemove) {
        await deleteImage(url);
      }
      project.screenshots = project.screenshots.filter(s => !toRemove.includes(s));
    }

    if (files.screenshots?.length) {
      project.screenshots = [...project.screenshots, ...files.screenshots.map(f => f.path)];
    }

    await project.save();
    return project;
  }

  async deleteProject(id, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Project not found'); err.status = 404; throw err; }
    if (project.owner.toString() !== reqUser._id.toString()) {
      const err = new Error('Forbidden'); err.status = 403; throw err;
    }

    const images = [project.bannerImage, ...project.screenshots].filter(Boolean);
    for (const url of images) {
      await deleteImage(url);
    }

    await projectRepo.delete(project);
    await Activity.deleteMany({ project: id });
    return { message: 'Project deleted' };
  }

  // Count projects and Showcase projects (were originally directly in routes/projects.js)
  async countProjects() {
    const hiddenOwners = await User.find({ hidden: true }).select('_id').lean();
    const hiddenIds = hiddenOwners.map((u) => u._id);
    return await projectRepo.count({
      status: 'approved',
      hidden: { $ne: true },
      owner: { $nin: hiddenIds },
    });
  }

  async getShowcaseProjects(skip, limit) {
    const hiddenOwners = await User.find({ hidden: true }).select('_id').lean();
    const hiddenIds = hiddenOwners.map((u) => u._id);
    return await projectRepo.findApprovedProjects({
      status: 'approved',
      hidden: { $ne: true },
      owner: { $nin: hiddenIds },
    }, skip, limit);
  }

  // Other operations...
  async toggleLike(id, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Project not found'); err.status = 404; throw err; }
    
    const uid = reqUser._id.toString();
    const idx = project.likes.findIndex(l => l.toString() === uid);
    
    if (idx >= 0) {
      project.likes.splice(idx, 1);
    } else {
      project.likes.push(reqUser._id);
      await Activity.create({ user: reqUser._id, type: 'PROJECT_LIKED', project: project._id }).catch(() => {});

      if (project.owner.toString() !== uid) {
        const already = await Notification.exists({ user: project.owner, fromUser: reqUser._id, type: 'like', project: project._id });
        if (!already) {
          await Notification.create({
            user: project.owner, fromUser: reqUser._id, type: 'like', title: 'Someone liked your project', message: `Your project "${project.title}" received a new like.`, project: project._id,
          });
        }
      }
    }
    await project.save();
    return { likes: project.likes.length, liked: idx < 0 };
  }

  async rateProject(id, value, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Project not found'); err.status = 404; throw err; }
    const uid = reqUser._id.toString();
    const idx = project.ratings.findIndex(r => r.user.toString() === uid);
    const isNew = idx < 0;

    if (idx >= 0) {
      project.ratings[idx].value = value;
    } else {
      project.ratings.push({ user: reqUser._id, value });
      await Activity.create({ user: reqUser._id, type: 'PROJECT_RATED', project: project._id, meta: { rating: value } }).catch(() => {});
    }
    await project.save();

    if (isNew && project.owner.toString() !== uid) {
      await Notification.create({
        user: project.owner, fromUser: reqUser._id, type: 'rated', title: 'Your project received a rating', message: `Your project "${project.title}" received a new rating.`, project: project._id,
      });
    }
    const avg = project.ratings.reduce((s, r) => s + r.value, 0) / project.ratings.length;
    return { avg: Math.round(avg * 10) / 10, count: project.ratings.length, userRating: value };
  }

  async recordView(id, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Not found'); err.status = 404; throw err; }
    
    if (reqUser && project.owner.toString() === reqUser._id.toString()) {
      return { viewCount: project.viewCount };
    }
    const updated = await projectRepo.incrementViews(id, reqUser ? reqUser._id : null);
    return { viewCount: updated ? updated.viewCount : project.viewCount + 1 };
  }

  async getComments(id) {
    return await Comment.find({ project: id }).populate('user', 'name avatar').sort({ createdAt: -1 });
  }

  async addComment(id, text, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Project not found'); err.status = 404; throw err; }
    
    const comment = await Comment.create({ project: id, user: reqUser._id, text });
    await comment.populate('user', 'name avatar');
    
    await Activity.create({ user: reqUser._id, type: 'PROJECT_COMMENTED', project: project._id }).catch(() => {});

    if (project.owner.toString() !== reqUser._id.toString()) {
      await Notification.create({
        user: project.owner, fromUser: reqUser._id, type: 'commented', title: 'New comment on your project', message: `Someone left a comment on your project "${project.title}".`, project: project._id,
      });
    }
    return comment;
  }

  async deleteComment(commentId, reqUser) {
    const comment = await Comment.findById(commentId);
    if (!comment) { const err = new Error('Not found'); err.status = 404; throw err; }
    if (comment.user.toString() !== reqUser._id.toString() && !reqUser.isAdmin) {
      const err = new Error('Forbidden'); err.status = 403; throw err;
    }
    await comment.deleteOne();
    return { message: 'Deleted' };
  }

  async toggleHidden(id, reqUser) {
    const project = await projectRepo.findById(id);
    if (!project) { const err = new Error('Not found'); err.status = 404; throw err; }
    if (project.owner.toString() !== reqUser._id.toString()) {
      const err = new Error('Forbidden'); err.status = 403; throw err;
    }
    project.hidden = !project.hidden;
    await project.save();
    return { hidden: project.hidden };
  }
}

module.exports = new ProjectService();
