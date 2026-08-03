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
  updateModuleOrder,
  copyFromQuizZone,
} = require('../controllers/interviewModuleController');

router.get('/', protect, requireAdmin, getAllModules);
router.get('/:id', protect, requireAdmin, getModuleById);
router.put('/reorder', protect, requireAdmin, updateModuleOrder);
router.post('/copy-from-quiz-zone', protect, requireAdmin, copyFromQuizZone);
router.post('/', protect, requireAdmin, createModule);
router.put('/:id', protect, requireAdmin, updateModule);
router.delete('/:id', protect, requireAdmin, deleteModule);
router.post('/:id/topics', protect, requireAdmin, addTopic);
router.put('/:id/topics/:topicId', protect, requireAdmin, updateTopic);
router.delete('/:id/topics/:topicId', protect, requireAdmin, deleteTopic);
router.get('/:moduleId/topics/:topicId/quizzes', protect, requireAdmin, getTopicQuizzes);

module.exports = router;
