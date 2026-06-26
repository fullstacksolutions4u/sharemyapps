const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

exports.getFeed = async (req, res) => {
  try {
    const [announcements, activity] = await Promise.all([
      Announcement.find({ active: true }).sort({ createdAt: -1 }).lean(),
      Notification.find({ type: { $in: ['like', 'rated', 'commented'] } })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({ path: 'project', select: 'title owner', populate: { path: 'owner', select: 'name' } })
        .lean(),
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

    // pattern: 3 activity items, then 1 announcement, repeat
    const feed = [];
    let ai = 0; // announcement index
    for (let i = 0; i < activityItems.length; i++) {
      feed.push(activityItems[i]);
      if ((i + 1) % 3 === 0 && announcementItems.length > 0) {
        feed.push(announcementItems[ai % announcementItems.length]);
        ai++;
      }
    }
    // if no activity at all, just show announcements
    if (activityItems.length === 0) feed.push(...announcementItems);

    res.json(feed);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getActive = async (req, res) => {
  try {
    const items = await Announcement.find({ active: true }).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' });
    const item = await Announcement.create({ text: text.trim() });
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const item = await Announcement.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Not found' });
    item.active = !item.active;
    await item.save();
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: 'Text required' });
    const item = await Announcement.findByIdAndUpdate(
      req.params.id,
      { text: text.trim() },
      { new: true }
    );
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
