const configRepo = require('../repositories/config.repository');
const { invalidateCache, getConfig } = require('../utils/configCache');

class ConfigService {
  async getAdminConfig() {
    return await getConfig();
  }

  async updateAdminConfig(updateData) {
    await configRepo.updateConfig(updateData);

    if (updateData.premiumServicePricePaise !== undefined) {
      const priceRupees = updateData.premiumServicePricePaise / 100;
      await configRepo.syncPlanPrices(priceRupees);
    }

    invalidateCache();
    return await getConfig();
  }
}

module.exports = new ConfigService();
