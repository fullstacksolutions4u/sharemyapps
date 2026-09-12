const FreeOffer = require('../models/FreeOffer');
const User = require('../models/User');
const PremiumService = require('../models/PremiumService');
const ProjectModel = require('../models/Project');

class FreeOfferRepository {
  async findOfferByUser(userId) {
    return await FreeOffer.findOne({ user: userId });
  }

  async findOfferByUserLean(userId) {
    return await FreeOffer.findOne({ user: userId }).lean();
  }

  async createOffer(data) {
    return await FreeOffer.create(data);
  }

  async getAdminOffers(skip, limit, filter) {
    const [offers, total] = await Promise.all([
      FreeOffer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar phone designations')
        .lean(),
      FreeOffer.countDocuments(filter),
    ]);
    return { offers, total };
  }

  async updateOffer(id, update) {
    return await FreeOffer.findByIdAndUpdate(id, { $set: update }, { new: true })
      .populate('user', 'name email avatar _id');
  }

  async deleteOffer(id) {
    return await FreeOffer.findByIdAndDelete(id);
  }

  async getOfferStats() {
    const [pending, approved, rejected] = await Promise.all([
      FreeOffer.countDocuments({ status: 'pending' }),
      FreeOffer.countDocuments({ status: 'approved' }),
      FreeOffer.countDocuments({ status: 'rejected' }),
    ]);
    return { pending, approved, rejected };
  }

  async findOfferByIdLean(id) {
    return await FreeOffer.findById(id).lean();
  }

  async findOfferById(id) {
    return await FreeOffer.findById(id);
  }

  async saveOffer(offer) {
    return await offer.save();
  }

  async getAllPremiumServices() {
    return await PremiumService.find({ active: true }).select('key').lean();
  }

  async getUserById(userId) {
    return await User.findById(userId);
  }

  async getOfferPortfolio(id) {
    const offer = await FreeOffer.findById(id)
      .populate('user', 'name email avatar bio phone linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl familiarTech designations yearsOfExperience joiningAvailability currentSalary expectedSalary preferredLocations jobMode place district state country regNumber badge userType createdAt')
      .lean();
    if (!offer) return null;

    const projects = await ProjectModel.find({ owner: offer.user._id })
      .select('title description liveUrl techTags bannerImage status category appType createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return { offer, projects };
  }
}

module.exports = new FreeOfferRepository();
