const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getProjects, getProject, getMyProjects, getUserProjects,
  createProject, updateProject, deleteProject,
  toggleLike, rateProject, getComments, addComment, deleteComment,
  recordView, getFeaturedProjects,
} = require('../controllers/projectController');
const { sendMessage } = require('../controllers/messageController');

const projectUpload = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 },
]);

router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/my', protect, getMyProjects);
router.get('/user/:userId', getUserProjects);
router.get('/:id', getProject);
router.post('/', protect, projectUpload, createProject);
router.put('/:id', protect, projectUpload, updateProject);
router.delete('/:id', protect, deleteProject);

router.post('/:id/view', recordView);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/rate', protect, rateProject);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/message', protect, sendMessage);

module.exports = router;
