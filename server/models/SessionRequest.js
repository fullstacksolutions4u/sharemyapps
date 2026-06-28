const mongoose = require('mongoose');

const sessionRequestSchema = new mongoose.Schema({
  user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceKey:   { type: String, required: true },
  serviceLabel: { type: String, default: '' },
  message:           { type: String, default: '' },
  availabilityFrom:  { type: Date },
  availabilityTo:    { type: Date },
  status:       { type: String, enum: ['pending', 'scheduled', 'completed'], default: 'pending' },
  meetLink:     { type: String, default: '' },
  scheduledAt:  { type: Date },
  adminNotes:        { type: String, default: '' },
  instructions:      { type: String, default: '' },
  completionFeedback:{ type: String, default: '' },
}, { timestamps: true });

sessionRequestSchema.index({ user: 1, serviceKey: 1 });
sessionRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SessionRequest', sessionRequestSchema);
