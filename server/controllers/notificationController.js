const notificationService = require('../services/notification.service');

exports.getNotifications = async (req, res, next) => {
  try {
    const result = await notificationService.getNotifications(req.user._id);
    res.json(result);
  } catch (err) { next(err); }
};

exports.markRead = async (req, res, next) => {
  try {
    const result = await notificationService.markRead(req.user._id, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await notificationService.markAllRead(req.user._id);
    res.json(result);
  } catch (err) { next(err); }
};
