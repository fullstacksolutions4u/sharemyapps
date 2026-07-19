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
      'USER_JOINED'
    ],
    required: true
  },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  module: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningModule' },
  meta: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Activity', activitySchema);
