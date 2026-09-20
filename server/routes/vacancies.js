const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { getVacancies, showInterest, withdrawInterest, createVacancy, reportVacancy, getSharedProfiles, getShortlistedProfiles } = require('../controllers/vacancyController');

router.get('/', optionalAuth, getVacancies);
router.post('/', protect, createVacancy);
router.post('/report', protect, reportVacancy);
router.post('/:id/interest', protect, showInterest);
router.delete('/:id/interest', protect, withdrawInterest);
router.get('/:id/shared-profiles', getSharedProfiles);
router.get('/:id/shortlisted', getShortlistedProfiles);

module.exports = router;
