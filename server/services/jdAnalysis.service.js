const jdRepo = require('../repositories/jdAnalysis.repository');
const { currentDay } = require('../middleware/jdQuota');
const { getConfig } = require('../utils/configCache');

class JDAnalysisService {
  async saveSearchHistory(userId, data) {
    const jdTrimmed = data.jd.trim();
    return await jdRepo.saveHistory({
      user: userId,
      jd: jdTrimmed,
      jdSnippet: jdTrimmed.slice(0, 120).replace(/\s+/g, ' '),
      extracted: data.extracted || {},
      resultCount: data.resultCount || 0,
      developers: data.developers || [],
    });
  }

  async getSearchHistory(userId) {
    return await jdRepo.getHistoryByUser(userId);
  }

  async deleteSearchHistory(id, userId) {
    await jdRepo.deleteHistory(id, userId);
    return { ok: true };
  }

  async adminGetUserJDHistory(userId) {
    return await jdRepo.getHistoryByAdmin(userId);
  }

  async clearAllSearchHistory(userId) {
    await jdRepo.clearAllHistory(userId);
    return { ok: true };
  }

  async getQuota(userId) {
    const [user, cfg] = await Promise.all([
      jdRepo.getUserJDQuota(userId),
      getConfig(),
    ]);

    const quota = user?.jdQuota || {};
    const day = currentDay();

    const dailyUsed = quota.resetDay === day ? (quota.dailyUsed ?? 0) : 0;
    const paidRemaining = quota.paidRemaining ?? 0;

    return {
      freeUsed: dailyUsed,
      freeLimit: cfg.jdFreeLimit,
      paidRemaining,
      paidPackSize: cfg.jdPaidPackSize,
      packPricePaise: cfg.jdPackPricePaise,
      featureEnabled: cfg.jdFeatureEnabled,
      resetDay: day,
    };
  }
}

module.exports = new JDAnalysisService();
