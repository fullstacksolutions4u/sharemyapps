const adminRepo = require('../repositories/admin.repository');
const { sendProjectApprovedEmail, sendProjectRejectedEmail, sendAdminCustomEmail } = require('../utils/email');
const { generateAndUploadThumbnail } = require('../utils/thumbnailGenerator');

class AdminService {
  async getPendingProjects() {
    return await adminRepo.getPendingProjects();
  }

  async getAllProjects(options) {
    const { status, page, limit, search } = options;
    const p = Math.max(1, parseInt(page));
    const l = parseInt(limit);
    const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    if (safeSearch) {
      const searchMatch = {
        ...(status ? { status } : {}),
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { 'owner.name': { $regex: safeSearch, $options: 'i' } },
          { 'owner.email': { $regex: safeSearch, $options: 'i' } },
        ],
      };
      const result = await adminRepo.searchProjects(searchMatch, p, l);
      const searchTotal = result?.total[0]?.n || 0;
      return { projects: result?.projects || [], total: searchTotal, page: p, pages: Math.ceil(searchTotal / l) || 1 };
    }

    const filter = status ? { status } : {};
    const { total, projects } = await adminRepo.getAllProjects(filter, p, l);
    return { projects, total, page: p, pages: Math.ceil(total / l) || 1 };
  }

  async updateProjectStatus(id, data) {
    const { status, adminNote } = data;
    const project = await adminRepo.findProjectByIdPopulated(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }

    project.status = status;
    if (adminNote !== undefined) project.adminNote = adminNote || '';
    await adminRepo.saveProject(project);

    if (status === 'approved' && project.liveUrl && !project.bannerImage) {
      generateAndUploadThumbnail(project.liveUrl).then(async (url) => {
        if (url) {
          project.bannerImage = url;
          await adminRepo.saveProject(project);
        }
      }).catch(err => console.error('Background thumbnail failed:', err.message));
    }

    const owner = project.owner;
    if (owner && status === 'approved') {
      await adminRepo.createNotification({
        user: owner._id,
        type: 'approved',
        title: 'Project Approved!',
        message: adminNote
          ? `Your project "${project.title}" has been approved and is now live. Admin tip: ${adminNote}`
          : `Your project "${project.title}" has been approved and is now live.`,
        project: project._id,
      });
      await adminRepo.createActivity({
        user: owner._id,
        type: 'PROJECT_APPROVED',
        project: project._id,
        createdAt: project.createdAt,
      }).catch(err => console.error('Activity creation failed:', err.message));

      sendProjectApprovedEmail({
        to: owner.email,
        name: owner.name,
        projectTitle: project.title,
        projectId: project._id,
        adminNote,
      }).catch(err => console.error('Approval email failed:', err.message));
    } else if (owner && status === 'rejected') {
      await adminRepo.createNotification({
        user: owner._id,
        type: 'rejected',
        title: 'Project Needs Changes',
        message: adminNote
          ? `Your project "${project.title}" was not approved. Admin note: ${adminNote}`
          : `Your project "${project.title}" was not approved. Please review and resubmit.`,
        project: project._id,
      });
      sendProjectRejectedEmail({
        to: owner.email,
        name: owner.name,
        projectTitle: project.title,
        projectId: project._id,
        adminNote,
      }).catch(err => console.error('Rejection email failed:', err.message));
    }

    return project;
  }

  async adminUpdateProject(id, data) {
    const project = await adminRepo.findProjectById(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }

    const { title, description, liveUrl, appType, category, techTags, contactEmail, contactPhone, linkedinUrl, githubUrls, githubVisible } = data;

    if (title) project.title = title;
    if (description) project.description = description;
    if (liveUrl) project.liveUrl = liveUrl;
    if (appType) project.appType = appType;
    if (category !== undefined) project.category = category;
    if (techTags !== undefined) {
      project.techTags = Array.isArray(techTags) ? techTags : techTags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (contactEmail !== undefined) project.contactEmail = contactEmail;
    if (contactPhone !== undefined) project.contactPhone = contactPhone;
    if (linkedinUrl !== undefined) project.linkedinUrl = linkedinUrl;
    if (githubUrls !== undefined) {
      project.githubUrls = (Array.isArray(githubUrls) ? githubUrls : [githubUrls]).map(u => u.trim()).filter(Boolean);
    }
    if (githubVisible !== undefined) project.githubVisible = githubVisible !== 'false' && githubVisible !== false;

    await adminRepo.saveProject(project);
    await project.populate('owner', 'name email avatar');
    return project;
  }

  async getAllUsers(options) {
    const isPaginated = options.page !== undefined || options.tab !== undefined || options.paginated === 'true';
    const userSelect = '_id name email avatar role userType onboardingComplete phone linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl cvWasPlaceholder badge regNumber hidden isBlocked isDeleted createdAt deletedAt points adminNote designations resumeData companyName companyWebsite industry hrName requirements freelanceAvailable freelanceRate mentorshipAvailable mentorshipRate mentorshipTech familiarTech mentorshipSchedule languagePreference gender place district state country dateOfBirth yearsOfExperience currentSalary expectedSalary preferredLocations jobMode menteeProfile clientProfile';

    if (isPaginated) {
      const page = Math.max(1, parseInt(options.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 10));
      const tab = options.tab || 'developers';
      const search = (options.search || '').trim();
      const filterPlaceholderCv = options.filterPlaceholderCv === 'true';
      const filterUpdatedCv = options.filterUpdatedCv === 'true';

      const match = {};
      if (tab === 'deleted') {
        match.isDeleted = true;
      } else {
        match.isDeleted = { $ne: true };
        if (tab === 'developers') match.userType = 'developer';
        else if (tab === 'recruiters') match.userType = 'recruiter';
        else if (tab === 'clients') match.userType = 'client';
        else if (tab === 'mentees') match.userType = 'mentee';
      }

      if (search) {
        match.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { regNumber: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      if (filterPlaceholderCv) {
        match.cvUrl = { $regex: /drive\.google\.com/i };
      } else if (filterUpdatedCv) {
        match.cvWasPlaceholder = true;
        match.cvUrl = { $exists: true, $ne: '' };
      }

      const [
        total, devCount, recruiterCount, clientCount, menteeCount, deletedCount,
        missingCvCount, missingSummaryCount, placeholderCvCount, updatedCvCount,
        allDesignations, pageUsers,
      ] = await Promise.all([
        adminRepo.countUsers(match),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'developer' }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'recruiter' }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'client' }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'mentee' }),
        adminRepo.countUsers({ isDeleted: true }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'developer', $or: [{ cvUrl: { $exists: false } }, { cvUrl: '' }, { cvUrl: null }] }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'developer', cvUrl: { $exists: true }, $and: [{ cvUrl: { $ne: '' } }, { cvUrl: { $ne: null } }], 'resumeData.summary': { $exists: false } }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'developer', cvUrl: { $regex: /drive\.google\.com/i } }),
        adminRepo.countUsers({ isDeleted: { $ne: true }, userType: 'developer', cvWasPlaceholder: true, cvUrl: { $exists: true }, $and: [{ cvUrl: { $ne: '' } }, { cvUrl: { $ne: null } }] }),
        adminRepo.distinctUsers('designations'),
        adminRepo.findUsers(match, userSelect, { createdAt: -1 }, (page - 1) * limit, limit),
      ]);

      const userIds = pageUsers.map(u => u._id);
      let statsMap = {};

      if (userIds.length > 0) {
        const stats = await adminRepo.aggregateProjectsForUsers(userIds);
        statsMap = Object.fromEntries(stats.map(s => [s._id.toString(), s]));
      }

      const ranks = await Promise.all(
        pageUsers.map(async u => {
          if (u.userType !== 'developer' || u.isDeleted) return null;
          const pts = u.points || 0;
          const higher = await adminRepo.countUsers({
            isDeleted: { $ne: true },
            userType: 'developer',
            $or: [
              { points: { $gt: pts } },
              { points: pts, createdAt: { $lt: u.createdAt } },
            ],
          });
          return higher + 1;
        })
      );

      const usersWithStats = pageUsers.map((u, i) => {
        const s = statsMap[u._id.toString()] || {};
        const projectCount = s.projectCount || 0;
        const totalLikes   = s.totalLikes   || 0;
        const avgRating    = s.avgRating    || 0;
        const ratingCount  = s.ratingCount  || 0;
        return {
          ...u,
          rank: ranks[i] || 1,
          projectCount,
          totalLikes,
          avgRating,
          engagementScore: totalLikes * 2 + avgRating * 10 + ratingCount,
        };
      });

      return {
        users: usersWithStats,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
        counts: {
          developers: devCount,
          recruiters: recruiterCount,
          clients: clientCount,
          mentees: menteeCount,
          deleted: deletedCount,
          missingCv: missingCvCount,
          missingSummary: missingSummaryCount,
          placeholderCv: placeholderCvCount,
          updatedCv: updatedCvCount,
        },
        allDesignations: (allDesignations || []).filter(Boolean),
      };
    }

    const query = {};
    if (options.userType) query.userType = options.userType;
    if (options.onlyContacted === 'true') {
      const contactedUserIds = await adminRepo.getContactedUserIds();
      query._id = { $in: contactedUserIds };
    }

    const limit = options.limit ? parseInt(options.limit) : 100;
    const users = await adminRepo.findUsers(query, userSelect, { createdAt: -1 }, 0, limit);
    return users;
  }

  async getResumes() {
    return await adminRepo.findResumes();
  }

  async toggleFeatured(id) {
    const project = await adminRepo.findProjectById(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }
    if (project.status !== 'approved') {
      const err = new Error('Only approved projects can be featured'); err.status = 400; throw err;
    }

    if (!project.featured) {
      const count = await adminRepo.countProjects({ featured: true });
      if (count >= 2) {
        const err = new Error('Only 2 projects can be featured at a time. Unfeature one first.'); err.status = 400; throw err;
      }
    }

    project.featured = !project.featured;
    await adminRepo.saveProject(project);
    return { featured: project.featured };
  }

  async adminToggleHidden(id) {
    const project = await adminRepo.findProjectById(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }
    project.hidden = !project.hidden;
    await adminRepo.saveProject(project);
    return { hidden: project.hidden };
  }

  async toggleUserHidden(id) {
    const user = await adminRepo.findUserById(id);
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    user.hidden = !user.hidden;
    await adminRepo.saveUser(user);
    return { hidden: user.hidden };
  }

  async setAdminNote(id, note) {
    const user = await adminRepo.updateUserAdminNote(id, note);
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    return { adminNote: user.adminNote };
  }

  async adminUpdateUser(id, data) {
    const strFields = [
      'name', 'phone', 'bio',
      'linkedinUrl', 'githubUrl', 'leetcodeUrl', 'portfolioUrl', 'cvUrl',
      'companyName', 'companyWebsite', 'industry', 'requirements',
      'badge', 'userType', 'joiningAvailability', 'place', 'district', 'state', 'country',
      'yearsOfExperience', 'adminNote',
    ];
    const update = {};
    for (const key of strFields) {
      if (data[key] !== undefined) update[key] = data[key];
    }
    if (data.hidden !== undefined) update.hidden = Boolean(data.hidden);
    if (data.isBlocked !== undefined) update.isBlocked = Boolean(data.isBlocked);
    if (data.freelanceAvailable !== undefined) update.freelanceAvailable = Boolean(data.freelanceAvailable);
    if (data.mentorshipAvailable !== undefined) update.mentorshipAvailable = Boolean(data.mentorshipAvailable);

    const toNum = v => (v === '' || v === null || v === undefined) ? null : Number(v);
    if (data.freelanceRate !== undefined) update.freelanceRate = toNum(data.freelanceRate);
    if (data.mentorshipRate !== undefined) update.mentorshipRate = toNum(data.mentorshipRate);
    if (data.currentSalary !== undefined) update.currentSalary = toNum(data.currentSalary);
    if (data.expectedSalary !== undefined) update.expectedSalary = toNum(data.expectedSalary);

    if (data.gender !== undefined)
      update.gender = ['male', 'female', 'other', ''].includes(data.gender) ? data.gender : '';
    if (data.dateOfBirth !== undefined)
      update.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;

    const toArr = (v) => (Array.isArray(v) ? v : [v]).map(s => String(s).trim()).filter(Boolean);
    if (data.designations !== undefined) update.designations = toArr(data.designations);
    if (data.mentorshipTech !== undefined) update.mentorshipTech = toArr(data.mentorshipTech);
    if (data.preferredLocations !== undefined) update.preferredLocations = toArr(data.preferredLocations);
    if (data.jobMode !== undefined) update.jobMode = toArr(data.jobMode);
    if (data.languagePreference !== undefined) update.languagePreference = toArr(data.languagePreference);

    if (data.menteeProfile !== undefined) update.menteeProfile = data.menteeProfile;
    if (data.clientProfile !== undefined) update.clientProfile = data.clientProfile;

    if (update.badge && !['new_member', 'active', 'top', 'champion'].includes(update.badge)) {
      const err = new Error('Invalid badge value'); err.status = 400; throw err;
    }
    if (update.userType && !['developer', 'client', 'recruiter', 'mentee', 'mentor'].includes(update.userType)) {
      const err = new Error('Invalid userType value'); err.status = 400; throw err;
    }

    const isPlaceholderCv = (u) => {
      const c = (u || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      return c === 'drive.google.com';
    };
    if (update.cvUrl !== undefined) {
      const existing = await adminRepo.findUserByIdSelect(id, 'cvUrl cvWasPlaceholder');
      if (existing && isPlaceholderCv(existing.cvUrl)) update.cvWasPlaceholder = true;
      if (isPlaceholderCv(update.cvUrl)) update.cvWasPlaceholder = true;
    }
    const user = await adminRepo.updateUser(id, update, '-password');
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    return user.toObject();
  }

  async setDesignation(id, designations) {
    const user = await adminRepo.updateUser(id, { designations }, '-password');
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    return { designations: user.designations };
  }

  async setBadge(id, badge) {
    const user = await adminRepo.updateUser(id, { badge }, '-password');
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    return user;
  }

  async setResumeData(id, resumeData) {
    const user = await adminRepo.findUserById(id);
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }

    user.resumeData = resumeData ?? null;

    if (resumeData) {
      const info = resumeData.personalInfo || {};
      const isEmpty = v => !v || (Array.isArray(v) && v.length === 0);

      if (isEmpty(user.place)             && info.place)                          user.place             = info.place;
      if (isEmpty(user.district)          && info.district)                       user.district          = info.district;
      if (isEmpty(user.state)             && info.state)                          user.state             = info.state;
      if (isEmpty(user.country)           && info.country)                        user.country           = info.country;
      if (isEmpty(user.linkedinUrl)       && info.linkedin)                       user.linkedinUrl       = info.linkedin;
      if (isEmpty(user.githubUrl)         && info.github)                         user.githubUrl         = info.github;
      if (isEmpty(user.portfolioUrl)      && info.portfolio)                      user.portfolioUrl      = info.portfolio;
      if (isEmpty(user.bio)               && info.summary)                        user.bio               = info.summary;
      if (isEmpty(user.preferredLocations) && resumeData.preferredLocations?.length) user.preferredLocations = resumeData.preferredLocations;
      if (isEmpty(user.jobMode)           && resumeData.jobMode?.length)          user.jobMode           = resumeData.jobMode;
      if (isEmpty(user.yearsOfExperience) && resumeData.totalExperienceYears)     user.yearsOfExperience = String(resumeData.totalExperienceYears);
      if (isEmpty(user.joiningAvailability) && resumeData.noticePeriod)           user.joiningAvailability = resumeData.noticePeriod;
      if (!user.expectedSalary            && resumeData.expectedSalary)           user.expectedSalary    = Number(resumeData.expectedSalary) || null;
      if (!user.currentSalary             && resumeData.currentSalary)            user.currentSalary     = Number(resumeData.currentSalary) || null;
    }

    await adminRepo.saveUser(user);
    return { resumeData: user.resumeData };
  }

  async deleteUser(id) {
    const user = await adminRepo.findUserById(id);
    if (!user) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }
    if (user.isDeleted) {
      const err = new Error('User is already deleted'); err.status = 400; throw err;
    }
    if (user.role === 'admin') {
      const err = new Error('Cannot delete admin accounts'); err.status = 403; throw err;
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    await Promise.all([
      adminRepo.saveUser(user),
      adminRepo.deleteUserRelated(user._id),
    ]);
    return { message: 'User deleted successfully' };
  }

  async deleteProject(id) {
    const project = await adminRepo.deleteProjectRelated(id);
    if (!project) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }
    await adminRepo.deleteActivitiesByProject(id);
    return { message: 'Project deleted successfully' };
  }

  async getStats() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      total, pending, approved, rejected, users, developers, clients, forSale,
      pendingVacancies, pendingOffers, pendingMentorships, usersToday, projectsToday
    ] = await Promise.all([
      adminRepo.countProjects({}),
      adminRepo.countProjects({ status: 'pending' }),
      adminRepo.countProjects({ status: 'approved' }),
      adminRepo.countProjects({ status: 'rejected' }),
      adminRepo.countUsers({}),
      adminRepo.countUsers({ userType: { $ne: 'client' } }),
      adminRepo.countUsers({ userType: 'client' }),
      adminRepo.countProjects({ forSale: true, status: 'approved' }),
      adminRepo.countVacancies({ status: 'pending', isViewed: { $ne: true } }),
      adminRepo.countFreeOffers({ status: 'pending' }),
      adminRepo.countMentorships({ status: 'pending' }),
      adminRepo.countUsers({ createdAt: { $gte: startOfToday } }),
      adminRepo.countProjects({ status: 'approved', updatedAt: { $gte: startOfToday } }),
    ]);

    return {
      total, pending, approved, rejected, users, developers, clients, forSale,
      pendingVacancies, pendingApplicants: pendingOffers + pendingMentorships,
      usersToday, projectsToday
    };
  }

  async getUserGrowth(mode, params) {
    if (mode === 'monthly') {
      const months = parseInt(params.months) || 12;
      const since = new Date();
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      since.setMonth(since.getMonth() - months + 1);

      const rows = await adminRepo.aggregateUsersMonthly(since);
      const map = Object.fromEntries(rows.map(r => [r._id, r.count]));
      const result = [];
      for (let i = 0; i < months; i++) {
        const d = new Date(since);
        d.setMonth(since.getMonth() + i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const key = `${year}-${month}`;
        result.push({ date: key, count: map[key] || 0 });
      }
      return result;
    }

    const days = parseInt(params.days) || 30;
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    since.setHours(0, 0, 0, 0);

    const rows = await adminRepo.aggregateUsersDaily(since);
    const map = Object.fromEntries(rows.map(r => [r._id, r.count]));
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${year}-${month}-${day}`;
      result.push({ date: key, count: map[key] || 0 });
    }
    return result;
  }

  async getEmailRecipients() {
    const users = await adminRepo.findUsersForEmail({
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    });
    return { users };
  }

  async sendCustomEmail(data) {
    let emailSubject = data.subject?.trim();
    let emailBody = data.body?.trim();
    if (data.templateId) {
      const template = await adminRepo.findEmailTemplateById(data.templateId);
      if (!template) {
        const err = new Error('Email template not found'); err.status = 404; throw err;
      }
      emailSubject = template.subject;
      emailBody = template.body;
    }

    if (!emailSubject) { const err = new Error('Subject is required'); err.status = 400; throw err; }
    if (!emailBody) { const err = new Error('Body is required'); err.status = 400; throw err; }
    if (!Array.isArray(data.userIds) || data.userIds.length === 0) {
      const err = new Error('Select at least one user'); err.status = 400; throw err;
    }

    const users = await adminRepo.findUsersForEmail({
      _id: { $in: data.userIds },
      isDeleted: { $ne: true },
      email: { $exists: true, $ne: '' },
    });
    
    if (users.length === 0) {
      const err = new Error('No valid recipients found'); err.status = 404; throw err;
    }

    const fillName = (text, name) => text.replace(/\{\{\s*name\s*\}\}/gi, name || 'there');
    let sent = 0;
    const failed = [];

    for (const u of users) {
      try {
        await sendAdminCustomEmail({
          to: u.email,
          name: u.name,
          subject: fillName(emailSubject, u.name),
          body: fillName(emailBody, u.name),
        });
        sent++;
      } catch (err) {
        console.error(`Admin email failed for ${u.email}:`, err.message);
        failed.push(u.email);
      }
    }

    return { sent, failed, total: users.length };
  }

  async getEmailTemplates() {
    return await adminRepo.findAllEmailTemplates();
  }

  async createEmailTemplate(adminId, data) {
    return await adminRepo.createEmailTemplate({
      name: data.name.trim(),
      subject: data.subject.trim(),
      body: data.body.trim(),
      createdBy: adminId,
    });
  }

  async updateEmailTemplate(id, data) {
    const template = await adminRepo.updateEmailTemplate(id, {
      name: data.name.trim(),
      subject: data.subject.trim(),
      body: data.body.trim()
    });
    if (!template) {
      const err = new Error('Template not found'); err.status = 404; throw err;
    }
    return template;
  }

  async deleteEmailTemplate(id) {
    const template = await adminRepo.deleteEmailTemplate(id);
    if (!template) {
      const err = new Error('Template not found'); err.status = 404; throw err;
    }
    return { message: 'Template deleted' };
  }

  async getCompanies() {
    const users = await adminRepo.findUsers(
      {
        resumeData: { $ne: null },
        isDeleted: { $ne: true },
        userType: { $ne: 'client' },
      },
      'name email avatar regNumber designations resumeData',
      {},
      undefined,
      undefined
    );

    const normalize = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');
    const companies = new Map(); 

    for (const u of users) {
      const rd = (u.resumeData && typeof u.resumeData === 'object') ? u.resumeData : {};
      const entries = [];

      if (Array.isArray(rd.workExperience)) {
        for (const w of rd.workExperience) {
          if (w && typeof w.company === 'string' && w.company.trim()) {
            entries.push({
              company: w.company,
              role: typeof w.role === 'string' ? w.role : '',
              period: [w.startDate, w.current ? 'Present' : w.endDate].filter(Boolean).join(' – '),
              current: !!w.current,
            });
          }
        }
      }

      if (Array.isArray(rd.experience)) {
        for (const w of rd.experience) {
          if (w && typeof w.company === 'string' && w.company.trim()) {
            entries.push({
              company: w.company,
              role: typeof w.role === 'string' ? w.role : '',
              period: typeof w.duration === 'string' ? w.duration : '',
              current: /present|current/i.test(w.duration || ''),
            });
          }
        }
      }

      const cc = rd.currentCompany || rd.current_company;
      if (typeof cc === 'string' && cc.trim() && !entries.some(e => normalize(e.company) === normalize(cc))) {
        entries.push({
          company: cc,
          role: typeof (rd.currentRole || rd.current_role) === 'string' ? (rd.currentRole || rd.current_role) : '',
          period: '',
          current: true,
        });
      }

      for (const e of entries) {
        const name = e.company.trim().replace(/\s+/g, ' ');
        const key = name.toLowerCase();
        if (!companies.has(key)) companies.set(key, { name, developers: [] });
        const company = companies.get(key);

        const userId = String(u._id);
        const stint = { role: e.role, period: e.period, current: e.current };
        const existing = company.developers.find(d => d.userId === userId);
        if (existing) {
          existing.stints.push(stint);
          existing.current = existing.current || e.current;
        } else {
          company.developers.push({
            userId,
            name: u.name,
            email: u.email,
            avatar: u.avatar || null,
            regNumber: u.regNumber || null,
            designations: Array.isArray(u.designations) ? u.designations.filter(Boolean) : [],
            current: e.current,
            stints: [stint],
          });
        }
      }
    }

    const result = [...companies.values()]
      .map(c => ({
        ...c,
        developerCount: c.developers.length,
        currentCount: c.developers.filter(d => d.current).length,
      }))
      .sort((a, b) => b.developerCount - a.developerCount || a.name.localeCompare(b.name));

    return { companies: result, totalCompanies: result.length, usersScanned: users.length };
  }
}

module.exports = new AdminService();
