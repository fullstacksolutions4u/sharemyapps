const express = require('express');
const router = express.Router();
const { getJobLinks, createJobLink, getAdminJobLinks, updateJobLink, createAdminJobLink, extractJobDetails, submitFeedback, getAdminFeedback, getAdminCompanies, recordClick } = require('../controllers/jobLinkController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', getJobLinks);
router.post('/', protect, createJobLink);

// User Click / Apply Route
router.post('/:id/click', protect, recordClick);

// Admin Routes
router.get('/admin/companies', protect, requireAdmin, getAdminCompanies);
router.get('/admin/feedback', protect, requireAdmin, getAdminFeedback);
router.post('/admin', protect, requireAdmin, createAdminJobLink);
router.get('/admin', protect, requireAdmin, getAdminJobLinks);
router.post('/extract-job-details', protect, requireAdmin, extractJobDetails);
router.put('/:id', protect, requireAdmin, updateJobLink);

// User Feedback Route
router.post('/:id/feedback', protect, submitFeedback);


module.exports = router;
