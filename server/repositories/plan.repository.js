const Plan = require('../models/Plan');
const SiteConfig = require('../models/SiteConfig');

class PlanRepository {
  async countPlans() {
    return await Plan.countDocuments();
  }

  async insertMany(plans) {
    return await Plan.insertMany(plans);
  }

  async findPlanByName(name) {
    return await Plan.findOne({ name });
  }

  async findPlanByNameLean(name) {
    return await Plan.findOne({ name }).lean();
  }

  async createPlan(data) {
    return await Plan.create(data);
  }

  async updatePlanStatus(name, active) {
    return await Plan.updateOne({ name }, { $set: { active } });
  }

  async findActivePlans() {
    return await Plan.find({ active: true }).sort({ order: 1 }).lean();
  }

  async findAllPlans() {
    return await Plan.find().sort({ order: 1 }).lean();
  }

  async updatePlanById(id, data) {
    return await Plan.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deletePlanById(id) {
    return await Plan.findByIdAndDelete(id);
  }

  async updatePremiumServicePrice(pricePaise) {
    return await SiteConfig.findOneAndUpdate(
      { key: 'main' },
      { $set: { premiumServicePricePaise: pricePaise } },
      { upsert: true }
    );
  }
}

module.exports = new PlanRepository();
