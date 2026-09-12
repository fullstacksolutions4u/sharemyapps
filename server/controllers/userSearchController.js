const User = require('../models/User');
const Project = require('../models/Project');
const { extractJDRequirements } = require('../utils/aiExtract');
const { getUserVisibilityClause } = require('../utils/visibility');

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

exports.findDevelopers = async (req, res) => {
  try {
    const { jd } = req.body;
    if (!jd?.trim() || jd.trim().length < 30) {
      return res.status(400).json({ message: 'Please provide a more detailed job description.' });
    }

    const extracted = await extractJDRequirements(jd.trim());
    const skills     = (extracted.skills     || []).map(s => s.toLowerCase());
    const baseRoles  = (extracted.roles      || []).map(r => r.toLowerCase());
    const niceToHave = (extracted.niceToHave || []).map(s => s.toLowerCase());

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

    const visibility = await getUserVisibilityClause(req.user, User);
    const filter = {
      userType: { $in: ['developer', 'mentee'] },
      role: { $ne: 'admin' },
      isDeleted: { $ne: true },
      ...visibility,
    };
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

        const resumeSkills       = toArr(dev.resumeData?.skills).map(s => s.toLowerCase());
        const resumeStack        = toArr(dev.resumeData?.techStack).map(s => s.toLowerCase());
        const resumeProjectTech  = (dev.resumeData?.projects || []).flatMap(p => toArr(p.techStack)).map(s => s.toLowerCase());
        const resumeRoles        = (dev.resumeData?.experience || []).map(e => (e.role || '').toLowerCase()).filter(Boolean);
        const resumeCerts        = (dev.resumeData?.certifications || []).map(c => (c.name || '').toLowerCase()).filter(Boolean);

        const techTags     = projectMap[pid]?.techTags || [];
        const mentorTech   = toArr(dev.mentorshipTech).map(t => t.toLowerCase());
        const designations = toArr(dev.designations).map(d => d.toLowerCase());
        const langPref     = toArr(dev.languagePreference).map(l => l.toLowerCase());
        const devJobModes  = toArr(dev.jobMode).map(m => m.toLowerCase());

        const rawScore =
          scoreMatches(techTags,          skills) * 3   +
          scoreMatches(resumeSkills,      skills) * 3   +
          scoreMatches(resumeStack,       skills) * 2   +
          scoreMatches(resumeProjectTech, skills) * 1.5 +
          scoreMatches(mentorTech,        skills) * 2   +
          scoreMatches(designations,      roles)  * 2   +
          scoreMatches(resumeRoles,       roles)  * 1.5 +
          scoreMatches(langPref,          skills) * 1;

        const devLevel = inferDevLevel(dev);
        const levelMul = LEVEL_MULTIPLIER[jdLevel]?.[devLevel] ?? 1.0;
        let matchScore = rawScore * levelMul;

        if (minYears !== null && minYears > 0) {
          const yearsScore = Math.min(getDevYears(dev) / minYears, 1.5);
          matchScore += yearsScore * 2;
        }

        if (locationType !== 'any' && devJobModes.length > 0) {
          if (devJobModes.some(m => m.includes(locationType) || locationType.includes(m))) {
            matchScore += 1.0;
          }
        }

        if (niceToHave.length > 0) {
          matchScore +=
            scoreMatches(techTags,          niceToHave) * 0.5 +
            scoreMatches(resumeSkills,      niceToHave) * 0.5 +
            scoreMatches(resumeStack,       niceToHave) * 0.3 +
            scoreMatches(resumeProjectTech, niceToHave) * 0.3 +
            scoreMatches(resumeCerts,       niceToHave) * 0.2;
        }

        matchScore += completenessBonus(dev);

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
};
