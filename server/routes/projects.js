const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  getProjects, getProject, getMyProjects, getUserProjects,
  createProject, updateProject, deleteProject,
  toggleLike, rateProject, getComments, addComment, deleteComment,
  recordView, getFeaturedProjects, toggleHidden,
} = require('../controllers/projectController');
const { sendMessage } = require('../controllers/messageController');

const projectUpload = upload.fields([
  { name: 'banner', maxCount: 1 },
  { name: 'screenshots', maxCount: 5 },
]);

router.get('/count', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const count = await Project.countDocuments({ status: 'approved' });
    res.json({ count });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/my', protect, getMyProjects);
router.get('/user/:userId', getUserProjects);
router.get('/showcase', async (req, res) => {
  try {
    const Project = require('../models/Project');
    const skip = Math.max(parseInt(req.query.skip) || 99, 0);
    const limit = Math.min(parseInt(req.query.limit) || 4, 10);
    const projects = await Project.find({ status: 'approved', hidden: { $ne: true } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name avatar')
      .lean();
    res.json(projects);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/:id', getProject);
router.post('/', protect, projectUpload, createProject);
router.put('/:id', protect, projectUpload, updateProject);
router.delete('/:id', protect, deleteProject);

router.post('/:id/view', recordView);
router.patch('/:id/hide', protect, toggleHidden);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/rate', protect, rateProject);
router.get('/:id/comments', getComments);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);
router.post('/:id/message', protect, sendMessage);

module.exports = router;
