const FreeOffer = require('../models/FreeOffer');

async function applyForFreeOffer(req, res) {
  try {
    const existing = await FreeOffer.findOne({ user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied.' });
    }
    const offer = await FreeOffer.create({ user: req.user._id });
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}

async function getMyOffer(req, res) {
  try {
    const offer = await FreeOffer.findOne({ user: req.user._id }).lean();
    res.json(offer || null);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOffers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};
    const [offers, total] = await Promise.all([
      FreeOffer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar')
        .lean(),
      FreeOffer.countDocuments(filter),
    ]);

    res.json({ offers, total, page, pages: Math.ceil(total / limit) });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminUpdateOffer(req, res) {
  try {
    const { status, offerDueDate, adminNote } = req.body;
    const update = {};
    if (status) update.status = status;
    if (offerDueDate !== undefined) update.offerDueDate = offerDueDate || null;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const offer = await FreeOffer.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!offer) return res.status(404).json({ message: 'Not found' });
    res.json(offer);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOfferStats(req, res) {
  try {
    const [pending, approved, rejected] = await Promise.all([
      FreeOffer.countDocuments({ status: 'pending' }),
      FreeOffer.countDocuments({ status: 'approved' }),
      FreeOffer.countDocuments({ status: 'rejected' }),
    ]);
    res.json({ pending, approved, rejected });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = { applyForFreeOffer, getMyOffer, adminGetOffers, adminUpdateOffer, adminGetOfferStats };
