const mongoose = require('mongoose');

const freelanceSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  skills:      [{ type: String, trim: true }],
  budget:      { type: String, trim: true, default: '' },
  duration:    { type: String, trim: true, default: '' },
  type:        { type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote' },
  status:      { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interests:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

freelanceSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('FreelanceOpportunity', freelanceSchema);
