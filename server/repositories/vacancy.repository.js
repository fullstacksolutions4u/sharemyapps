const Vacancy = require('../models/Vacancy');
const User = require('../models/User');
const Notification = require('../models/Notification');
const InterviewSession = require('../models/InterviewSession');

class VacancyRepository {
  async getPublicVacancies() {
    return await Vacancy.find({
      createdBy: { $exists: true, $ne: null },
      listOnOpportunities: { $ne: false },
    }).sort({ status: 1, createdAt: -1 }).limit(200).lean();
  }

  async findActiveVacancyById(id) {
    return await Vacancy.findOne({ _id: id, status: 'active' });
  }

  async saveVacancy(vacancy) {
    return await vacancy.save();
  }

  async createVacancy(data) {
    return await Vacancy.create(data);
  }

  async getAllVacanciesAdmin() {
    return await Vacancy.find()
      .sort({ createdAt: -1 })
      .populate('interests', 'name email phone regNumber userType avatar cvUrl premiumServices freePremiumGrant')
      .populate('createdBy', 'name email phone companyName userType')
      .lean();
  }

  async updateVacancy(id, data) {
    return await Vacancy.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .populate('interests', 'name email phone regNumber userType avatar cvUrl');
  }

  async findVacancyById(id) {
    return await Vacancy.findById(id);
  }

  async createNotification(data) {
    return await Notification.create(data);
  }

  async deleteVacancy(id) {
    return await Vacancy.findByIdAndDelete(id);
  }

  async getUserById(id) {
    return await User.findById(id).select('name email');
  }

  async markVacancyViewed(id) {
    return await Vacancy.findByIdAndUpdate(id, { isViewed: true }, { new: true });
  }

  async getVacancyForSharedProfiles(id) {
    return await Vacancy.findById(id).select('title company description skills location type experience salaryRange');
  }

  async getInterviewSessionsForVacancy(vacancyId) {
    return await InterviewSession.find({ vacancy: vacancyId })
      .populate('user', 'name email phone linkedinUrl githubUrl portfolioUrl cvUrl avatar bio yearsOfExperience skills designations')
      .sort({ overallRating: -1 })
      .lean();
  }
}

module.exports = new VacancyRepository();
