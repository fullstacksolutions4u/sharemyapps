const feedbackRepo = require('../repositories/learningFeedback.repository');

class LearningFeedbackService {
  async createFeedback(user, data) {
    return await feedbackRepo.createFeedback({
      user: user._id,
      username: user.name || 'Anonymous',
      message: data.message
    });
  }

  async getAllFeedback() {
    return await feedbackRepo.getAllFeedback();
  }

  async deleteFeedback(id) {
    const feedback = await feedbackRepo.deleteFeedback(id);
    if (!feedback) {
      const err = new Error('Feedback not found'); err.status = 404; throw err;
    }
    return { message: 'Feedback deleted' };
  }
}

module.exports = new LearningFeedbackService();
