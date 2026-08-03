const mongoose = require('mongoose');

const jobLinkSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  company: { type: String, trim: true, default: '' },
  postedDate: { type: String, trim: true, default: '' },
  url: { type: String, required: true, trim: true },
  platform: { 
    type: String, 
    enum: ['linkedin', 'glassdoor', 'indeed', 'naukri', 'other'], 
    default: 'other' 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'access_granted'],
    default: 'pending'
  },
  workMode: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  experience: { type: String, trim: true, default: '' },
  state: { type: String, trim: true, default: '' },
  adminNote: { type: String, trim: true, default: '' },
  expiresAt: { type: Date, expires: 0 },
  approvedAt: { type: Date },
  clicks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Timestamped applies for weekly free-apply gating (clicks[] remains for admin “who applied”)
  clickEvents: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    at: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

jobLinkSchema.index({ createdBy: 1, status: 1, approvedAt: -1 });
jobLinkSchema.index({ clicks: 1 });
jobLinkSchema.index({ 'clickEvents.user': 1, 'clickEvents.at': -1 });

module.exports = mongoose.model('JobLink', jobLinkSchema);
