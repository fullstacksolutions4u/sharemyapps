const express = require('express');
const router = express.Router();
const { getJobLinks, createJobLink, getAdminJobLinks, updateJobLink, createAdminJobLink } = require('../controllers/jobLinkController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', getJobLinks);
router.post('/', protect, createJobLink);

// Admin Routes
router.post('/admin', protect, requireAdmin, createAdminJobLink);
router.get('/admin', protect, requireAdmin, getAdminJobLinks);
router.put('/:id', protect, requireAdmin, updateJobLink);

module.exports = router;
