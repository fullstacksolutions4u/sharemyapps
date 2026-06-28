const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const PremiumService = require('../models/PremiumService');
const SessionRequest = require('../models/SessionRequest');
const FreeOffer = require('../models/FreeOffer');

// All active services (used by the user-facing Services page)
router.get('/catalog', async (_req, res) => {
  try {
    const services = await PremiumService.find({ active: true }).sort({ number: 1 }).lean();
    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// The calling user's unlocked service entries
router.get('/my-services', protect, async (req, res) => {
  try {
    const [user, offer, catalog] = await Promise.all([
      User.findById(req.user._id).select('premiumServices').lean(),
      FreeOffer.findOne({ user: req.user._id, status: 'approved' }).lean(),
      PremiumService.find({ active: true }).select('key').lean(),
    ]);
    let services = user?.premiumServices || [];

    // User is entitled to all catalog services if they have placement_session or an approved offer
    const isEntitled = !!offer || services.some(s => s.key === 'placement_session');
    if (isEntitled) {
      for (const catalogService of catalog) {
        if (!services.find(s => s.key === catalogService.key)) {
          services = [...services, { key: catalogService.key, notes: 'Unlocked via approved offer' }];
        }
      }
    }

    res.json({ services });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get current user's session requests
router.get('/my-sessions', protect, async (req, res) => {
  try {
    const sessions = await SessionRequest.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({ sessions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Request a 1:1 session for a service
router.post('/:key/session-request', protect, async (req, res) => {
  try {
    const { message, availabilityFrom, availabilityTo } = req.body;
    const [user, offer] = await Promise.all([
      User.findById(req.user._id).select('premiumServices').lean(),
      FreeOffer.findOne({ user: req.user._id, status: 'approved' }).lean(),
    ]);
    const hasDirectUnlock = user?.premiumServices?.some(s => s.key === req.params.key);
    const hasPlacementSession = user?.premiumServices?.some(s => s.key === 'placement_session');
    const unlocked = hasDirectUnlock || hasPlacementSession || !!offer;
    if (!unlocked) return res.status(403).json({ message: 'Service not unlocked' });

    const existing = await SessionRequest.findOne({ user: req.user._id, serviceKey: req.params.key, status: { $in: ['pending', 'scheduled'] } });
    if (existing) return res.status(409).json({ message: 'You already have an active request for this service' });

    const service = await PremiumService.findOne({ key: req.params.key }).lean();
    const session = await SessionRequest.create({
      user: req.user._id,
      serviceKey: req.params.key,
      serviceLabel: service?.label || req.params.key,
      message:          message?.trim() || '',
      availabilityFrom: availabilityFrom ? new Date(availabilityFrom) : undefined,
      availabilityTo:   availabilityTo   ? new Date(availabilityTo)   : undefined,
    });
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
