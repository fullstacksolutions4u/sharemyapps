class LearningModuleDto {
  static validateCreate(data) {
    const { title, category, topics, order } = data;
    if (!title) {
      const err = new Error('Module title is required'); err.status = 400; throw err;
    }
    return { title, category: category || '', order: order || 0, topics: topics || [] };
  }

  static validateAddTopic(data) {
    const { name, order, isPracticalProblem, quizzes, problemUrl } = data;
    if (!name) {
      const err = new Error('Topic name is required'); err.status = 400; throw err;
    }
    return { name, order, isPracticalProblem, quizzes, problemUrl };
  }

  static validateUpdateOrder(data) {
    const { modules } = data;
    if (!Array.isArray(modules)) {
      const err = new Error('Invalid data format. Expected array of modules.'); err.status = 400; throw err;
    }
    return modules;
  }
}

module.exports = LearningModuleDto;
