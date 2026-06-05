const JDSearchHistory = require('../models/JDSearchHistory');

const saveSearchHistory = async (req, res) => {
  try {
    const { jd, extracted, resultCount, developers } = req.body;
    if (!jd?.trim()) return res.status(400).json({ message: 'jd is required' });

    await JDSearchHistory.create({
      user: req.user._id,
      jd: jd.trim(),
      jdSnippet: jd.trim().slice(0, 120).replace(/\s+/g, ' '),
      extracted: extracted || {},
      resultCount: resultCount || 0,
      developers: developers || [],
    });

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getSearchHistory = async (req, res) => {
  try {
    const history = await JDSearchHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const deleteSearchHistory = async (req, res) => {
  try {
    await JDSearchHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminGetUserJDHistory = async (req, res) => {
  try {
    const history = await JDSearchHistory.find({ user: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { saveSearchHistory, getSearchHistory, deleteSearchHistory, adminGetUserJDHistory };
