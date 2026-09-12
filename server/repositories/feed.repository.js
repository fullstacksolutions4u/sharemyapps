const Activity = require('../models/Activity');
const Project = require('../models/Project');
const User = require('../models/User');
const { getExcludedHiddenUserIds } = require('../utils/visibility');

class FeedRepository {
  async getHiddenExcludeIds(reqUser) {
    const hiddenExclude = await getExcludedHiddenUserIds(reqUser, User);
    const deletedUsers = await User.find({ isDeleted: true }).select('_id').lean();
    return [
      ...hiddenExclude.map((id) => id.toString()),
      ...deletedUsers.map((u) => u._id.toString()),
    ];
  }

  async getActivities(excludeIds, skip, limit) {
    return await Activity.find({ user: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage avatar designations userType linkedinUrl')
      .populate({
        path: 'project',
        select: 'title description bannerImage liveUrl _id owner status likes ratings techTags category',
        populate: { path: 'owner', select: 'name profileImage avatar designations linkedinUrl' }
      })
      .populate('module', 'title _id')
      .populate({
        path: 'communityPost',
        populate: { path: 'author', select: 'name avatar badge premiumServices' }
      })
      .populate('comments.user', 'name profileImage avatar')
      .lean();
  }

  async getRecentProjects(excludeIds, limit = 40) {
    return await Project.find({ status: 'approved', owner: { $nin: excludeIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('owner', 'name profileImage avatar designations linkedinUrl')
      .lean();
  }

  async findActivityById(id) {
    return await Activity.findById(id);
  }

  async saveActivity(activity) {
    return await activity.save();
  }

  async populateActivityComments(activity) {
    return await activity.populate('comments.user', 'name profileImage avatar');
  }
}

module.exports = new FeedRepository();
