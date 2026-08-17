const FreeOffer = require('../models/FreeOffer');
const User = require('../models/User');
const PremiumService = require('../models/PremiumService');
const { sendActivationEmail } = require('../utils/email');

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
    const limit = 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = status ? { status } : {};
    const [offers, total] = await Promise.all([
      FreeOffer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar phone designations')
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
    ).populate('user', 'name email avatar _id');

    if (!offer) return res.status(404).json({ message: 'Not found' });

    // Auto-unlock all premium services when approving
    if (status === 'approved') {
      await activateUserPremiumAccess(offer.user._id, req.user._id, { sendEmail: false });
    }

    res.json(offer);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminDeleteOffer(req, res) {
  try {
    const offer = await FreeOffer.findByIdAndDelete(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
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

async function adminToggleEnroll(req, res) {
  try {
    const offer = await FreeOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: 'Not found' });
    const newEnrolled = !offer.enrolled;
    const updated = await FreeOffer.findByIdAndUpdate(
      req.params.id,
      { $set: { enrolled: newEnrolled, enrolledAt: newEnrolled ? new Date() : null } },
      { new: true }
    ).populate('user', 'name email avatar phone designations');
    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function unlockAllPremiumServices(user, adminUserId, notes) {
  const allServices = await PremiumService.find({ active: true }).select('key').lean();
  const existing = new Set(user.premiumServices.map(s => s.key));
  for (const svc of allServices) {
    if (!existing.has(svc.key)) {
      user.premiumServices.push({ key: svc.key, notes, unlockedBy: adminUserId });
    }
  }
}

async function ensureActivatedOffer(userId) {
  let offer = await FreeOffer.findOne({ user: userId });
  if (offer) {
    offer.status = 'approved';
    offer.enrolled = true;
    if (!offer.enrolledAt) offer.enrolledAt = new Date();
    await offer.save();
    return offer;
  }
  return FreeOffer.create({
    user: userId,
    status: 'approved',
    enrolled: true,
    enrolledAt: new Date(),
  });
}

async function activateUserPremiumAccess(userId, adminUserId, { notes = 'Auto-unlocked on activation', sendEmail = true } = {}) {
  const user = await User.findById(userId);
  if (!user) return null;
  await ensureActivatedOffer(userId);
  await unlockAllPremiumServices(user, adminUserId, notes);
  await user.save();
  if (sendEmail) sendActivationEmail({ to: user.email, name: user.name }).catch(() => {});
  return user;
}

async function adminActivate(req, res) {
  try {
    const offer = await FreeOffer.findById(req.params.id).lean();
    if (!offer) return res.status(404).json({ message: 'Not found' });

    const activate = offer.status !== 'approved' || !offer.enrolled;
    const $set = activate
      ? { status: 'approved', enrolled: true, enrolledAt: new Date() }
      : { status: 'pending', enrolled: false, enrolledAt: null };

    const updated = await FreeOffer.findByIdAndUpdate(req.params.id, { $set }, { new: true })
      .populate('user', 'name email avatar phone designations');

    if (activate) {
      await activateUserPremiumAccess(offer.user, req.user._id, { sendEmail: true });
    }

    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminMarkWhatsappContacted(req, res) {
  try {
    const offer = await FreeOffer.findByIdAndUpdate(
      req.params.id,
      { $set: { whatsappContacted: true, whatsappContactedAt: new Date() } },
      { new: true }
    ).populate('user', 'name email avatar phone designations');
    if (!offer) return res.status(404).json({ message: 'Not found' });
    res.json(offer);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

async function adminGetOfferPortfolio(req, res) {
  try {
    const offer = await FreeOffer.findById(req.params.id)
      .populate('user', 'name email avatar bio phone linkedinUrl githubUrl leetcodeUrl portfolioUrl cvUrl familiarTech designations yearsOfExperience joiningAvailability currentSalary expectedSalary preferredLocations jobMode place district state country regNumber badge userType createdAt')
      .lean();
    if (!offer) return res.status(404).json({ message: 'Not found' });

    const ProjectModel = require('../models/Project');
    const projects = await ProjectModel.find({ owner: offer.user._id })
      .select('title description liveUrl techTags bannerImage status category appType createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ offer, projects });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  applyForFreeOffer, getMyOffer, adminGetOffers, adminUpdateOffer, adminDeleteOffer,
  adminGetOfferStats, adminGetOfferPortfolio, adminMarkWhatsappContacted, adminToggleEnroll,
  adminActivate, activateUserPremiumAccess,
};
