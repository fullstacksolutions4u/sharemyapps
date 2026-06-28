const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const PremiumService = require('../models/PremiumService');
const SessionRequest = require('../models/SessionRequest');

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
    const user = await User.findById(req.user._id).select('premiumServices').lean();
    res.json({ services: user?.premiumServices || [] });
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
    const user = await User.findById(req.user._id).select('premiumServices').lean();
    const unlocked = user?.premiumServices?.some(s => s.key === req.params.key);
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
