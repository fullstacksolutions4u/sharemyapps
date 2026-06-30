const User = require('../models/User');
const { getConfig } = require('../utils/configCache');

function currentDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const jdQuota = async (req, res, next) => {
  try {
    const cfg = await getConfig();
    const DAILY_LIMIT = cfg.jdFreeLimit ?? 5;

    const user = await User.findById(req.user._id).select('jdQuota userType');
    if (!user) return res.status(401).json({ message: 'User not found.' });

    const day   = currentDay();
    const quota = user.jdQuota || {};

    const dailyUsed = quota.resetDay === day ? (quota.dailyUsed ?? 0) : 0;

    // Feature disabled → free access with daily cap only
    if (!cfg.jdFeatureEnabled) {
      if (dailyUsed >= DAILY_LIMIT) {
        return res.status(403).json({
          code: 'DAILY_LIMIT_EXCEEDED',
          message: `You have reached the daily limit of ${DAILY_LIMIT} JD analyses. Please try again tomorrow.`,
          dailyUsed,
          dailyLimit: DAILY_LIMIT,
        });
      }
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.dailyUsed': dailyUsed + 1, 'jdQuota.resetDay': day } }
      );
      req.jdQuotaInfo = { free: true, dailyUsed: dailyUsed + 1, dailyLimit: DAILY_LIMIT };
      return next();
    }

    // Feature enabled → daily free limit, then paid packs
    const paidRemaining = quota.paidRemaining ?? 0;

    if (dailyUsed < DAILY_LIMIT) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.dailyUsed': dailyUsed + 1, 'jdQuota.resetDay': day } }
      );
      req.jdQuotaInfo = { freeUsed: dailyUsed + 1, paidRemaining, freeLimit: DAILY_LIMIT, dailyUsed: dailyUsed + 1 };
      return next();
    }

    if (paidRemaining > 0) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.paidRemaining': paidRemaining - 1, 'jdQuota.dailyUsed': dailyUsed + 1, 'jdQuota.resetDay': day } }
      );
      req.jdQuotaInfo = { freeUsed: dailyUsed, paidRemaining: paidRemaining - 1, freeLimit: DAILY_LIMIT, dailyUsed: dailyUsed + 1 };
      return next();
    }

    return res.status(403).json({
      code: 'QUOTA_EXCEEDED',
      message: `You have reached the daily limit of ${DAILY_LIMIT} JD analyses and have no paid analyses remaining.`,
      dailyUsed,
      paidRemaining,
      dailyLimit: DAILY_LIMIT,
      paidPackSize: cfg.jdPaidPackSize,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { jdQuota, currentDay };
