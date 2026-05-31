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
} = require('../controllers/adminController');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/projects', getAllProjects);
router.get('/projects/pending', getPendingProjects);
router.patch('/projects/:id/status', updateProjectStatus);
router.put('/projects/:id', adminUpdateProject);
router.get('/users', getAllUsers);
router.patch('/users/:id/badge', setBadge);

module.exports = router;
