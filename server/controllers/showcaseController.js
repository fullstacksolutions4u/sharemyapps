const showcaseService = require('../services/showcase.service');
const ShowcaseDto = require('../dtos/showcase.dto');

exports.listShowcases = async (req, res, next) => {
  try {
    const pages = await showcaseService.listShowcases();
    res.json({ pages });
  } catch (err) { next(err); }
};

exports.createShowcase = async (req, res, next) => {
  try {
    const data = ShowcaseDto.validateCreate(req.body);
    const page = await showcaseService.createShowcase(req.user._id, data);
    res.status(201).json({ page });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.updateShowcase = async (req, res, next) => {
  try {
    const data = ShowcaseDto.validateUpdate(req.body);
    const page = await showcaseService.updateShowcase(req.params.id, data);
    res.json({ page });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.deleteShowcase = async (req, res, next) => {
  try {
    const result = await showcaseService.deleteShowcase(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.toggleShowcase = async (req, res, next) => {
  try {
    const result = await showcaseService.toggleShowcase(req.params.id);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.getPublicShowcase = async (req, res, next) => {
  try {
    const result = await showcaseService.getPublicShowcase(req.params.slug);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};
