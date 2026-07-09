const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const mentorship = require('../controllers/mentorshipOpportunityController');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const MentorshipOpportunity = require('../models/MentorshipOpportunity');
    if (req.user) {
      const items = await MentorshipOpportunity.find({ status: 'active' }).sort({ createdAt: -1 });
      const uid = req.user._id.toString();
      return res.json(items.map(v => ({
        ...v.toObject(),
        interested: v.interests.map(i => i.toString()).includes(uid),
        interestCount: v.interests.length,
      })));
    }
    const items = await MentorshipOpportunity.find({ status: 'active' })
      .select('-interests')
      .sort({ createdAt: -1 });
    res.json(items.map(v => ({ ...v.toObject(), interested: false, interestCount: 0 })));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

// ── Mentorship Program applications (apply → admin verifies → pay) ──────────
router.get('/program/my-application', protect, async (req, res) => {
  try {
    const MentorshipApplication = require('../models/MentorshipApplication');
    const application = await MentorshipApplication.findOne({ user: req.user._id })
      .select('phone qualification status createdAt').lean();
    res.json({ application: application || null });
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/program/apply', protect, async (req, res) => {
  try {
    const MentorshipApplication = require('../models/MentorshipApplication');
    const phone = (req.body.phone || '').trim();
    const qualification = (req.body.qualification || '').trim();
    if (!phone || !qualification) {
      return res.status(400).json({ message: 'Contact number and qualification are required.' });
    }
    if (!/^[+\d][\d\s-]{6,18}$/.test(phone)) {
      return res.status(400).json({ message: 'Please enter a valid contact number.' });
    }

    let application = await MentorshipApplication.findOne({ user: req.user._id });
    if (application) {
      if (application.status === 'approved') {
        return res.status(409).json({ message: 'Your application is already approved.', application });
      }
      // pending or rejected — update details and put (back) under review
      application.phone = phone;
      application.qualification = qualification;
      application.status = 'pending';
      application.reviewedAt = undefined;
      application.reviewedBy = undefined;
      await application.save();
    } else {
      application = await MentorshipApplication.create({ user: req.user._id, phone, qualification });
    }

    const { sendMentorshipApplicationEmail } = require('../utils/email');
    sendMentorshipApplicationEmail({ to: req.user.email, name: req.user.name })
      .catch(err => console.error('Mentorship application email error:', err));

    res.status(201).json({ application });
  } catch (err) { res.status(500).json({ message: err.message || 'Server error' }); }
});

router.post('/:id/interest', protect, mentorship.showInterest);

module.exports = router;
