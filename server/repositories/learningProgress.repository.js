const LearningProgress = require('../models/LearningProgress');
const LearningModule = require('../models/LearningModule');
const User = require('../models/User');
const Activity = require('../models/Activity');

class LearningProgressRepository {
  async findProgressByUserId(userId) {
    return await LearningProgress.findOne({ userId });
  }

  async createProgress(userId) {
    return await LearningProgress.create({ userId, completedTopics: [], completedModules: [] });
  }

  async findUserById(userId, selectStr) {
    let query = User.findById(userId);
    if (selectStr) query = query.select(selectStr);
    return await query;
  }

  async findUserByIdLean(userId, selectStr) {
    let query = User.findById(userId);
    if (selectStr) query = query.select(selectStr);
    return await query.lean();
  }

  async findModuleById(moduleId) {
    return await LearningModule.findById(moduleId).lean();
  }

  async findAllModules() {
    return await LearningModule.find();
  }

  async saveProgress(progressDoc) {
    return await progressDoc.save();
  }

  async saveUser(userDoc) {
    return await userDoc.save();
  }

  async createActivity(data) {
    return await Activity.create(data);
  }

  async findDevUsersForLeaderboard(filter, sort, limit, selectStr) {
    let query = User.find(filter);
    if (selectStr) query = query.select(selectStr);
    if (sort) query = query.sort(sort);
    if (limit) query = query.limit(limit);
    return await query.lean();
  }

  async countDevUsersForLeaderboard(filter) {
    return await User.countDocuments(filter);
  }
}

module.exports = new LearningProgressRepository();
