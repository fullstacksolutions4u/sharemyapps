const InterviewModule = require('../models/InterviewModule');
const LearningModule = require('../models/LearningModule');

class InterviewModuleRepository {
  async getActiveModules() {
    return await InterviewModule.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async findModuleById(id) {
    return await InterviewModule.findById(id);
  }

  async createModule(data) {
    return await InterviewModule.create(data);
  }

  async updateModule(id, data) {
    return await InterviewModule.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteModule(id) {
    return await InterviewModule.findByIdAndDelete(id);
  }

  async saveModule(module) {
    return await module.save();
  }

  async updateModulesOrder(updates) {
    return await Promise.all(
      updates.map(({ _id, order }) => InterviewModule.findByIdAndUpdate(_id, { order }))
    );
  }

  async countModules() {
    return await InterviewModule.countDocuments();
  }

  async getLearningModules() {
    return await LearningModule.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
  }

  async insertManyModules(modules) {
    return await InterviewModule.insertMany(modules);
  }
}

module.exports = new InterviewModuleRepository();
