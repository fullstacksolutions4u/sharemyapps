const User = require('../models/User');

const FREE_LIMIT = 5;
const PAID_PACK_SIZE = 5;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const jdQuota = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('jdQuota userType');
    if (!user) return res.status(401).json({ message: 'User not found.' });

    const month = currentMonth();
    const quota = user.jdQuota || {};

    // Reset free count on new calendar month
    if (quota.resetMonth !== month) {
      quota.freeUsed = 0;
      quota.resetMonth = month;
    }

    const freeUsed = quota.freeUsed ?? 0;
    const paidRemaining = quota.paidRemaining ?? 0;

    if (freeUsed < FREE_LIMIT) {
      // Consume one free analysis
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.freeUsed': freeUsed + 1, 'jdQuota.resetMonth': month } }
      );
      req.jdQuotaInfo = { freeUsed: freeUsed + 1, paidRemaining, freeLimit: FREE_LIMIT };
      return next();
    }

    if (paidRemaining > 0) {
      // Consume one paid analysis
      await User.updateOne(
        { _id: user._id },
        { $set: { 'jdQuota.paidRemaining': paidRemaining - 1 } }
      );
      req.jdQuotaInfo = { freeUsed, paidRemaining: paidRemaining - 1, freeLimit: FREE_LIMIT };
      return next();
    }

    return res.status(403).json({
      code: 'QUOTA_EXCEEDED',
      message: 'You have used all 5 free JD analyses for this month.',
      freeUsed,
      paidRemaining,
      freeLimit: FREE_LIMIT,
      paidPackSize: PAID_PACK_SIZE,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { jdQuota, FREE_LIMIT, PAID_PACK_SIZE, currentMonth };
