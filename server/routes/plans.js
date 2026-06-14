const router = require('express').Router();
const { getPublicPlans } = require('../controllers/planController');

router.get('/', getPublicPlans);

module.exports = router;
