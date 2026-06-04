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

router.post('/:id/interest', protect, mentorship.showInterest);

module.exports = router;
