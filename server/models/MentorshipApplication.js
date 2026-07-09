const mongoose = require('mongoose');

const mentorshipApplicationSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  phone:         { type: String, required: true, trim: true, maxlength: 20 },
  qualification: { type: String, required: true, trim: true, maxlength: 200 },
  status:        { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedAt:    { type: Date },
  reviewedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

mentorshipApplicationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('MentorshipApplication', mentorshipApplicationSchema);
