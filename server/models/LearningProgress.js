const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  completedTopics: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
    topicId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  completedModules: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
    completedAt: { type: Date, default: Date.now }
  }],
  attemptedQuizzes: [{
    moduleId: { type: mongoose.Schema.Types.ObjectId, required: true },
    topicId: { type: String, required: true },
    quizId: { type: mongoose.Schema.Types.ObjectId, required: true },
    isCorrect: { type: Boolean, required: true },
    attemptedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

progressSchema.index({ userId: 1 });
progressSchema.index({ 'completedTopics.moduleId': 1, 'completedTopics.topicId': 1 });

module.exports = mongoose.model('LearningProgress', progressSchema);
