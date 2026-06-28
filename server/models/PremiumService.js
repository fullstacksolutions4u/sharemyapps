const mongoose = require('mongoose');


const premiumServiceSchema = new mongoose.Schema({
  key:              { type: String, required: true, unique: true, trim: true },
  number:           { type: Number, required: true },
  label:            { type: String, required: true, trim: true },
  description:      { type: String, default: '', trim: true },
  bullets:          [{ type: String, trim: true }],
  unlockedMessage:  { type: String, default: '', trim: true },
  active:           { type: Boolean, default: true },
  feedback:         [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: String, createdAt: Date }],
}, { timestamps: true });

premiumServiceSchema.index({ number: 1 });

module.exports = mongoose.model('PremiumService', premiumServiceSchema);
