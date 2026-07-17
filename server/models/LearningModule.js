const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Topic name is required'],
    trim: true,
    maxlength: [200, 'Topic name cannot exceed 200 characters']
  },
  completed: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isPracticalProblem: { type: Boolean, default: false },
  problemUrl: { type: String, trim: true },
  quizzes: [{
    question: { type: String, trim: true, required: true },
    questionCode: { type: String, trim: true },
    options: {
      type: [String],
      validate: [{ validator: v => v.length === 4, message: 'Quiz must have exactly 4 options' }],
      required: true
    },
    correctAnswer: { type: Number, min: 0, max: 3, required: true },
    explanation: { type: String, trim: true },
    sampleCode: { type: String, trim: true }
  }]
}, { timestamps: true });

const moduleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Module title is required'],
    trim: true,
    maxlength: [200, 'Module title cannot exceed 200 characters'],
    unique: true
  },
  category: { type: String, trim: true, maxlength: [100, 'Category cannot exceed 100 characters'] },
  topics: [topicSchema],
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

moduleSchema.index({ order: 1 });
moduleSchema.index({ isActive: 1 });

module.exports = mongoose.model('LearningModule', moduleSchema);
