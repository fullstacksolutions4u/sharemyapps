const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const { getConfig } = require('../utils/configCache');
const { sendPlacementPaymentEmail } = require('../utils/email');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createJDPackOrder = async (req, res) => {
  try {
    const cfg = await getConfig();
    const order = await razorpay.orders.create({
      amount: cfg.jdPackPricePaise,
      currency: 'INR',
      receipt: `jd_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: req.user._id.toString(), pack: `jd_${cfg.jdPaidPackSize}` },
    });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

const verifyJDPackPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment fields.' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const cfg = await getConfig();

    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'jdQuota.paidRemaining': cfg.jdPaidPackSize } }
    );

    await Payment.create({
      user:              req.user._id,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise:       cfg.jdPackPricePaise,
      pack:              `jd_${cfg.jdPaidPackSize}`,
      analysesGranted:   cfg.jdPaidPackSize,
      status:            'success',
    });

    const updated = await User.findById(req.user._id).select('jdQuota').lean();
    res.json({
      ok: true,
      paidRemaining: updated.jdQuota?.paidRemaining ?? cfg.jdPaidPackSize,
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: 'Payment verification error.' });
  }
};

const adminGetPayments = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = 20;
    const skip  = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find({ status: 'success' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email userType')
        .lean(),
      Payment.countDocuments({ status: 'success' }),
    ]);

    const [revenueResult] = await Payment.aggregate([
      { $match: { status: 'success' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
    ]);

    res.json({
      payments,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalRevenuePaise: revenueResult?.total ?? 0,
      totalTransactions:  revenueResult?.count ?? 0,
    });
  } catch (err) {
    console.error('adminGetPayments error:', err);
    res.status(500).json({ message: err.message });
  }
};

const createPlacementOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId is required.' });

    const plan = await Plan.findById(planId).lean();
    if (!plan || !plan.active) return res.status(404).json({ message: 'Plan not found.' });

    const amountPaise = plan.price * 100;
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `pl_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: req.user._id.toString(), plan: plan.name },
    });

    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name });
  } catch (err) {
    console.error('Placement order error:', err);
    res.status(500).json({ message: 'Failed to create payment order.' });
  }
};

const verifyPlacementPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return res.status(400).json({ message: 'Missing payment fields.' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }

    const plan = await Plan.findById(planId).lean();
    if (!plan) return res.status(404).json({ message: 'Plan not found.' });

    await Payment.create({
      user:              req.user._id,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise:       plan.price * 100,
      pack:              `placement_${plan.name.toLowerCase()}`,
      analysesGranted:   0,
      status:            'success',
    });

    sendPlacementPaymentEmail({
      to:   req.user.email,
      name: req.user.name,
      plan,
    }).catch(err => console.error('Placement email error:', err));

    res.json({ ok: true, planName: plan.name });
  } catch (err) {
    console.error('Placement verify error:', err);
    res.status(500).json({ message: 'Payment verification error.' });
  }
};

const getPlacementPurchases = async (req, res) => {
  try {
    const purchases = await Payment.find({
      user: req.user._id,
      status: 'success',
      pack: /^placement_/,
    }).select('pack amountPaise createdAt').lean();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createJDPackOrder, verifyJDPackPayment, adminGetPayments, createPlacementOrder, verifyPlacementPayment, getPlacementPurchases };
