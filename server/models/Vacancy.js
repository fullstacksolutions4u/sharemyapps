const mongoose = require('mongoose');

const vacancySchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  company:     { type: String, trim: true, default: '' },
  description: { type: String, required: true, trim: true },
  skills:      [{ type: String, trim: true }],
  location:    { type: String, trim: true, default: '' },
  type:        { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote' },
  industry:    { type: String, trim: true, default: '' },
  jobType:     { type: String, enum: ['', 'Full-time', 'Part-time', 'Freelance', 'Contract', 'Internship'], default: '' },
  experience:  { type: String, enum: ['', 'Fresher', '0-1 years', '0-2 years', '1-3 years', '3-5 years', '5-8 years', '8+ years'], default: '' },
  salaryRange: { type: String, trim: true, default: '' },
  status:      { type: String, enum: ['active', 'closed', 'pending'], default: 'active' },
  listOnOpportunities: { type: Boolean, default: true }, // false = internal eval vacancy (interviews + reports, hidden from Opportunities)
  isViewed:    { type: Boolean, default: false },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interests:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  everApplied: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  positions:   [{ type: String, trim: true }],
  applicantStatus: { type: Map, of: String, default: {} },
  applicantPositions: { type: Map, of: String, default: {} },
  applicantStatusHistory: {
    type: Map,
    of: [{
      status: String,
      note: String,
      date: { type: Date, default: Date.now }
    }],
    default: {}
  },
}, { timestamps: true });

vacancySchema.index({ status: 1, createdAt: -1 });
vacancySchema.index({ createdBy: 1 });

module.exports = mongoose.model('Vacancy', vacancySchema);
