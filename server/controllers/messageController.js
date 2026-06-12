const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');
const { sendFeedbackEmail } = require('../utils/email');

exports.replyMessage = async (req, res) => {
  try {
    const original = await Message.findById(req.params.id);
    if (!original) return res.status(404).json({ message: 'Message not found' });
    if (original.recipient.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Forbidden' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Reply text required' });

    const msg = await Message.create({
      sender: req.user._id,
      recipient: original.sender,
      project: original.project,
      text,
    });
    await msg.populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title' }]);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const recipientId = project.owner.toString();
    if (recipientId === req.user._id.toString())
      return res.status(400).json({ message: 'You cannot message yourself' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Message text required' });

    const msg = await Message.create({
      sender: req.user._id,
      recipient: project.owner,
      project: project._id,
      text,
    });
    await msg.populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title' }]);
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id })
      .populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title liveUrl bannerImage' }])
      .sort({ createdAt: -1 })
      .lean();
    const unreadCount = messages.filter(m => !m.read).length;
    res.json({ messages, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate([{ path: 'recipient', select: 'name avatar' }, { path: 'project', select: 'title' }])
      .sort({ createdAt: -1 })
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    const msg = await Message.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { read: true },
      { new: true }
    );
    if (!msg) return res.status(404).json({ message: 'Not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await Message.updateMany({ recipient: req.user._id, read: false }, { read: true });
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.adminSendMessage = async (req, res) => {
  try {
    const recipient = await User.findById(req.params.id);
    if (!recipient) return res.status(404).json({ message: 'User not found' });
    if (recipient._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'Cannot send message to yourself' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Message text required' });

    const msg = await Message.create({
      sender: req.user._id,
      recipient: recipient._id,
      text,
    });
    await msg.populate('sender', 'name avatar');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendToAdmin = async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) return res.status(404).json({ message: 'No admin available' });
    if (admin._id.toString() === req.user._id.toString())
      return res.status(400).json({ message: 'You are the admin' });

    const text = req.body.text?.trim();
    if (!text) return res.status(400).json({ message: 'Message text required' });

    const msg = await Message.create({
      sender: req.user._id,
      recipient: admin._id,
      text,
    });
    await msg.populate('sender', 'name avatar');
    res.status(201).json(msg);

    sendFeedbackEmail({
      senderName: req.user.name,
      senderEmail: req.user.email,
      text,
    }).catch(() => {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
