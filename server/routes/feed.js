const express = require('express');
const router = express.Router();
const { getFeed, likeActivity, commentActivity } = require('../controllers/feedController');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, getFeed);
router.post('/:id/like', protect, likeActivity);
router.post('/:id/comment', protect, commentActivity);

module.exports = router;
