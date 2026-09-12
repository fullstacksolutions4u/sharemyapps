const Project = require('../models/Project');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const FreeOffer = require('../models/FreeOffer');
const EmailTemplate = require('../models/EmailTemplate');
const Vacancy = require('../models/Vacancy');
const MentorshipApplication = require('../models/MentorshipApplication');

class AdminRepository {
  async getPendingProjects() {
    return await Project.find({ status: 'pending' })
      .populate('owner', 'name email avatar')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAllProjects(filter, p, l) {
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate('owner', 'name email avatar phone linkedinUrl githubUrl')
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
    ]);
    return { total, projects };
  }

  async searchProjects(searchMatch, p, l) {
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
    return result;
  }

  async findProjectByIdPopulated(id) {
    return await Project.findById(id).populate('owner', 'name email avatar');
  }

  async findProjectById(id) {
    return await Project.findById(id);
  }

  async saveProject(project) {
    return await project.save();
  }

  async countProjects(filter) {
    return await Project.countDocuments(filter);
  }

  async createNotification(data) {
    return await Notification.create(data);
  }

  async createActivity(data) {
    return await Activity.create(data);
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async findUserByIdLean(id) {
    return await User.findById(id).lean();
  }

  async findUserByIdSelect(id, selectStr) {
    return await User.findById(id).select(selectStr);
  }

  async saveUser(user) {
    return await user.save();
  }

  async countUsers(filter) {
    return await User.countDocuments(filter);
  }

  async distinctUsers(field) {
    return await User.distinct(field);
  }

  async findUsers(match, selectStr, sortObj, skipNum, limitNum) {
    let query = User.find(match).select(selectStr).sort(sortObj);
    if (skipNum !== undefined) query = query.skip(skipNum);
    if (limitNum !== undefined) query = query.limit(limitNum);
    return await query.lean();
  }

  async aggregateProjectsForUsers(userIds) {
    return await Project.aggregate([
      { $match: { owner: { $in: userIds }, status: 'approved' } },
      {
        $group: {
          _id: '$owner',
          projectCount: { $sum: 1 },
          totalLikes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          allRatings: { $push: '$ratings' },
        },
      },
      {
        $addFields: {
          flatRatings: {
            $reduce: {
              input: '$allRatings',
              initialValue: [],
              in: { $concatArrays: ['$$value', { $ifNull: ['$$this', []] }] },
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
          ratingCount: { $size: '$flatRatings' },
        },
      },
      { $project: { allRatings: 0, flatRatings: 0 } },
    ]);
  }

  async getContactedUserIds() {
    const vacancies = await Vacancy.find({}, 'applicantStatus');
    const contactedUserIds = new Set();
    vacancies.forEach(v => {
      if (v.applicantStatus) {
        const statusObj = v.applicantStatus instanceof Map ? Object.fromEntries(v.applicantStatus) : v.applicantStatus;
        for (const userId in statusObj) {
          if (statusObj[userId] === 'contacted') contactedUserIds.add(userId);
        }
      }
    });
    return Array.from(contactedUserIds);
  }

  async updateUserAdminNote(id, note) {
    return await User.findByIdAndUpdate(id, { adminNote: String(note ?? '').trim() }, { new: true });
  }

  async updateUser(id, update, selectStr) {
    return await User.findByIdAndUpdate(id, update, { new: true }).select(selectStr);
  }

  async deleteUserRelated(userId) {
    await FreeOffer.deleteOne({ user: userId });
  }

  async deleteProjectRelated(projectId) {
    return await Project.findByIdAndDelete(projectId);
  }

  async deleteActivitiesByProject(projectId) {
    return await Activity.deleteMany({ project: projectId });
  }

  async countVacancies(filter) {
    return await Vacancy.countDocuments(filter);
  }

  async countFreeOffers(filter) {
    return await FreeOffer.countDocuments(filter);
  }

  async countMentorships(filter) {
    return await MentorshipApplication.countDocuments(filter);
  }

  async aggregateUsersMonthly(since) {
    return await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async aggregateUsersDaily(since) {
    return await User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  async findUsersForEmail(filter) {
    return await User.find(filter)
      .select('name email avatar regNumber userType designations resumeData')
      .sort({ createdAt: -1 })
      .lean();
  }

  async findEmailTemplateById(id) {
    return await EmailTemplate.findById(id).lean();
  }

  async findAllEmailTemplates() {
    return await EmailTemplate.find().sort({ updatedAt: -1 }).lean();
  }

  async createEmailTemplate(data) {
    return await EmailTemplate.create(data);
  }

  async updateEmailTemplate(id, data) {
    return await EmailTemplate.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteEmailTemplate(id) {
    return await EmailTemplate.findByIdAndDelete(id);
  }

  async findResumes() {
    return await User.find({ cvUrl: { $ne: '' }, userType: 'developer' })
      .select('name email regNumber avatar cvUrl userType createdAt')
      .sort({ updatedAt: -1 });
  }
}

module.exports = new AdminRepository();
