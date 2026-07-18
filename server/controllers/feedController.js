const Activity = require('../models/Activity');
const Project = require('../models/Project');

exports.getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 40;
    const skip = (page - 1) * limit;

    let activities = await Activity.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name profileImage avatar')
      .populate({
        path: 'project',
        select: 'title bannerImage liveUrl _id owner status',
        populate: { path: 'owner', select: 'name profileImage avatar' }
      })
      .populate('module', 'title _id')
      .lean();

    // To ensure the feed isn't empty when first launching, if we have 0 activities, 
    // dynamically pull the latest 40 approved projects and format them as activities
    if (activities.length === 0 && page === 1) {
      const recentProjects = await Project.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(40)
        .populate('owner', 'name profileImage avatar')
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
