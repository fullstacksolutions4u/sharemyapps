const SiteConfig = require('../models/SiteConfig');
const Plan = require('../models/Plan');

class ConfigRepository {
  async updateConfig(updateData) {
    return await SiteConfig.findOneAndUpdate(
      { key: 'main' },
      { $set: updateData },
      { upsert: true, new: true }
    );
  }

  async syncPlanPrices(priceRupees) {
    return await Plan.updateMany({}, { $set: { price: priceRupees } });
  }
}

module.exports = new ConfigRepository();
