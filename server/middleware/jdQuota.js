const User = require('../models/User');
const { getConfig } = require('../utils/configCache');

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const jdQuota = async (req, res, next) => {
  try {
    const cfg = await getConfig();

    if (!cfg.jdFeatureEnabled) {
      return res.status(403).json({ code: 'FEATURE_DISABLED', message: 'JD analysis is currently disabled.' });
    }

    const FREE_LIMIT    = cfg.jdFreeLimit;
    const PAID_PACK_SIZE = cfg.jdPaidPackSize;

    const user = await User.findById(req.user._id).select('jdQuota userType');
    if (!user) return res.status(401).json({ message: 'User not found.' });

    const month = currentMonth();
    const quota = user.jdQuota || {};

    if (quota.resetMonth !== month) {
      quota.freeUsed = 0;
      quota.resetMonth = month;
    }

    const freeUsed      = quota.freeUsed ?? 0;
    const paidRemaining = quota.paidRemaining ?? 0;

    if (freeUsed < FREE_LIMIT) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.freeUsed': freeUsed + 1, 'jdQuota.resetMonth': month } }
      );
      req.jdQuotaInfo = { freeUsed: freeUsed + 1, paidRemaining, freeLimit: FREE_LIMIT };
      return next();
    }

    if (paidRemaining > 0) {
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.paidRemaining': paidRemaining - 1 } }
      );
      req.jdQuotaInfo = { freeUsed, paidRemaining: paidRemaining - 1, freeLimit: FREE_LIMIT };
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
