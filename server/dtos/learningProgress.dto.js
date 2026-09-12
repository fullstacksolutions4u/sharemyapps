class LearningProgressDto {
  static validateToggleTopic(data) {
    const { moduleId, topicId } = data;
    if (!moduleId || !topicId) {
      const err = new Error('Module ID and Topic ID are required'); err.status = 400; throw err;
    }
    return { moduleId, topicId };
  }

  static validateQuizAttempt(data) {
    const { moduleId, topicId, quizId, isCorrect } = data;
    if (!moduleId || !topicId || !quizId) {
      const err = new Error('Module ID, Topic ID, and Quiz ID are required'); err.status = 400; throw err;
    }
    return { moduleId, topicId, quizId, isCorrect };
  }
}

module.exports = LearningProgressDto;
