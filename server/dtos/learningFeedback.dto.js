class LearningFeedbackDto {
  static validateCreate(data) {
    const { message } = data;
    if (!message) {
      const err = new Error('Message is required'); err.status = 400; throw err;
    }
    return { message };
  }
}

module.exports = LearningFeedbackDto;
