const router = require('express').Router();
const { protect, requireAdmin } = require('../middleware/auth');
const {
  getPendingProjects,
  getAllProjects,
  updateProjectStatus,
  adminUpdateProject,
  getAllUsers,
  getStats,
  setBadge,
  toggleFeatured,
} = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/projects', getAllProjects);
router.get('/projects/pending', getPendingProjects);
router.patch('/projects/:id/status', updateProjectStatus);
router.put('/projects/:id', adminUpdateProject);
router.get('/users', getAllUsers);
router.patch('/users/:id/badge', setBadge);
router.patch('/projects/:id/featured', toggleFeatured);

module.exports = router;
