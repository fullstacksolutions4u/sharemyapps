const User = require('../models/User');
const { getConfig } = require('../utils/configCache');

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function currentDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const DAILY_LIMIT = 15;

const jdQuota = async (req, res, next) => {
  try {
    const cfg = await getConfig();

    const user = await User.findById(req.user._id).select('jdQuota userType');
    if (!user) return res.status(401).json({ message: 'User not found.' });

    const month = currentMonth();
    const day   = currentDay();
    const quota = user.jdQuota || {};

    // Reset daily counter if it's a new day
    const dailyUsed = quota.resetDay === day ? (quota.dailyUsed ?? 0) : 0;

    if (dailyUsed >= DAILY_LIMIT) {
      return res.status(403).json({
        code: 'DAILY_LIMIT_EXCEEDED',
        message: `You have reached the daily limit of ${DAILY_LIMIT} JD analyses. Please try again tomorrow.`,
        dailyUsed,
        dailyLimit: DAILY_LIMIT,
      });
    }

    // Feature disabled → free access, only daily limit applies
    if (!cfg.jdFeatureEnabled) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.dailyUsed': dailyUsed + 1, 'jdQuota.resetDay': day } }
      );
      req.jdQuotaInfo = { free: true, dailyUsed: dailyUsed + 1, dailyLimit: DAILY_LIMIT };
      return next();
    }

    // Feature enabled → monthly free quota + paid packs (+ daily cap above)
    const FREE_LIMIT     = cfg.jdFreeLimit;
    const PAID_PACK_SIZE = cfg.jdPaidPackSize;

    if (quota.resetMonth !== month) {
      quota.freeUsed = 0;
      quota.resetMonth = month;
    }

    const freeUsed      = quota.freeUsed ?? 0;
    const paidRemaining = quota.paidRemaining ?? 0;

    if (freeUsed < FREE_LIMIT) {
      await User.updateOne(
        { _id: user._id },
        { $set: {
          'jdQuota.freeUsed': freeUsed + 1,
          'jdQuota.resetMonth': month,
          'jdQuota.dailyUsed': dailyUsed + 1,
          'jdQuota.resetDay': day,
        }}
      );
      req.jdQuotaInfo = { freeUsed: freeUsed + 1, paidRemaining, freeLimit: FREE_LIMIT, dailyUsed: dailyUsed + 1 };
      return next();
    }

    if (paidRemaining > 0) {
      await User.updateOne(
        { _id: user._id },
        { $set: {
          'jdQuota.paidRemaining': paidRemaining - 1,
          'jdQuota.dailyUsed': dailyUsed + 1,
          'jdQuota.resetDay': day,
        }}
      );
      req.jdQuotaInfo = { freeUsed, paidRemaining: paidRemaining - 1, freeLimit: FREE_LIMIT, dailyUsed: dailyUsed + 1 };
      return next();
    }

    return res.status(403).json({
      code: 'QUOTA_EXCEEDED',
      message: 'You have used all your free JD analyses for this month.',
      freeUsed,
      paidRemaining,
      freeLimit: FREE_LIMIT,
      paidPackSize: PAID_PACK_SIZE,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { jdQuota, currentMonth };
