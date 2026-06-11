const router = require('express').Router();
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const { extractJDRequirements } = require('../utils/aiExtract');
const aiLimit = require('../middleware/aiLimit');
const { jdQuota } = require('../middleware/jdQuota');

// GET /api/users/count — public, returns total registered user count
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments({ isDeleted: { $ne: true }, role: { $ne: 'admin' } });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/stats — public, returns counts by userType for hero section
router.get('/stats', async (req, res) => {
  try {
    const base = { isDeleted: { $ne: true }, role: { $ne: 'admin' } };
    const [developerCount, recruiterCount, menteeCount] = await Promise.all([
      User.countDocuments({ ...base, userType: 'developer' }),
      User.countDocuments({ ...base, userType: { $in: ['recruiter', 'client'] } }),
      User.countDocuments({ ...base, userType: 'mentee' }),
    ]);
    res.json({ developerCount, recruiterCount, menteeCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/search?q=query — public, for @ mention collaborator search
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q?.trim() || '';
    const filter = { role: { $ne: 'admin' }, isDeleted: { $ne: true } };
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }
    const users = await User.find(filter).select('name avatar').limit(10).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/recent — last N registered users (for social proof on homepage)
router.get('/recent', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 50);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const users = await require('../models/User').find(
      { role: { $ne: 'admin' }, isDeleted: { $ne: true }, userType: 'developer', avatar: { $regex: 'cloudinary\\.com', $options: 'i' } },
      { name: 1, avatar: 1, userType: 1 }
    ).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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
          { $match: { $expr: { $and: [{ $eq: ['$owner', '$$uid'] }, { $eq: ['$status', 'approved'] }, { $ne: ['$hidden', true] }] } } },
          { $sort: { createdAt: -1 } },
          { $project: { _id: 1, title: 1, appType: 1, createdAt: 1 } },
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
      likedProjectsLookup,
      ratedProjectsLookup,
      commentsLookup,
      {
        $addFields: {
          hasProjects:    { $gt: [{ $size: '$projects' }, 0] },
          lastProjectAt:  { $max: '$projects.createdAt' },
          likesGiven:     { $size: '$_likedProjects' },
          ratingsGiven:   { $size: '$_ratedProjects' },
          commentsGiven:  { $size: '$_userComments' },
          communityScore: {
            $add: [
              { $size: '$_likedProjects' },
              { $multiply: [{ $size: '$_ratedProjects' }, 2] },
              { $multiply: [{ $size: '$_userComments' }, 3] },
            ],
          },
        },
      },
      { $sort: { lastProjectAt: -1, hasProjects: -1, createdAt: -1 } },
      {
        $facet: {
          total: [{ $count: 'n' }],
          developers: [
            { $skip: skip },
            { $limit: LIMIT },
            {
              $project: {
                password: 0, googleId: 0, companyName: 0, companyWebsite: 0,
                industry: 0, requirements: 0, adminNote: 0,
                _likedProjects: 0, _ratedProjects: 0, _userComments: 0, hasProjects: 0,
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

// GET /api/users/candidates — developers with ≥1 approved project + resume, for recruiter browse
router.get('/candidates', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'recruiter') {
      return res.status(403).json({ message: 'Recruiter access only' });
    }

    const candidates = await User.aggregate([
      {
        $match: {
          userType: { $in: ['developer', 'mentee'] },
          role: { $ne: 'admin' },
          hidden: { $ne: true },
          isDeleted: { $ne: true },
          cvUrl: { $exists: true, $nin: ['', null] },
        },
      },
      {
        $lookup: {
          from: 'projects',
          let: { uid: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$owner', '$$uid'] }, { $eq: ['$status', 'approved'] }] } } },
            { $project: { _id: 1 } },
          ],
          as: '_projects',
        },
      },
      { $match: { $expr: { $gt: [{ $size: '$_projects' }, 0] } } },
      { $addFields: { projectCount: { $size: '$_projects' } } },
      {
        $project: {
          password: 0, googleId: 0, companyName: 0, companyWebsite: 0,
          industry: 0, requirements: 0, resetOtp: 0, resetOtpExpiry: 0,
          _projects: 0,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(candidates);
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

// ── AI match helpers ─────────────────────────────────────────────────────────

const ALIAS_MAP = {
  'reactjs': 'react', 'react.js': 'react',
  'nodejs': 'node.js', 'node': 'node.js',
  'nextjs': 'next.js', 'next': 'next.js',
  'nuxtjs': 'nuxt.js', 'nuxt': 'nuxt.js',
  'vuejs': 'vue.js', 'vue': 'vue.js',
  'expressjs': 'express.js', 'express': 'express.js',
  'ts': 'typescript', 'js': 'javascript',
  'postgres': 'postgresql',
  'mongo': 'mongodb',
  'mssql': 'sql server', 'ms sql': 'sql server',
  'gcp': 'google cloud', 'amazon web services': 'aws',
  'tailwindcss': 'tailwind', 'tailwind css': 'tailwind',
  'react-native': 'react native',
};

function normalize(str) {
  const lower = str.toLowerCase().trim();
  return ALIAS_MAP[lower] ?? lower;
}

function isWordMatch(hay, needle) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|[\\s,./\\-+#])${escaped}(?:[\\s,./\\-+#]|$)`, 'i');
  return re.test(` ${hay} `);
}

function scoreMatches(haystack, needles) {
  return needles.reduce((acc, needle) => {
    const n = normalize(needle);
    for (const raw of haystack) {
      const h = normalize(raw);
      if (h === n) return acc + 1.0;
      if (isWordMatch(h, n) || isWordMatch(n, h)) return acc + 0.6;
    }
    return acc;
  }, 0);
}

function inferDevLevel(dev) {
  const titles = (dev.designations || []).join(' ').toLowerCase();
  if (/\b(senior|sr\.?|lead|principal|staff|architect)\b/.test(titles)) return 'senior';
  if (/\b(junior|jr\.?|entry|intern|graduate|fresher)\b/.test(titles)) return 'junior';
  const exp = Array.isArray(dev.resumeData?.experience) ? dev.resumeData.experience : [];
  let totalMonths = 0;
  for (const e of exp) {
    try {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end   = e.endDate   ? new Date(e.endDate)   : new Date();
      if (start && !isNaN(start)) totalMonths += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
    } catch {}
  }
  const years = totalMonths / 12 || exp.length * 1.5;
  if (years >= 5) return 'senior';
  if (years >= 2) return 'mid';
  return 'junior';
}

function getDevYears(dev) {
  const exp = Array.isArray(dev.resumeData?.experience) ? dev.resumeData.experience : [];
  let totalMonths = 0;
  for (const e of exp) {
    try {
      const start = e.startDate ? new Date(e.startDate) : null;
      const end   = e.endDate   ? new Date(e.endDate)   : new Date();
      if (start && !isNaN(start)) totalMonths += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
    } catch {}
  }
  return (totalMonths / 12) || (exp.length * 1.5);
}

function completenessBonus(dev) {
  let bonus = 0;
  if ((dev.resumeData?.skills?.length  || 0) > 3)    bonus += 0.4;
  if ((dev.resumeData?.experience?.length || 0) > 0)  bonus += 0.4;
  if ((dev.designations?.length || 0) > 0)            bonus += 0.3;
  if (dev.githubUrl?.trim())                          bonus += 0.2;
  if (dev.bio?.trim()?.length > 50)                   bonus += 0.2;
  return bonus;
}

const LEVEL_MULTIPLIER = {
  senior: { senior: 1.0, mid: 0.6,  junior: 0.25 },
  mid:    { senior: 0.85, mid: 1.0, junior: 0.6  },
  junior: { senior: 0.7,  mid: 0.9, junior: 1.0  },
  any:    { senior: 1.0,  mid: 1.0, junior: 1.0  },
};

// ─────────────────────────────────────────────────────────────────────────────

// POST /api/users/find-developers — AI-powered JD matching
router.post('/find-developers', protect, jdQuota, aiLimit, async (req, res) => {
  try {
    const { jd } = req.body;
    if (!jd?.trim() || jd.trim().length < 30) {
      return res.status(400).json({ message: 'Please provide a more detailed job description.' });
    }

    // 1. Extract requirements from JD using OpenAI
    const extracted = await extractJDRequirements(jd.trim());
    const skills     = (extracted.skills     || []).map(s => s.toLowerCase());
    const roles      = (extracted.roles      || []).map(r => r.toLowerCase());
    const niceToHave = (extracted.niceToHave || []).map(s => s.toLowerCase());
    const jdLevel    = (extracted.level      || 'any').toLowerCase();
    const minYears   = typeof extracted.minYears === 'number' ? extracted.minYears : null;
    const locationType  = (extracted.locationType  || 'any').toLowerCase();
    const locationCity  = extracted.locationCity?.toLowerCase().trim() || null;
    const locationState = extracted.locationState?.toLowerCase().trim() || null;
    const isOnsiteJob   = locationType === 'onsite' && (locationCity || locationState);

    // 2. Fetch all eligible developers with their approved projects
    const developers = await User.find({
      userType: { $in: ['developer', 'mentee'] },
      role: { $ne: 'admin' },
      hidden: { $ne: true },
      isDeleted: { $ne: true },
    }).select('-password -googleId -adminNote').lean();

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
    // Location pre-filter: onsite jobs with a specified city/state only show matching developers
    const locationFilter = isOnsiteJob
      ? (dev) => {
          const locs = (dev.preferredLocations || []).map(l => l.toLowerCase().trim());
          if (locs.length === 0) return false;
          return locs.some(l =>
            (locationCity  && (l.includes(locationCity)  || locationCity.includes(l)))  ||
            (locationState && (l.includes(locationState) || locationState.includes(l)))
          );
        }
      : () => true;

    const hasValidResume = dev => {
      const cv = (dev.cvUrl || '').trim();
      const hasUploadedCv = cv.length > 0 && !cv.includes('drive.google.com');
      const hasJsonResume = dev.resumeData && (
        (dev.resumeData.skills?.length > 0) ||
        (dev.resumeData.techStack?.length > 0) ||
        (dev.resumeData.experience?.length > 0)
      );
      return hasUploadedCv || hasJsonResume;
    };

    const hasProfileData = dev =>
      projectMap[dev._id.toString()]?.count > 0 || hasValidResume(dev);

    const scored = developers
      .filter(dev => hasProfileData(dev) && locationFilter(dev) && hasValidResume(dev))
      .map(dev => {
        const pid = dev._id.toString();
        const toArr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v).flat() : []);

        // — resume data —
        const resumeSkills       = toArr(dev.resumeData?.skills).map(s => s.toLowerCase());
        const resumeStack        = toArr(dev.resumeData?.techStack).map(s => s.toLowerCase());
        const resumeProjectTech  = (dev.resumeData?.projects || []).flatMap(p => toArr(p.techStack)).map(s => s.toLowerCase());
        const resumeRoles        = (dev.resumeData?.experience || []).map(e => (e.role || '').toLowerCase()).filter(Boolean);
        const resumeCerts        = (dev.resumeData?.certifications || []).map(c => (c.name || '').toLowerCase()).filter(Boolean);

        // — profile data —
        const techTags     = projectMap[pid]?.techTags || [];
        const mentorTech   = toArr(dev.mentorshipTech).map(t => t.toLowerCase());
        const designations = toArr(dev.designations).map(d => d.toLowerCase());
        const langPref     = toArr(dev.languagePreference).map(l => l.toLowerCase());
        const devJobModes  = toArr(dev.jobMode).map(m => m.toLowerCase());

        const rawScore =
          scoreMatches(techTags,          skills) * 3   +   // approved project tags
          scoreMatches(resumeSkills,      skills) * 3   +   // resume skills block
          scoreMatches(resumeStack,       skills) * 2   +   // resume techStack flat list
          scoreMatches(resumeProjectTech, skills) * 1.5 +   // resume project tech
          scoreMatches(mentorTech,        skills) * 2   +   // profile mentorship tech
          scoreMatches(designations,      roles)  * 2   +   // profile designations vs JD roles
          scoreMatches(resumeRoles,       roles)  * 1.5 +   // resume job titles vs JD roles
          scoreMatches(langPref,          skills) * 1;      // language preference

        // Apply level multiplier
        const devLevel = inferDevLevel(dev);
        const levelMul = LEVEL_MULTIPLIER[jdLevel]?.[devLevel] ?? 1.0;
        let finalScore = rawScore * levelMul;

        // Experience years bonus (additive, max +3)
        if (minYears !== null && minYears > 0) {
          const yearsScore = Math.min(getDevYears(dev) / minYears, 1.5);
          finalScore += yearsScore * 2;
        }

        // jobMode match vs JD locationType (+1.0)
        if (locationType !== 'any' && devJobModes.length > 0) {
          if (devJobModes.some(m => m.includes(locationType) || locationType.includes(m))) {
            finalScore += 1.0;
          }
        }

        // Nice-to-have skills (low weight bonus)
        if (niceToHave.length > 0) {
          finalScore +=
            scoreMatches(techTags,          niceToHave) * 0.5 +
            scoreMatches(resumeSkills,      niceToHave) * 0.5 +
            scoreMatches(resumeStack,       niceToHave) * 0.3 +
            scoreMatches(resumeProjectTech, niceToHave) * 0.3 +
            scoreMatches(resumeCerts,       niceToHave) * 0.2;
        }

        // Profile completeness tie-breaker (max +1.5)
        finalScore += completenessBonus(dev);

        return { ...dev, matchScore: finalScore, rawScore, projectCount: projectMap[pid]?.count || 0 };
      })
      .filter(d => d.rawScore > 0)
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
