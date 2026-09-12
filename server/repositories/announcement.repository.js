const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

class AnnouncementRepository {
  async getActiveAnnouncements() {
    return await Announcement.find({ active: true }).sort({ createdAt: -1 }).lean();
  }

  async getAllAnnouncements() {
    return await Announcement.find().sort({ createdAt: -1 }).lean();
  }

  async getRecentActivity() {
    return await Notification.find({ type: { $in: ['like', 'rated', 'commented'] } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate({ path: 'project', select: 'title owner', populate: { path: 'owner', select: 'name' } })
      .lean();
  }

  async createAnnouncement(data) {
    return await Announcement.create(data);
  }

  async findById(id) {
    return await Announcement.findById(id);
  }

  async updateById(id, data) {
    return await Announcement.findByIdAndUpdate(id, data, { new: true });
  }

  async deleteById(id) {
    return await Announcement.findByIdAndDelete(id);
  }
}

module.exports = new AnnouncementRepository();
