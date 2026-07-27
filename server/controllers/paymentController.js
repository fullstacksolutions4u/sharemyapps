const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const Notification = require('../models/Notification');
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
      totalRevenuePaise: revenueResult?.total || 0,
      totalTransactions: revenueResult?.count || 0,
    });
  } catch (err) {
    console.error('adminGetPayments error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const adminDeletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    console.error('adminDeletePayment error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

const createPlacementOrder = async (req, res) => {
  try {
    const { planId } = req.body;
    if (!planId) return res.status(400).json({ message: 'planId is required.' });

    const plan = await Plan.findById(planId).lean();
    if (!plan || !plan.active) return res.status(404).json({ message: 'Plan not found.' });

    // Block re-purchase of the same plan (other plans stay purchasable)
    const existing = await Payment.findOne({ user: req.user._id, status: 'success', pack: `placement_${plan.name.toLowerCase()}` }).lean();
    if (existing) return res.status(409).json({ message: `You have already purchased the ${plan.name} plan.` });

    // Mentorship requires an admin-verified application before payment
    if (plan.name === 'Mentorship') {
      const MentorshipApplication = require('../models/MentorshipApplication');
      const application = await MentorshipApplication.findOne({ user: req.user._id }).lean();
      if (!application || application.status !== 'approved') {
        return res.status(403).json({ message: 'Your mentorship application must be verified by our team before payment.' });
      }
    }

    let amountPaise = plan.price * 100;
    if (plan.name === 'Premium' && req.user.hasRank1Offer) {
      const cfg = await getConfig();
      amountPaise = cfg.rank1OfferPricePaise;
    }
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

    let amountPaise = plan.price * 100;
    if (plan.name === 'Premium' && req.user.hasRank1Offer) {
      const cfg = await getConfig();
      amountPaise = cfg.rank1OfferPricePaise;
    }

    await Payment.create({
      user:              req.user._id,
      razorpayOrderId:   razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise:       amountPaise,
      pack:              `placement_${plan.name.toLowerCase()}`,
      analysesGranted:   0,
      status:            'success',
    });

    // Unlock premium service for the user (pull first to avoid duplicates, then push)
    await User.updateOne({ _id: req.user._id }, { $pull: { premiumServices: { key: 'placement_session' } } });
    const updateQuery = { $push: { premiumServices: { key: 'placement_session', notes: `Payment: ${razorpay_payment_id}` } } };
    if (plan.name === 'Premium' && req.user.hasRank1Offer) {
      updateQuery.$set = { hasRank1Offer: false };
    }
    await User.updateOne({ _id: req.user._id }, updateQuery);

    // Create FreeOffer entry so user appears in admin Premium Applicants list
    const FreeOffer = require('../models/FreeOffer');
    const existingOffer = await FreeOffer.findOne({ user: req.user._id }).lean();
    if (!existingOffer) {
      await FreeOffer.create({
        user:       req.user._id,
        status:     'approved',
        enrolled:   true,
        enrolledAt: new Date(),
      });
    }

    // In-app notification
    await Notification.create({
      user:    req.user._id,
      type:    'payment_success',
      title:   'Payment Successful 🎉',
      message: `Your ₹${plan.price} ${plan.name === 'Mentorship' ? 'Mentorship Program' : 'Placement Service'} payment was successful. Our HR team will contact you within 2 business days.`,
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

module.exports = { createJDPackOrder, verifyJDPackPayment, adminGetPayments, adminDeletePayment, createPlacementOrder, verifyPlacementPayment, getPlacementPurchases };
