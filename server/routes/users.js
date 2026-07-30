const router = require('express').Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Vacancy = require('../models/Vacancy');
const { protect, optionalAuth } = require('../middleware/auth');
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

// GET /api/users/applications — protected, returns job opportunities the user has applied for
router.get('/applications', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    // Find all vacancies where the user is in the everApplied array
    const vacancies = await Vacancy.find({ everApplied: userId })
      .select('title company location type salaryRange status applicantStatus applicantStatusHistory createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const InterviewSession = require('../models/InterviewSession');
    const latestSession = await InterviewSession.findOne({ user: userId })
      .sort({ interviewedAt: -1 })
      .select('googleMeetLink interviewedAt')
      .lean();
    const meetLink = latestSession?.googleMeetLink || '';
    const interviewedAt = latestSession?.interviewedAt || null;

    // Map the results to include the user's specific status
    const applications = vacancies.map(v => ({
      _id: v._id,
      title: v.title,
      company: v.company,
      location: v.location,
      type: v.type,
      salaryRange: v.salaryRange,
      jobStatus: v.status, // The status of the job itself (active/closed)
      applicantStatus: v.applicantStatus && v.applicantStatus[userId.toString()] ? v.applicantStatus[userId.toString()] : 'pending',
      statusHistory: v.applicantStatusHistory && v.applicantStatusHistory[userId.toString()] ? v.applicantStatusHistory[userId.toString()] : [],
      appliedAt: v.createdAt, // We use job created at for now, or could just show it.
      googleMeetLink: meetLink,
      interviewedAt: interviewedAt
    }));

    res.json(applications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/stats — public, returns counts by userType for hero section
router.get('/stats', async (req, res) => {
  try {
    const base = { isDeleted: { $ne: true }, hidden: { $ne: true }, role: { $ne: 'admin' } };
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
    const filter = { role: { $ne: 'admin' }, isDeleted: { $ne: true }, hidden: { $ne: true } };
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
    const limit = Math.min(parseInt(req.query.limit) || 5, 200);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const users = await require('../models/User').find(
      { role: { $ne: 'admin' }, isDeleted: { $ne: true }, hidden: { $ne: true }, userType: 'developer', avatar: { $exists: true, $ne: '' } },
      { name: 1, avatar: 1, userType: 1 }
    ).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/showcase-devs — devs with photo + approved projects, at a registration offset
router.get('/showcase-devs', optionalAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Project = require('../models/Project');
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const limit = Math.min(parseInt(req.query.limit) || 3, 10);

    // Only developers who have a profile photo
    const allDevs = await User.find(
      {
        role: { $ne: 'admin' },
        isDeleted: { $ne: true },
        hidden: { $ne: true },
        userType: 'developer',
        avatar: { $exists: true, $ne: '' },
      },
      { password: 0, googleId: 0, adminNote: 0 }
    ).sort({ createdAt: -1 }).lean();

    // Get approved project counts for all these devs
    const allIds = allDevs.map(d => d._id);
    const projects = await Project.find(
      { owner: { $in: allIds }, status: 'approved' },
      { owner: 1, title: 1 }
    ).lean();

    const projectMap = {};
    for (const p of projects) {
      const key = p.owner.toString();
      if (!projectMap[key]) projectMap[key] = [];
      projectMap[key].push(p.title);
    }

    // Filter to only devs with at least 1 approved project, then apply skip/limit
    const result = allDevs
      .map(d => ({
        ...d,
        projectNames: projectMap[d._id.toString()] || [],
        projectCount: (projectMap[d._id.toString()] || []).length,
      }))
      .filter(d => d.projectCount > 0)
      .slice(skip, skip + limit);

    const reqUser = req.user;
    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedResult = result.map(d => {
      const isSelf = reqUser && reqUser._id.toString() === d._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete d.email;
        delete d.phone;
        delete d.cvUrl;
        if (d.resumeData && d.resumeData.personalInfo) {
          delete d.resumeData.personalInfo.email;
          delete d.resumeData.personalInfo.phone;
        }
      }
      return d;
    });

    res.json(sanitizedResult);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/developers — sorted by community engagement (likes/ratings/comments given to others)
router.get('/developers', optionalAuth, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const LIMIT = 12;
    const skip  = (page - 1) * LIMIT;
    const search = req.query.search?.trim();

    const safeSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchStage = { userType: 'developer', role: { $ne: 'admin' }, isDeleted: { $ne: true } };
    if (!req.user || (req.user.role !== 'admin' && !req.user.hidden)) {
      matchStage.hidden = { $ne: true };
    }
    if (safeSearch) matchStage.name = { $regex: safeSearch, $options: 'i' };
    if (req.query.freelance === 'true') matchStage.freelanceAvailable = true;
    if (req.query.designation?.trim()) {
      const safeDesig = req.query.designation.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchStage.designations = { $elemMatch: { $regex: safeDesig, $options: 'i' } };
    }

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

    // Job alert eligibility — only need to know if ≥1 exists
    const jobAlertLookup = {
      $lookup: {
        from: 'sessionrequests',
        let: { uid: '$_id' },
        pipeline: [
          { $match: {
              $expr: { $eq: ['$user', '$$uid'] },
              serviceKey: 'ats_compatible_resume_cover_letter_optimization',
              status: 'completed',
              completionLink: { $nin: ['', null] }
          }},
          { $limit: 1 },
          { $project: { _id: 1 } },
        ],
        as: '_jobAlertSessions',
      }
    };

    const [result] = await User.aggregate([
      { $match: matchStage },
      ownProjectsLookup,
      jobAlertLookup,
      {
        $addFields: {
          hasProjects:        { $gt: [{ $size: '$projects' }, 0] },
          isPremium:          { $gt: [{ $size: { $ifNull: ['$premiumServices', []] } }, 0] },
          hasCoins:           { $gt: [{ $ifNull: ['$points', 0] }, 0] },
          lastProjectAt:      { $max: '$projects.createdAt' },
          isJobAlertPremium:  { $cond: [{ $gt: [{ $size: '$_jobAlertSessions' }, 0] }, 1, 0] },
          isComplete: {
            $cond: [
              {
                $and: [
                  { $gt: [{ $strLenCP: { $ifNull: ['$phone', ''] } }, 0] },
                  { $gte: [
                    {
                      $add: [
                        { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$linkedinUrl', ''] } }, 0] }, 1, 0] },
                        { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$githubUrl', ''] } }, 0] }, 1, 0] },
                        { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$leetcodeUrl', ''] } }, 0] }, 1, 0] },
                        { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$portfolioUrl', ''] } }, 0] }, 1, 0] },
                      ]
                    },
                    2
                  ]}
                ]
              },
              1, 0
            ]
          }
        },
      },
      {
        $addFields: {
          displayCategory: {
            $switch: {
              branches: [
                { case: '$isPremium', then: 0 },
                {
                  case: { $and: [{ $in: ['$badge', ['active', 'top', 'champion']] }, '$hasCoins'] },
                  then: 1
                },
                {
                  case: { $and: [{ $not: { $in: ['$badge', ['active', 'top', 'champion']] } }, '$hasCoins'] },
                  then: 2
                },
                {
                  case: { $and: [{ $in: ['$badge', ['active', 'top', 'champion']] }, { $not: '$hasCoins' }] },
                  then: 3
                }
              ],
              default: 4
            }
          },
        }
      },
      // Pre-compute a single composite sort key so $setWindowFields can use exactly one field
      {
        $addFields: {
          _sortKey: {
            $concat: [
              { $toString: '$isComplete' },
              '_',
              { $toString: '$isJobAlertPremium' },
              '_',
              { $cond: ['$hasProjects', '1', '0'] },
              '_',
              { $dateToString: { date: '$lastProjectAt', format: '%Y-%m-%dT%H:%M:%S.%LZ', onNull: '0000-01-01T00:00:00.000Z' } },
              '_',
              { $dateToString: { date: '$createdAt', format: '%Y-%m-%dT%H:%M:%S.%LZ', onNull: '0000-01-01T00:00:00.000Z' } },
            ]
          }
        }
      },
      // Assign a rank within each displayCategory using the single sort key
      {
        $setWindowFields: {
          partitionBy: '$displayCategory',
          sortBy: { _sortKey: -1 },
          output: {
            categoryRank: { $documentNumber: {} }
          }
        }
      },
      // Interleaved sort: rank-1 premium + rank-1 active + rank-1 new, rank-2 of each, etc.
      { $sort: { categoryRank: 1, displayCategory: 1 } },
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
                _jobAlertSessions: 0, _progress: 0, hasProjects: 0,
                categoryRank: 0, _sortKey: 0,
              },
            },
          ],
        },
      },
    ]);

    const developers = result?.developers ?? [];
    const totalCount = result?.total?.[0]?.n ?? 0;

    const reqUser = req.user;
    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedDevs = developers.map(dev => {
      const isSelf = reqUser && reqUser._id.toString() === dev._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete dev.email;
        delete dev.phone;
        delete dev.cvUrl;
        if (dev.resumeData && dev.resumeData.personalInfo) {
          delete dev.resumeData.personalInfo.email;
          delete dev.resumeData.personalInfo.phone;
        }
      }
      return dev;
    });

    res.json({
      developers: sanitizedDevs,
      total: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / LIMIT),
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
          ...((!req.user || (req.user.role !== 'admin' && !req.user.hidden)) ? { hidden: { $ne: true } } : {}),
          isDeleted: { $ne: true },
          $and: [
            { cvUrl: { $exists: true, $nin: ['', null] } },
            { cvUrl: { $not: /^(https?:\/\/)?drive\.google\.com\/?$/i } },
            { $nor: [{
              'resumeData.summary': 'empty',
              'resumeData.skills.0': { $exists: false },
              'resumeData.techStack.0': { $exists: false },
              'resumeData.experience.0': { $exists: false },
            }] },
          ],
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

    const reqUser = req.user;
    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedMentors = mentors.map(m => {
      const isSelf = reqUser && reqUser._id.toString() === m._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete m.email;
        delete m.phone;
      }
      return m;
    });

    const mentorIds = mentors.map(m => m._id);
    const projectCounts = await Project.aggregate([
      { $match: { owner: { $in: mentorIds }, status: 'approved' } },
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(projectCounts.map(p => [p._id.toString(), p.count]));

    res.json(sanitizedMentors.map(m => ({ ...m, projectCount: countMap[m._id.toString()] || 0 })));
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

const wordMatchCache = new Map();

function isWordMatch(hay, needle) {
  let re = wordMatchCache.get(needle);
  if (!re) {
    if (wordMatchCache.size > 5000) wordMatchCache.clear();
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    re = new RegExp(`(?:^|[\\s,./\\-+#])${escaped}(?:[\\s,./\\-+#]|$)`, 'i');
    wordMatchCache.set(needle, re);
  }
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
    const baseRoles  = (extracted.roles      || []).map(r => r.toLowerCase());
    const niceToHave = (extracted.niceToHave || []).map(s => s.toLowerCase());

    // Expand roles: React → also match MERN; Angular → also match MEAN
    const roleExpansions = [];
    const rolesStr = baseRoles.join(' ');
    if (/\breact\b/.test(rolesStr)) roleExpansions.push('mern stack developer', 'mern stack');
    if (/\bangular\b/.test(rolesStr)) roleExpansions.push('mean stack developer', 'mean stack');
    const roles = [...new Set([...baseRoles, ...roleExpansions])];
    const jdLevel    = (extracted.level      || 'any').toLowerCase();
    const minYears   = typeof extracted.minYears === 'number' ? extracted.minYears : null;
    const locationType  = (extracted.locationType  || 'any').toLowerCase();
    const locationCity  = extracted.locationCity?.toLowerCase().trim() || null;
    const locationState = extracted.locationState?.toLowerCase().trim() || null;
    const isOnsiteJob   = locationType === 'onsite' && (locationCity || locationState);

    // 2. Fetch all eligible developers with their approved projects
    const filter = {
      userType: { $in: ['developer', 'mentee'] },
      role: { $ne: 'admin' },
      isDeleted: { $ne: true },
    };
    if (!req.user || (req.user.role !== 'admin' && !req.user.hidden)) {
      filter.hidden = { $ne: true };
    }
    const developers = await User.find(filter).select('-password -googleId -adminNote').lean();

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

    const isEmptySummaryPlaceholder = dev =>
      dev.resumeData &&
      dev.resumeData.summary === 'empty' &&
      !dev.resumeData.skills?.length &&
      !dev.resumeData.techStack?.length &&
      !dev.resumeData.experience?.length;

    const hasValidResume = dev => {
      if (isEmptySummaryPlaceholder(dev)) return false;
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
      .filter(dev => !isEmptySummaryPlaceholder(dev) && hasProfileData(dev) && locationFilter(dev))
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
        let matchScore = rawScore * levelMul;

        // Experience years bonus (additive, max +3)
        if (minYears !== null && minYears > 0) {
          const yearsScore = Math.min(getDevYears(dev) / minYears, 1.5);
          matchScore += yearsScore * 2;
        }

        // jobMode match vs JD locationType (+1.0)
        if (locationType !== 'any' && devJobModes.length > 0) {
          if (devJobModes.some(m => m.includes(locationType) || locationType.includes(m))) {
            matchScore += 1.0;
          }
        }

        // Nice-to-have skills (low weight bonus)
        if (niceToHave.length > 0) {
          matchScore +=
            scoreMatches(techTags,          niceToHave) * 0.5 +
            scoreMatches(resumeSkills,      niceToHave) * 0.5 +
            scoreMatches(resumeStack,       niceToHave) * 0.3 +
            scoreMatches(resumeProjectTech, niceToHave) * 0.3 +
            scoreMatches(resumeCerts,       niceToHave) * 0.2;
        }

        // Profile completeness tie-breaker (max +1.5)
        matchScore += completenessBonus(dev);

        // JD match breakdown
        const allDevSkills = new Set([
          ...techTags, ...resumeSkills, ...resumeStack,
          ...resumeProjectTech, ...mentorTech, ...resumeCerts,
        ]);
        const matchedSkills = skills.filter(s => allDevSkills.has(s));
        const missingSkills = skills.filter(s => !allDevSkills.has(s));
        const matchPercent  = skills.length > 0 ? Math.round((matchedSkills.length / skills.length) * 100) : 0;

        return {
          ...dev,
          matchScore, rawScore,
          projectCount: projectMap[pid]?.count || 0,
          jdMatch: { matchedSkills, missingSkills, matchPercent },
        };
      })
      .filter(d => d.rawScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore || b.createdAt - a.createdAt)
      .slice(0, 40);

    const reqUser = req.user;
    const isClientRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedDevs = scored.map(dev => {
      const isSelf = reqUser && reqUser._id.toString() === dev._id.toString();
      if (!isClientRecruiterOrAdmin && !isSelf) {
        delete dev.email;
        delete dev.phone;
        delete dev.cvUrl;
        if (dev.resumeData && dev.resumeData.personalInfo) {
          delete dev.resumeData.personalInfo.email;
          delete dev.resumeData.personalInfo.phone;
        }
      }
      return dev;
    });

    res.json({ developers: sanitizedDevs, extracted });
  } catch (err) {
    console.error('find-developers error:', err);
    res.status(500).json({ message: 'Search failed. Please try again.' });
  }
});

// POST /api/users/:id/portfolio-visit — notify developer when a recruiter views their portfolio
router.post('/:id/portfolio-visit', protect, async (req, res) => {
  try {
    if (req.user.userType !== 'recruiter') return res.status(403).json({ message: 'Recruiter only' });
    const ownerId = req.params.id;
    if (ownerId === req.user._id.toString()) return res.json({ ok: true });

    const Notification = require('../models/Notification');
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Notification.exists({
      user: ownerId,
      fromUser: req.user._id,
      type: 'recruiter_visit',
      createdAt: { $gte: since },
    });
    if (!existing) {
      await Notification.create({
        user: ownerId,
        fromUser: req.user._id,
        type: 'recruiter_visit',
        title: 'A recruiter viewed your profile',
        message: 'A recruiter visited your portfolio page.',
      });
    }
    res.json({ ok: true });
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
