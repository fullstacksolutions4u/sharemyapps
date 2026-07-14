const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const FreeOffer = require('../models/FreeOffer');
const JobAlert = require('../models/JobAlert');
const CandidateIntake = require('../models/CandidateIntake');
const CATALOG = require('../config/services');

async function getDocumentDelivery(userId) {
  return SessionRequest.findOne({
    user: userId,
    serviceKey: 'ats_compatible_resume_cover_letter_optimization',
    status: 'completed',
    completionLink: { $ne: '' },
  }).sort({ updatedAt: 1 }).lean();
}

// All active services (used by the user-facing Services page)
router.get('/catalog', (_req, res) => {
  res.json({ services: CATALOG });
});

// The calling user's unlocked service entries
router.get('/my-services', protect, async (req, res) => {
  try {
    const [user, offer] = await Promise.all([
      User.findById(req.user._id).select('premiumServices').lean(),
      FreeOffer.findOne({ user: req.user._id, status: 'approved' }).lean(),
    ]);
    const catalog = CATALOG;
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

    // Auto-create pending SessionRequests for document-type services the user is entitled to
    const documentServices = catalog.filter(s => s.serviceType === 'document');
    for (const ds of documentServices) {
      if (services.find(s => s.key === ds.key)) {
        const existing = await SessionRequest.findOne({ user: req.user._id, serviceKey: ds.key });
        if (!existing) {
          await SessionRequest.create({
            user: req.user._id,
            serviceKey: ds.key,
            serviceLabel: ds.label,
            serviceType: 'document',
            status: 'pending',
          });
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

    const service = CATALOG.find(s => s.key === req.params.key);
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

// Whether the calling user is eligible to view the Job Alerts page
router.get('/job-alerts/eligibility', protect, async (req, res) => {
  try {
    const delivery = await getDocumentDelivery(req.user._id);
    res.json({ eligible: !!delivery, eligibleSince: delivery?.updatedAt || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Job alerts broadcast list (only visible to users who received resume/cover letter documents)
router.get('/job-alerts', protect, async (req, res) => {
  try {
    const delivery = await getDocumentDelivery(req.user._id);
    if (!delivery) return res.status(403).json({ message: 'Not eligible for job alerts' });

    const alerts = await JobAlert.find({ notified: true, recipients: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ alerts, eligibleSince: delivery.updatedAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// The calling user's candidate intake submission, if any
router.get('/candidate-intake', protect, async (req, res) => {
  try {
    const intake = await CandidateIntake.findOne({ user: req.user._id }).lean();
    res.json({ intake });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create/update the calling user's candidate intake submission
router.post('/candidate-intake', protect, async (req, res) => {
  try {
    const {
      fullName, jobSearchStatus, jobSearchStatusOther, searchDuration, searchDurationOther,
      platformsUsed, applicationsPerDay, interviewCallsFrequency, interviewsScheduledPerWeek,
      availableForMeetingToday,
    } = req.body;

    if (!fullName?.trim() || !searchDuration?.trim() || !platformsUsed?.trim() || !interviewsScheduledPerWeek?.trim())
      return res.status(400).json({ message: 'Please fill in all required fields.' });

    const intake = await CandidateIntake.findOneAndUpdate(
      { user: req.user._id },
      {
        user: req.user._id,
        fullName: fullName.trim(),
        jobSearchStatus: jobSearchStatus?.trim() || '',
        jobSearchStatusOther: jobSearchStatusOther?.trim() || '',
        searchDuration: searchDuration.trim(),
        searchDurationOther: searchDurationOther?.trim() || '',
        platformsUsed: platformsUsed.trim(),
        applicationsPerDay: applicationsPerDay?.trim() || '',
        interviewCallsFrequency: interviewCallsFrequency?.trim() || '',
        interviewsScheduledPerWeek: interviewsScheduledPerWeek.trim(),
        availableForMeetingToday: availableForMeetingToday?.trim() || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ intake });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
