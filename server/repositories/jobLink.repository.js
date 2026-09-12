const JobLink = require('../models/JobLink');
const JobLinkFeedback = require('../models/JobLinkFeedback');
const CompanyContact = require('../models/CompanyContact');
const User = require('../models/User');
const FreeOffer = require('../models/FreeOffer');
const Plan = require('../models/Plan');
const Vacancy = require('../models/Vacancy');

class JobLinkRepository {
  async findClickedLinksByUser(userId) {
    return await JobLink.find({ clicks: userId }).select('_id').lean();
  }

  async findWeeklyApplyDocs(userId, since) {
    return await JobLink.find({
      clickEvents: { $elemMatch: { user: userId, at: { $gte: since } } },
    }).select('_id').lean();
  }

  async getUser(userId) {
    return await User.findById(userId).select('name email premiumServices freePremiumGrant').lean();
  }

  async getFreeOfferByUser(userId) {
    return await FreeOffer.findOne({ user: userId }).select('_id').lean();
  }

  async getPlanByName(name) {
    return await Plan.findOne({ name }).select('price').lean();
  }

  async getActiveJobLinks(activeThreshold) {
    return await JobLink.find({
      status: 'approved',
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: { $exists: false }, createdAt: { $gte: activeThreshold } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name avatar profileImage designations linkedinUrl')
      .lean();
  }

  async createJobLink(data) {
    return await JobLink.create(data);
  }

  async findJobLinkById(id) {
    return await JobLink.findById(id);
  }

  async findJobLinkByIdPopulated(id, populateFields) {
    return await JobLink.findById(id).populate(populateFields).lean();
  }

  async getAdminJobLinks() {
    return await JobLink.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email avatar profileImage')
      .populate('clicks', 'name email')
      .lean();
  }

  async saveJobLink(jobLink) {
    return await jobLink.save();
  }

  async findApprovedLinks(limit = 300) {
    return await JobLink.find({ status: 'approved' })
      .select('title company url status createdAt')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  async findVacancyMatch(companyRegex, titleRegex) {
    return await Vacancy.findOne({
      company: companyRegex,
      title: titleRegex,
      status: { $in: ['active', 'pending'] },
    }).select('title company status').lean();
  }

  async upsertCompanyContact(companyName, emailToAdd) {
    const updateDoc = {};
    if (emailToAdd) {
      updateDoc.$addToSet = { emails: emailToAdd };
    }
    return await CompanyContact.findOneAndUpdate(
      { name: { $regex: new RegExp(`^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
      { 
        $setOnInsert: { name: companyName },
        ...updateDoc
      },
      { upsert: true, new: true }
    );
  }

  async upsertFeedback(user, jobLink, heardBack) {
    return await JobLinkFeedback.findOneAndUpdate(
      { user, jobLink },
      { heardBack },
      { new: true, upsert: true }
    );
  }

  async getAdminFeedback() {
    return await JobLinkFeedback.find()
      .populate('user', 'name email avatar')
      .populate('jobLink', 'title company')
      .sort({ createdAt: -1 })
      .lean();
  }

  async getAdminCompanies() {
    return await CompanyContact.find().sort({ createdAt: -1 }).lean();
  }
}

module.exports = new JobLinkRepository();
