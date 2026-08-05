const router = require('express').Router();
const { getPublicPlans, getJobLinkUnlimitedPlan } = require('../controllers/planController');

router.get('/', getPublicPlans);
router.get('/job-link-unlimited', getJobLinkUnlimitedPlan);

module.exports = router;
