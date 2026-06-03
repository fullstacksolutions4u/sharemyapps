const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { saveSearchHistory, getSearchHistory, deleteSearchHistory } = require('../controllers/jdAnalysisController');

router.get('/history', protect, getSearchHistory);
router.post('/history', protect, saveSearchHistory);
router.delete('/history/:id', protect, deleteSearchHistory);

module.exports = router;
