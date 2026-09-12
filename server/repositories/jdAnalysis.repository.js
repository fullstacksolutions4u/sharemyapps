const JDSearchHistory = require('../models/JDSearchHistory');
const User = require('../models/User');

class JDAnalysisRepository {
  async saveHistory(data) {
    return await JDSearchHistory.create(data);
  }

  async getHistoryByUser(userId) {
    return await JDSearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }

  async deleteHistory(id, userId) {
    return await JDSearchHistory.findOneAndDelete({ _id: id, user: userId });
  }

  async getHistoryByAdmin(userId) {
    return await JDSearchHistory.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  }

  async clearAllHistory(userId) {
    return await JDSearchHistory.deleteMany({ user: userId });
  }

  async getUserJDQuota(userId) {
    return await User.findById(userId).select('jdQuota').lean();
  }
}

module.exports = new JDAnalysisRepository();
