const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayOrderId:    { type: String, required: true },
  razorpayPaymentId:  { type: String, required: true },
  amountPaise:        { type: Number, required: true },
  currency:           { type: String, default: 'INR' },
  pack:               { type: String, default: 'jd_5' },
  analysesGranted:    { type: Number, default: 5 },
  status:             { type: String, enum: ['success', 'failed'], default: 'success' },
}, { timestamps: true });

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
