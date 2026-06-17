const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { getVacancies, showInterest, withdrawInterest, createVacancy } = require('../controllers/vacancyController');

router.get('/', optionalAuth, getVacancies);
router.post('/', protect, createVacancy);
router.post('/:id/interest', protect, showInterest);
router.delete('/:id/interest', protect, withdrawInterest);

module.exports = router;
