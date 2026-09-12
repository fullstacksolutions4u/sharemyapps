const userProfileService = require('../services/userProfile.service');

exports.getApplications = async (req, res, next) => {
  try {
    const result = await userProfileService.getApplications(req.user._id);
    res.json(result);
  } catch (err) { next(err); }
};

exports.getClientProjects = async (req, res, next) => {
  try {
    const result = await userProfileService.getClientProjects(req.user._id);
    res.json(result);
  } catch (err) { next(err); }
};

exports.addClientProject = async (req, res, next) => {
  try {
    const result = await userProfileService.addClientProject(req.user._id, req.body);
    res.status(201).json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.updateClientProject = async (req, res, next) => {
  try {
    const result = await userProfileService.updateClientProject(req.user._id, req.params.projectId, req.body);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteClientProject = async (req, res, next) => {
  try {
    const result = await userProfileService.deleteClientProject(req.user._id, req.params.projectId);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.recordPortfolioVisit = async (req, res, next) => {
  try {
    const result = await userProfileService.recordPortfolioVisit(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.toggleFollow = async (req, res, next) => {
  try {
    const result = await userProfileService.toggleFollow(req.params.id, req.user);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};
