const paymentService = require('../services/payment.service');
const PaymentDto = require('../dtos/payment.dto');

exports.createJDPackOrder = async (req, res, next) => {
  try {
    const result = await paymentService.createJDPackOrder(req.user._id);
    res.json(result);
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

exports.verifyJDPackPayment = async (req, res, next) => {
  try {
    const data = PaymentDto.validateVerifyJDPack(req.body);
    const result = await paymentService.verifyJDPackPayment(req.user._id, data);
    res.json(result);
  } catch (err) {
    console.error('Razorpay verify error:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Payment verification error.' });
  }
};

exports.adminGetPayments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const result = await paymentService.adminGetPayments(page);
    res.json(result);
  } catch (err) {
    console.error('adminGetPayments error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.adminDeletePayment = async (req, res, next) => {
  try {
    const result = await paymentService.adminDeletePayment(req.params.id);
    res.json(result);
  } catch (err) {
    console.error('adminDeletePayment error:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.createPlacementOrder = async (req, res, next) => {
  try {
    const data = PaymentDto.validateCreatePlacement(req.body);
    const result = await paymentService.createPlacementOrder(req.user._id, data);
    res.json(result);
  } catch (err) {
    console.error('Placement order error:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

exports.verifyPlacementPayment = async (req, res, next) => {
  try {
    const data = PaymentDto.validateVerifyPlacement(req.body);
    const result = await paymentService.verifyPlacementPayment(req.user._id, data);
    res.json(result);
  } catch (err) {
    console.error('Placement verify error:', err);
    if (err.status) return res.status(err.status).json({ message: err.message });
    res.status(500).json({ message: 'Payment verification error.' });
  }
};

exports.getPlacementPurchases = async (req, res, next) => {
  try {
    const purchases = await paymentService.getPlacementPurchases(req.user._id);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
