const express = require('express');
const router = express.Router();
const InterviewSession = require('../models/InterviewSession');
const { getMyFeedback } = require('../controllers/interviewController');

// GET /api/interview-feedback/eligibility — show sidebar after ≥1 interview scheduled
router.get('/eligibility', async (req, res) => {
  try {
    const count = await InterviewSession.countDocuments({
      user: req.user._id,
      status: { $in: ['scheduled', 'completed', 'postponed'] },
    });
    res.json({ eligible: count > 0 });
  } catch (err) {
    res.status(500).json({ message: err.message, eligible: false });
  }
});

router.get('/', getMyFeedback);

module.exports = router;
