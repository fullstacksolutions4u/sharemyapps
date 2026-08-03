const Activity = require('../models/Activity');
const Project = require('../models/Project');
const User = require('../models/User');
const { getExcludedHiddenUserIds } = require('../utils/visibility');

exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 40;
    const skip = (page - 1) * limit;

    const hiddenExclude = await getExcludedHiddenUserIds(req.user, User);
    const deletedUsers = await User.find({ isDeleted: true }).select('_id').lean();
    const excludeIds = [
      ...hiddenExclude.map((id) => id.toString()),
      ...deletedUsers.map((u) => u._id.toString()),
    ];

    let activities = await Activity.find({ user: { $nin: excludeIds } })
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
      .populate('comments.user', 'name profileImage avatar')
      .lean();

    // To ensure the feed isn't empty when first launching, if we have 0 activities, 
    // dynamically pull the latest 40 approved projects and format them as activities
    if (activities.length === 0 && page === 1) {
      const recentProjects = await Project.find({ status: 'approved', owner: { $nin: excludeIds } })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate('owner', 'name profileImage avatar designations linkedinUrl')
        .lean();
      
      activities = recentProjects.map(p => ({
        _id: p._id,
        user: p.owner,
        type: 'PROJECT_APPROVED',
        project: p,
        createdAt: p.createdAt || new Date(),
        meta: {}
      }));
    }

    res.json({
      success: true,
      data: activities,
      page,
      hasMore: activities.length === limit
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeActivity = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    
    const userId = req.user._id;
    const idx = activity.likes.indexOf(userId);
    if (idx === -1) {
      activity.likes.push(userId);
    } else {
      activity.likes.splice(idx, 1);
    }
    
    await activity.save();
    res.json({ success: true, likes: activity.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.commentActivity = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment text is required' });
    
    const activity = await Activity.findById(req.params.id);
    if (!activity) return res.status(404).json({ success: false, message: 'Activity not found' });
    
    const comment = {
      user: req.user._id,
      text: text.trim(),
      createdAt: new Date()
    };
    
    activity.comments.push(comment);
    await activity.save();
    
    await activity.populate('comments.user', 'name profileImage avatar');
    
    res.json({ success: true, comment: activity.comments[activity.comments.length - 1] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
