const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema({
  jobs: [{
    emailId: { type: String, default: '' },
    subject: { type: String, default: '' },
    gotResponse: { type: Boolean, default: false },
    comment: { type: String, default: '' },
  }],
  careerLinks: [{
    company: { type: String, default: '' },
    url:     { type: String, default: '' },
  }],
  sentBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipients:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  scheduledAt:  { type: Date, default: Date.now },
  notified:     { type: Boolean, default: false },
  sessionNumber: { type: Number, required: true },
  reusedFromSessionNumber: { type: Number, default: null },
  isDraft:      { type: Boolean, default: false },
}, { timestamps: true });

jobAlertSchema.index({ notified: 1, scheduledAt: 1 });

module.exports = mongoose.model('JobAlert', jobAlertSchema);
