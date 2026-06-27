const mongoose = require('mongoose');

const freeOfferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  offerDueDate: { type: Date, default: null },
  adminNote: { type: String, default: '' },
  whatsappContacted: { type: Boolean, default: false },
  whatsappContactedAt: { type: Date, default: null },
  enrolled: { type: Boolean, default: false },
  enrolledAt: { type: Date, default: null },
}, { timestamps: true });

freeOfferSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FreeOffer', freeOfferSchema);
