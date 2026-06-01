const router = require('express').Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET /api/users/developers — alternating rows of top-engaging and newest developers
router.get('/developers', async (req, res) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const LIMIT  = 12;  // developers per page
    const COLS   = 3;   // cards per row
    const half   = LIMIT;  // fetch up to LIMIT from each list, deduplicate down to LIMIT
    const skip   = (page - 1) * half;
    const search = req.query.search?.trim();

    const matchStage = { userType: 'developer' };
    if (search) matchStage.name = { $regex: search, $options: 'i' };

    const projectLookup = {
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

    const cleanProject = {
      $project: { password: 0, googleId: 0, companyName: 0, companyWebsite: 0, industry: 0, requirements: 0 },
    };

    const [total, engaging, recent] = await Promise.all([
      User.countDocuments(matchStage),

      // Top engaging: most followers + most projects
      User.aggregate([
        { $match: matchStage },
        projectLookup,
        { $addFields: { _followerCount: { $size: { $ifNull: ['$followers', []] } }, _projectCount: { $size: { $ifNull: ['$projects', []] } } } },
        { $sort: { _followerCount: -1, _projectCount: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: half },
        cleanProject,
      ]),

      // Newest: most recently registered
      User.aggregate([
        { $match: matchStage },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: half },
        projectLookup,
        cleanProject,
      ]),
    ]);

    // Interleave by rows: COLS from engaging, then COLS from recent, alternating
    const seen = new Set();
    const interleaved = [];
    const rowCount = Math.max(Math.ceil(engaging.length / COLS), Math.ceil(recent.length / COLS));

    for (let r = 0; r < rowCount; r++) {
      for (const chunk of [engaging, recent]) {
        const row = chunk.slice(r * COLS, (r + 1) * COLS);
        for (const dev of row) {
          const id = dev._id.toString();
          if (!seen.has(id)) { seen.add(id); interleaved.push(dev); }
        }
      }
    }

    res.json({
      developers: interleaved.slice(0, LIMIT),
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
