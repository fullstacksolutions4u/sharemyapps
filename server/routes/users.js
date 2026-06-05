const router = require('express').Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { extractJDRequirements } = require('../utils/aiExtract');
const aiLimit = require('../middleware/aiLimit');

// GET /api/users/developers — sorted by community engagement (likes/ratings/comments given to others)
router.get('/developers', async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const LIMIT = 12;
    const skip  = (page - 1) * LIMIT;
    const search = req.query.search?.trim();

    const safeSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchStage = { userType: 'developer', role: { $ne: 'admin' }, hidden: { $ne: true }, isDeleted: { $ne: true } };
    if (safeSearch) matchStage.name = { $regex: safeSearch, $options: 'i' };
    if (req.query.freelance === 'true') matchStage.freelanceAvailable = true;

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

    const [result] = await User.aggregate([
      { $match: matchStage },
      ownProjectsLookup,
      { $match: { $expr: { $gt: [{ $size: '$projects' }, 0] } } },
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
      {
        $facet: {
          total: [{ $count: 'n' }],
          developers: [
            { $skip: skip },
            { $limit: LIMIT },
            {
              $project: {
                password: 0, googleId: 0, companyName: 0, companyWebsite: 0,
                industry: 0, requirements: 0,
                _likedProjects: 0, _ratedProjects: 0, _userComments: 0,
              },
            },
          ],
        },
      },
    ]);

    const total = result.total[0]?.n || 0;
    const developers = result.developers;

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

// GET /api/users/mentors — developers who opted in for mentorship with tech filled
router.get('/mentors', protect, async (req, res) => {
  try {
    const search = req.query.search?.trim();

    const query = {
      userType: 'developer',
      mentorshipAvailable: true,
      'mentorshipTech.0': { $exists: true },
      role: { $ne: 'admin' },
      hidden: { $ne: true },
      isDeleted: { $ne: true },
    };
    const safeMentorSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (safeMentorSearch) query.name = { $regex: safeMentorSearch, $options: 'i' };

    const mentors = await User.find(query)
      .select('name avatar designations bio mentorshipTech mentorshipRate mentorshipSchedule languagePreference linkedinUrl githubUrl phone email createdAt')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const mentorIds = mentors.map(m => m._id);
    const projectCounts = await Project.aggregate([
      { $match: { owner: { $in: mentorIds }, status: 'approved' } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(projectCounts.map(p => [p._id.toString(), p.count]));

    res.json(mentors.map(m => ({ ...m, projectCount: countMap[m._id.toString()] || 0 })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/client-projects — list the calling client's projects
router.get('/client-projects', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('clientProjects');
    res.json(user?.clientProjects || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/client-projects — add a new project
router.post('/client-projects', protect, async (req, res) => {
  try {
    const { projectName, budget, duration, skillsNeeded, experienceLevel, description, status } = req.body;
    if (!projectName?.trim()) return res.status(400).json({ message: 'Project name is required' });

    const project = {
      _id: new (require('mongoose').Types.ObjectId)().toString(),
      projectName: projectName.trim(),
      budget: budget ? Number(budget) : null,
      duration: duration?.trim() || '',
      skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : [],
      experienceLevel: experienceLevel?.trim() || '',
      description: description?.trim() || '',
      status: status || 'open',
      createdAt: new Date(),
    };

    await User.findByIdAndUpdate(req.user._id, { $push: { clientProjects: project } });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/client-projects/:projectId — update a project
router.put('/client-projects/:projectId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const idx = (user.clientProjects || []).findIndex(p => p._id === req.params.projectId);
    if (idx === -1) return res.status(404).json({ message: 'Project not found' });

    const { projectName, budget, duration, skillsNeeded, experienceLevel, description, status } = req.body;
    const existing = user.clientProjects[idx];

    user.clientProjects[idx] = {
      ...existing,
      projectName: projectName?.trim() || existing.projectName,
      budget: budget !== undefined ? (budget ? Number(budget) : null) : existing.budget,
      duration: duration?.trim() ?? existing.duration,
      skillsNeeded: Array.isArray(skillsNeeded) ? skillsNeeded : existing.skillsNeeded,
      experienceLevel: experienceLevel?.trim() ?? existing.experienceLevel,
      description: description?.trim() ?? existing.description,
      status: status || existing.status,
    };
    user.markModified('clientProjects');
    await user.save();
    res.json(user.clientProjects[idx]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/client-projects/:projectId — delete a project
router.delete('/client-projects/:projectId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.clientProjects = (user.clientProjects || []).filter(p => p._id !== req.params.projectId);
    user.markModified('clientProjects');
    await user.save();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/find-developers — AI-powered JD matching
router.post('/find-developers', protect, aiLimit, async (req, res) => {
  try {
    const { jd } = req.body;
    if (!jd?.trim() || jd.trim().length < 30) {
      return res.status(400).json({ message: 'Please provide a more detailed job description.' });
    }

    // 1. Extract requirements from JD using OpenAI
    const extracted = await extractJDRequirements(jd.trim());
    const skills = (extracted.skills || []).map(s => s.toLowerCase());
    const roles  = (extracted.roles  || []).map(r => r.toLowerCase());

    // 2. Fetch all eligible developers with their approved projects
    const developers = await User.find({
      userType: { $in: ['developer', 'mentee'] },
      role: { $ne: 'admin' },
      hidden: { $ne: true },
      isDeleted: { $ne: true },
    }).select('-password -googleId').lean();

    const projectsByOwner = await Project.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$owner', techTags: { $push: '$techTags' }, count: { $sum: 1 } } },
    ]);
    const projectMap = Object.fromEntries(
      projectsByOwner.map(p => [
        p._id.toString(),
        { count: p.count, techTags: p.techTags.flat().map(t => t.toLowerCase()) },
      ])
    );

    // 3. Score each developer
    const scored = developers
      .filter(dev => projectMap[dev._id.toString()]?.count > 0)
      .map(dev => {
        const pid = dev._id.toString();
        const toArr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : []);
        const techTags    = projectMap[pid]?.techTags || [];
        const mentorTech  = toArr(dev.mentorshipTech).map(t => t.toLowerCase());
        const designations= toArr(dev.designations).map(d => d.toLowerCase());
        const langPref    = toArr(dev.languagePreference).map(l => l.toLowerCase());
        const resumeSkills= toArr(dev.resumeData?.skills).map(s => s.toLowerCase());
        const resumeStack = toArr(dev.resumeData?.techStack).map(s => s.toLowerCase());

        const countMatches = (haystack, needles) =>
          needles.reduce((acc, n) => acc + (haystack.some(h => h.includes(n) || n.includes(h)) ? 1 : 0), 0);

        const score =
          countMatches(techTags,     skills) * 3 +
          countMatches(resumeSkills, skills) * 3 +
          countMatches(resumeStack,  skills) * 2 +
          countMatches(mentorTech,   skills) * 2 +
          countMatches(designations, roles)  * 2 +
          countMatches(langPref,     skills) * 1;

        return { ...dev, matchScore: score, projectCount: projectMap[pid]?.count || 0 };
      })
      .filter(d => d.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || b.createdAt - a.createdAt)
      .slice(0, 40);

    res.json({ developers: scored, extracted });
  } catch (err) {
    console.error('find-developers error:', err);
    res.status(500).json({ message: 'Search failed. Please try again.' });
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
