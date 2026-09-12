const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getProjects, getProject, getMyProjects, getUserProjects,
  createProject, updateProject, deleteProject,
  toggleLike, rateProject, getComments, addComment, deleteComment,
  recordView, getFeaturedProjects, toggleHidden,
  countProjects, getShowcaseProjects,
} = require('../controllers/projectController');
const { sendMessage } = require('../controllers/messageController');

const projectUpload = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 },
]);

router.get('/count', countProjects);
router.get('/', optionalAuth, getProjects);
router.get('/featured', optionalAuth, getFeaturedProjects);
router.get('/my', protect, getMyProjects);
router.get('/user/:userId', optionalAuth, getUserProjects);
router.get('/showcase', getShowcaseProjects);
router.get('/:id', optionalAuth, getProject);

router.post('/', protect, projectUpload, createProject);
router.put('/:id', protect, projectUpload, updateProject);
router.delete('/:id', protect, deleteProject);

router.post('/:id/view', optionalAuth, recordView);
router.patch('/:id/hide', protect, toggleHidden);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/rate', protect, rateProject);

router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/message', protect, sendMessage);

module.exports = router;
