const User = require('../models/User');

const DAILY_LIMIT = 50;

module.exports = async function aiLimit(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const user = await User.findById(req.user._id).select('aiUsageCount aiUsageDate');

    const count = user.aiUsageDate === today ? user.aiUsageCount : 0;

    if (count >= DAILY_LIMIT) {
      return res.status(429).json({
        message: `Daily AI limit reached. You can use this feature ${DAILY_LIMIT} times per day. Try again tomorrow.`,
        limitReached: true,
      });
    }

    await User.updateOne(
      { _id: req.user._id },
      { aiUsageCount: count + 1, aiUsageDate: today }
    );

    next();
  } catch (err) {
    next(err);
  }
};
