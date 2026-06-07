const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const { PAID_PACK_SIZE } = require('../middleware/jdQuota');

const PACK_AMOUNT_PAISE = 49900; // ₹499 in paise

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createJDPackOrder = async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: PACK_AMOUNT_PAISE,
      currency: 'INR',
      receipt: `jd_${req.user._id.toString().slice(-8)}_${Date.now().toString().slice(-8)}`,
      notes: { userId: req.user._id.toString(), pack: 'jd_5' },
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

    await User.updateOne(
      { _id: req.user._id },
      { $inc: { 'jdQuota.paidRemaining': PAID_PACK_SIZE } }
    );

    const updated = await User.findById(req.user._id).select('jdQuota').lean();
    res.json({
      ok: true,
      paidRemaining: updated.jdQuota?.paidRemaining ?? PAID_PACK_SIZE,
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: 'Payment verification error.' });
  }
};

module.exports = { createJDPackOrder, verifyJDPackPayment };
