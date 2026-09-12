const interviewModuleRepo = require('../repositories/interviewModule.repository');

class InterviewModuleService {
  async getAllModules() {
    const modules = await interviewModuleRepo.getActiveModules();
    return modules.map(module => ({
      ...module,
      topics: module.topics.map(topic => ({
        ...topic,
        hasQuiz: topic.quizzes && topic.quizzes.length > 0,
        quizCount: topic.quizzes ? topic.quizzes.length : 0,
        quizzes: undefined
      }))
    }));
  }

  async getModuleById(id) {
    const module = await interviewModuleRepo.findModuleById(id);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    return module;
  }

  async createModule(data) {
    return await interviewModuleRepo.createModule(data);
  }

  async updateModule(id, data) {
    const module = await interviewModuleRepo.updateModule(id, data);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    return module;
  }

  async deleteModule(id) {
    const module = await interviewModuleRepo.deleteModule(id);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    return { message: 'Module deleted successfully' };
  }

  async addTopic(moduleId, data) {
    const module = await interviewModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    
    module.topics.push({
      name: data.name,
      order: data.order !== undefined ? data.order : module.topics.length,
      completed: false,
      isPracticalProblem: data.isPracticalProblem || false,
      problemUrl: data.problemUrl || '',
      quizzes: data.quizzes || []
    });
    
    await interviewModuleRepo.saveModule(module);
    return module;
  }

  async updateTopic(moduleId, topicId, updateData) {
    const module = await interviewModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    
    const topic = module.topics.id(topicId);
    if (!topic) {
      const err = new Error('Topic not found'); err.status = 404; throw err;
    }
    
    if (updateData.isPracticalProblem === false) updateData.problemUrl = '';
    Object.assign(topic, updateData);
    
    await interviewModuleRepo.saveModule(module);
    return module;
  }

  async deleteTopic(moduleId, topicId) {
    const module = await interviewModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    
    module.topics.pull(topicId);
    await interviewModuleRepo.saveModule(module);
    return module;
  }

  async getTopicQuizzes(moduleId, topicId) {
    const module = await interviewModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    
    const topic = module.topics.id(topicId);
    if (!topic) {
      const err = new Error('Topic not found'); err.status = 404; throw err;
    }
    
    return topic.quizzes || [];
  }

  async updateModuleOrder(modules) {
    await interviewModuleRepo.updateModulesOrder(modules);
    return { message: 'Module order updated successfully' };
  }

  async copyFromQuizZone() {
    const existingCount = await interviewModuleRepo.countModules();
    if (existingCount > 0) {
      const err = new Error(`Interview Modules already has ${existingCount} module(s). Clear them first before copying.`);
      err.status = 400; throw err;
    }

    const quizModules = await interviewModuleRepo.getLearningModules();
    const copies = quizModules.map(({ _id, __v, ...rest }) => ({
      ...rest,
      topics: (rest.topics || []).map(({ _id: tid, __v: tv, ...topic }) => ({
        ...topic,
        quizzes: (topic.quizzes || []).map(({ _id: qid, ...quiz }) => {
          const expectedAnswer = `Correct Option: ${String.fromCharCode(65 + quiz.correctAnswer)}. ${quiz.options[quiz.correctAnswer]}\n\nAll Options:\n${quiz.options.map((opt, oIdx) => `${String.fromCharCode(65 + oIdx)}. ${opt}`).join('\n')}\n\nExplanation:\n${quiz.explanation || 'None'}`;
          return {
            question: quiz.question,
            questionCode: quiz.questionCode || '',
            answer: expectedAnswer,
            explanation: quiz.explanation || '',
            sampleCode: quiz.sampleCode || '',
            options: quiz.options || [],
            correctAnswer: quiz.correctAnswer || 0
          };
        })
      }))
    }));

    const inserted = await interviewModuleRepo.insertManyModules(copies);
    return { count: inserted.length };
  }
}

module.exports = new InterviewModuleService();
