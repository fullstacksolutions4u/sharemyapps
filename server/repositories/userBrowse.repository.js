const User = require('../models/User');
const Project = require('../models/Project');

class UserBrowseRepository {
  async searchUsers(filter, limit = 10) {
    return await User.find(filter).select('name avatar').limit(limit).lean();
  }

  async getRecentDevelopers(skip, limit) {
    return await User.find(
      { role: { $ne: 'admin' }, isDeleted: { $ne: true }, hidden: { $ne: true }, userType: 'developer', avatar: { $exists: true, $ne: '' } },
      { name: 1, avatar: 1, userType: 1 }
    ).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  }

  async getShowcaseDevs(pipeline) {
    return await User.aggregate(pipeline);
  }

  async getDevelopers(pipeline) {
    return await User.aggregate(pipeline);
  }

  async getCandidates(pipeline) {
    return await User.aggregate(pipeline);
  }

  async getMentors(query, limit = 100) {
    return await User.find(query)
      .select('name avatar designations bio mentorshipTech mentorshipRate mentorshipSchedule languagePreference linkedinUrl githubUrl phone email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async getProjectCountsForMentors(mentorIds) {
    return await Project.aggregate([
      { $match: { owner: { $in: mentorIds }, status: 'approved' } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
  }
}

module.exports = new UserBrowseRepository();
