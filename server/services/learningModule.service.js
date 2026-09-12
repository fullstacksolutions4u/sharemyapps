const learningModuleRepo = require('../repositories/learningModule.repository');

let modulesCache = null;
let modulesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

class LearningModuleService {
  clearModulesCache() {
    modulesCache = null;
    modulesCacheTime = 0;
  }

  async getAllModules() {
    const now = Date.now();
    if (modulesCache && now - modulesCacheTime < CACHE_TTL) {
      return modulesCache;
    }

    const modules = await learningModuleRepo.getActiveModulesAggr();
    modulesCache = modules;
    modulesCacheTime = now;
    return modules;
  }

  async getModuleById(id) {
    const module = await learningModuleRepo.findModuleById(id);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    return module;
  }

  async createModule(data) {
    const module = await learningModuleRepo.createModule(data);
    this.clearModulesCache();
    return module;
  }

  async updateModule(id, data) {
    const module = await learningModuleRepo.updateModule(id, data);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    this.clearModulesCache();
    return module;
  }

  async deleteModule(id) {
    const module = await learningModuleRepo.deleteModule(id);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }
    this.clearModulesCache();
    return { message: 'Module deleted successfully' };
  }

  async addTopic(moduleId, data) {
    const module = await learningModuleRepo.findModuleById(moduleId);
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

    await learningModuleRepo.saveModule(module);
    this.clearModulesCache();
    return module;
  }

  async updateTopic(moduleId, topicId, updateData) {
    const module = await learningModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }

    const topic = module.topics.id(topicId);
    if (!topic) {
      const err = new Error('Topic not found'); err.status = 404; throw err;
    }

    if (updateData.isPracticalProblem === false) updateData.problemUrl = '';
    Object.assign(topic, updateData);

    await learningModuleRepo.saveModule(module);
    this.clearModulesCache();
    return module;
  }

  async deleteTopic(moduleId, topicId) {
    const module = await learningModuleRepo.findModuleById(moduleId);
    if (!module) {
      const err = new Error('Module not found'); err.status = 404; throw err;
    }

    module.topics.pull(topicId);
    await learningModuleRepo.saveModule(module);
    this.clearModulesCache();
    return module;
  }

  async getTopicQuizzes(moduleId, topicId) {
    const module = await learningModuleRepo.findTopicQuizzes(moduleId, topicId);
    if (!module || !module.topics || !module.topics[0]) {
      const err = new Error('Topic not found'); err.status = 404; throw err;
    }
    return module.topics[0].quizzes || [];
  }

  async updateModuleOrder(modules) {
    await learningModuleRepo.updateModulesOrder(modules);
    this.clearModulesCache();
    return { message: 'Module order updated successfully' };
  }
}

module.exports = new LearningModuleService();
