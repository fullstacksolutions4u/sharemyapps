const mongoose = require('mongoose');

const mentorshipSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true, trim: true },
  topics:       [{ type: String, trim: true }],
  type:         { type: String, enum: ['free', 'paid'], default: 'free' },
  duration:     { type: String, trim: true, default: '' },
  availability: { type: String, trim: true, default: '' },
  status:       { type: String, enum: ['active', 'closed'], default: 'active' },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interests:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

mentorshipSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipOpportunity', mentorshipSchema);
