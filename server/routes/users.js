const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/developers — sorted by community engagement (likes/ratings/comments given to others)
router.get('/developers', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const LIMIT = 12;
    const skip  = (page - 1) * LIMIT;
    const search = req.query.search?.trim();

    const matchStage = { userType: 'developer', role: { $ne: 'admin' }, hidden: { $ne: true } };
    if (search) matchStage.name = { $regex: search, $options: 'i' };

    // Projects owned by this developer (for the card display)
    const ownProjectsLookup = {
      $lookup: {
        from: 'projects',
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$owner', '$$uid'] }, { $eq: ['$status', 'approved'] }] } } },
          { $project: { _id: 1, title: 1, appType: 1 } },
        ],
        as: 'projects',
      },
    };

    // Projects they liked on OTHER developers' work
    const likedProjectsLookup = {
      $lookup: {
        from: 'projects',
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $ne: ['$owner', '$$uid'] },
            { $in: ['$$uid', '$likes'] },
          ] } } },
          { $project: { _id: 1 } },
        ],
        as: '_likedProjects',
      },
    };

    // Projects they rated on OTHER developers' work
    const ratedProjectsLookup = {
      $lookup: {
        from: 'projects',
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $and: [
            { $ne: ['$owner', '$$uid'] },
            { $gt: [
              { $size: { $filter: { input: { $ifNull: ['$ratings', []] }, as: 'r', cond: { $eq: ['$$r.user', '$$uid'] } } } },
              0,
            ] },
          ] } } },
          { $project: { _id: 1 } },
        ],
        as: '_ratedProjects',
      },
    };

    // Comments they wrote (on any project — Comment model stores project ref but not owner)
    const commentsLookup = {
      $lookup: {
        from: 'comments',
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$user', '$$uid'] } } },
          { $project: { _id: 1 } },
        ],
        as: '_userComments',
      },
    };

    const [total, developers] = await Promise.all([
      User.countDocuments(matchStage),

      User.aggregate([
        { $match: matchStage },
        ownProjectsLookup,
        likedProjectsLookup,
        ratedProjectsLookup,
        commentsLookup,
        {
          $addFields: {
            likesGiven:    { $size: '$_likedProjects' },
            ratingsGiven:  { $size: '$_ratedProjects' },
            commentsGiven: { $size: '$_userComments' },
            communityScore: {
              $add: [
                { $size: '$_likedProjects' },
                { $multiply: [{ $size: '$_ratedProjects' }, 2] },
                { $multiply: [{ $size: '$_userComments' }, 3] },
              ],
            },
          },
        },
        { $sort: { communityScore: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: LIMIT },
        {
          $project: {
            password: 0, googleId: 0, companyName: 0, companyWebsite: 0,
            industry: 0, requirements: 0,
            _likedProjects: 0, _ratedProjects: 0, _userComments: 0,
          },
        },
      ]),
    ]);

    res.json({
      developers,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / LIMIT),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/:id/follow  — toggle follow/unfollow
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    const alreadyFollowing = target.followers.some(
      f => f.toString() === req.user._id.toString()
    );

    if (alreadyFollowing) {
      target.followers.pull(req.user._id);
    } else {
      target.followers.addToSet(req.user._id);
    }

    await target.save();

    res.json({
      following: !alreadyFollowing,
      followersCount: target.followers.length,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
