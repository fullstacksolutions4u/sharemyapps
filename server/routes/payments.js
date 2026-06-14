const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createJDPackOrder, verifyJDPackPayment, createPlacementOrder, verifyPlacementPayment } = require('../controllers/paymentController');

router.post('/jd-pack/create-order', protect, createJDPackOrder);
router.post('/jd-pack/verify', protect, verifyJDPackPayment);

router.post('/placement/create-order', protect, createPlacementOrder);
router.post('/placement/verify', protect, verifyPlacementPayment);

module.exports = router;
