const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const { createFeedback, getAllFeedback, deleteFeedback } = require('../controllers/learningFeedbackController');

router.post('/', protect, createFeedback);
router.get('/', protect, requireAdmin, getAllFeedback);
router.delete('/:id', protect, requireAdmin, deleteFeedback);

module.exports = router;
