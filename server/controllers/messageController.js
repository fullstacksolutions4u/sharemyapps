const Message = require('../models/Message');
const Project = require('../models/Project');

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
    await msg.populate('sender', 'name avatar');
    await msg.populate('project', 'title');
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
    await msg.populate('sender', 'name avatar');
    await msg.populate('project', 'title');
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getInbox = async (req, res) => {
  try {
    const messages = await Message.find({ recipient: req.user._id })
      .populate('sender', 'name avatar')
      .populate('project', 'title liveUrl bannerImage')
      .sort({ createdAt: -1 });
    const unreadCount = messages.filter(m => !m.read).length;
    res.json({ messages, unreadCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getSent = async (req, res) => {
  try {
    const messages = await Message.find({ sender: req.user._id })
      .populate('recipient', 'name avatar')
      .populate('project', 'title')
      .sort({ createdAt: -1 });
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
