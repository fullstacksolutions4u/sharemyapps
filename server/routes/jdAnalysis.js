const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveSearchHistory, getSearchHistory, deleteSearchHistory, clearAllSearchHistory, getQuota } = require('../controllers/jdAnalysisController');

router.get('/quota', protect, getQuota);
router.get('/history', protect, getSearchHistory);
router.post('/history', protect, saveSearchHistory);
router.delete('/history', protect, clearAllSearchHistory);
router.delete('/history/:id', protect, deleteSearchHistory);

module.exports = router;
