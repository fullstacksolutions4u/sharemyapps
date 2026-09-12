const userBrowseService = require('../services/userBrowse.service');

exports.searchUsers = async (req, res, next) => {
  try {
    const result = await userBrowseService.searchUsers(req.query.q);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getRecentDevelopers = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 5, 200);
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const result = await userBrowseService.getRecentDevelopers(skip, limit);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getShowcaseDevs = async (req, res, next) => {
  try {
    const skip = Math.max(parseInt(req.query.skip) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 12, 1), 50);
    const result = await userBrowseService.getShowcaseDevs(req.user, skip, limit);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getDevelopers = async (req, res, next) => {
  try {
    const result = await userBrowseService.getDevelopers(req.user, req.query);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getMentors = async (req, res, next) => {
  try {
    const result = await userBrowseService.getMentors(req.user, req.query.search);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getCandidates = async (req, res, next) => {
  try {
    const result = await userBrowseService.getCandidates(req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};
