const InterviewSession = require('../models/InterviewSession');
const User = require('../models/User');
const Notification = require('../models/Notification');

class InterviewRepository {
  async getSessions(filter, skip, limit) {
    const sessions = await InterviewSession.find(filter)
      .populate('user', 'name email avatar regNumber designations familiarTech yearsOfExperience place state linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl joiningAvailability currentSalary expectedSalary')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company description skills location type industry jobType experience salaryRange status')
      .sort({ interviewedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await InterviewSession.countDocuments(filter);
    return { sessions, total };
  }

  async getUserSessions(userId) {
    return await InterviewSession.find({ user: userId })
      .populate('user', 'name email avatar regNumber designations linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl joiningAvailability currentSalary expectedSalary')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company description skills location type industry jobType experience salaryRange status')
      .sort({ sessionNumber: -1 })
      .lean();
  }

  async findUserById(userId) {
    return await User.findById(userId).lean();
  }

  async getLastUserSession(userId) {
    return await InterviewSession.findOne({ user: userId })
      .sort({ sessionNumber: -1 })
      .lean();
  }

  async getLastSession() {
    return await InterviewSession.findOne()
      .sort({ sessionNumber: -1 })
      .lean();
  }

  async createSession(data) {
    return await InterviewSession.create(data);
  }

  async findSessionById(id) {
    return await InterviewSession.findById(id)
      .populate('user', 'name email avatar regNumber designations linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl joiningAvailability currentSalary expectedSalary')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company description skills location type industry jobType experience salaryRange status');
  }

  async findSessionByIdLean(id) {
    return await InterviewSession.findById(id).lean();
  }

  async updateSession(id, data) {
    return await InterviewSession.findByIdAndUpdate(id, data, { new: true })
      .populate('user', 'name email avatar regNumber designations linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl joiningAvailability currentSalary expectedSalary')
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title company description skills location type industry jobType experience salaryRange status');
  }

  async deleteSession(id) {
    return await InterviewSession.findByIdAndDelete(id);
  }

  async saveSession(session) {
    return await session.save();
  }

  async createNotification(data) {
    return await Notification.create(data);
  }

  async getMyFeedback(userId) {
    return await InterviewSession.find({
      user: userId,
      sharedWithCandidate: true,
    })
      .populate('evaluatedBy', 'name avatar')
      .populate('vacancy', 'title')
      .sort({ sessionNumber: -1 })
      .lean();
  }
}

module.exports = new InterviewRepository();
