const messageService = require('../services/message.service');
const MessageDto = require('../dtos/message.dto');

exports.replyMessage = async (req, res, next) => {
  try {
    const data = MessageDto.validateReply(req.body);
    const msg = await messageService.replyMessage(req.user._id, req.params.id, data);
    res.status(201).json(msg);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const data = MessageDto.validateText(req.body);
    const msg = await messageService.sendMessage(req.user._id, req.params.id, data);
    res.status(201).json(msg);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getInbox = async (req, res, next) => {
  try {
    const result = await messageService.getInbox(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSent = async (req, res, next) => {
  try {
    const messages = await messageService.getSent(req.user._id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res, next) => {
  try {
    const msg = await messageService.markRead(req.user._id, req.params.id);
    res.json(msg);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.markAllRead = async (req, res, next) => {
  try {
    const result = await messageService.markAllRead(req.user._id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminSendMessage = async (req, res, next) => {
  try {
    const data = MessageDto.validateText(req.body);
    const msg = await messageService.adminSendMessage(req.user._id, req.params.id, data);
    res.status(201).json(msg);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.sendToAdmin = async (req, res, next) => {
  try {
    const data = MessageDto.validateText(req.body);
    const msg = await messageService.sendToAdmin(req.user, data);
    res.status(201).json(msg);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: err.message });
  }
};
