const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.LearningFeedback || mongoose.model('LearningFeedback', feedbackSchema);
