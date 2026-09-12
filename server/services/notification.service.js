const notificationRepo = require('../repositories/notification.repository');

class NotificationService {
  async getNotifications(userId) {
    const [notifications, unreadCount] = await Promise.all([
      notificationRepo.getNotifications(userId),
      notificationRepo.countUnread(userId),
    ]);
    return { notifications, unreadCount };
  }

  async markRead(userId, notificationId) {
    await notificationRepo.markRead(userId, notificationId);
    return { success: true };
  }

  async markAllRead(userId) {
    await notificationRepo.markAllRead(userId);
    return { success: true };
  }
}

module.exports = new NotificationService();
