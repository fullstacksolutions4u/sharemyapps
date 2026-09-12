const LearningModule = require('../models/LearningModule');

class LearningModuleRepository {
  async getActiveModulesAggr() {
    return await LearningModule.aggregate([
      { $match: { isActive: true } },
      { $sort: { order: 1, createdAt: 1 } },
      {
        $project: {
          title: 1,
          category: 1,
          order: 1,
          isActive: 1,
          createdAt: 1,
          updatedAt: 1,
          topics: {
            $map: {
              input: "$topics",
              as: "topic",
              in: {
                _id: "$$topic._id",
                name: "$$topic.name",
                completed: "$$topic.completed",
                order: "$$topic.order",
                isPracticalProblem: "$$topic.isPracticalProblem",
                problemUrl: "$$topic.problemUrl",
                createdAt: "$$topic.createdAt",
                updatedAt: "$$topic.updatedAt",
                quizCount: { $size: { $ifNull: ["$$topic.quizzes", []] } },
                hasQuiz: { $gt: [{ $size: { $ifNull: ["$$topic.quizzes", []] } }, 0] }
              }
            }
          }
        }
      }
    ]);
  }

  async findModuleById(id) {
    return await LearningModule.findById(id);
  }

  async createModule(data) {
    return await LearningModule.create(data);
  }

  async updateModule(id, data) {
    return await LearningModule.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
  }

  async deleteModule(id) {
    return await LearningModule.findByIdAndDelete(id);
  }

  async saveModule(module) {
    return await module.save();
  }

  async findTopicQuizzes(moduleId, topicId) {
    return await LearningModule.findOne(
      { _id: moduleId, "topics._id": topicId },
      { "topics.$": 1 }
    ).lean();
  }

  async updateModulesOrder(updates) {
    return await Promise.all(
      updates.map(({ _id, order }) => LearningModule.findByIdAndUpdate(_id, { order }))
    );
  }
}

module.exports = new LearningModuleRepository();
