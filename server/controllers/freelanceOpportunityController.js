const freelanceService = require('../services/freelanceOpportunity.service');
const FreelanceOpportunityDto = require('../dtos/freelanceOpportunity.dto');

exports.getAllAdmin = async (req, res, next) => {
  try {
    const items = await freelanceService.getAllAdmin();
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = FreelanceOpportunityDto.validateCreate(req.body);
    const item = await freelanceService.create(req.user._id, data);
    res.status(201).json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = FreelanceOpportunityDto.validateUpdate(req.body);
    const item = await freelanceService.update(req.params.id, data);
    res.json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await freelanceService.remove(req.params.id);
    res.json(result);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const result = await freelanceService.toggleStatus(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToInterest = async (req, res, next) => {
  try {
    const data = FreelanceOpportunityDto.validateReply(req.body);
    const result = await freelanceService.replyToInterest(req.user._id, data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.showInterest = async (req, res, next) => {
  try {
    const result = await freelanceService.showInterest(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
