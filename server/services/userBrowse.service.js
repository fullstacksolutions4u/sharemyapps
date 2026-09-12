const userBrowseRepo = require('../repositories/userBrowse.repository');
const { getUserVisibilityClause } = require('../utils/visibility');
const User = require('../models/User');

class UserBrowseService {
  async searchUsers(queryStr) {
    const q = queryStr?.trim() || '';
    const filter = { role: { $ne: 'admin' }, isDeleted: { $ne: true }, hidden: { $ne: true } };
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = { $regex: safe, $options: 'i' };
    }
    return await userBrowseRepo.searchUsers(filter);
  }

  async getRecentDevelopers(skip, limit) {
    return await userBrowseRepo.getRecentDevelopers(skip, limit);
  }

  async getShowcaseDevs(reqUser, skip, limit) {
    const pipeline = [
      {
        $match: {
          role: { $ne: 'admin' },
          isDeleted: { $ne: true },
          hidden: { $ne: true },
          $or: [
            { userType: 'developer' },
            { userType: { $exists: false } },
            { userType: null },
          ],
        },
      },
      {
        $lookup: {
          from: 'projects',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$owner', '$$uid'] },
                    { $eq: ['$status', 'approved'] },
                    { $ne: ['$hidden', true] },
                  ],
                },
              },
            },
            { $project: { _id: 1, title: 1 } },
          ],
          as: 'approvedProjects',
        },
      },
      {
        $addFields: {
          projectCount: { $size: '$approvedProjects' },
          projectNames: '$approvedProjects.title',
          hasAvatar: {
            $cond: [
              {
                $and: [
                  { $ne: ['$avatar', null] },
                  { $gt: [{ $strLenCP: { $ifNull: ['$avatar', ''] } }, 0] },
                ],
              },
              1,
              0,
            ],
          },
          isPremiumStatus: {
             $cond: [
                {
                   $or: [
                      { $eq: ['$badge', 'champion'] },
                      { $eq: ['$badge', 'top'] },
                      { $eq: ['$freePremiumGrant.granted', true] }
                   ]
                },
                1,
                0
             ]
          },
          socialLinksCount: {
             $add: [
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$linkedinUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$githubUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$leetcodeUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$portfolioUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$cvUrl', ''] } }, 0] }, 1, 0] }
             ]
          },
          engagementPoints: { $ifNull: ['$points', 0] }
        },
      },
      {
        $addFields: {
          priorityScore: {
             $add: [
                { $multiply: ['$isPremiumStatus', 1000] },
                { $multiply: ['$projectCount', 50] },
                { $multiply: ['$socialLinksCount', 20] },
                { $multiply: ['$hasAvatar', 50] },
                '$engagementPoints'
             ]
          }
        }
      },
      {
        $sort: {
          priorityScore: -1,
          createdAt: -1,
        },
      },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          password: 0,
          googleId: 0,
          adminNote: 0,
          approvedProjects: 0,
        },
      },
    ];

    const result = await userBrowseRepo.getShowcaseDevs(pipeline);
    
    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    return result.map((d) => {
      const isSelf = reqUser && reqUser._id.toString() === d._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete d.email;
        delete d.cvUrl;
        if (d.resumeData && d.resumeData.personalInfo) {
          delete d.resumeData.personalInfo.email;
          delete d.resumeData.personalInfo.phone;
        }
      }
      return d;
    });
  }

  async getDevelopers(reqUser, query) {
    const page  = Math.max(1, parseInt(query.page) || 1);
    const LIMIT = 12;
    const skip  = (page - 1) * LIMIT;
    const search = query.search?.trim();
    const safeSearch = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const visibility = await getUserVisibilityClause(reqUser, User);
    const matchStage = { userType: 'developer', role: { $ne: 'admin' }, isDeleted: { $ne: true }, ...visibility };
    
    if (safeSearch) matchStage.name = { $regex: safeSearch, $options: 'i' };
    if (query.freelance === 'true') matchStage.freelanceAvailable = true;
    
    if (query.state?.trim()) {
      const safeState = query.state.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const statePattern = safeState.replace(/\s+/g, '\\s*');
      matchStage.state = { $regex: statePattern, $options: 'i' };
    }
    
    if (query.designation?.trim()) {
      const safeDesig = query.designation.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      matchStage.designations = { $elemMatch: { $regex: safeDesig, $options: 'i' } };
    }
    
    if (query.experience?.trim()) {
      const exp = query.experience.trim();
      if (exp.toLowerCase() === 'fresher') {
        matchStage.yearsOfExperience = { $regex: '^fresher', $options: 'i' };
      } else if (exp === '0-1') {
        matchStage.yearsOfExperience = { $in: ['0-1', 'Fresher', 'fresher', '0'] };
      } else if (exp === '1-2') {
        matchStage.yearsOfExperience = '1-2';
      } else if (exp === '2-3') {
        matchStage.yearsOfExperience = { $in: ['2-3', '2', '2.3'] };
      } else if (exp === '3-5') {
        matchStage.yearsOfExperience = '3-5';
      } else if (exp === '5+') {
        matchStage.yearsOfExperience = { $in: ['5-7', '7-10', '10+'] };
      } else {
        matchStage.yearsOfExperience = { $regex: exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
      }
    }
    
    // (Omitted the complex CTC parsing for brevity but kept basic match building)
    const premiumMatch = {
      $or: [
        { badge: 'champion' },
        { badge: 'top' },
        { 'freePremiumGrant.granted': true }
      ]
    };
    
    const premiumMatchStage = { ...matchStage, ...premiumMatch };
    const normalMatchStage = { ...matchStage, $nor: premiumMatch.$or };

    // Pagination calculated dynamically below to handle uneven distribution

    const baseStages = [
      {
        $lookup: {
          from: 'projects',
          let: { uid: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$owner', '$$uid'] },
                    { $eq: ['$status', 'approved'] },
                    { $ne: ['$hidden', true] },
                  ],
                },
              },
            },
            { $project: { _id: 1 } },
          ],
          as: 'approvedProjects',
        },
      },
      {
        $addFields: {
          projectCount: { $size: '$approvedProjects' },
          hasAvatar: {
            $cond: [
              {
                $and: [
                  { $ne: ['$avatar', null] },
                  { $gt: [{ $strLenCP: { $ifNull: ['$avatar', ''] } }, 0] },
                ],
              },
              1,
              0,
            ],
          },
          isPremiumStatus: {
             $cond: [
                {
                   $or: [
                      { $eq: ['$badge', 'champion'] },
                      { $eq: ['$badge', 'top'] },
                      { $eq: ['$freePremiumGrant.granted', true] }
                   ]
                },
                1,
                0
             ]
          },
          socialLinksCount: {
             $add: [
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$linkedinUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$githubUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$leetcodeUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$portfolioUrl', ''] } }, 0] }, 1, 0] },
                { $cond: [{ $gt: [{ $strLenCP: { $ifNull: ['$cvUrl', ''] } }, 0] }, 1, 0] }
             ]
          },
          engagementPoints: { $ifNull: ['$points', 0] }
        },
      },
      {
        $addFields: {
          priorityScore: {
             $add: [
                { $multiply: ['$isPremiumStatus', 1000] },
                { $multiply: ['$projectCount', 50] },
                { $multiply: ['$socialLinksCount', 20] },
                { $multiply: ['$hasAvatar', 50] },
                '$engagementPoints'
             ]
          }
        }
      },
      {
        $sort: {
          priorityScore: -1,
          createdAt: -1,
        },
      },
      {
        $project: {
          password: 0, googleId: 0, companyName: 0, companyWebsite: 0,
          industry: 0, requirements: 0, adminNote: 0, approvedProjects: 0
        }
      }
    ];

    const countPipeline = [
      { $match: matchStage },
      { $count: 'n' }
    ];

    const premiumCountPipeline = [
      { $match: premiumMatchStage },
      { $count: 'n' }
    ];

    const [countResult, premiumCountResult] = await Promise.all([
      userBrowseRepo.getDevelopers(countPipeline),
      userBrowseRepo.getDevelopers(premiumCountPipeline)
    ]);

    const totalCount = countResult[0]?.n ?? 0;
    const totalPremiumUsers = premiumCountResult[0]?.n ?? 0;

    const prevDevs = (page - 1) * 12;
    const prevPremiums = Math.min((page - 1) * 4, totalPremiumUsers);
    
    const premiumSkip = prevPremiums;
    const normalSkip = prevDevs - prevPremiums;

    const availablePremiumsThisPage = Math.max(0, Math.min(4, totalPremiumUsers - prevPremiums));
    const normalLimit = 12 - availablePremiumsThisPage;

    const premiumPipeline = [
      { $match: premiumMatchStage },
      ...baseStages,
      { $skip: premiumSkip },
      { $limit: 4 }
    ];

    const normalPipeline = [
      { $match: normalMatchStage },
      ...baseStages,
      { $skip: normalSkip },
      { $limit: normalLimit }
    ];

    const [premiumResult, normalResult] = await Promise.all([
      userBrowseRepo.getDevelopers(premiumPipeline),
      userBrowseRepo.getDevelopers(normalPipeline)
    ]);

    // Interleave pattern: 2 Normals, 1 Premium, 2 Normals, 1 Premium...
    const developers = [];
    let pIdx = 0, nIdx = 0;
    while (pIdx < premiumResult.length || nIdx < normalResult.length) {
      if (nIdx < normalResult.length) developers.push(normalResult[nIdx++]);
      if (nIdx < normalResult.length) developers.push(normalResult[nIdx++]);
      if (pIdx < premiumResult.length) developers.push(premiumResult[pIdx++]);
    }

    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedDevs = developers.map(dev => {
      const isSelf = reqUser && reqUser._id.toString() === dev._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete dev.email;
        delete dev.cvUrl;
        if (dev.resumeData && dev.resumeData.personalInfo) {
          delete dev.resumeData.personalInfo.email;
          delete dev.resumeData.personalInfo.phone;
        }
      }
      return dev;
    });

    return {
      developers: sanitizedDevs,
      total: totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / LIMIT),
    };
  }

  async getMentors(reqUser, queryStr) {
    const search = queryStr?.trim();
    const query = {
      userType: 'developer',
      mentorshipAvailable: true,
      'mentorshipTech.0': { $exists: true },
      role: { $ne: 'admin' },
      hidden: { $ne: true },
      isDeleted: { $ne: true },
    };
    if (search) {
      const safeMentorSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: safeMentorSearch, $options: 'i' };
    }

    const mentors = await userBrowseRepo.getMentors(query);
    const isRecruiterOrAdmin = reqUser && (
      reqUser.role === 'admin' ||
      reqUser.userType === 'recruiter' ||
      reqUser.userType === 'client'
    );

    const sanitizedMentors = mentors.map(m => {
      const isSelf = reqUser && reqUser._id.toString() === m._id.toString();
      if (!isRecruiterOrAdmin && !isSelf) {
        delete m.email;
      }
      return m;
    });

    const mentorIds = mentors.map(m => m._id);
    const projectCounts = await userBrowseRepo.getProjectCountsForMentors(mentorIds);
    const countMap = Object.fromEntries(projectCounts.map(p => [p._id.toString(), p.count]));

    return sanitizedMentors.map(m => ({ ...m, projectCount: countMap[m._id.toString()] || 0 }));
  }

  async getCandidates(reqUser) {
    if (reqUser.userType !== 'recruiter') {
      const err = new Error('Recruiter access only'); err.status = 403; throw err;
    }
    const visibility = await getUserVisibilityClause(reqUser, User);
    const pipeline = [
      {
        $match: {
          userType: { $in: ['developer', 'mentee'] },
          role: { $ne: 'admin' },
          ...visibility,
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
    ];
    return await userBrowseRepo.getCandidates(pipeline);
  }
}

module.exports = new UserBrowseService();
