const mongoose = require('mongoose');

const jobLinkFeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  jobLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobLink',
    required: true
  },
  heardBack: {
    type: Boolean,
    required: true
  }
}, { timestamps: true });

// Ensure one feedback per user per job link
jobLinkFeedbackSchema.index({ user: 1, jobLink: 1 }, { unique: true });

module.exports = mongoose.model('JobLinkFeedback', jobLinkFeedbackSchema);
