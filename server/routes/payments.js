const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createJDPackOrder, verifyJDPackPayment } = require('../controllers/paymentController');

router.post('/jd-pack/create-order', protect, createJDPackOrder);
router.post('/jd-pack/verify', protect, verifyJDPackPayment);

module.exports = router;
