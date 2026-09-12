const feedRepo = require('../repositories/feed.repository');
const { sanitizeText } = require('../utils/sanitize');

class FeedService {
  async getFeed(reqUser, page = 1, limit = 40) {
    const skip = (page - 1) * limit;
    const excludeIds = await feedRepo.getHiddenExcludeIds(reqUser);

    let activities = await feedRepo.getActivities(excludeIds, skip, limit);

    activities = activities.map(activity => {
      if (activity.type === 'COMMUNITY_POST_CREATED') {
        if (!activity.communityPost) return null;
        
        if (activity.communityPost.anonymous) {
          activity.user = {
            _id: 'anonymous',
            name: 'Community Member',
            avatar: '',
            profileImage: '',
            designations: [],
            userType: 'developer',
            linkedinUrl: ''
          };
          activity.communityPost.author = {
            _id: 'anonymous',
            name: 'Community Member',
            avatar: '',
            badge: '',
            premiumServices: []
          };
        }
      }
      return activity;
    }).filter(Boolean);

    if (activities.length === 0 && page === 1) {
      const recentProjects = await feedRepo.getRecentProjects(excludeIds);
      activities = recentProjects.map(p => ({
        _id: p._id,
        user: p.owner,
        type: 'PROJECT_APPROVED',
        project: p,
        createdAt: p.createdAt || new Date(),
        meta: {}
      }));
    }

    return {
      activities,
      hasMore: activities.length === limit,
    };
  }

  async likeActivity(activityId, userId) {
    const activity = await feedRepo.findActivityById(activityId);
    if (!activity) {
      const err = new Error('Activity not found'); err.status = 404; throw err;
    }
    
    const idx = activity.likes.indexOf(userId);
    if (idx === -1) {
      activity.likes.push(userId);
    } else {
      activity.likes.splice(idx, 1);
    }
    
    await feedRepo.saveActivity(activity);
    return activity.likes;
  }

  async commentActivity(activityId, userId, text) {
    const activity = await feedRepo.findActivityById(activityId);
    if (!activity) {
      const err = new Error('Activity not found'); err.status = 404; throw err;
    }
    
    const comment = {
      user: userId,
      text: sanitizeText(text),
      createdAt: new Date()
    };
    
    activity.comments.push(comment);
    await feedRepo.saveActivity(activity);
    
    await feedRepo.populateActivityComments(activity);
    
    return activity.comments[activity.comments.length - 1];
  }
}

module.exports = new FeedService();
