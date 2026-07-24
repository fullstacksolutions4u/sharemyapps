const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'PROJECT_APPROVED',
      'PROJECT_LIKED',
      'PROJECT_COMMENTED',
      'PROJECT_RATED',
      'MODULE_STARTED',
      'MODULE_COMPLETED',
      'USER_JOINED',
      'LEADERBOARD_TOP'
    ],
    required: true
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
