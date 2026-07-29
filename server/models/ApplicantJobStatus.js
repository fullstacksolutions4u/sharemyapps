const mongoose = require('mongoose');

const applicantJobStatusSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  alertId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobAlert', required: true },
  company: { type: String, required: true },
  status: { type: String, default: 'Sent' },
  comment: { type: String, default: '' },
}, { timestamps: true });

applicantJobStatusSchema.index({ user: 1, alertId: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('ApplicantJobStatus', applicantJobStatusSchema);
