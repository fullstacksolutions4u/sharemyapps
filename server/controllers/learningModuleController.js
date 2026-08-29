const LearningModule = require('../models/LearningModule');

let modulesCache = null;
let modulesCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

const clearModulesCache = () => {
  modulesCache = null;
  modulesCacheTime = 0;
};

const getAllModules = async (req, res) => {
  try {
    const now = Date.now();
    if (modulesCache && now - modulesCacheTime < CACHE_TTL) {
      return res.status(200).json({ success: true, data: modulesCache, count: modulesCache.length });
    }

    const modules = await LearningModule.aggregate([
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

    modulesCache = modules;
    modulesCacheTime = now;

    res.status(200).json({ success: true, data: modules, count: modules.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
};

const getModuleById = async (req, res) => {
  try {
    const module = await LearningModule.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    res.status(200).json({ success: true, data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch module', error: error.message });
  }
};

const createModule = async (req, res) => {
  try {
    const { title, category, topics, order } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Module title is required' });
    const module = await LearningModule.create({ title, category: category || '', order: order || 0, topics: topics || [] });
    clearModulesCache();
    res.status(201).json({ success: true, message: 'Module created successfully', data: module });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Module with this title already exists' });
    }
    res.status(500).json({ success: false, message: 'Failed to create module', error: error.message });
  }
};

const updateModule = async (req, res) => {
  try {
    const module = await LearningModule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    clearModulesCache();
    res.status(200).json({ success: true, message: 'Module updated successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module', error: error.message });
  }
};

const deleteModule = async (req, res) => {
  try {
    const module = await LearningModule.findByIdAndDelete(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    clearModulesCache();
    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete module', error: error.message });
  }
};

const addTopic = async (req, res) => {
  try {
    const { name, order, isPracticalProblem, quizzes, problemUrl } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Topic name is required' });
    const module = await LearningModule.findById(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    module.topics.push({
      name,
      order: order !== undefined ? order : module.topics.length,
      completed: false,
      isPracticalProblem: isPracticalProblem || false,
      problemUrl: problemUrl || '',
      quizzes: quizzes || []
    });
    await module.save();
    clearModulesCache();
    res.status(201).json({ success: true, message: 'Topic added successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add topic', error: error.message });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const module = await LearningModule.findById(id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    const topic = module.topics.id(topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    const updateData = req.body;
    if (updateData.isPracticalProblem === false) updateData.problemUrl = '';
    Object.assign(topic, updateData);
    await module.save();
    clearModulesCache();
    res.status(200).json({ success: true, message: 'Topic updated successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update topic', error: error.message });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const module = await LearningModule.findById(id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    module.topics.pull(topicId);
    await module.save();
    clearModulesCache();
    res.status(200).json({ success: true, message: 'Topic deleted successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete topic', error: error.message });
  }
};

const getTopicQuizzes = async (req, res) => {
  try {
    const { moduleId, topicId } = req.params;
    const module = await LearningModule.findOne(
      { _id: moduleId, "topics._id": topicId },
      { "topics.$": 1 }
    ).lean();
    if (!module || !module.topics || !module.topics[0]) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    const topic = module.topics[0];
    res.status(200).json({ success: true, data: topic.quizzes || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes', error: error.message });
  }
};

const updateModuleOrder = async (req, res) => {
  try {
    const { modules } = req.body;
    if (!Array.isArray(modules)) {
      return res.status(400).json({ success: false, message: 'Invalid data format. Expected array of modules.' });
    }
    await Promise.all(modules.map(({ _id, order }) => LearningModule.findByIdAndUpdate(_id, { order })));
    clearModulesCache();
    res.status(200).json({ success: true, message: 'Module order updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module order', error: error.message });
  }
};

module.exports = {
  getAllModules,
  getModuleById,
  createModule,
  updateModule,
  deleteModule,
  addTopic,
  updateTopic,
  deleteTopic,
  getTopicQuizzes,
  updateModuleOrder
};
