const userProfileRepo = require('../repositories/userProfile.repository');
const mongoose = require('mongoose');
const { canSeeUser } = require('../utils/visibility');

class UserProfileService {
  async getApplications(userId) {
    const [vacancies, sessions] = await Promise.all([
      userProfileRepo.getVacanciesApplied(userId),
      userProfileRepo.getInterviewSessions(userId),
    ]);

    return vacancies.map(v => ({
      _id: v._id,
      title: v.title,
      company: v.company,
      location: v.location,
      type: v.type,
      salaryRange: v.salaryRange,
      jobStatus: v.status,
      applicantStatus: v.applicantStatus && v.applicantStatus[userId.toString()] ? v.applicantStatus[userId.toString()] : 'pending',
      appliedPosition: v.applicantPositions && v.applicantPositions[userId.toString()] ? v.applicantPositions[userId.toString()] : null,
      statusHistory: v.applicantStatusHistory && v.applicantStatusHistory[userId.toString()] ? v.applicantStatusHistory[userId.toString()] : [],
      appliedAt: v.createdAt,
      sessions: sessions
    }));
  }

  async getClientProjects(userId) {
    return await userProfileRepo.getUserClientProjects(userId);
  }

  async addClientProject(userId, data) {
    if (!data.projectName?.trim()) {
      const err = new Error('Project name is required'); err.status = 400; throw err;
    }

    const project = {
      _id: new mongoose.Types.ObjectId().toString(),
      projectName: data.projectName.trim(),
      budget: data.budget ? Number(data.budget) : null,
      duration: data.duration?.trim() || '',
      skillsNeeded: Array.isArray(data.skillsNeeded) ? data.skillsNeeded : [],
      experienceLevel: data.experienceLevel?.trim() || '',
      description: data.description?.trim() || '',
      status: data.status || 'open',
      createdAt: new Date(),
    };

    await userProfileRepo.addClientProject(userId, project);
    return project;
  }

  async updateClientProject(userId, projectId, data) {
    const user = await userProfileRepo.findUserById(userId);
    const idx = (user.clientProjects || []).findIndex(p => p._id === projectId);
    if (idx === -1) {
      const err = new Error('Project not found'); err.status = 404; throw err;
    }

    const existing = user.clientProjects[idx];
    user.clientProjects[idx] = {
      ...existing,
      projectName: data.projectName?.trim() || existing.projectName,
      budget: data.budget !== undefined ? (data.budget ? Number(data.budget) : null) : existing.budget,
      duration: data.duration?.trim() ?? existing.duration,
      skillsNeeded: Array.isArray(data.skillsNeeded) ? data.skillsNeeded : existing.skillsNeeded,
      experienceLevel: data.experienceLevel?.trim() ?? existing.experienceLevel,
      description: data.description?.trim() ?? existing.description,
      status: data.status || existing.status,
    };
    
    user.markModified('clientProjects');
    await userProfileRepo.updateClientProjects(user);
    return user.clientProjects[idx];
  }

  async deleteClientProject(userId, projectId) {
    const user = await userProfileRepo.findUserById(userId);
    user.clientProjects = (user.clientProjects || []).filter(p => p._id !== projectId);
    user.markModified('clientProjects');
    await userProfileRepo.updateClientProjects(user);
    return { message: 'Project deleted' };
  }

  async recordPortfolioVisit(ownerId, reqUser) {
    if (reqUser.userType !== 'recruiter') {
      const err = new Error('Recruiter only'); err.status = 403; throw err;
    }
    if (ownerId === reqUser._id.toString()) return { ok: true };

    const owner = await userProfileRepo.findUserById(ownerId);
    if (!owner || !canSeeUser(reqUser, owner)) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await userProfileRepo.notificationExists({
      user: ownerId,
      fromUser: reqUser._id,
      type: 'recruiter_visit',
      createdAt: { $gte: since },
    });
    
    if (!existing) {
      await userProfileRepo.createNotification({
        user: ownerId,
        fromUser: reqUser._id,
        type: 'recruiter_visit',
        title: 'A recruiter viewed your profile',
        message: 'A recruiter visited your portfolio page.',
      });
    }
    return { ok: true };
  }

  async toggleFollow(targetId, reqUser) {
    if (targetId === reqUser._id.toString()) {
      const err = new Error('You cannot follow yourself'); err.status = 400; throw err;
    }

    const target = await userProfileRepo.findUserById(targetId);
    if (!target || !canSeeUser(reqUser, target)) {
      const err = new Error('User not found'); err.status = 404; throw err;
    }

    const alreadyFollowing = target.followers.some(f => f.toString() === reqUser._id.toString());
    if (alreadyFollowing) {
      target.followers.pull(reqUser._id);
    } else {
      target.followers.addToSet(reqUser._id);
    }
    await target.save();
    return {
      following: !alreadyFollowing,
      followersCount: target.followers.length,
    };
  }
}

module.exports = new UserProfileService();
