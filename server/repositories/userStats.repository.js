const User = require('../models/User');
const Vacancy = require('../models/Vacancy');
const Project = require('../models/Project');
const JobLink = require('../models/JobLink');
const LearningProgress = require('../models/LearningProgress');
const LearningModule = require('../models/LearningModule');
const JobAlertModel = require('../models/JobAlert');
const mongoose = require('mongoose');

class UserStatsRepository {
  async countUsers() {
    return await User.countDocuments();
  }

  async countVacanciesApplied(userId) {
    return await Vacancy.countDocuments({ everApplied: userId });
  }

  async countJobPostLinks(userObjectId) {
    const res = await JobLink.aggregate([
      { $match: { 'clickEvents.user': userObjectId } },
      { $unwind: '$clickEvents' },
      { $match: { 'clickEvents.user': userObjectId } },
      { $count: 'total' },
    ]);
    return res[0]?.total || 0;
  }

  async getLearningProgress(userId) {
    return await LearningProgress.findOne({ userId }).select('completedModules completedTopics').lean();
  }

  async countProjectsByOwner(userId) {
    return await Project.countDocuments({ owner: userId });
  }

  async getActiveLearningModules() {
    return await LearningModule.find({ isActive: true }).select('category title topics._id').lean();
  }

  async getJobAlertCount(userObjectId) {
    const res = await JobAlertModel.aggregate([
      { $match: { notified: true, recipients: userObjectId } },
      {
        $project: {
          count: {
            $add: [
              { $size: { $ifNull: ['$jobs', []] } },
              { $size: { $ifNull: ['$careerLinks', []] } },
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$count' } } },
    ]);
    return res[0]?.total || 0;
  }

  async getHeroStats() {
    const base = { isDeleted: { $ne: true }, hidden: { $ne: true }, role: { $ne: 'admin' } };
    const [developerCount, recruiterCount, menteeCount] = await Promise.all([
      User.countDocuments({ ...base, userType: 'developer' }),
      User.countDocuments({ ...base, userType: { $in: ['recruiter', 'client'] } }),
      User.countDocuments({ ...base, userType: 'mentee' }),
    ]);
    return { developerCount, recruiterCount, menteeCount };
  }
}

module.exports = new UserStatsRepository();
