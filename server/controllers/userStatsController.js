const userStatsService = require('../services/userStats.service');

exports.getCount = async (req, res, next) => {
  try {
    const count = await userStatsService.getCount();
    res.json({ count });
  } catch (err) { next(err); }
};

exports.getOverviewStats = async (req, res, next) => {
  try {
    const stats = await userStatsService.getOverviewStats(req.user);
    res.json(stats);
  } catch (err) { next(err); }
};

exports.getHeroStats = async (req, res, next) => {
  try {
    const stats = await userStatsService.getHeroStats();
    res.json(stats);
  } catch (err) { next(err); }
};
