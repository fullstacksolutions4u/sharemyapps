const InterviewModule = require('../models/InterviewModule');

const getAllModules = async (req, res) => {
  try {
    const modules = await InterviewModule.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    const optimizedModules = modules.map(module => ({
      ...module,
      topics: module.topics.map(topic => ({
        ...topic,
        hasQuiz: topic.quizzes && topic.quizzes.length > 0,
        quizCount: topic.quizzes ? topic.quizzes.length : 0,
        quizzes: undefined
      }))
    }));
    res.status(200).json({ success: true, data: optimizedModules, count: optimizedModules.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch modules', error: error.message });
  }
};

const getModuleById = async (req, res) => {
  try {
    const module = await InterviewModule.findById(req.params.id);
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
    const module = await InterviewModule.create({ title, category: category || '', order: order || 0, topics: topics || [] });
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
    const module = await InterviewModule.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    res.status(200).json({ success: true, message: 'Module updated successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module', error: error.message });
  }
};

const deleteModule = async (req, res) => {
  try {
    const module = await InterviewModule.findByIdAndDelete(req.params.id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    res.status(200).json({ success: true, message: 'Module deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete module', error: error.message });
  }
};

const addTopic = async (req, res) => {
  try {
    const { name, order, isPracticalProblem, quizzes, problemUrl } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Topic name is required' });
    const module = await InterviewModule.findById(req.params.id);
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
    res.status(201).json({ success: true, message: 'Topic added successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add topic', error: error.message });
  }
};

const updateTopic = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const module = await InterviewModule.findById(id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    const topic = module.topics.id(topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
    const updateData = req.body;
    if (updateData.isPracticalProblem === false) updateData.problemUrl = '';
    Object.assign(topic, updateData);
    await module.save();
    res.status(200).json({ success: true, message: 'Topic updated successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update topic', error: error.message });
  }
};

const deleteTopic = async (req, res) => {
  try {
    const { id, topicId } = req.params;
    const module = await InterviewModule.findById(id);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    module.topics.pull(topicId);
    await module.save();
    res.status(200).json({ success: true, message: 'Topic deleted successfully', data: module });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete topic', error: error.message });
  }
};

const getTopicQuizzes = async (req, res) => {
  try {
    const { moduleId, topicId } = req.params;
    const module = await InterviewModule.findById(moduleId);
    if (!module) return res.status(404).json({ success: false, message: 'Module not found' });
    const topic = module.topics.id(topicId);
    if (!topic) return res.status(404).json({ success: false, message: 'Topic not found' });
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
    await Promise.all(modules.map(({ _id, order }) => InterviewModule.findByIdAndUpdate(_id, { order })));
    res.status(200).json({ success: true, message: 'Module order updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update module order', error: error.message });
  }
};

// Deep copy all LearningModule documents into InterviewModule collection
const copyFromQuizZone = async (req, res) => {
  try {
    const LearningModule = require('../models/LearningModule');
    const existing = await InterviewModule.countDocuments();
    if (existing > 0) {
      return res.status(400).json({ success: false, message: `Interview Modules already has ${existing} module(s). Clear them first before copying.` });
    }
    const quizModules = await LearningModule.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean();
    const copies = quizModules.map(({ _id, __v, ...rest }) => ({
      ...rest,
      // Remap topic _ids so they are fresh
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
    const inserted = await InterviewModule.insertMany(copies);
    res.status(201).json({ success: true, message: `Copied ${inserted.length} module(s) from Quiz Zone.`, count: inserted.length });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to copy from Quiz Zone', error: error.message });
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
  updateModuleOrder,
  copyFromQuizZone,
};
