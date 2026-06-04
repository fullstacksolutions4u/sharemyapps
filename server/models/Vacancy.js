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
  salaryRange: { type: String, trim: true, default: '' },
  status:      { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interests:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

vacancySchema.index({ status: 1, createdAt: -1 });
vacancySchema.index({ createdBy: 1 });

module.exports = mongoose.model('Vacancy', vacancySchema);
