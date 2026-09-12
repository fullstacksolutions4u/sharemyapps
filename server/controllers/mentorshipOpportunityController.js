const mentorshipService = require('../services/mentorshipOpportunity.service');
const MentorshipOpportunityDto = require('../dtos/mentorshipOpportunity.dto');

exports.getAllAdmin = async (req, res, next) => {
  try {
    const items = await mentorshipService.getAllAdmin();
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = MentorshipOpportunityDto.validateCreate(req.body);
    const item = await mentorshipService.create(req.user._id, data);
    res.status(201).json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = MentorshipOpportunityDto.validateUpdate(req.body);
    const item = await mentorshipService.update(req.params.id, data);
    res.json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await mentorshipService.remove(req.params.id);
    res.json(result);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

exports.toggleStatus = async (req, res, next) => {
  try {
    const result = await mentorshipService.toggleStatus(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToInterest = async (req, res, next) => {
  try {
    const data = MentorshipOpportunityDto.validateReply(req.body);
    const result = await mentorshipService.replyToInterest(req.user._id, data);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.showInterest = async (req, res, next) => {
  try {
    const result = await mentorshipService.showInterest(req.params.id, req.user._id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
};
