const Project = require('../models/Project');
const User = require('../models/User');

class AiChatRepository {
  async getProjectsForContext(limit = 200) {
    return await Project.find({ hidden: { $ne: true }, status: 'approved' })
      .populate('owner', 'name email')
      .select('title description techTags status category appType likes ratings viewCount featured hidden salePrice createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getDevelopersForContext(limit = 200) {
    return await User.find({ userType: 'developer', isDeleted: { $ne: true }, hidden: { $ne: true } })
      .select('name email bio designations badge freelanceAvailable mentorshipAvailable place district state country regNumber hidden createdAt resumeData')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getStatsForContext(startOfMonth) {
    return await Promise.all([
      Project.countDocuments({ status: 'approved', hidden: { $ne: true } }),
      Project.countDocuments({ status: 'pending' }),
      Project.countDocuments({ status: 'rejected' }),
      User.countDocuments({ userType: 'developer', isDeleted: { $ne: true }, hidden: { $ne: true } }),
      User.countDocuments({ userType: 'client', isDeleted: { $ne: true }, hidden: { $ne: true } }),
      User.countDocuments({ userType: 'developer', isDeleted: { $ne: true }, hidden: { $ne: true }, createdAt: { $gte: startOfMonth } }),
      Project.countDocuments({ createdAt: { $gte: startOfMonth }, hidden: { $ne: true } }),
      Project.countDocuments({ salePrice: { $exists: true, $ne: null }, hidden: { $ne: true } }),
    ]);
  }
}

module.exports = new AiChatRepository();
