const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');

exports.getFeed = async (req, res) => {
  try {
    const [announcements, activity] = await Promise.all([
      Announcement.find({ active: true }).sort({ createdAt: -1 }),
      Notification.find({ type: { $in: ['like', 'rated', 'commented'] } })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate({ path: 'project', select: 'title owner', populate: { path: 'owner', select: 'name' } }),
    ]);

    const activityItems = activity
      .filter(n => n.project?.title && n.project?.owner?.name)
      .map(n => {
        const title = n.project.title;
        const owner = n.project.owner.name.split(' ')[0];
        let text = '';
        if (n.type === 'like')      text = `${title} by ${owner} got a new like`;
        else if (n.type === 'rated')     text = `${title} by ${owner} received a rating`;
        else if (n.type === 'commented') text = `New comment on ${title} by ${owner}`;
        return { _id: n._id.toString() + '_a', text, kind: 'activity' };
      });

    const announcementItems = announcements.map(a => ({
      _id: a._id,
      text: a.text,
      kind: 'announcement',
    }));

    // interleave: announcement, activity, announcement, activity …
    const feed = [];
    const max = Math.max(announcementItems.length, activityItems.length);
    for (let i = 0; i < max; i++) {
      if (i < announcementItems.length) feed.push(announcementItems[i]);
      if (i < activityItems.length)     feed.push(activityItems[i]);
    }

    res.json(feed);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getActive = async (req, res) => {
  try {
    const items = await Announcement.find({ active: true }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Announcement.find().sort({ createdAt: -1 });
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

exports.remove = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};
