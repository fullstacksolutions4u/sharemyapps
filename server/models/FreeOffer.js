const mongoose = require('mongoose');

const freeOfferSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  offerDueDate: { type: Date, default: null },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

freeOfferSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FreeOffer', freeOfferSchema);
