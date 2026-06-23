const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const {
  getProgress,
  toggleTopicCompletion,
  submitQuizAttempt,
  getProgressStats
} = require('../controllers/learningProgressController');

router.get('/', protect, getProgress);
router.post('/topic', optionalAuth, toggleTopicCompletion);
router.post('/quiz', protect, submitQuizAttempt);
router.get('/stats', protect, getProgressStats);

module.exports = router;
