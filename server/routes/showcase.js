const router = require('express').Router();
const { getPublicShowcase } = require('../controllers/showcaseController');

// Public — no auth required
router.get('/:slug', getPublicShowcase);

module.exports = router;
