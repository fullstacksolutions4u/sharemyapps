const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createJDPackOrder, verifyJDPackPayment, createPlacementOrder, verifyPlacementPayment, getPlacementPurchases } = require('../controllers/paymentController');

router.post('/jd-pack/create-order', protect, createJDPackOrder);
router.post('/jd-pack/verify', protect, verifyJDPackPayment);

router.get('/placement/my-purchases', protect, getPlacementPurchases);
router.post('/placement/create-order', protect, createPlacementOrder);
router.post('/placement/verify', protect, verifyPlacementPayment);

module.exports = router;
