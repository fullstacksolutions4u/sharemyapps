const mongoose = require('mongoose');

const jobLinkSchema = new mongoose.Schema({
  title: { type: String, trim: true, default: '' },
  company: { type: String, trim: true, default: '' },
  url: { type: String, required: true, trim: true },
  platform: { 
    type: String, 
    enum: ['linkedin', 'glassdoor', 'indeed', 'naukri', 'other'], 
    default: 'other' 
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  workMode: { type: String, trim: true, default: '' },
  experience: { type: String, trim: true, default: '' },
  expiresAt: { type: Date, expires: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('JobLink', jobLinkSchema);
