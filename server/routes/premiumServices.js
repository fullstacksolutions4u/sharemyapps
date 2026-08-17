const router = require('express').Router();
const { protect } = require('../middleware/auth');
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const FreeOffer = require('../models/FreeOffer');
const JobAlert = require('../models/JobAlert');
const ApplicantJobStatus = require('../models/ApplicantJobStatus');
const CandidateIntake = require('../models/CandidateIntake');
const CATALOG = require('../config/services');
const { getPremiumAccess } = require('../utils/premiumAccess');

// All active services (used by the user-facing Services page)
router.get('/catalog', (_req, res) => {
  res.json({ services: CATALOG });
});

// The calling user's unlocked service entries
router.get('/my-services', protect, async (req, res) => {
  try {
    const [user, { hasAccess: isEntitled }] = await Promise.all([
      User.findById(req.user._id).select('premiumServices').lean(),
      getPremiumAccess(req.user._id),
    ]);
    const catalog = CATALOG;
    let services = user?.premiumServices || [];

    if (isEntitled) {
      for (const catalogService of catalog) {
        if (!services.find(s => s.key === catalogService.key)) {
          services = [...services, { key: catalogService.key, notes: 'Unlocked via premium access' }];
        }
      }
    }

    // Auto-create pending SessionRequests for document-type services when entitled
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
    const [{ hasAccess }, user] = await Promise.all([
      getPremiumAccess(req.user._id),
      User.findById(req.user._id).select('premiumServices').lean(),
    ]);
    const hasDirectUnlock = user?.premiumServices?.some(s => s.key === req.params.key);
    if (!hasAccess && !hasDirectUnlock) return res.status(403).json({ message: 'Service not unlocked' });

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
    const { hasAccess, since } = await getPremiumAccess(req.user._id);
    res.json({ eligible: hasAccess, eligibleSince: since });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Job alerts broadcast list (premium members)
router.get('/job-alerts', protect, async (req, res) => {
  try {
    const { hasAccess, since } = await getPremiumAccess(req.user._id);
    if (!hasAccess) return res.status(403).json({ message: 'Not eligible for job alerts' });

    const alerts = await JobAlert.find({ notified: true, recipients: req.user._id }).sort({ createdAt: -1 }).limit(30).lean();
    const statuses = await ApplicantJobStatus.find({ user: req.user._id }).lean();
    res.json({ alerts, statuses, eligibleSince: since });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Upsert a job alert status for a specific company
router.put('/job-alerts/status', protect, async (req, res) => {
  try {
    const { hasAccess } = await getPremiumAccess(req.user._id);
    if (!hasAccess) return res.status(403).json({ message: 'Not eligible for job alerts' });

    const { alertId, company, status, comment } = req.body;
    if (!alertId || !company) return res.status(400).json({ message: 'alertId and company are required' });

    const updated = await ApplicantJobStatus.findOneAndUpdate(
      { user: req.user._id, alertId, company },
      { user: req.user._id, alertId, company, status: status || 'Sent', comment: comment || '' },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, status: updated });
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
