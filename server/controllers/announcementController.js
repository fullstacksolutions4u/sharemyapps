const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

exports.getFeed = async (req, res) => {
  try {
    const [announcements, activity, recentProjects] = await Promise.all([
      Announcement.find({ active: true }).sort({ createdAt: -1 }).lean(),
      Notification.find({ type: { $in: ['like', 'rated', 'commented'] } })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate({ path: 'project', select: 'title owner', populate: { path: 'owner', select: 'name' } })
        .lean(),
      Project.find({ status: 'approved' })
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('owner', 'name')
        .select('title owner')
        .lean(),
    ]);

    // Group by project, collect unique action types per project
    const byProject = new Map();
    for (const n of activity) {
      if (!n.project?.title || !n.project?.owner?.name) continue;
      const pid = n.project._id.toString();
      if (!byProject.has(pid)) {
        byProject.set(pid, { project: n.project, types: new Set(), id: n._id.toString() });
      }
      byProject.get(pid).types.add(n.type);
    }

    const actionLabel = { like: 'a new like', rated: 'a rating', commented: 'a comment' };

    const activityItems = [...byProject.values()].slice(0, 3).map(({ project, types, id }) => {
      const title = project.title;
      const owner = project.owner.name.split(' ')[0];
      const parts = [...types].map(t => actionLabel[t]).filter(Boolean);
      const joined = parts.length === 1
        ? parts[0]
        : parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1];
      return { _id: id + '_a', text: `${title} by ${owner} got ${joined}`, kind: 'activity', types: [...types] };
    });

    const announcementItems = announcements.map(a => ({
      _id: a._id,
      text: a.text,
      kind: 'announcement',
    }));

    const newProjectItems = recentProjects
      .filter(p => p.owner?.name)
      .map(p => ({
        _id: p._id + '_np',
        text: `${p.title} by ${p.owner.name.split(' ')[0]} was just added — explore it and give your feedback!`,
        kind: 'new_project',
      }));

    // interleave: announcement, activity, new_project, …
    const feed = [];
    const max = Math.max(announcementItems.length, activityItems.length, newProjectItems.length);
    for (let i = 0; i < max; i++) {
      if (i < announcementItems.length) feed.push(announcementItems[i]);
      if (i < activityItems.length)     feed.push(activityItems[i]);
      if (i < newProjectItems.length)   feed.push(newProjectItems[i]);
    }

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
