const Message = require('../models/Message');
const Project = require('../models/Project');
const User = require('../models/User');

class MessageRepository {
  async findMessageById(id) {
    return await Message.findById(id);
  }

  async createMessage(data) {
    return await Message.create(data);
  }

  async findProjectById(id) {
    return await Project.findById(id);
  }

  async findUserById(id) {
    return await User.findById(id);
  }

  async findAdminUser() {
    return await User.findOne({ role: 'admin' });
  }

  async getInboxMessages(userId) {
    return await Message.find({ recipient: userId })
      .populate([{ path: 'sender', select: 'name avatar' }, { path: 'project', select: 'title liveUrl bannerImage' }])
      .sort({ createdAt: -1 })
      .lean();
  }

  async getSentMessages(userId) {
    return await Message.find({ sender: userId })
      .populate([{ path: 'recipient', select: 'name avatar' }, { path: 'project', select: 'title' }])
      .sort({ createdAt: -1 })
      .lean();
  }

  async markAsRead(id, userId) {
    return await Message.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    );
  }

  async markAllAsRead(userId) {
    return await Message.updateMany({ recipient: userId, read: false }, { read: true });
  }
}

module.exports = new MessageRepository();
