const Notification = require('../models/Notification');

class NotificationRepository {
  async getNotifications(userId, limit = 30) {
    return await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countUnread(userId) {
    return await Notification.countDocuments({ user: userId, read: false });
  }

  async markRead(userId, notificationId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { read: true },
      { new: true }
    );
  }

  async markAllRead(userId) {
    return await Notification.updateMany({ user: userId, read: false }, { read: true });
  }
}

module.exports = new NotificationRepository();
