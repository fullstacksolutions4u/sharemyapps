const User = require('../models/User');
const Vacancy = require('../models/Vacancy');
const InterviewSession = require('../models/InterviewSession');
const Notification = require('../models/Notification');

class UserProfileRepository {
  async getVacanciesApplied(userId) {
    return await Vacancy.find({ everApplied: userId })
      .select('title company location type salaryRange status applicantStatus applicantStatusHistory applicantPositions createdAt')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getInterviewSessions(userId) {
    return await InterviewSession.find({ user: userId })
      .sort({ interviewedAt: 1 })
      .select('googleMeetLink interviewedAt status')
      .lean();
  }

  async getUserClientProjects(userId) {
    const user = await User.findById(userId).select('clientProjects');
    return user?.clientProjects || [];
  }

  async addClientProject(userId, project) {
    return await User.findByIdAndUpdate(userId, { $push: { clientProjects: project } });
  }

  async updateClientProjects(user) {
    return await user.save();
  }

  async findUserById(userId) {
    return await User.findById(userId);
  }

  async notificationExists(query) {
    return await Notification.exists(query);
  }

  async createNotification(data) {
    return await Notification.create(data);
  }
}

module.exports = new UserProfileRepository();
