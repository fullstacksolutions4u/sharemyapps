const FreelanceOpportunity = require('../models/FreelanceOpportunity');
const Message = require('../models/Message');

exports.getAllAdmin = async (req, res) => {
  try {
    const items = await FreelanceOpportunity.find()
      .populate('interests', 'name email avatar regNumber userType')
      .sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, description, skills, budget, duration, type, status } = req.body;
    if (!title?.trim() || !description?.trim()) return res.status(400).json({ message: 'Title and description are required' });
    const skillArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills || [];
    const item = await FreelanceOpportunity.create({ title, description, skills: skillArr, budget, duration, type, status, createdBy: req.user._id });
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { skills, ...rest } = req.body;
    const skillArr = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills || [];
    const item = await FreelanceOpportunity.findByIdAndUpdate(req.params.id, { ...rest, skills: skillArr }, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.remove = async (req, res) => {
  try {
    await FreelanceOpportunity.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.toggleStatus = async (req, res) => {
  try {
    const item = await FreelanceOpportunity.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    item.status = item.status === 'active' ? 'closed' : 'active';
    await item.save();
    res.json({ status: item.status });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.replyToInterest = async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message?.trim()) return res.status(400).json({ message: 'userId and message required' });
    await Message.create({ sender: req.user._id, recipient: userId, text: message });
    res.json({ message: 'Sent' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.showInterest = async (req, res) => {
  try {
    const item = await FreelanceOpportunity.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    const uid = req.user._id.toString();
    const idx = item.interests.findIndex(i => i.toString() === uid);
    if (idx === -1) {
      item.interests.push(req.user._id);
      await item.save();
      res.json({ interested: true, interestCount: item.interests.length });
    } else {
      item.interests.splice(idx, 1);
      await item.save();
      res.json({ interested: false, interestCount: item.interests.length });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
