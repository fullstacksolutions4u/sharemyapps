const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
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
} = require('../controllers/learningModuleController');

router.get('/', getAllModules);
router.get('/:id', getModuleById);
router.put('/reorder', protect, requireAdmin, updateModuleOrder);
router.post('/', protect, requireAdmin, createModule);
router.put('/:id', protect, requireAdmin, updateModule);
router.delete('/:id', protect, requireAdmin, deleteModule);
router.post('/:id/topics', protect, requireAdmin, addTopic);
router.put('/:id/topics/:topicId', protect, requireAdmin, updateTopic);
router.delete('/:id/topics/:topicId', protect, requireAdmin, deleteTopic);
router.get('/:moduleId/topics/:topicId/quizzes', getTopicQuizzes);

module.exports = router;
