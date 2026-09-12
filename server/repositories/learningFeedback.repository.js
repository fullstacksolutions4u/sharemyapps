const LearningFeedback = require('../models/LearningFeedback');

class LearningFeedbackRepository {
  async createFeedback(data) {
    return await LearningFeedback.create(data);
  }

  async getAllFeedback() {
    return await LearningFeedback.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
  }

  async deleteFeedback(id) {
    return await LearningFeedback.findByIdAndDelete(id);
  }
}

module.exports = new LearningFeedbackRepository();
