const announcementRepo = require('../repositories/announcement.repository');

class AnnouncementService {
  async getFeed() {
    const [announcements, activity] = await Promise.all([
      announcementRepo.getActiveAnnouncements(),
      announcementRepo.getRecentActivity(),
    ]);

    const actionLabel = { like: 'a new like', rated: 'a rating', commented: 'a new comment' };

    const activityItems = activity
      .filter(n => n.project?.title && n.project?.owner?.name)
      .map(n => ({
        _id: n._id.toString() + '_a',
        text: `${n.project.title} by ${n.project.owner.name.split(' ')[0]} received ${actionLabel[n.type] || n.type}`,
        kind: 'activity',
        types: [n.type],
      }));

    const announcementItems = announcements.map(a => ({
      _id: a._id,
      text: a.text,
      kind: 'announcement',
    }));

    const feed = [];
    let ai = 0;
    for (let i = 0; i < activityItems.length; i++) {
      feed.push(activityItems[i]);
      if ((i + 1) % 3 === 0 && announcementItems.length > 0) {
        feed.push(announcementItems[ai % announcementItems.length]);
        ai++;
      }
    }
    if (activityItems.length === 0) feed.push(...announcementItems);

    return feed;
  }

  async getActive() {
    return await announcementRepo.getActiveAnnouncements();
  }

  async getAll() {
    return await announcementRepo.getAllAnnouncements();
  }

  async create(data) {
    return await announcementRepo.createAnnouncement(data);
  }

  async toggle(id) {
    const item = await announcementRepo.findById(id);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    item.active = !item.active;
    await item.save();
    return item;
  }

  async update(id, data) {
    const item = await announcementRepo.updateById(id, data);
    if (!item) {
      const err = new Error('Not found'); err.status = 404; throw err;
    }
    return item;
  }

  async remove(id) {
    await announcementRepo.deleteById(id);
    return { message: 'Deleted' };
  }
}

module.exports = new AnnouncementService();
