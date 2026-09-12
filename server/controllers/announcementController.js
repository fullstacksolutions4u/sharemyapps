const announcementService = require('../services/announcement.service');
const AnnouncementDto = require('../dtos/announcement.dto');

exports.getFeed = async (req, res, next) => {
  try {
    const feed = await announcementService.getFeed();
    res.json(feed);
  } catch (err) { next(err); }
};

exports.getActive = async (req, res, next) => {
  try {
    const items = await announcementService.getActive();
    res.json(items);
  } catch (err) { next(err); }
};

exports.getAll = async (req, res, next) => {
  try {
    const items = await announcementService.getAll();
    res.json(items);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const data = AnnouncementDto.validateCreate(req.body);
    const item = await announcementService.create(data);
    res.status(201).json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.toggle = async (req, res, next) => {
  try {
    const item = await announcementService.toggle(req.params.id);
    res.json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const data = AnnouncementDto.validateUpdate(req.body);
    const item = await announcementService.update(req.params.id, data);
    res.json(item);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const result = await announcementService.remove(req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};
