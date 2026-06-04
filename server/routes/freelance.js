const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const freelance = require('../controllers/freelanceOpportunityController');

router.get('/', optionalAuth, async (req, res) => {
  try {
    const FreelanceOpportunity = require('../models/FreelanceOpportunity');
    const items = await FreelanceOpportunity.find({ status: 'active' })
      .select('-interests')
      .sort({ createdAt: -1 });
    // attach interested flag if logged in
    if (req.user) {
      const withFlag = await FreelanceOpportunity.find({ status: 'active' }).sort({ createdAt: -1 });
      const uid = req.user._id.toString();
      return res.json(withFlag.map(v => ({
        ...v.toObject(),
        interested: v.interests.map(i => i.toString()).includes(uid),
        interestCount: v.interests.length,
      })));
    }
    res.json(items.map(v => ({ ...v.toObject(), interested: false, interestCount: 0 })));
  } catch { res.status(500).json({ message: 'Server error' }); }
});

router.post('/:id/interest', protect, freelance.showInterest);

module.exports = router;
