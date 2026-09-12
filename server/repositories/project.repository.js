const Project = require('../models/Project');

class ProjectRepository {
  async count(filter) {
    return await Project.countDocuments(filter);
  }

  async findApprovedProjects(filter, skip = 0, limit = 10) {
    return await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name avatar badge premiumServices')
      .lean();
  }

  async aggregate(pipeline) {
    return await Project.aggregate(pipeline);
  }

  async findById(id) {
    return await Project.findById(id);
  }

  async findByIdWithPopulate(id) {
    return await Project.findById(id)
      .populate('owner', 'name email avatar phone linkedinUrl githubUrl leetcodeUrl followers badge hidden premiumServices')
      .populate('collaborators', 'name avatar badge');
  }

  async findByOwner(ownerId, extraFilter = {}) {
    return await Project.find({ owner: ownerId, ...extraFilter })
      .populate('collaborators', 'name avatar')
      .sort({ createdAt: -1 });
  }

  async findByFilter(filter) {
    return await Project.find(filter).sort({ createdAt: -1 });
  }

  async create(data) {
    return await Project.create(data);
  }

  async update(id, data) {
    return await Project.findByIdAndUpdate(id, data, { new: true });
  }

  async incrementViews(id, userId) {
    if (userId) {
      const updated = await Project.findOneAndUpdate(
        { _id: id, viewedBy: { $ne: userId } },
        { $addToSet: { viewedBy: userId }, $inc: { viewCount: 1 } },
        { new: true }
      ).select('viewCount');
      return updated;
    }
    return await Project.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true }).select('viewCount');
  }

  async delete(project) {
    return await project.deleteOne();
  }
}

module.exports = new ProjectRepository();
