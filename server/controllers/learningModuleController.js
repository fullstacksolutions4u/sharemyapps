const learningModuleService = require('../services/learningModule.service');
const LearningModuleDto = require('../dtos/learningModule.dto');

const getAllModules = async (req, res) => {
  try {
    const modules = await learningModuleService.getAllModules();
    res.status(200).json({ success: true, data: modules, count: modules.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
};

const getModuleById = async (req, res) => {
  try {
    const module = await learningModuleService.getModuleById(req.params.id);
    res.status(200).json({ success: true, data: module });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch module', error: error.message });
  }
};

const createModule = async (req, res) => {
  try {
    const data = LearningModuleDto.validateCreate(req.body);
    const module = await learningModuleService.createModule(data);
    res.status(201).json({ success: true, message: 'Module created successfully', data: module });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Module with this title already exists' });
    }
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to create module', error: error.message });
  }
};

const updateModule = async (req, res) => {
  try {
    const module = await learningModuleService.updateModule(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Module updated successfully', data: module });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to update module', error: error.message });
  }
};

const deleteModule = async (req, res) => {
  try {
    await learningModuleService.deleteModule(req.params.id);
    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete module', error: error.message });
  }
};

const addTopic = async (req, res) => {
  try {
    const data = LearningModuleDto.validateAddTopic(req.body);
    const module = await learningModuleService.addTopic(req.params.id, data);
    res.status(201).json({ success: true, message: 'Topic added successfully', data: module });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to add topic', error: error.message });
  }
};

const updateTopic = async (req, res) => {
  try {
    const module = await learningModuleService.updateTopic(req.params.id, req.params.topicId, req.body);
    res.status(200).json({ success: true, message: 'Topic updated successfully', data: module });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to update topic', error: error.message });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const module = await learningModuleService.deleteTopic(req.params.id, req.params.topicId);
    res.status(200).json({ success: true, message: 'Topic deleted successfully', data: module });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to delete topic', error: error.message });
  }
};

const getTopicQuizzes = async (req, res) => {
  try {
    const quizzes = await learningModuleService.getTopicQuizzes(req.params.moduleId, req.params.topicId);
    res.status(200).json({ success: true, data: quizzes });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
    res.status(500).json({ success: false, message: 'Failed to fetch quizzes', error: error.message });
  }
};

const updateModuleOrder = async (req, res) => {
  try {
    const modules = LearningModuleDto.validateUpdateOrder(req.body);
    await learningModuleService.updateModuleOrder(modules);
    res.status(200).json({ success: true, message: 'Module order updated successfully' });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ success: false, message: error.message });
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
